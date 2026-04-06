const Doctor = require('../models/Doctor');
const Rating = require('../models/Rating');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Prescription = require('../models/Prescription');
const Counter = require('../models/Counter');
const { calcDoctorProfileStrength } = require('./profileStrength');
const { uploadBase64Image, deleteCloudinaryFile } = require('../config/cloudinary');
const { publishEvent } = require('../config/rabbitmq');
const logger = require('../config/logger');

/**
 * Generate next doctor ID
 */
const getNextDoctorId = async () => {
  const counter = await Counter.findByIdAndUpdate(
    { _id: 'doctorId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `DOC-${String(counter.seq).padStart(6, '0')}`;
};

// ========================================
// PROFILE MANAGEMENT
// ========================================

/**
 * Create doctor profile (manual creation, not via event)
 */
const createDoctorProfile = async ({ userId, fullName, specialization, email, phone }) => {
  // Check if profile exists
  const existing = await Doctor.findOne({ userId });
  if (existing) {
    return { status: 409, data: { message: 'Doctor profile already exists' } };
  }

  const doctorId = await getNextDoctorId();

  const doctor = await Doctor.create({
    userId,
    doctorId,
    fullName,
    specialization,
    email,
    phone,
    status: 'PENDING',
    profileStrength: 10,
  });

  logger.info('Doctor profile created', { doctorId: doctor.doctorId, userId });

  // Publish event
  await publishEvent('doctor.profile.created', {
    doctorId: doctor.doctorId,
    userId,
    fullName,
    specialization,
  });

  return {
    status: 201,
    data: {
      message: 'Doctor profile created successfully',
      doctor: {
        doctorId: doctor.doctorId,
        fullName: doctor.fullName,
        specialization: doctor.specialization,
        status: doctor.status,
      },
    },
  };
};

/**
 * Get doctor profile by userId
 */
const getDoctorProfile = async ({ userId }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  // Calculate profile strength
  const profileStrength = calcDoctorProfileStrength({ doctor });

  // Update profile strength if changed
  if (doctor.profileStrength !== profileStrength.score) {
    doctor.profileStrength = profileStrength.score;
    await doctor.save();
  }

  return {
    status: 200,
    data: {
      doctor: {
        doctorId: doctor.doctorId,
        fullName: doctor.fullName,
        email: doctor.email,
        phone: doctor.phone,
        avatarUrl: doctor.avatarUrl,
        specialization: doctor.specialization,
        qualifications: doctor.qualifications,
        experience: doctor.experience,
        bio: doctor.bio,
        licenseNumber: doctor.licenseNumber,
        licenseDocUrl: doctor.licenseDocUrl,
        consultationFee: doctor.consultationFee,
        rating: doctor.rating,
        totalRatings: doctor.totalRatings,
        status: doctor.status,
        isVerified: doctor.isVerified,
        profileStrength,
        availabilitySlots: doctor.availabilitySlots.filter(s => !s.isBooked),
      },
    },
  };
};

/**
 * Update doctor profile
 */
const updateDoctorProfile = async ({ userId, updates }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  // Whitelist allowed fields
  const allowedFields = [
    'fullName',
    'specialization',
    'qualifications',
    'experience',
    'bio',
    'licenseNumber',
    'consultationFee',
    'phone',
  ];

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      doctor[field] = updates[field];
    }
  });

  await doctor.save();

  // Recalculate profile strength
  const profileStrength = calcDoctorProfileStrength({ doctor });
  doctor.profileStrength = profileStrength.score;
  await doctor.save();

  logger.info('Doctor profile updated', { doctorId: doctor.doctorId });

  return {
    status: 200,
    data: {
      message: 'Profile updated successfully',
      doctor: {
        doctorId: doctor.doctorId,
        fullName: doctor.fullName,
        specialization: doctor.specialization,
        profileStrength,
      },
    },
  };
};

/**
 * Update doctor avatar
 */
const updateAvatarBase64 = async ({ userId, base64Image }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  try {
    // Delete old avatar if exists
    if (doctor.avatarPublicId) {
      await deleteCloudinaryFile(doctor.avatarPublicId);
    }

    // Upload new avatar
    const { url, publicId } = await uploadBase64Image(base64Image, {
      folder: 'careline360/doctors/avatars',
    });

    doctor.avatarUrl = url;
    doctor.avatarPublicId = publicId;
    await doctor.save();

    logger.info('Doctor avatar updated', { doctorId: doctor.doctorId });

    return {
      status: 200,
      data: {
        message: 'Avatar updated successfully',
        avatarUrl: url,
      },
    };
  } catch (error) {
    logger.error('Avatar upload failed:', error);
    return { status: 400, data: { message: error.message } };
  }
};

