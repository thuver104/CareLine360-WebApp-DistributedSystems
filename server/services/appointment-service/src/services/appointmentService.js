const Appointment = require('../models/Appointment');
const {
  sendAppointmentCreated,
  sendAppointmentConfirmed,
  sendAppointmentRescheduled,
  sendAppointmentCancelled,
} = require('../config/email');
const {
  publishAppointmentCreated,
  publishAppointmentConfirmed,
  publishAppointmentCancelled,
  publishAppointmentCompleted,
  publishAppointmentRescheduled,
} = require('../publishers/appointmentPublisher');
const logger = require('../config/logger');
const axios = require('axios');

// Valid status transitions
const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no-show'],
  completed: [], // terminal state
  cancelled: [], // terminal state
  'no-show': [], // terminal state
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Fetch doctor info from doctor-service
 */
const fetchDoctorInfo = async (doctorId) => {
  try {
    const url = `${process.env.DOCTOR_SERVICE_URL}/api/v1/doctors/public?doctorId=${doctorId}`;
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.data?.doctors?.length > 0) {
      const doc = response.data.doctors[0];
      return {
        fullName: doc.fullName,
        specialization: doc.specialization,
        email: doc.email,
      };
    }
    return null;
  } catch (error) {
    logger.warn('Failed to fetch doctor info:', error.message);
    return null;
  }
};

/**
 * Fetch patient info from patient-service
 */
const fetchPatientInfo = async (patientId) => {
  try {
    // This would need an internal API endpoint
    // For now, we use the data passed in the request
    return null;
  } catch (error) {
    logger.warn('Failed to fetch patient info:', error.message);
    return null;
  }
};

/**
 * Check if a slot is already booked (double-booking prevention)
 */
const checkDoubleBooking = async (doctorId, date, time, excludeId = null) => {
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);

  const query = {
    doctorId,
    date: { $gte: dateStart, $lte: dateEnd },
    time,
    status: { $nin: ['cancelled', 'no-show'] },
    isDeleted: false,
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await Appointment.findOne(query);
  return !!existing;
};

// ========================================
// CRUD OPERATIONS
// ========================================

/**
 * Create new appointment
 */
const createAppointment = async (data) => {
  const {
    patientId,
    doctorId,
    patientName,
    patientEmail,
    doctorName,
    specialization,
    date,
    time,
    endTime,
    consultationType,
    symptoms,
    notes,
    priority,
  } = data;

  // Check for double booking
  const isBooked = await checkDoubleBooking(doctorId, date, time);
  if (isBooked) {
    const error = new Error('This time slot is already booked');
    error.status = 409;
    throw error;
  }

  // Create appointment
  const appointment = new Appointment({
    patientId,
    doctorId,
    patientName,
    doctorName,
    specialization,
    date,
    time,
    endTime,
    consultationType,
    symptoms,
    notes,
    priority: priority || 'low',
    status: 'pending',
  });

  // Generate meeting URL for video appointments
  if (consultationType === 'video') {
    appointment.generateMeetingUrl();
  }

  await appointment.save();

  logger.info('Appointment created', {
    appointmentId: appointment.appointmentId,
    patientId,
    doctorId,
    date,
    time,
  });

  // Publish event for other services
  try {
    await publishAppointmentCreated(appointment);
  } catch (error) {
    logger.error('Failed to publish appointment.created event:', error);
  }

  // Send email notification
  try {
    if (patientEmail) {
      await sendAppointmentCreated(appointment, patientEmail, doctorName);
    }
  } catch (error) {
    logger.error('Failed to send appointment created email:', error);
  }

  return { status: 201, data: { appointment } };
};

/**
 * Get appointments with filters
 */
const getAppointments = async (filters = {}) => {
  const {
    patientId,
    doctorId,
    status,
    dateFrom,
    dateTo,
    date,
    page = 1,
    limit = 10,
    sort = '-createdAt',
  } = filters;

  const query = { isDeleted: false };

  if (patientId) query.patientId = patientId;
  if (doctorId) query.doctorId = doctorId;
  if (status) query.status = status;

  // Date filters
  if (date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    query.date = { $gte: dayStart, $lte: dayEnd };
  } else if (dateFrom || dateTo) {
    query.date = {};
    if (dateFrom) query.date.$gte = new Date(dateFrom);
    if (dateTo) query.date.$lte = new Date(dateTo);
  }

  const skip = (page - 1) * limit;

  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Appointment.countDocuments(query),
  ]);

  return {
    status: 200,
    data: {
      appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  };
};

