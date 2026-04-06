const { publishEvent } = require('../config/rabbitmq');
const logger = require('../config/logger');

/**
 * Publish appointment.created event
 * Consumed by: doctor-service (update availability), notification-service
 */
const publishAppointmentCreated = async (appointment) => {
  await publishEvent('appointment.created', {
    appointmentId: appointment.appointmentId,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    patientName: appointment.patientName,
    doctorName: appointment.doctorName,
    date: appointment.date,
    startTime: appointment.time,
    endTime: appointment.endTime,
    type: appointment.consultationType,
    status: appointment.status,
    priority: appointment.priority,
    meetingUrl: appointment.meetingUrl,
  });
  
  logger.info('Published appointment.created', { 
    appointmentId: appointment.appointmentId 
  });
};

/**
 * Publish appointment.confirmed event
 */
const publishAppointmentConfirmed = async (appointment) => {
  await publishEvent('appointment.confirmed', {
    appointmentId: appointment.appointmentId,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    date: appointment.date,
    time: appointment.time,
    type: appointment.consultationType,
  });
  
  logger.info('Published appointment.confirmed', { 
    appointmentId: appointment.appointmentId 
  });
};

/**
 * Publish appointment.cancelled event
 * Consumed by: doctor-service (free up availability slot)
 */
const publishAppointmentCancelled = async (appointment) => {
  await publishEvent('appointment.cancelled', {
    appointmentId: appointment.appointmentId,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    date: appointment.date,
    time: appointment.time,
    reason: appointment.cancellationReason,
    cancelledBy: appointment.cancelledBy,
  });
  
  logger.info('Published appointment.cancelled', { 
    appointmentId: appointment.appointmentId 
  });
};

/**
 * Publish appointment.completed event
 */
const publishAppointmentCompleted = async (appointment) => {
  await publishEvent('appointment.completed', {
    appointmentId: appointment.appointmentId,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    date: appointment.date,
    time: appointment.time,
    completedAt: appointment.completedAt,
  });
  
  logger.info('Published appointment.completed', { 
    appointmentId: appointment.appointmentId 
  });
};

/**
 * Publish appointment.rescheduled event
 */
const publishAppointmentRescheduled = async (appointment, previousDate, previousTime) => {
  await publishEvent('appointment.rescheduled', {
    appointmentId: appointment.appointmentId,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    previousDate,
    previousTime,
    newDate: appointment.date,
    newTime: appointment.time,
    type: appointment.consultationType,
  });
  
  logger.info('Published appointment.rescheduled', { 
    appointmentId: appointment.appointmentId 
  });
};

module.exports = {
  publishAppointmentCreated,
  publishAppointmentConfirmed,
  publishAppointmentCancelled,
  publishAppointmentCompleted,
  publishAppointmentRescheduled,
};
