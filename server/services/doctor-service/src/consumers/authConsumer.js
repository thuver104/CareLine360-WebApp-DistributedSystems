const { subscribeToEvents, publishEvent } = require('../config/rabbitmq');
const Doctor = require('../models/Doctor');
const Counter = require('../models/Counter');
const logger = require('../config/logger');

const QUEUE_NAME = 'doctor.events';

/**
 * Generate next doctor ID (DOC-000001, DOC-000002, etc.)
 * @returns {Promise<string>}
 */
const getNextDoctorId = async () => {
  const counter = await Counter.findByIdAndUpdate(
    { _id: 'doctorId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `DOC-${String(counter.seq).padStart(6, '0')}`;
};

/**
 * Handle user.registered event for doctors
 * @param {Object} payload - Event payload from auth-service
 */
const handleUserRegistered = async (payload) => {
  const { userId, email, phone, fullName, role } = payload;

  // Only process if role is doctor
  if (role !== 'doctor') {
    logger.debug('Ignoring non-doctor registration', { userId, role });
    return;
  }

  try {
    // Check if doctor profile already exists
    const existingDoctor = await Doctor.findOne({ userId });
    if (existingDoctor) {
      logger.warn('Doctor profile already exists', { userId, doctorId: existingDoctor.doctorId });
      return;
    }

    // Generate doctor ID
    const doctorId = await getNextDoctorId();

    // Create doctor profile with PENDING status (awaiting admin verification)
    const doctor = await Doctor.create({
      userId,
      doctorId,
      fullName: fullName || 'Doctor',
      email,
      phone,
      status: 'PENDING', // Requires admin approval
      profileStrength: 10, // Initial profile strength
    });

    logger.info('Doctor profile created from registration event', {
      userId,
      doctorId: doctor.doctorId,
      status: doctor.status,
    });

    // Publish doctor.profile.created event
    await publishEvent('doctor.profile.created', {
      doctorId: doctor.doctorId,
      userId,
      email,
      fullName,
      status: 'PENDING',
    });

  } catch (error) {
    logger.error('Failed to create doctor profile:', error);
    throw error; // Requeue message for retry
  }
};

/**
 * Handle doctor.verified event from auth-service/admin
 * @param {Object} payload - Event payload
 */
const handleDoctorVerified = async (payload) => {
  const { userId, doctorId, verifiedBy } = payload;

  try {
    const doctor = await Doctor.findOne({ 
      $or: [{ userId }, { doctorId }],
      isDeleted: false,
    });

    if (!doctor) {
      logger.warn('Doctor not found for verification', { userId, doctorId });
      return;
    }

    // Update verification status
    doctor.isVerified = true;
    doctor.verifiedAt = new Date();
    doctor.status = 'ACTIVE';
    await doctor.save();

    logger.info('Doctor verified successfully', {
      doctorId: doctor.doctorId,
      verifiedBy,
    });

    // Publish doctor.activated event
    await publishEvent('doctor.activated', {
      doctorId: doctor.doctorId,
      userId: doctor.userId,
      email: doctor.email,
      fullName: doctor.fullName,
    });

  } catch (error) {
    logger.error('Failed to verify doctor:', error);
    throw error;
  }
};

/**
 * Handle appointment events from appointment-service
 * Creates local copy of appointment for doctor queries
 */
const handleAppointmentCreated = async (payload) => {
  const Appointment = require('../models/Appointment');
  
  const {
    appointmentId,
    doctorId,
    patientId,
    patientName,
    patientEmail,
    patientPhone,
    date,
    startTime,
    endTime,
    type,
    reason,
  } = payload;

  try {
    // Find doctor by doctorId string
    const doctor = await Doctor.findOne({ doctorId, isDeleted: false });
    if (!doctor) {
      logger.warn('Doctor not found for appointment', { doctorId });
      return;
    }

    // Check if appointment already exists
    const existing = await Appointment.findOne({ appointmentId });
    if (existing) {
      logger.debug('Appointment already exists locally', { appointmentId });
      return;
    }

    // Create local copy
    await Appointment.create({
      appointmentId,
      doctorId: doctor._id,
      patientId,
      patientName,
      patientEmail,
      patientPhone,
      date,
      startTime,
      endTime,
      type: type || 'in-person',
      status: 'pending',
      reason,
    });

    // Mark availability slot as booked
    const slot = doctor.availabilitySlots.find(
      s => s.date === date && s.startTime === startTime && !s.isBooked
    );
    if (slot) {
      slot.isBooked = true;
      slot.appointmentId = appointmentId;
      await doctor.save();
    }

    logger.info('Appointment replicated to doctor-service', { appointmentId, doctorId });

  } catch (error) {
    logger.error('Failed to handle appointment.created:', error);
    throw error;
  }
};

/**
 * Handle appointment status updates
 */
const handleAppointmentUpdated = async (payload) => {
  const Appointment = require('../models/Appointment');
  
  const { appointmentId, status, notes } = payload;

  try {
    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) {
      logger.warn('Appointment not found for update', { appointmentId });
      return;
    }

    appointment.status = status;
    if (notes) appointment.notes = notes;
    await appointment.save();

    // If cancelled, free up the slot
    if (status === 'cancelled') {
      const doctor = await Doctor.findById(appointment.doctorId);
      if (doctor) {
        const slot = doctor.availabilitySlots.find(
          s => s.appointmentId === appointmentId
        );
        if (slot) {
          slot.isBooked = false;
          slot.appointmentId = null;
          await doctor.save();
        }
      }
    }

    logger.info('Appointment updated in doctor-service', { appointmentId, status });

  } catch (error) {
    logger.error('Failed to handle appointment.updated:', error);
    throw error;
  }
};

/**
 * Main event handler
 */
const handleEvent = async (routingKey, payload) => {
  logger.info(`Processing event: ${routingKey}`);

  switch (routingKey) {
    case 'user.registered':
    case 'user.registered.doctor':
      await handleUserRegistered(payload);
      break;
      
    case 'doctor.verified':
      await handleDoctorVerified(payload);
      break;
      
    case 'appointment.created':
      await handleAppointmentCreated(payload);
      break;
      
    case 'appointment.updated':
    case 'appointment.cancelled':
      await handleAppointmentUpdated(payload);
      break;
      
    default:
      logger.debug(`Unhandled event: ${routingKey}`);
  }
};

/**
 * Start auth event consumer
 */
const startAuthConsumer = async () => {
  const routingKeys = [
    'user.registered',
    'user.registered.doctor',
    'doctor.verified',
    'appointment.created',
    'appointment.updated',
    'appointment.cancelled',
  ];

  await subscribeToEvents(QUEUE_NAME, routingKeys, handleEvent);
  
  logger.info('Auth consumer started', { queue: QUEUE_NAME, routingKeys });
};

module.exports = { startAuthConsumer };