/**
 * Get single appointment by ID
 */
const getAppointmentById = async (id) => {
  const appointment = await Appointment.findOne({
    $or: [{ _id: id }, { appointmentId: id }],
    isDeleted: false,
  });

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.status = 404;
    throw error;
  }

  return { status: 200, data: { appointment } };
};

/**
 * Update pending appointment
 */
const updateAppointment = async (id, data) => {
  const appointment = await Appointment.findOne({
    $or: [{ _id: id }, { appointmentId: id }],
    isDeleted: false,
  });

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.status = 404;
    throw error;
  }

  // Only pending appointments can be updated
  if (appointment.status !== 'pending') {
    const error = new Error('Only pending appointments can be updated');
    error.status = 400;
    throw error;
  }

  // Check for double booking if date/time changed
  if (data.date || data.time) {
    const newDate = data.date || appointment.date;
    const newTime = data.time || appointment.time;
    
    const isBooked = await checkDoubleBooking(
      appointment.doctorId,
      newDate,
      newTime,
      appointment._id
    );
    
    if (isBooked) {
      const error = new Error('This time slot is already booked');
      error.status = 409;
      throw error;
    }
  }

  // Whitelist allowed fields
  const allowedFields = [
    'date',
    'time',
    'endTime',
    'consultationType',
    'symptoms',
    'notes',
    'priority',
  ];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      appointment[field] = data[field];
    }
  });

  // Regenerate meeting URL if type changed to video
  if (data.consultationType === 'video' && !appointment.meetingUrl) {
    appointment.generateMeetingUrl();
  }

  await appointment.save();

  logger.info('Appointment updated', { appointmentId: appointment.appointmentId });

  return { status: 200, data: { appointment } };
};

/**
 * Delete pending appointment
 */
const deleteAppointment = async (id) => {
  const appointment = await Appointment.findOne({
    $or: [{ _id: id }, { appointmentId: id }],
    isDeleted: false,
  });

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.status = 404;
    throw error;
  }

  // Only pending appointments can be deleted
  if (appointment.status !== 'pending') {
    const error = new Error('Only pending appointments can be deleted');
    error.status = 400;
    throw error;
  }

  // Soft delete
  appointment.isDeleted = true;
  await appointment.save();

  // Publish cancellation event to free up slot
  try {
    await publishAppointmentCancelled(appointment);
  } catch (error) {
    logger.error('Failed to publish appointment deletion event:', error);
  }

  logger.info('Appointment deleted', { appointmentId: appointment.appointmentId });

  return { status: 200, data: { message: 'Appointment deleted successfully' } };
};

// ========================================
// STATUS MANAGEMENT
// ========================================

/**
 * Transition appointment status
 */
const transitionStatus = async (id, newStatus, userId) => {
  const appointment = await Appointment.findOne({
    $or: [{ _id: id }, { appointmentId: id }],
    isDeleted: false,
  });

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.status = 404;
    throw error;
  }

  // Validate transition
  const validTransitions = VALID_TRANSITIONS[appointment.status];
  if (!validTransitions?.includes(newStatus)) {
    const error = new Error(
      `Invalid status transition: ${appointment.status} → ${newStatus}`
    );
    error.status = 400;
    throw error;
  }

  const previousStatus = appointment.status;
  appointment.status = newStatus;

  // Handle specific transitions
  if (newStatus === 'completed') {
    appointment.completedAt = new Date();
  }

  await appointment.save();

  logger.info('Appointment status changed', {
    appointmentId: appointment.appointmentId,
    from: previousStatus,
    to: newStatus,
  });

  // Publish events and send notifications
  try {
    if (newStatus === 'confirmed') {
      await publishAppointmentConfirmed(appointment);
      // Send email (would need patient email)
      // await sendAppointmentConfirmed(appointment, patientEmail, doctorName);
    } else if (newStatus === 'completed') {
      await publishAppointmentCompleted(appointment);
    }
  } catch (error) {
    logger.error('Failed to publish status transition event:', error);
  }

  return { status: 200, data: { appointment } };
};

