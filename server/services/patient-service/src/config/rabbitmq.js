/**
 * RabbitMQ Connection Configuration
 * Handles connection, channel management, and reconnection
 */

const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';
const EXCHANGE_NAME = 'careline.events';
const SERVICE_NAME = 'patient-service';

let connection = null;
let channel = null;
let isConnecting = false;

/**
 * Connect to RabbitMQ with retry logic
 */
const connectRabbitMQ = async (retries = 5, delay = 5000) => {
  if (isConnecting) return;
  isConnecting = true;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[${SERVICE_NAME}] Connecting to RabbitMQ (attempt ${attempt}/${retries})...`);
      
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();

      // Setup exchange
      await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

      // Setup queues for this service
      await setupQueues();

      // Handle connection close
      connection.on('close', async () => {
        console.warn(`[${SERVICE_NAME}] RabbitMQ connection closed. Reconnecting...`);
        channel = null;
        connection = null;
        isConnecting = false;
        setTimeout(() => connectRabbitMQ(), delay);
      });

      connection.on('error', (err) => {
        console.error(`[${SERVICE_NAME}] RabbitMQ connection error:`, err.message);
      });

      isConnecting = false;
      console.log(`[${SERVICE_NAME}] RabbitMQ connected successfully`);
      return { connection, channel };

    } catch (error) {
      console.error(`[${SERVICE_NAME}] RabbitMQ connection attempt ${attempt} failed:`, error.message);
      
      if (attempt < retries) {
        console.log(`[${SERVICE_NAME}] Retrying in ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        isConnecting = false;
        throw new Error('RabbitMQ connection failed after all retries');
      }
    }
  }
};

/**
 * Setup required queues for patient-service
 */
const setupQueues = async () => {
  // Queue for user.registered events (from auth-service)
  const userRegisteredQueue = `${SERVICE_NAME}.user.registered`;
  await channel.assertQueue(userRegisteredQueue, { 
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'careline.dlq',
      'x-dead-letter-routing-key': `${SERVICE_NAME}.dlq`
    }
  });
  await channel.bindQueue(userRegisteredQueue, EXCHANGE_NAME, 'user.registered');

  // Queue for patient profile events
  const patientProfileQueue = `${SERVICE_NAME}.patient.profile`;
  await channel.assertQueue(patientProfileQueue, { durable: true });
  await channel.bindQueue(patientProfileQueue, EXCHANGE_NAME, 'patient.profile.#');

  // DLQ setup
  await channel.assertExchange('careline.dlq', 'direct', { durable: true });
  const dlqQueue = `${SERVICE_NAME}.dlq`;
  await channel.assertQueue(dlqQueue, { durable: true });
  await channel.bindQueue(dlqQueue, 'careline.dlq', `${SERVICE_NAME}.dlq`);

  console.log(`[${SERVICE_NAME}] Queues configured`);
};

/**
 * Get current channel
 */
const getChannel = () => channel;

/**
 * Get current connection
 */
const getConnection = () => connection;

/**
 * Publish message to exchange
 */
const publishMessage = async (routingKey, message, options = {}) => {
  if (!channel) {
    throw new Error('RabbitMQ channel not available');
  }

  const messageBuffer = Buffer.from(JSON.stringify({
    ...message,
    timestamp: new Date().toISOString(),
    source: SERVICE_NAME
  }));

  const publishOptions = {
    persistent: true,
    contentType: 'application/json',
    headers: {
      'x-correlation-id': options.correlationId || null,
      'x-request-id': options.requestId || null
    },
    ...options
  };

  return channel.publish(EXCHANGE_NAME, routingKey, messageBuffer, publishOptions);
};

/**
 * Close RabbitMQ connection
 */
const closeRabbitMQ = async () => {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    console.log(`[${SERVICE_NAME}] RabbitMQ connection closed`);
  } catch (error) {
    console.error(`[${SERVICE_NAME}] Error closing RabbitMQ:`, error.message);
  }
};

module.exports = {
  connectRabbitMQ,
  getChannel,
  getConnection,
  publishMessage,
  closeRabbitMQ,
  EXCHANGE_NAME,
  SERVICE_NAME
};
