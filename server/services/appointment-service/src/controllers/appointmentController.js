const appointmentService = require('../services/appointmentService');
const logger = require('../config/logger');

/**
 * Create new appointment
 * POST /api/v1/appointments
 */
const createAppointment = async (req, res) => {
  try {
    const result = await appointmentService.createAppointment({
      patientId: req.user.userId,
      patientName: req.user.fullName,
      patientEmail: req.user.email,
      ...req.body,
    });
    
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Create appointment error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to create appointment',
    });
  }
};

/**
 * Get my appointments (patient view)
 * GET /api/v1/appointments/me
 */
const getMyAppointments = async (req, res) => {
  try {
    const result = await appointmentService.getAppointments({
      patientId: req.user.userId,
      ...req.query,
    });
    
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Get my appointments error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to fetch appointments',
    });
  }
};

/**
 * Get appointments for doctor
 * GET /api/v1/appointments/doctor
 */
const getDoctorAppointments = async (req, res) => {
  try {
    const result = await appointmentService.getAppointments({
      doctorId: req.user.userId,
      ...req.query,
    });
    
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Get doctor appointments error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to fetch appointments',
    });
  }
};

/**
 * Get all appointments (admin view)
 * GET /api/v1/appointments
 */
const getAllAppointments = async (req, res) => {
  try {
    const result = await appointmentService.getAppointments(req.query);
    
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Get all appointments error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to fetch appointments',
    });
  }
};

/**
 * Get single appointment
 * GET /api/v1/appointments/:id
 */
const getAppointment = async (req, res) => {
  try {
    const result = await appointmentService.getAppointmentById(req.params.id);
    
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Get appointment error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to fetch appointment',
    });
  }
};

/**
 * Update pending appointment
 * PUT /api/v1/appointments/:id
 */
const updateAppointment = async (req, res) => {
  try {
    const result = await appointmentService.updateAppointment(
      req.params.id,
      req.body
    );
    
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Update appointment error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to update appointment',
    });
  }
};

/**
 * Delete pending appointment
 * DELETE /api/v1/appointments/:id
 */
const deleteAppointment = async (req, res) => {
  try {
    const result = await appointmentService.deleteAppointment(req.params.id);
    
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Delete appointment error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to delete appointment',
    });
  }
};

/**
 * Confirm appointment (doctor)
 * PATCH /api/v1/appointments/:id/confirm
 */
const confirmAppointment = async (req, res) => {
  try {
    const result = await appointmentService.transitionStatus(
      req.params.id,
      'confirmed',
      req.user.userId
    );
    
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Confirm appointment error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to confirm appointment',
    });
  }
};

/**
 * Complete appointment (doctor)
 * PATCH /api/v1/appointments/:id/complete
 */
const completeAppointment = async (req, res) => {
  try {
    const result = await appointmentService.transitionStatus(
      req.params.id,
      'completed',
      req.user.userId
    );
    
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Complete appointment error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to complete appointment',
    });
  }
};

/**
 * Mark as no-show (doctor)
 * PATCH /api/v1/appointments/:id/no-show
 */
const markNoShow = async (req, res) => {
  try {
    const result = await appointmentService.transitionStatus(
      req.params.id,
      'no-show',
      req.user.userId
    );
    
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Mark no-show error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to mark as no-show',
    });
  }
};

/**
 * Reschedule appointment
 * PATCH /api/v1/appointments/:id/reschedule
 */
const rescheduleAppointment = async (req, res) => {
  try {
    const { date, time } = req.body;
    
    if (!date || !time) {
      return res.status(400).json({
        error: 'Date and time are required for rescheduling',
      });
    }
    
    const result = await appointmentService.rescheduleAppointment(
      req.params.id,
      date,
      time,
      req.user.userId
    );
    
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Reschedule appointment error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to reschedule appointment',
    });
  }
};

/**
 * Cancel appointment
 * PATCH /api/v1/appointments/:id/cancel
 */
const cancelAppointment = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const result = await appointmentService.cancelAppointment(
      req.params.id,
      reason || 'No reason provided',
      req.user.userId
    );
    
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Cancel appointment error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to cancel appointment',
    });
  }
};

/**
 * Get appointment statistics
 * GET /api/v1/appointments/stats
 */
const getStats = async (req, res) => {
  try {
    const result = await appointmentService.getAppointmentStats(req.query);
    
    return res.status(result.status).json(result.data);
  } catch (error) {
    logger.error('Get stats error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to fetch statistics',
    });
  }
};

/**
 * Check doctor availability for a specific slot
 * GET /api/v1/appointments/check-availability
 */
const checkAvailability = async (req, res) => {
  try {
    const { doctorId, date, time } = req.query;
    
    if (!doctorId || !date || !time) {
      return res.status(400).json({
        error: 'doctorId, date, and time are required',
      });
    }
    
    const Appointment = require('../models/Appointment');
    
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);
    
    const existing = await Appointment.findOne({
      doctorId,
      date: { $gte: dateStart, $lte: dateEnd },
      time,
      status: { $nin: ['cancelled', 'no-show'] },
      isDeleted: false,
    });
    
    return res.status(200).json({
      available: !existing,
      doctorId,
      date,
      time,
    });
  } catch (error) {
    logger.error('Check availability error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to check availability',
    });
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getAllAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  confirmAppointment,
  completeAppointment,
  markNoShow,
  rescheduleAppointment,
  cancelAppointment,
  getStats,
  checkAvailability,
};
