/**
 * Patient Controller
 * HTTP handlers for patient profile endpoints
 */

const patientService = require('../services/patientService');
const { calcPatientProfileStrength } = require('../services/profileStrengthService');
const PatientDocument = require('../models/PatientDocument');
const { validationResult } = require('express-validator');

/**
 * GET /api/v1/patient/me
 * Get current patient's profile
 */
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await patientService.getPatientByUserId(userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const { patient, profileStrength } = result;

    return res.json({
      success: true,
      data: {
        patientId: patient.patientId,
        fullName: patient.fullName,
        email: patient.email,
        avatarUrl: patient.avatarUrl,
        dob: patient.dob,
        age: patient.age,
        gender: patient.gender,
        nic: patient.nic,
        phone: patient.phone,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions,
        heightCm: patient.heightCm,
        weightKg: patient.weightKg,
        bmi: patient.bmi,
        profileStrength,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt
      }
    });
  } catch (error) {
    console.error('getMyProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      requestId: req.requestId
    });
  }
};

/**
 * PATCH /api/v1/patient/me
 * Update current patient's profile
 */
const updateMyProfile = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const patient = await patientService.updatePatientProfile(userId, req.body);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Recalculate profile strength
    const docsCount = await PatientDocument.countForPatient(patient.patientId);
    const profileStrength = calcPatientProfileStrength({ patient, docsCount });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        patient,
        profileStrength
      }
    });
  } catch (error) {
    console.error('updateMyProfile error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      requestId: req.requestId
    });
  }
};

/**
 * PATCH /api/v1/patient/me/avatar
 * Upload/update avatar image
 */
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file?.path) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const avatarUrl = req.file.path;
    const patient = await patientService.updatePatientAvatar(userId, avatarUrl);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    return res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: { avatarUrl }
    });
  } catch (error) {
    console.error('uploadAvatar error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload avatar',
      requestId: req.requestId
    });
  }
};

/**
 * PATCH /api/v1/patient/me/deactivate
 * Deactivate patient account
 */
const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const patient = await patientService.deactivatePatient(userId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    return res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('deactivateAccount error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate account',
      requestId: req.requestId
    });
  }
};

/**
 * GET /api/v1/patient/search
 * Search patients (for admin/doctor)
 */
const searchPatients = async (req, res) => {
  try {
    const { q, page, limit } = req.query;

    const result = await patientService.searchPatients(q, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    });

    return res.json({
      success: true,
      data: result.patients,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('searchPatients error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search patients',
      requestId: req.requestId
    });
  }
};

/**
 * GET /api/v1/patient/:patientId
 * Get patient by patientId (for doctor/admin)
 */
const getPatientById = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await patientService.getPatientByPatientId(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    return res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('getPatientById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patient',
      requestId: req.requestId
    });
  }
};

/**
 * GET /api/v1/patient/:patientId/summary
 * Get patient summary (for cross-service queries)
 */
const getPatientSummary = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await patientService.getPatientSummary(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    return res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('getPatientSummary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patient summary',
      requestId: req.requestId
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  deactivateAccount,
  searchPatients,
  getPatientById,
  getPatientSummary
};