/**
 * Deactivate doctor account
 */
const deactivateDoctorAccount = async ({ userId }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  doctor.isDeleted = true;
  doctor.status = 'SUSPENDED';
  await doctor.save();

  logger.info('Doctor account deactivated', { doctorId: doctor.doctorId });

  // Publish event
  await publishEvent('doctor.deactivated', {
    doctorId: doctor.doctorId,
    userId,
  });

  return {
    status: 200,
    data: { message: 'Account deactivated successfully' },
  };
};

// ========================================
// DASHBOARD & ANALYTICS
// ========================================

/**
 * Get dashboard statistics
 */
const getDashboardStats = async ({ userId }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  const today = new Date().toISOString().split('T')[0];

  // Run queries in parallel
  const [
    totalAppointments,
    pendingAppointments,
    completedAppointments,
    todayAppointments,
    totalRecords,
  ] = await Promise.all([
    Appointment.countDocuments({ doctorId: doctor._id, isDeleted: false }),
    Appointment.countDocuments({ doctorId: doctor._id, status: 'pending', isDeleted: false }),
    Appointment.countDocuments({ doctorId: doctor._id, status: 'completed', isDeleted: false }),
    Appointment.countDocuments({ doctorId: doctor._id, date: today, isDeleted: false }),
    MedicalRecord.countDocuments({ doctorId: doctor._id, isDeleted: false }),
  ]);

  // Get unique patients
  const uniquePatients = await Appointment.distinct('patientId', {
    doctorId: doctor._id,
    isDeleted: false,
  });

  return {
    status: 200,
    data: {
      doctor: {
        doctorId: doctor.doctorId,
        fullName: doctor.fullName,
        specialization: doctor.specialization,
        avatarUrl: doctor.avatarUrl,
        rating: doctor.rating,
        totalRatings: doctor.totalRatings,
        status: doctor.status,
        isVerified: doctor.isVerified,
      },
      stats: {
        totalAppointments,
        pendingAppointments,
        completedAppointments,
        todayAppointments,
        totalPatients: uniquePatients.length,
        totalRecords,
      },
    },
  };
};

/**
 * Get detailed analytics
 */
