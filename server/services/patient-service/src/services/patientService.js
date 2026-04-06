/**
 * Patient Service
 * Business logic for patient profile management
 */

const Patient = require('../models/Patient');
const PatientDocument = require('../models/PatientDocument');
const { calcPatientProfileStrength } = require('./profileStrengthService');
const { publishPatientEvent } = require('../publishers/patientPublisher');

/**
 * Generate unique patient ID
 */
const generatePatientId = () => 'P' + Date.now();

/**
 * Create patient profile from auth-service event
 */
const createPatientFromAuthEvent = async (userData) => {
  const { userId, name, email } = userData;

  // Check if patient already exists
  const existing = await Patient.findOne({ userId });
  if (existing) {
    console.log(`Patient profile already exists for userId: ${userId}`);
    return existing;
  }

  const patient = await Patient.create({
    userId: userId.toString(),
    patientId: generatePatientId(),
    fullName: name || 'Patient',
    email: email || '',
    isDeleted: false
  });

  console.log(`Created patient profile for userId: ${userId}, patientId: ${patient.patientId}`);

  // Publish patient.created event
  await publishPatientEvent('patient.created', {
    patientId: patient.patientId,
    userId: patient.userId,
    fullName: patient.fullName,
    email: patient.email
  });

  return patient;
};

/**
 * Get patient profile by userId
 */
const getPatientByUserId = async (userId) => {
  const patient = await Patient.findOne({
    userId: userId.toString(),
    isDeleted: { $ne: true }
  });

  if (!patient) {
    return null;
  }

  // Get document count for profile strength
  const docsCount = await PatientDocument.countForPatient(patient.patientId);
  patient.documentsCount = docsCount;

  // Calculate profile strength
  const profileStrength = calcPatientProfileStrength({ patient, docsCount });

  // Update profile strength if changed
  if (patient.profileStrength !== profileStrength.score) {
    patient.profileStrength = profileStrength.score;
    await patient.save();
  }

  return { patient, profileStrength };
};

/**
 * Get patient by patientId
 */
const getPatientByPatientId = async (patientId) => {
  return Patient.findOne({
    patientId,
    isDeleted: { $ne: true }
  });
};

/**
 * Update patient profile
 */
const updatePatientProfile = async (userId, updateData) => {
  const {
    fullName,
    dob,
    gender,
    nic,
    phone,
    address,
    emergencyContact,
    bloodGroup,
    allergies,
    chronicConditions,
    heightCm,
    weightKg
  } = updateData;

  const update = {};

  // Basic fields
  if (fullName !== undefined) update.fullName = fullName;
  if (dob !== undefined) update.dob = dob;
  if (gender !== undefined) update.gender = gender;
  if (nic !== undefined) update.nic = nic;
  if (phone !== undefined) update.phone = phone;

  // Nested address
  if (address) {
    if (address.district !== undefined) update['address.district'] = address.district;
    if (address.city !== undefined) update['address.city'] = address.city;
    if (address.line1 !== undefined) update['address.line1'] = address.line1;
    if (address.postalCode !== undefined) update['address.postalCode'] = address.postalCode;
  }

  // Nested emergency contact
  if (emergencyContact) {
    if (emergencyContact.name !== undefined) update['emergencyContact.name'] = emergencyContact.name;
    if (emergencyContact.phone !== undefined) update['emergencyContact.phone'] = emergencyContact.phone;
    if (emergencyContact.relationship !== undefined) update['emergencyContact.relationship'] = emergencyContact.relationship;
  }

  // Medical info
  if (bloodGroup !== undefined) update.bloodGroup = bloodGroup;
  if (allergies !== undefined) update.allergies = allergies;
  if (chronicConditions !== undefined) update.chronicConditions = chronicConditions;
  if (heightCm !== undefined) update.heightCm = heightCm;
  if (weightKg !== undefined) update.weightKg = weightKg;

  const patient = await Patient.findOneAndUpdate(
    {
      userId: userId.toString(),
      isDeleted: { $ne: true }
    },
    { $set: update },
    { new: true, runValidators: true }
  );

  if (!patient) {
    return null;
  }

  // Publish patient.updated event
  await publishPatientEvent('patient.updated', {
    patientId: patient.patientId,
    userId: patient.userId,
    fullName: patient.fullName,
    updatedFields: Object.keys(update)
  });

  return patient;
};

/**
 * Update patient avatar
 */
const updatePatientAvatar = async (userId, avatarUrl) => {
  const patient = await Patient.findOneAndUpdate(
    {
      userId: userId.toString(),
      isDeleted: { $ne: true }
    },
    { $set: { avatarUrl } },
    { new: true }
  );

  if (patient) {
    await publishPatientEvent('patient.avatar.updated', {
      patientId: patient.patientId,
      userId: patient.userId,
      avatarUrl
    });
  }

  return patient;
};

/**
 * Soft delete patient account
 */
const deactivatePatient = async (userId) => {
  const patient = await Patient.findOneAndUpdate(
    { userId: userId.toString() },
    { $set: { isDeleted: true } },
    { new: true }
  );

  if (patient) {
    await publishPatientEvent('patient.deactivated', {
      patientId: patient.patientId,
      userId: patient.userId
    });
  }

  return patient;
};

/**
 * Search patients (for admin/doctor use)
 */
const searchPatients = async (query, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const filter = { isDeleted: { $ne: true } };

  if (query) {
    filter.$or = [
      { fullName: { $regex: query, $options: 'i' } },
      { patientId: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ];
  }

  const [patients, total] = await Promise.all([
    Patient.find(filter)
      .select('patientId fullName email avatarUrl gender dob profileStrength createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Patient.countDocuments(filter)
  ]);

  return {
    patients,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get patient summary for cross-service queries
 */
const getPatientSummary = async (patientId) => {
  const patient = await Patient.findOne({
    patientId,
    isDeleted: { $ne: true }
  }).select('patientId userId fullName email avatarUrl bloodGroup allergies');

  return patient;
};

module.exports = {
  generatePatientId,
  createPatientFromAuthEvent,
  getPatientByUserId,
  getPatientByPatientId,
  updatePatientProfile,
  updatePatientAvatar,
  deactivatePatient,
  searchPatients,
  getPatientSummary
};
