const doctorService = require('../services/doctorService');
const logger = require('../config/logger');
const { validationResult } = require('express-validator');

/**
 * Helper to handle validation errors
 */
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
};

// ========================================
// PROFILE MANAGEMENT
// ========================================

const createProfile = async (req, res) => {
  try {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { fullName, specialization } = req.body;
    const userId = req.user.userId;

    const result = await doctorService.createDoctorProfile({
      userId,
      fullName,
      specialization,
      email: req.user.email,
      phone: req.user.phone,
    });

    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Create profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await doctorService.getDoctorProfile({
      userId: req.user.userId,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Get profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const result = await doctorService.updateDoctorProfile({
      userId: req.user.userId,
      updates: req.body,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateAvatar = async (req, res) => {
  try {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { image } = req.body;
    const result = await doctorService.updateAvatarBase64({
      userId: req.user.userId,
      base64Image: image,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Update avatar error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const deactivateAccount = async (req, res) => {
  try {
    const result = await doctorService.deactivateDoctorAccount({
      userId: req.user.userId,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Deactivate account error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ========================================
// DASHBOARD
// ========================================

const getDashboard = async (req, res) => {
  try {
    const result = await doctorService.getDashboardStats({
      userId: req.user.userId,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Get dashboard error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const result = await doctorService.getDoctorAnalytics({
      userId: req.user.userId,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Get analytics error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ========================================
// AVAILABILITY
// ========================================

const getAvailability = async (req, res) => {
  try {
    const result = await doctorService.getAvailability({
      userId: req.user.userId,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Get availability error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const addSlots = async (req, res) => {
  try {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { slots } = req.body;
    const result = await doctorService.addAvailabilitySlots({
      userId: req.user.userId,
      slots,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Add slots error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const result = await doctorService.deleteAvailabilitySlot({
      userId: req.user.userId,
      slotId,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Delete slot error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateSlot = async (req, res) => {
  try {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { slotId } = req.params;
    const { startTime, endTime } = req.body;
    const result = await doctorService.updateAvailabilitySlot({
      userId: req.user.userId,
      slotId,
      startTime,
      endTime,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Update slot error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ========================================
// APPOINTMENTS
// ========================================

const getAppointments = async (req, res) => {
  try {
    const { status, date, dateFrom, dateTo, search, page, limit } = req.query;
    const result = await doctorService.getMyAppointments({
      userId: req.user.userId,
      status,
      date,
      dateFrom,
      dateTo,
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Get appointments error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, notes } = req.body;
    const result = await doctorService.updateAppointmentStatus({
      userId: req.user.userId,
      appointmentId,
      status,
      notes,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Update appointment error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const result = await doctorService.deleteAppointment({
      userId: req.user.userId,
      appointmentId,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Delete appointment error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ========================================
// PATIENTS
// ========================================

const getPatients = async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const result = await doctorService.getMyPatients({
      userId: req.user.userId,
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Get patients error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getPatientDetail = async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await doctorService.getPatientDetail({
      userId: req.user.userId,
      patientId,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Get patient detail error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ========================================
// MEDICAL RECORDS
// ========================================

const createRecord = async (req, res) => {
  try {
    const result = await doctorService.createMedicalRecord({
      userId: req.user.userId,
      data: req.body,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Create record error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getRecordsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page, limit } = req.query;
    const result = await doctorService.getMedicalRecordsByPatient({
      userId: req.user.userId,
      patientId,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Get records error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const result = await doctorService.updateMedicalRecord({
      userId: req.user.userId,
      recordId,
      updates: req.body,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Update record error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ========================================
// PRESCRIPTIONS
// ========================================

const savePrescription = async (req, res) => {
  try {
    const result = await doctorService.savePrescription({
      userId: req.user.userId,
      data: req.body,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Save prescription error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getPrescriptions = async (req, res) => {
  try {
    const { patientId, page, limit } = req.query;
    const result = await doctorService.getMyPrescriptions({
      userId: req.user.userId,
      patientId,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Get prescriptions error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ========================================
// RATINGS
// ========================================

const getRatings = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await doctorService.getMyRatings({
      userId: req.user.userId,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Get ratings error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ========================================
// PUBLIC ROUTES
// ========================================

const listDoctors = async (req, res) => {
  try {
    const { specialization, search, page, limit } = req.query;
    const result = await doctorService.getPublicDoctors({
      specialization,
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('List doctors error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  // Profile
  createProfile,
  getProfile,
  updateProfile,
  updateAvatar,
  deactivateAccount,
  // Dashboard
  getDashboard,
  getAnalytics,
  // Availability
  getAvailability,
  addSlots,
  deleteSlot,
  updateSlot,
  // Appointments
  getAppointments,
  updateAppointment,
  deleteAppointment,
  // Patients
  getPatients,
  getPatientDetail,
  // Records
  createRecord,
  getRecordsByPatient,
  updateRecord,
  // Prescriptions
  savePrescription,
  getPrescriptions,
  // Ratings
  getRatings,
  // Public
  listDoctors,
};
