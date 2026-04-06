const { subscribeToEvents } = require('../config/rabbitmq');
const Appointment = require('../models/Appointment');
const logger = require('../config/logger');

const QUEUE_NAME = 'appointment.profile.events';

/**
 * Handle doctor availability updated event
 * Syncs availability data if needed
 */
const handleDoctorAvailabilityUpdated = async (payload) => {
  const { doctorId, slots } = payload;
  
  logger.debug('Doctor availability updated', { doctorId, slotsCount: slots?.length });
  
  // This event is mainly for reference
  // appointment-service checks availability via API call before booking
};

/**
 * Handle patient profile updated event
 * Updates denormalized patient name in appointments
 */
const handlePatientProfileUpdated = async (payload) => {
  const { patientId, fullName } = payload;
  
  if (!patientId || !fullName) return;
  
  try {
    // Update denormalized name in future appointments
    const result = await Appointment.updateMany(
      { 
        patientId, 
        date: { $gte: new Date() },
        status: { $nin: ['completed', 'cancelled'] },
      },
      { patientName: fullName }
    );
    
    if (result.modifiedCount > 0) {
      logger.info('Updated patient name in appointments', {
        patientId,
        fullName,
        count: result.modifiedCount,
      });
    }
  } catch (error) {
    logger.error('Failed to update patient name in appointments:', error);
    throw error;
  }
};

/**
 * Handle doctor profile updated event
 * Updates denormalized doctor name in appointments
 */
const handleDoctorProfileUpdated = async (payload) => {
  const { doctorId, fullName, specialization } = payload;
  
  if (!doctorId) return;
  
  try {
    const updateFields = {};
    if (fullName) updateFields.doctorName = fullName;
    if (specialization) updateFields.specialization = specialization;
    
    if (Object.keys(updateFields).length === 0) return;
    
    // Update denormalized fields in future appointments
    const result = await Appointment.updateMany(
      { 
        doctorId, 
        date: { $gte: new Date() },
        status: { $nin: ['completed', 'cancelled'] },
      },
      updateFields
    );
    
    if (result.modifiedCount > 0) {
      logger.info('Updated doctor info in appointments', {
        doctorId,
        ...updateFields,
        count: result.modifiedCount,
      });
    }
  } catch (error) {
    logger.error('Failed to update doctor info in appointments:', error);
    throw error;
  }
};

/**
 * Main event handler
 */
const handleEvent = async (routingKey, payload) => {
  logger.info(`Processing event: ${routingKey}`);

  switch (routingKey) {
    case 'doctor.availability.updated':
      await handleDoctorAvailabilityUpdated(payload);
      break;
      
    case 'patient.profile.updated':
      await handlePatientProfileUpdated(payload);
      break;
      
    case 'doctor.profile.updated':
      await handleDoctorProfileUpdated(payload);
      break;
      
    default:
      logger.debug(`Unhandled event: ${routingKey}`);
  }
};

/**
 * Start profile event consumer
 */
const startProfileConsumer = async () => {
  const routingKeys = [
    'doctor.availability.updated',
    'patient.profile.updated',
    'doctor.profile.updated',
  ];

  await subscribeToEvents(QUEUE_NAME, routingKeys, handleEvent);
  
  logger.info('Profile consumer started', { queue: QUEUE_NAME, routingKeys });
};

module.exports = { startProfileConsumer };
