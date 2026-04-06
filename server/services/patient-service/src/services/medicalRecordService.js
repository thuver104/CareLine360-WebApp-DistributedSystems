/**
 * Medical Record Service
 * Business logic for medical records and history
 */

const MedicalRecord = require('../models/MedicalRecord');

/**
 * Create medical record
 */
const createMedicalRecord = async (recordData) => {
  const record = await MedicalRecord.create(recordData);
  return record;
};

/**
 * Get patient's medical history
 */
const getPatientMedicalHistory = async (patientId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    visitType,
    startDate,
    endDate,
    doctorId
  } = options;

  const filter = {
    patientId,
    isDeleted: false
  };

  if (visitType) {
    filter.visitType = visitType;
  }

  if (doctorId) {
    filter.doctorId = doctorId;
  }

  if (startDate || endDate) {
    filter.visitDate = {};
    if (startDate) filter.visitDate.$gte = new Date(startDate);
    if (endDate) filter.visitDate.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    MedicalRecord.find(filter)
      .sort({ visitDate: -1 })
      .skip(skip)
      .limit(limit),
    MedicalRecord.countDocuments(filter)
  ]);

  return {
    records,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get single medical record by ID
 */
const getMedicalRecordById = async (recordId, patientId) => {
  return MedicalRecord.findOne({
    _id: recordId,
    patientId,
    isDeleted: false
  });
};

/**
 * Get records by doctor
 */
const getRecordsByDoctor = async (doctorId, patientId = null) => {
  const filter = {
    doctorId,
    isDeleted: false
  };

  if (patientId) {
    filter.patientId = patientId;
  }

  return MedicalRecord.find(filter)
    .sort({ visitDate: -1 })
    .limit(100);
};

/**
 * Get latest vitals for patient
 */
const getLatestVitals = async (patientId) => {
  const record = await MedicalRecord.findOne({
    patientId,
    isDeleted: false,
    'vitals.bloodPressure': { $ne: '' }
  })
    .sort({ visitDate: -1 })
    .select('vitals visitDate');

  return record?.vitals || null;
};

/**
 * Get diagnosis history for patient
 */
const getDiagnosisHistory = async (patientId, options = {}) => {
  const { limit = 10 } = options;

  const records = await MedicalRecord.find({
    patientId,
    isDeleted: false,
    diagnosis: { $ne: '' }
  })
    .sort({ visitDate: -1 })
    .limit(limit)
    .select('diagnosis secondaryDiagnosis visitDate doctorSnapshot.name');

  return records.map(r => ({
    diagnosis: r.diagnosis,
    secondaryDiagnosis: r.secondaryDiagnosis,
    visitDate: r.visitDate,
    doctor: r.doctorSnapshot?.name
  }));
};

/**
 * Add attachment to medical record
 */
const addAttachment = async (recordId, patientId, attachment) => {
  return MedicalRecord.findOneAndUpdate(
    {
      _id: recordId,
      patientId,
      isDeleted: false
    },
    {
      $push: {
        attachments: {
          ...attachment,
          uploadedAt: new Date()
        }
      }
    },
    { new: true }
  );
};

/**
 * Get summary stats for patient
 */
const getPatientStats = async (patientId) => {
  const stats = await MedicalRecord.aggregate([
    {
      $match: {
        patientId,
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalVisits: { $sum: 1 },
        consultations: {
          $sum: { $cond: [{ $eq: ['$visitType', 'consultation'] }, 1, 0] }
        },
        followUps: {
          $sum: { $cond: [{ $eq: ['$visitType', 'follow-up'] }, 1, 0] }
        },
        emergencies: {
          $sum: { $cond: [{ $eq: ['$visitType', 'emergency'] }, 1, 0] }
        },
        firstVisit: { $min: '$visitDate' },
        lastVisit: { $max: '$visitDate' }
      }
    }
  ]);

  return stats[0] || {
    totalVisits: 0,
    consultations: 0,
    followUps: 0,
    emergencies: 0,
    firstVisit: null,
    lastVisit: null
  };
};

module.exports = {
  createMedicalRecord,
  getPatientMedicalHistory,
  getMedicalRecordById,
  getRecordsByDoctor,
  getLatestVitals,
  getDiagnosisHistory,
  addAttachment,
  getPatientStats
};
