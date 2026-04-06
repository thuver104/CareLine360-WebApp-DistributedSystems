/**
 * Medical Record Controller
 * HTTP handlers for medical record endpoints
 */

const medicalRecordService = require('../services/medicalRecordService');

/**
 * GET /api/v1/patient/medical-records
 * Get patient's medical history
 */
const getMyMedicalRecords = async (req, res) => {
  try {
    const patientId = req.user.patientId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const { visitType, startDate, endDate, doctorId, page, limit } = req.query;

    const result = await medicalRecordService.getPatientMedicalHistory(patientId, {
      visitType,
      startDate,
      endDate,
      doctorId,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    });

    return res.json({
      success: true,
      data: result.records,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('getMyMedicalRecords error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch medical records',
      requestId: req.requestId
    });
  }
};

/**
 * GET /api/v1/patient/medical-records/:id
 * Get single medical record
 */
const getMedicalRecord = async (req, res) => {
  try {
    const patientId = req.user.patientId;
    const { id } = req.params;

    const record = await medicalRecordService.getMedicalRecordById(id, patientId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    return res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('getMedicalRecord error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch medical record',
      requestId: req.requestId
    });
  }
};

/**
 * GET /api/v1/patient/medical-records/vitals/latest
 * Get latest vitals
 */
const getLatestVitals = async (req, res) => {
  try {
    const patientId = req.user.patientId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const vitals = await medicalRecordService.getLatestVitals(patientId);

    return res.json({
      success: true,
      data: vitals
    });
  } catch (error) {
    console.error('getLatestVitals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vitals',
      requestId: req.requestId
    });
  }
};

/**
 * GET /api/v1/patient/medical-records/diagnosis
 * Get diagnosis history
 */
const getDiagnosisHistory = async (req, res) => {
  try {
    const patientId = req.user.patientId;
    const { limit } = req.query;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const diagnoses = await medicalRecordService.getDiagnosisHistory(patientId, {
      limit: parseInt(limit) || 10
    });

    return res.json({
      success: true,
      data: diagnoses
    });
  } catch (error) {
    console.error('getDiagnosisHistory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch diagnosis history',
      requestId: req.requestId
    });
  }
};

/**
 * GET /api/v1/patient/medical-records/stats
 * Get patient visit statistics
 */
const getPatientStats = async (req, res) => {
  try {
    const patientId = req.user.patientId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const stats = await medicalRecordService.getPatientStats(patientId);

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('getPatientStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      requestId: req.requestId
    });
  }
};

module.exports = {
  getMyMedicalRecords,
  getMedicalRecord,
  getLatestVitals,
  getDiagnosisHistory,
  getPatientStats
};
