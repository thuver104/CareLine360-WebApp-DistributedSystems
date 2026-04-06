/**
 * Patient Event Publisher
 * Publishes patient-related events to RabbitMQ
 */

const { publishMessage } = require('../config/rabbitmq');
const { v4: uuidv4 } = require('uuid');

/**
 * Publish patient event
 * @param {string} eventType - Event routing key (e.g., 'patient.created')
 * @param {object} data - Event payload
 * @param {object} options - Additional options (correlationId, requestId)
 */
const publishPatientEvent = async (eventType, data, options = {}) => {
  try {
    const eventId = uuidv4();

    const message = {
      eventId,
      eventType,
      data,
      timestamp: new Date().toISOString()
    };

    const publishOptions = {
      messageId: eventId,
      correlationId: options.correlationId || eventId,
      headers: {
        'x-request-id': options.requestId,
        'x-event-type': eventType
      }
    };

    await publishMessage(eventType, message, publishOptions);

    console.log('[PatientPublisher] Event published:', {
      eventType,
      eventId,
      patientId: data.patientId || data.userId
    });

    return eventId;

  } catch (error) {
    console.error('[PatientPublisher] Failed to publish event:', {
      eventType,
      error: error.message
    });
    // Don't throw - publishing failures shouldn't break the main flow
    return null;
  }
};

/**
 * Publish patient.created event
 */
const publishPatientCreated = async (patient, options = {}) => {
  return publishPatientEvent('patient.created', {
    patientId: patient.patientId,
    userId: patient.userId,
    fullName: patient.fullName,
    email: patient.email,
    createdAt: patient.createdAt
  }, options);
};

/**
 * Publish patient.updated event
 */
const publishPatientUpdated = async (patient, updatedFields, options = {}) => {
  return publishPatientEvent('patient.updated', {
    patientId: patient.patientId,
    userId: patient.userId,
    fullName: patient.fullName,
    updatedFields,
    updatedAt: patient.updatedAt
  }, options);
};

/**
 * Publish patient.document.uploaded event
 */
const publishDocumentUploaded = async (document, options = {}) => {
  return publishPatientEvent('patient.document.uploaded', {
    patientId: document.patientId,
    documentId: document._id.toString(),
    documentType: document.documentType,
    fileName: document.fileName,
    uploadedAt: document.createdAt
  }, options);
};

/**
 * Publish patient.profile.completed event
 * Fired when profile strength reaches 100%
 */
const publishProfileCompleted = async (patient, options = {}) => {
  return publishPatientEvent('patient.profile.completed', {
    patientId: patient.patientId,
    userId: patient.userId,
    fullName: patient.fullName,
    profileStrength: patient.profileStrength
  }, options);
};

/**
 * Publish patient.deactivated event
 */
const publishPatientDeactivated = async (patient, options = {}) => {
  return publishPatientEvent('patient.deactivated', {
    patientId: patient.patientId,
    userId: patient.userId,
    deactivatedAt: new Date().toISOString()
  }, options);
};

module.exports = {
  publishPatientEvent,
  publishPatientCreated,
  publishPatientUpdated,
  publishDocumentUploaded,
  publishProfileCompleted,
  publishPatientDeactivated
};
