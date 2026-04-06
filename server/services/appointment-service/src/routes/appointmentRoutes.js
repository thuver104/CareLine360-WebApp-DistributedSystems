const express = require('express');
const router = express.Router();

const appointmentController = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createAppointmentRules,
  updateAppointmentRules,
  rescheduleRules,
  cancelRules,
  queryRules,
  idParamRules,
  checkAvailabilityRules,
} = require('../validators/appointmentValidator');

// ========================================
// PUBLIC ROUTES
// ========================================

// Check availability (can be public)
router.get(
  '/check-availability',
  checkAvailabilityRules,
  validate,
  appointmentController.checkAvailability
);

// ========================================
// PATIENT ROUTES
// ========================================

// Create appointment (patient)
router.post(
  '/',
  authenticate,
  authorize('Patient', 'Admin'),
  createAppointmentRules,
  validate,
  appointmentController.createAppointment
);

// Get my appointments (patient)
router.get(
  '/me',
  authenticate,
  authorize('Patient'),
  queryRules,
  validate,
  appointmentController.getMyAppointments
);

// ========================================
// DOCTOR ROUTES
// ========================================

// Get doctor's appointments
router.get(
  '/doctor',
  authenticate,
  authorize('Doctor'),
  queryRules,
  validate,
  appointmentController.getDoctorAppointments
);

// Confirm appointment
router.patch(
  '/:id/confirm',
  authenticate,
  authorize('Doctor', 'Admin'),
  idParamRules,
  validate,
  appointmentController.confirmAppointment
);

// Complete appointment
router.patch(
  '/:id/complete',
  authenticate,
  authorize('Doctor', 'Admin'),
  idParamRules,
  validate,
  appointmentController.completeAppointment
);

// Mark as no-show
router.patch(
  '/:id/no-show',
  authenticate,
  authorize('Doctor', 'Admin'),
  idParamRules,
  validate,
  appointmentController.markNoShow
);

// ========================================
// SHARED ROUTES (Patient, Doctor, Admin)
// ========================================

// Reschedule appointment
router.patch(
  '/:id/reschedule',
  authenticate,
  authorize('Patient', 'Doctor', 'Admin'),
  rescheduleRules,
  validate,
  appointmentController.rescheduleAppointment
);

// Cancel appointment
router.patch(
  '/:id/cancel',
  authenticate,
  authorize('Patient', 'Doctor', 'Admin'),
  cancelRules,
  validate,
  appointmentController.cancelAppointment
);

// Get single appointment
router.get(
  '/:id',
  authenticate,
  idParamRules,
  validate,
  appointmentController.getAppointment
);

// Update pending appointment
router.put(
  '/:id',
  authenticate,
  authorize('Patient', 'Admin'),
  updateAppointmentRules,
  validate,
  appointmentController.updateAppointment
);

// Delete pending appointment
router.delete(
  '/:id',
  authenticate,
  authorize('Patient', 'Admin'),
  idParamRules,
  validate,
  appointmentController.deleteAppointment
);

// ========================================
// ADMIN ROUTES
// ========================================

// Get all appointments
router.get(
  '/',
  authenticate,
  authorize('Admin'),
  queryRules,
  validate,
  appointmentController.getAllAppointments
);

// Get statistics
router.get(
  '/stats',
  authenticate,
  authorize('Admin', 'Doctor'),
  appointmentController.getStats
);

module.exports = router;
