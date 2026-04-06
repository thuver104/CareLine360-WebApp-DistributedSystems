/**
 * Auth Event Consumer
 * Listens to user.registered events from auth-service
 * Creates patient profile when a new patient user registers
 */

const { getChannel, SERVICE_NAME, EXCHANGE_NAME } = require('../config/rabbitmq');
const patientService = require('../services/patientService');

const QUEUE_NAME = `${SERVICE_NAME}.user.registered`;

/**
 * Start consuming auth events
 */
const startAuthConsumer = async () => {
  const channel = getChannel();

  if (!channel) {
    console.error('[AuthConsumer] RabbitMQ channel not available');
    return;
  }

  // Ensure queue exists
  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'careline.dlq',
      'x-dead-letter-routing-key': `${SERVICE_NAME}.dlq`
    }
  });

  // Bind to user.registered events
  await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'user.registered');

  // Set prefetch to process one message at a time
  channel.prefetch(1);

  console.log(`[AuthConsumer] Waiting for messages in ${QUEUE_NAME}`);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    const startTime = Date.now();
    let eventData;

    try {
      eventData = JSON.parse(msg.content.toString());

      console.log('[AuthConsumer] Received user.registered event:', {
        userId: eventData.userId,
        role: eventData.role,
        messageId: msg.properties.messageId
      });

      // Only process patient registrations
      if (eventData.role !== 'patient') {
        console.log('[AuthConsumer] Skipping non-patient registration');
        channel.ack(msg);
        return;
      }

      // Check for duplicate processing (idempotency)
      const messageId = msg.properties.messageId;
      if (messageId) {
        // Could check processed events collection here
        // For now, createPatientFromAuthEvent handles duplicates
      }

      // Create patient profile
      const patient = await patientService.createPatientFromAuthEvent({
        userId: eventData.userId,
        name: eventData.name,
        email: eventData.email
      });

      const duration = Date.now() - startTime;
      console.log('[AuthConsumer] Created patient profile:', {
        patientId: patient.patientId,
        userId: patient.userId,
        duration: `${duration}ms`
      });

      // Acknowledge message
      channel.ack(msg);

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('[AuthConsumer] Error processing message:', {
        error: error.message,
        eventData,
        duration: `${duration}ms`
      });

      // Check retry count
      const retryCount = (msg.properties.headers?.['x-retry-count'] || 0);

      if (retryCount >= 3) {
        // Max retries reached, send to DLQ
        console.error('[AuthConsumer] Max retries reached, sending to DLQ');
        channel.nack(msg, false, false);
      } else {
        // Retry with backoff
        const backoffDelay = Math.pow(2, retryCount) * 1000;
        console.log(`[AuthConsumer] Retrying in ${backoffDelay}ms (attempt ${retryCount + 1})`);

        setTimeout(() => {
          channel.nack(msg, false, true);
        }, backoffDelay);
      }
    }
  }, { noAck: false });
};

/**
 * Stop consuming
 */
const stopAuthConsumer = async () => {
  const channel = getChannel();
  if (channel) {
    await channel.cancel(QUEUE_NAME);
    console.log('[AuthConsumer] Consumer stopped');
  }
};

module.exports = {
  startAuthConsumer,
  stopAuthConsumer
};