/**
 * Reschedule confirmed appointment
 */
const rescheduleAppointment = async (id, newDate, newTime, userId) => {
  const appointment = await Appointment.findOne({
    $or: [{ _id: id }, { appointmentId: id }],
    isDeleted: false,
  });

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.status = 404;
    throw error;
  }

  // Only confirmed appointments can be rescheduled
  if (appointment.status !== 'confirmed') {
    const error = new Error('Only confirmed appointments can be rescheduled');
    error.status = 400;
    throw error;
  }

  // Check for double booking
  const isBooked = await checkDoubleBooking(
    appointment.doctorId,
    newDate,
    newTime,
    appointment._id
  );

  if (isBooked) {
    const error = new Error('This time slot is already booked');
    error.status = 409;
    throw error;
  }

  // Store previous schedule in history
  const previousDate = appointment.date;
  const previousTime = appointment.time;

  appointment.rescheduleHistory.push({
    previousDate,
    previousTime,
    rescheduledBy: userId,
  });

  // Update to new schedule
  appointment.date = new Date(newDate);
  appointment.time = newTime;
  appointment.rescheduleCount += 1;
  
  // Reset reminder flags
  appointment.reminderSent = false;
  appointment.meetingReminderSent = false;

  await appointment.save();

  logger.info('Appointment rescheduled', {
    appointmentId: appointment.appointmentId,
    from: { date: previousDate, time: previousTime },
    to: { date: newDate, time: newTime },
  });

  // Publish event
  try {
    await publishAppointmentRescheduled(appointment, previousDate, previousTime);
  } catch (error) {
    logger.error('Failed to publish reschedule event:', error);
  }

  return { status: 200, data: { appointment } };
};

/**
 * Cancel appointment
 */
const cancelAppointment = async (id, reason, userId) => {
  const appointment = await Appointment.findOne({
    $or: [{ _id: id }, { appointmentId: id }],
    isDeleted: false,
  });

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.status = 404;
    throw error;
  }

  // Cannot cancel completed or already cancelled
  if (['completed', 'cancelled', 'no-show'].includes(appointment.status)) {
    const error = new Error(`Cannot cancel ${appointment.status} appointment`);
    error.status = 400;
    throw error;
  }

  appointment.status = 'cancelled';
  appointment.cancellationReason = reason;
  appointment.cancelledBy = userId;
  appointment.cancelledAt = new Date();

  await appointment.save();

  logger.info('Appointment cancelled', {
    appointmentId: appointment.appointmentId,
    reason,
  });

  // Publish event (doctor-service will free up the slot)
  try {
    await publishAppointmentCancelled(appointment);
  } catch (error) {
    logger.error('Failed to publish cancellation event:', error);
  }

  return { status: 200, data: { appointment } };
};

// ========================================
// STATISTICS
// ========================================

/**
 * Get appointment statistics
 */
const getAppointmentStats = async (filters = {}) => {
  const { doctorId, patientId, dateFrom, dateTo } = filters;

  const matchQuery = { isDeleted: false };
  
  if (doctorId) matchQuery.doctorId = doctorId;
  if (patientId) matchQuery.patientId = patientId;
  
  if (dateFrom || dateTo) {
    matchQuery.date = {};
    if (dateFrom) matchQuery.date.$gte = new Date(dateFrom);
    if (dateTo) matchQuery.date.$lte = new Date(dateTo);
  }

  const stats = await Appointment.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const statusCounts = stats.reduce((acc, s) => {
    acc[s._id] = s.count;
    return acc;
  }, {});

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return {
    status: 200,
    data: {
      total,
      byStatus: statusCounts,
    },
  };
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  transitionStatus,
  rescheduleAppointment,
  cancelAppointment,
  getAppointmentStats,
};
