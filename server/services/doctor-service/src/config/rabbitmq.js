const amqp = require('amqplib');
const logger = require('./logger');

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'careline.events';
const EXCHANGE_TYPE = 'topic';

/**
 * Connect to RabbitMQ
 * @returns {Promise<amqp.Channel>}
 */
const connectRabbitMQ = async () => {
  try {
    const url = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';
    
    connection = await amqp.connect(url);
    channel = await connection.createChannel();

    // Setup exchange
    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });

    logger.info('RabbitMQ connected successfully');

    // Handle connection close
    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
    });

    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error:', err);
    });

    return channel;
  } catch (error) {
    logger.error('RabbitMQ connection failed:', error);
    throw error;
  }
};

/**
 * Get RabbitMQ channel
 * @returns {amqp.Channel}
 */
const getChannel = () => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
};

/**
 * Publish event to RabbitMQ
 * @param {string} routingKey - Event routing key (e.g., 'doctor.profile.created')
 * @param {Object} payload - Event payload
 */
const publishEvent = async (routingKey, payload) => {
  try {
    const ch = getChannel();
    const message = Buffer.from(JSON.stringify({
      ...payload,
      timestamp: new Date().toISOString(),
      source: 'doctor-service',
    }));

    ch.publish(EXCHANGE_NAME, routingKey, message, {
      persistent: true,
      contentType: 'application/json',
    });

    logger.debug(`Published event: ${routingKey}`, payload);
  } catch (error) {
    logger.error(`Failed to publish event: ${routingKey}`, error);
    throw error;
  }
};

/**
 * Subscribe to events
 * @param {string} queueName - Queue name
 * @param {string[]} routingKeys - Array of routing key patterns
 * @param {Function} handler - Message handler function
 */
const subscribeToEvents = async (queueName, routingKeys, handler) => {
  try {
    const ch = getChannel();

    // Assert queue
    await ch.assertQueue(queueName, { durable: true });

    // Bind queue to exchange with routing keys
    for (const key of routingKeys) {
      await ch.bindQueue(queueName, EXCHANGE_NAME, key);
      logger.info(`Bound queue ${queueName} to ${key}`);
    }

    // Set prefetch
    ch.prefetch(1);

    // Consume messages
    ch.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;

        logger.debug(`Received event: ${routingKey}`, payload);

        await handler(routingKey, payload);

        ch.ack(msg);
      } catch (error) {
        logger.error('Error processing message:', error);
        // Reject and requeue on error
        ch.nack(msg, false, true);
      }
    });

    logger.info(`Subscribed to queue: ${queueName}`);
  } catch (error) {
    logger.error('Failed to subscribe to events:', error);
    throw error;
  }
};

/**
 * Close RabbitMQ connection
 */
const closeRabbitMQ = async () => {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    logger.info('RabbitMQ connection closed');
  } catch (error) {
    logger.error('Error closing RabbitMQ:', error);
  }
};

module.exports = {
  connectRabbitMQ,
  getChannel,
  publishEvent,
  subscribeToEvents,
  closeRabbitMQ,
};
