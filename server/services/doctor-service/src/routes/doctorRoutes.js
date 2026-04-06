const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  createProfileValidation,
  avatarValidation,
  slotsValidation,
  updateSlotValidation,
} = require('../middleware/validation');

// ========================================
// PUBLIC ROUTES (No authentication required)
// ========================================

/**
 * @route   GET /api/v1/doctors/public
 * @desc    List doctors with search/filter (public)
 * @access  Public
 * @query   specialization, search, page, limit
 */
router.get('/public', doctorController.listDoctors);

// ========================================
// PROTECTED ROUTES (Require authentication + doctor role)
// ========================================

// Apply auth middleware to all routes below
const doctorAuth = [authMiddleware, roleMiddleware(['doctor'])];

// ---------- Profile Management ----------

/**
 * @route   POST /api/v1/doctors/profile
 * @desc    Create doctor profile
 * @access  Private (Doctor only)
 */
router.post('/profile', doctorAuth, createProfileValidation, doctorController.createProfile);

/**
 * @route   GET /api/v1/doctors/profile
 * @desc    Get doctor profile
 * @access  Private (Doctor only)
 */
router.get('/profile', doctorAuth, doctorController.getProfile);

/**
 * @route   PUT /api/v1/doctors/profile
 * @desc    Update doctor profile
 * @access  Private (Doctor only)
 */
router.put('/profile', doctorAuth, doctorController.updateProfile);

/**
 * @route   PUT /api/v1/doctors/profile/avatar
 * @desc    Update avatar image
 * @access  Private (Doctor only)
 */
router.put('/profile/avatar', doctorAuth, avatarValidation, doctorController.updateAvatar);

/**
 * @route   DELETE /api/v1/doctors/account
 * @desc    Deactivate account
 * @access  Private (Doctor only)
 */
router.delete('/account', doctorAuth, doctorController.deactivateAccount);

// ---------- Dashboard ----------

/**
 * @route   GET /api/v1/doctors/dashboard
 * @desc    Get dashboard statistics
 * @access  Private (Doctor only)
 */
router.get('/dashboard', doctorAuth, doctorController.getDashboard);

/**
 * @route   GET /api/v1/doctors/analytics
 * @desc    Get detailed analytics
 * @access  Private (Doctor only)
 */
router.get('/analytics', doctorAuth, doctorController.getAnalytics);

// ---------- Availability ----------

/**
 * @route   GET /api/v1/doctors/availability
 * @desc    Get availability slots
 * @access  Private (Doctor only)
 */
router.get('/availability', doctorAuth, doctorController.getAvailability);

/**
 * @route   POST /api/v1/doctors/availability
 * @desc    Add availability slots
 * @access  Private (Doctor only)
 */
router.post('/availability', doctorAuth, slotsValidation, doctorController.addSlots);

/**
 * @route   DELETE /api/v1/doctors/availability/:slotId
 * @desc    Delete availability slot
 * @access  Private (Doctor only)
 */
router.delete('/availability/:slotId', doctorAuth, doctorController.deleteSlot);

/**
 * @route   PUT /api/v1/doctors/availability/:slotId
 * @desc    Update availability slot
 * @access  Private (Doctor only)
 */
router.put('/availability/:slotId', doctorAuth, updateSlotValidation, doctorController.updateSlot);

// ---------- Appointments ----------

/**
 * @route   GET /api/v1/doctors/appointments
 * @desc    Get doctor's appointments
 * @access  Private (Doctor only)
 * @query   status, date, dateFrom, dateTo, search, page, limit
 */
router.get('/appointments', doctorAuth, doctorController.getAppointments);

/**
 * @route   PATCH /api/v1/doctors/appointments/:appointmentId
 * @desc    Update appointment status
 * @access  Private (Doctor only)
 */
router.patch('/appointments/:appointmentId', doctorAuth, doctorController.updateAppointment);

/**
 * @route   DELETE /api/v1/doctors/appointments/:appointmentId
 * @desc    Delete appointment
 * @access  Private (Doctor only)
 */
router.delete('/appointments/:appointmentId', doctorAuth, doctorController.deleteAppointment);

// ---------- Patients ----------

/**
 * @route   GET /api/v1/doctors/patients
 * @desc    Get list of patients
 * @access  Private (Doctor only)
 * @query   search, page, limit
 */
router.get('/patients', doctorAuth, doctorController.getPatients);

/**
 * @route   GET /api/v1/doctors/patients/:patientId
 * @desc    Get patient details
 * @access  Private (Doctor only)
 */
router.get('/patients/:patientId', doctorAuth, doctorController.getPatientDetail);

// ---------- Medical Records ----------

/**
 * @route   POST /api/v1/doctors/records
 * @desc    Create medical record
 * @access  Private (Doctor only)
 */
router.post('/records', doctorAuth, doctorController.createRecord);

/**
 * @route   GET /api/v1/doctors/records/:patientId
 * @desc    Get medical records by patient
 * @access  Private (Doctor only)
 * @query   page, limit
 */
router.get('/records/:patientId', doctorAuth, doctorController.getRecordsByPatient);

/**
 * @route   PUT /api/v1/doctors/records/:recordId
 * @desc    Update medical record
 * @access  Private (Doctor only)
 */
router.put('/records/:recordId', doctorAuth, doctorController.updateRecord);

// ---------- Prescriptions ----------

/**
 * @route   POST /api/v1/doctors/prescriptions
 * @desc    Save prescription
 * @access  Private (Doctor only)
 */
router.post('/prescriptions', doctorAuth, doctorController.savePrescription);

/**
 * @route   GET /api/v1/doctors/prescriptions
 * @desc    Get prescriptions
 * @access  Private (Doctor only)
 * @query   patientId, page, limit
 */
router.get('/prescriptions', doctorAuth, doctorController.getPrescriptions);

// ---------- Ratings ----------

/**
 * @route   GET /api/v1/doctors/ratings
 * @desc    Get doctor's ratings
 * @access  Private (Doctor only)
 * @query   page, limit
 */
router.get('/ratings', doctorAuth, doctorController.getRatings);

module.exports = router;