const getDoctorAnalytics = async ({ userId }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  // Get last 6 months of data
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

  // Monthly appointment trends
  const monthlyTrend = await Appointment.aggregate([
    {
      $match: {
        doctorId: doctor._id,
        date: { $gte: sixMonthsAgoStr },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: { $substr: ['$date', 0, 7] }, // "YYYY-MM"
        count: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Status breakdown
  const statusBreakdown = await Appointment.aggregate([
    {
      $match: {
        doctorId: doctor._id,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // Calculate completion rate
  const total = statusBreakdown.reduce((sum, s) => sum + s.count, 0);
  const completed = statusBreakdown.find(s => s._id === 'completed')?.count || 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    status: 200,
    data: {
      doctor: {
        doctorId: doctor.doctorId,
        fullName: doctor.fullName,
        rating: doctor.rating,
        totalRatings: doctor.totalRatings,
      },
      analytics: {
        monthlyTrend,
        statusBreakdown: statusBreakdown.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
        completionRate,
      },
    },
  };
};

// ========================================
// AVAILABILITY MANAGEMENT
// ========================================

/**
 * Get availability slots
 */
const getAvailability = async ({ userId }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  // Filter future unbooked slots
  const today = new Date().toISOString().split('T')[0];
  const availableSlots = doctor.availabilitySlots.filter(
    slot => slot.date >= today && !slot.isBooked
  );

  return {
    status: 200,
    data: {
      slots: availableSlots,
      totalSlots: doctor.availabilitySlots.length,
      availableCount: availableSlots.length,
    },
  };
};

/**
 * Add availability slots
 */
const addAvailabilitySlots = async ({ userId, slots }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  // Map slots to schema format
  const newSlots = slots.map(slot => ({
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    isBooked: false,
  }));

  doctor.availabilitySlots.push(...newSlots);
  await doctor.save();

  // Recalculate profile strength
  const profileStrength = calcDoctorProfileStrength({ doctor });
  doctor.profileStrength = profileStrength.score;
  await doctor.save();

  logger.info('Availability slots added', {
    doctorId: doctor.doctorId,
    count: newSlots.length,
  });

  return {
    status: 201,
    data: {
      message: `${newSlots.length} slots added successfully`,
      slots: newSlots,
    },
  };
};

/**
 * Delete availability slot
 */
const deleteAvailabilitySlot = async ({ userId, slotId }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  const slot = doctor.availabilitySlots.id(slotId);
  
  if (!slot) {
    return { status: 404, data: { message: 'Slot not found' } };
  }

  if (slot.isBooked) {
    return { status: 400, data: { message: 'Cannot delete booked slot' } };
  }

  slot.deleteOne();
  await doctor.save();

  logger.info('Availability slot deleted', { doctorId: doctor.doctorId, slotId });

  return {
    status: 200,
    data: { message: 'Slot deleted successfully' },
  };
};

/**
 * Update availability slot
 */
const updateAvailabilitySlot = async ({ userId, slotId, startTime, endTime }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  const slot = doctor.availabilitySlots.id(slotId);
  
  if (!slot) {
    return { status: 404, data: { message: 'Slot not found' } };
  }

  if (slot.isBooked) {
    return { status: 400, data: { message: 'Cannot edit booked slot' } };
  }

  // Validate time order
  if (endTime <= startTime) {
    return { status: 400, data: { message: 'End time must be after start time' } };
  }

  slot.startTime = startTime;
  slot.endTime = endTime;
  await doctor.save();

  logger.info('Availability slot updated', { doctorId: doctor.doctorId, slotId });

  return {
    status: 200,
    data: { message: 'Slot updated successfully', slot },
  };
};

// ========================================
// APPOINTMENT MANAGEMENT
// ========================================

/**
 * Get doctor's appointments with filters
 */
const getMyAppointments = async ({
  userId,
  status,
  date,
  dateFrom,
  dateTo,
  search,
  page = 1,
  limit = 10,
}) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  const query = { doctorId: doctor._id, isDeleted: false };

  // Status filter
  if (status) {
    query.status = status;
  }

  // Date filters
  if (date) {
    query.date = date;
  } else if (dateFrom || dateTo) {
    query.date = {};
    if (dateFrom) query.date.$gte = dateFrom;
    if (dateTo) query.date.$lte = dateTo;
  }

  // Search in patient name
  if (search) {
    query.patientName = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(query),
  ]);

  return {
    status: 200,
    data: {
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  };
};

/**
 * Update appointment status
 */
const updateAppointmentStatus = async ({ userId, appointmentId, status, notes }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctorId: doctor._id,
  });

  if (!appointment) {
    return { status: 404, data: { message: 'Appointment not found' } };
  }

  const validStatuses = ['confirmed', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return { status: 400, data: { message: 'Invalid status' } };
  }

  appointment.status = status;
  if (notes) appointment.notes = notes;
  await appointment.save();

  // Free up slot if cancelled
  if (status === 'cancelled') {
    const slot = doctor.availabilitySlots.find(
      s => s.appointmentId === appointment.appointmentId
    );
    if (slot) {
      slot.isBooked = false;
      slot.appointmentId = null;
      await doctor.save();
    }
  }

  // Publish event
  await publishEvent('appointment.status.updated', {
    appointmentId: appointment.appointmentId,
    status,
    updatedBy: 'doctor',
    doctorId: doctor.doctorId,
  });

  logger.info('Appointment status updated', {
    appointmentId: appointment.appointmentId,
    status,
  });

  return {
    status: 200,
    data: { message: 'Appointment updated successfully', appointment },
  };
};

/**
 * Delete appointment
 */
const deleteAppointment = async ({ userId, appointmentId }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  const appointment = await Appointment.findOneAndDelete({
    _id: appointmentId,
    doctorId: doctor._id,
  });

  if (!appointment) {
    return { status: 404, data: { message: 'Appointment not found' } };
  }

  // Free up slot
  const slot = doctor.availabilitySlots.find(
    s => s.appointmentId === appointment.appointmentId
  );
  if (slot) {
    slot.isBooked = false;
    slot.appointmentId = null;
    await doctor.save();
  }

  logger.info('Appointment deleted', { appointmentId: appointment.appointmentId });

  return {
    status: 200,
    data: { message: 'Appointment deleted successfully' },
  };
};

// ========================================
// PATIENT MANAGEMENT
// ========================================

/**
 * Get list of patients the doctor has treated
 */
const getMyPatients = async ({ userId, search, page = 1, limit = 10 }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  // Aggregate unique patients from appointments
  const patientsAgg = await Appointment.aggregate([
    {
      $match: {
        doctorId: doctor._id,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: '$patientId',
        patientName: { $first: '$patientName' },
        patientEmail: { $first: '$patientEmail' },
        patientPhone: { $first: '$patientPhone' },
        patientAvatar: { $first: '$patientAvatar' },
        totalAppointments: { $sum: 1 },
        completedAppointments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        lastVisit: { $max: '$date' },
      },
    },
    { $sort: { lastVisit: -1 } },
  ]);

  // Apply search filter
  let patients = patientsAgg;
  if (search) {
    const searchLower = search.toLowerCase();
    patients = patients.filter(p => 
      p.patientName?.toLowerCase().includes(searchLower) ||
      p.patientEmail?.toLowerCase().includes(searchLower)
    );
  }

  // Pagination
  const total = patients.length;
  const skip = (page - 1) * limit;
  const paginatedPatients = patients.slice(skip, skip + limit);

  return {
    status: 200,
    data: {
      patients: paginatedPatients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  };
};

/**
 * Get detailed patient info
 */
const getPatientDetail = async ({ userId, patientId }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  // Verify doctor has treated this patient
  const hasRelationship = await Appointment.exists({
    doctorId: doctor._id,
    patientId,
    isDeleted: false,
  });

  if (!hasRelationship) {
    return { status: 403, data: { message: 'No treatment relationship with this patient' } };
  }

  // Get appointments with this patient
  const appointments = await Appointment.find({
    doctorId: doctor._id,
    patientId,
    isDeleted: false,
  }).sort({ date: -1 }).limit(20);

  // Get medical records
  const records = await MedicalRecord.find({
    doctorId: doctor._id,
    patientId,
    isDeleted: false,
  }).sort({ visitDate: -1 }).limit(10);

  // Get patient info from appointments
  const patientInfo = appointments[0] ? {
    patientId,
    patientName: appointments[0].patientName,
    patientEmail: appointments[0].patientEmail,
    patientPhone: appointments[0].patientPhone,
    patientAvatar: appointments[0].patientAvatar,
  } : null;

  return {
    status: 200,
    data: {
      patient: patientInfo,
      appointments,
      records,
      summary: {
        totalAppointments: appointments.length,
        totalRecords: records.length,
      },
    },
  };
};

// ========================================
// MEDICAL RECORDS
// ========================================

/**
 * Create medical record
 */
const createMedicalRecord = async ({ userId, data }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  const {
    patientId,
    appointmentId,
    visitType,
    chiefComplaint,
    symptoms,
    diagnosis,
    diagnosisCode,
    vitals,
    physicalExam,
    prescriptions,
    notes,
    treatmentPlan,
    followUpRequired,
    followUpDate,
  } = data;

  if (!patientId) {
    return { status: 400, data: { message: 'Patient ID is required' } };
  }

  // Create record
  const record = await MedicalRecord.create({
    doctorId: doctor._id,
    patientId,
    appointmentId,
    visitType: visitType || 'routine',
    chiefComplaint,
    symptoms,
    diagnosis,
    diagnosisCode,
    vitals,
    physicalExam,
    prescriptions,
    notes,
    treatmentPlan,
    followUpRequired,
    followUpDate,
  });

  // If appointmentId provided, mark appointment as completed
  if (appointmentId) {
    await Appointment.updateOne(
      { appointmentId, doctorId: doctor._id },
      { status: 'completed' }
    );
  }

  logger.info('Medical record created', {
    recordId: record._id,
    doctorId: doctor.doctorId,
    patientId,
  });

  // Publish event for patient-service to sync
  await publishEvent('medical.record.created', {
    recordId: record._id.toString(),
    doctorId: doctor.doctorId,
    patientId,
    appointmentId,
    diagnosis,
    visitDate: record.visitDate,
  });

  return {
    status: 201,
    data: {
      message: 'Medical record created successfully',
      record,
    },
  };
};

/**
 * Get medical records by patient
 */
const getMedicalRecordsByPatient = async ({ userId, patientId, page = 1, limit = 10 }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  const query = {
    doctorId: doctor._id,
    patientId,
    isDeleted: false,
  };

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    MedicalRecord.find(query)
      .sort({ visitDate: -1 })
      .skip(skip)
      .limit(limit),
    MedicalRecord.countDocuments(query),
  ]);

  return {
    status: 200,
    data: {
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  };
};

/**
 * Update medical record
 */
const updateMedicalRecord = async ({ userId, recordId, updates }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  const record = await MedicalRecord.findOne({
    _id: recordId,
    doctorId: doctor._id,
    isDeleted: false,
  });

  if (!record) {
    return { status: 404, data: { message: 'Medical record not found' } };
  }

  // Whitelist allowed fields
  const allowedFields = [
    'chiefComplaint',
    'symptoms',
    'diagnosis',
    'diagnosisCode',
    'vitals',
    'physicalExam',
    'prescriptions',
    'notes',
    'treatmentPlan',
    'followUpRequired',
    'followUpDate',
  ];

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      record[field] = updates[field];
    }
  });

  await record.save();

  logger.info('Medical record updated', { recordId });

  return {
    status: 200,
    data: {
      message: 'Medical record updated successfully',
      record,
    },
  };
};

// ========================================
// PRESCRIPTIONS
// ========================================

/**
 * Save prescription
 */
const savePrescription = async ({ userId, data }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  const {
    patientId,
    patientName,
    patientAge,
    patientGender,
    medicalRecordId,
    appointmentId,
    diagnosis,
    medications,
    notes,
    advice,
    fileUrl,
    filePublicId,
    validUntil,
  } = data;

  if (!patientId) {
    return { status: 400, data: { message: 'Patient ID is required' } };
  }

  const prescription = await Prescription.create({
    doctorId: doctor._id,
    patientId,
    patientName,
    patientAge,
    patientGender,
    medicalRecordId,
    appointmentId,
    diagnosis,
    medications: medications || [],
    notes,
    advice,
    fileUrl,
    filePublicId,
    sentToPatient: !!fileUrl,
    sentAt: fileUrl ? new Date() : undefined,
    validUntil,
  });

  logger.info('Prescription saved', {
    prescriptionNumber: prescription.prescriptionNumber,
    doctorId: doctor.doctorId,
    patientId,
  });

  // Publish event
  await publishEvent('prescription.created', {
    prescriptionNumber: prescription.prescriptionNumber,
    doctorId: doctor.doctorId,
    patientId,
    fileUrl,
  });

  return {
    status: 201,
    data: {
      message: 'Prescription saved successfully',
      prescription,
    },
  };
};

/**
 * Get prescriptions
 */
const getMyPrescriptions = async ({ userId, patientId, page = 1, limit = 10 }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  const query = {
    doctorId: doctor._id,
    isDeleted: false,
  };

  if (patientId) {
    query.patientId = patientId;
  }

  const skip = (page - 1) * limit;

  const [prescriptions, total] = await Promise.all([
    Prescription.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Prescription.countDocuments(query),
  ]);

  return {
    status: 200,
    data: {
      prescriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  };
};

// ========================================
// RATINGS
// ========================================

/**
 * Get doctor's ratings
 */
const getMyRatings = async ({ userId, page = 1, limit = 10 }) => {
  const doctor = await Doctor.findOne({ userId, isDeleted: false });
  
  if (!doctor) {
    return { status: 404, data: { message: 'Doctor profile not found' } };
  }

  const skip = (page - 1) * limit;

  const [ratings, total] = await Promise.all([
    Rating.find({ doctorId: doctor._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Rating.countDocuments({ doctorId: doctor._id }),
  ]);

  return {
    status: 200,
    data: {
      ratings,
      summary: {
        averageRating: doctor.rating,
        totalRatings: doctor.totalRatings,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  };
};

// ========================================
// PUBLIC DOCTOR SEARCH
// ========================================

/**
 * Get public doctor list with search/filter
 */
const getPublicDoctors = async ({ specialization, search, page = 1, limit = 10 }) => {
  const query = {
    isDeleted: false,
    status: 'ACTIVE',
  };

  // Specialization filter
  if (specialization) {
    query.specialization = { $regex: specialization, $options: 'i' };
  }

  // Search in name or specialization
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { specialization: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [doctors, total] = await Promise.all([
    Doctor.find(query)
      .select('doctorId fullName specialization experience bio rating totalRatings consultationFee avatarUrl qualifications')
      .sort({ rating: -1, totalRatings: -1 })
      .skip(skip)
      .limit(limit),
    Doctor.countDocuments(query),
  ]);

  return {
    status: 200,
    data: {
      doctors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  };
};

// Export all functions
module.exports = {
  // Profile
  createDoctorProfile,
  getDoctorProfile,
  updateDoctorProfile,
  updateAvatarBase64,
  deactivateDoctorAccount,
  // Dashboard
  getDashboardStats,
  getDoctorAnalytics,
  // Availability
  getAvailability,
  addAvailabilitySlots,
  deleteAvailabilitySlot,
  updateAvailabilitySlot,
  // Appointments
  getMyAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  // Patients
  getMyPatients,
  getPatientDetail,
  // Records
  createMedicalRecord,
  getMedicalRecordsByPatient,
  updateMedicalRecord,
  // Prescriptions
  savePrescription,
  getMyPrescriptions,
  // Ratings
  getMyRatings,
  // Public
  getPublicDoctors,
};
