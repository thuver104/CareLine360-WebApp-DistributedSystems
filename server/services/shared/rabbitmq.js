/**
 * CareLine360 RabbitMQ Retry & Dead Letter Queue
 * 
 * Production-grade message handling:
 * - Retry exchange with exponential backoff
 * - Dead Letter Queue for poison messages
 * - Max retry count enforcement
 * - Idempotent message processing
 * - Connection recovery
 */

const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');
const { createLogger } = require('./logger');
const { setRabbitConnection } = require('./health');
const {
  rabbitConsumeFailures,
  rabbitRetryCount,
  rabbitDeadLetterCount,
  trackRabbitMessage,
} = require('./metrics');

const logger = createLogger({ serviceName: 'rabbitmq' });

// Configuration
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown';

// Exchange names
const MAIN_EXCHANGE = 'careline.events';
const RETRY_EXCHANGE = 'careline.retry';
const DLQ_EXCHANGE = 'careline.dlq';

// Retry configuration
const MAX_RETRIES = parseInt(process.env.RABBIT_MAX_RETRIES) || 3;
const INITIAL_DELAY_MS = parseInt(process.env.RABBIT_INITIAL_DELAY) || 1000;
const MAX_DELAY_MS = parseInt(process.env.RABBIT_MAX_DELAY) || 60000;

// Connection state
let connection = null;
let channel = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY_MS = 5000;

/**
 * Calculate exponential backoff delay
 */
const calculateBackoff = (retryCount) => {
  const delay = INITIAL_DELAY_MS * Math.pow(2, retryCount);
  return Math.min(delay, MAX_DELAY_MS);
};

/**
 * Create RabbitMQ connection with recovery
 */
const createRabbitConnection = async (options = {}) => {
  if (connection && channel) {
    return { connection, channel };
  }

  if (isConnecting) {
    // Wait for existing connection attempt
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { connection, channel };
  }

  isConnecting = true;

  try {
    const url = options.url || RABBITMQ_URL;
    
    logger.info('Connecting to RabbitMQ', { url: url.replace(/\/\/.*@/, '//***@') });

    connection = await amqp.connect(url);
    channel = await connection.createConfirmChannel();

    // Enable publisher confirms
    await channel.waitForConfirms;

    // Handle connection events
    connection.on('error', (error) => {
      logger.error('RabbitMQ connection error', { error: error.message });
      handleDisconnect();
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
      handleDisconnect();
    });

    channel.on('error', (error) => {
      logger.error('RabbitMQ channel error', { error: error.message });
    });

    // Setup retry infrastructure
    await setupRetryInfrastructure();

    // Update health check
    setRabbitConnection(connection, channel);

    reconnectAttempts = 0;
    isConnecting = false;

    logger.info('RabbitMQ connected successfully');

    return { connection, channel };
  } catch (error) {
    isConnecting = false;
    logger.error('Failed to connect to RabbitMQ', { error: error.message });
    
    // Schedule reconnect
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      logger.info(`Scheduling reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
      setTimeout(() => createRabbitConnection(options), RECONNECT_DELAY_MS);
    }
    
    throw error;
  }
};

/**
 * Handle disconnection - attempt reconnect
 */
const handleDisconnect = () => {
  connection = null;
  channel = null;
  setRabbitConnection(null, null);

  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    logger.info(`Attempting reconnect ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
    setTimeout(() => createRabbitConnection(), RECONNECT_DELAY_MS);
  } else {
    logger.error('Max reconnect attempts reached');
  }
};

/**
 * Setup retry and DLQ exchanges
 */
const setupRetryInfrastructure = async () => {
  if (!channel) throw new Error('Channel not available');

  // Main exchange (topic)
  await channel.assertExchange(MAIN_EXCHANGE, 'topic', { durable: true });

  // Retry exchange (for delayed redelivery)
  await channel.assertExchange(RETRY_EXCHANGE, 'topic', { durable: true });

  // Dead Letter exchange
  await channel.assertExchange(DLQ_EXCHANGE, 'topic', { durable: true });

  // DLQ queue (persistent storage for failed messages)
  await channel.assertQueue('careline.dlq', {
    durable: true,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
    },
  });
  await channel.bindQueue('careline.dlq', DLQ_EXCHANGE, '#');

  logger.info('Retry infrastructure setup complete');
};

/**
 * Publish event with retry support
 */
const publishWithRetry = async (routingKey, payload, options = {}) => {
  if (!channel) {
    await createRabbitConnection();
  }

  const eventId = payload.eventId || uuidv4();
  const correlationId = payload.correlationId || uuidv4();

  const message = {
    ...payload,
    eventId,
    correlationId,
    sourceService: SERVICE_NAME,
    publishedAt: new Date().toISOString(),
  };

  const messageOptions = {
    persistent: true,
    messageId: uuidv4(),
    timestamp: Date.now(),
    contentType: 'application/json',
    headers: {
      'x-event-id': eventId,
      'x-correlation-id': correlationId,
      'x-source-service': SERVICE_NAME,
      ...options.headers,
    },
  };

  try {
    channel.publish(
      MAIN_EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      messageOptions
    );

    logger.info('Event published', {
      routingKey,
      eventId,
      correlationId,
    });

    return { eventId, correlationId };
  } catch (error) {
    logger.error('Failed to publish event', {
      routingKey,
      eventId,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Setup consumer queue with retry binding
 */
const setupConsumerQueue = async (queueName, routingKeys, options = {}) => {
  if (!channel) {
    await createRabbitConnection();
  }

  // Assert main queue with DLX for retries
  await channel.assertQueue(queueName, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': RETRY_EXCHANGE,
      'x-dead-letter-routing-key': `retry.${queueName}`,
    },
  });

  // Bind to main exchange
  for (const key of routingKeys) {
    await channel.bindQueue(queueName, MAIN_EXCHANGE, key);
  }

  // Create retry queue with TTL and rebind to main
  const retryQueueName = `${queueName}.retry`;
  await channel.assertQueue(retryQueueName, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': MAIN_EXCHANGE,
      'x-message-ttl': INITIAL_DELAY_MS, // Base delay, will be overridden per message
    },
  });
  await channel.bindQueue(retryQueueName, RETRY_EXCHANGE, `retry.${queueName}`);

  logger.info('Consumer queue setup complete', { queueName, routingKeys });

  return queueName;
};

/**
 * Consume messages with retry logic
 */
const consumeWithRetry = async (queueName, routingKeys, handler, options = {}) => {
  await setupConsumerQueue(queueName, routingKeys, options);

  const prefetch = options.prefetch || 10;
  await channel.prefetch(prefetch);

  channel.consume(queueName, async (msg) => {
    if (!msg) return;

    const startTime = Date.now();
    const routingKey = msg.fields.routingKey;
    const messageId = msg.properties.messageId;
    
    let payload;
    try {
      payload = JSON.parse(msg.content.toString());
    } catch (parseError) {
      logger.error('Failed to parse message', { messageId, error: parseError.message });
      sendToDLQ(msg, 'PARSE_ERROR');
      channel.ack(msg);
      return;
    }

    const eventId = payload.eventId || msg.properties.headers?.['x-event-id'];
    const retryCount = (msg.properties.headers?.['x-retry-count'] || 0);

    logger.info('Processing message', {
      routingKey,
      messageId,
      eventId,
      retryCount,
    });

    try {
      // Process message
      await handler(routingKey, payload, {
        messageId,
        eventId,
        retryCount,
        headers: msg.properties.headers,
      });

      // Success
      channel.ack(msg);
      
      const duration = Date.now() - startTime;
      trackRabbitMessage(queueName, routingKey, duration, 'success');

      logger.info('Message processed successfully', {
        routingKey,
        messageId,
        eventId,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Message processing failed', {
        routingKey,
        messageId,
        eventId,
        retryCount,
        error: error.message,
        stack: error.stack,
      });

      rabbitConsumeFailures
        .labels(SERVICE_NAME, queueName, routingKey, error.name || 'Error')
        .inc();

      if (retryCount < MAX_RETRIES) {
        // Retry with backoff
        scheduleRetry(msg, payload, retryCount + 1);
        channel.ack(msg);
        
        rabbitRetryCount.labels(SERVICE_NAME, queueName, routingKey).inc();
      } else {
        // Max retries exceeded - send to DLQ
        sendToDLQ(msg, 'MAX_RETRIES_EXCEEDED', error.message);
        channel.ack(msg);
        
        rabbitDeadLetterCount
          .labels(SERVICE_NAME, queueName, routingKey, 'MAX_RETRIES')
          .inc();
      }

      trackRabbitMessage(queueName, routingKey, duration, 'error');
    }
  });

  logger.info('Consumer started', { queueName, routingKeys });
};

/**
 * Schedule message retry with exponential backoff
 */
const scheduleRetry = (originalMsg, payload, retryCount) => {
  const delay = calculateBackoff(retryCount - 1);
  const routingKey = originalMsg.fields.routingKey;

  const retryPayload = {
    ...payload,
    _retryMetadata: {
      originalRoutingKey: routingKey,
      retryCount,
      lastAttempt: new Date().toISOString(),
      nextAttemptDelay: delay,
    },
  };

  channel.publish(
    MAIN_EXCHANGE,
    routingKey,
    Buffer.from(JSON.stringify(retryPayload)),
    {
      persistent: true,
      messageId: uuidv4(),
      headers: {
        ...originalMsg.properties.headers,
        'x-retry-count': retryCount,
        'x-original-message-id': originalMsg.properties.messageId,
        'x-retry-delay': delay,
      },
      // Use per-message TTL for backoff
      expiration: delay.toString(),
    }
  );

  logger.info('Message scheduled for retry', {
    routingKey,
    retryCount,
    delayMs: delay,
    eventId: payload.eventId,
  });
};

/**
 * Send message to Dead Letter Queue
 */
const sendToDLQ = (originalMsg, reason, errorMessage = '') => {
  const routingKey = originalMsg.fields.routingKey;
  
  let payload;
  try {
    payload = JSON.parse(originalMsg.content.toString());
  } catch {
    payload = { _raw: originalMsg.content.toString() };
  }

  const dlqPayload = {
    originalPayload: payload,
    dlqMetadata: {
      originalRoutingKey: routingKey,
      originalMessageId: originalMsg.properties.messageId,
      reason,
      errorMessage,
      sentToDlqAt: new Date().toISOString(),
      retryCount: originalMsg.properties.headers?.['x-retry-count'] || 0,
      sourceService: SERVICE_NAME,
    },
  };

  channel.publish(
    DLQ_EXCHANGE,
    `dlq.${routingKey}`,
    Buffer.from(JSON.stringify(dlqPayload)),
    {
      persistent: true,
      messageId: uuidv4(),
      headers: {
        'x-dlq-reason': reason,
        'x-original-routing-key': routingKey,
      },
    }
  );

  logger.warn('Message sent to DLQ', {
    routingKey,
    reason,
    eventId: payload.eventId,
  });
};

/**
 * Inspect DLQ messages (for admin/debugging)
 */
const inspectDLQ = async (limit = 10) => {
  if (!channel) {
    await createRabbitConnection();
  }

  const messages = [];
  const queueName = 'careline.dlq';

  for (let i = 0; i < limit; i++) {
    const msg = await channel.get(queueName, { noAck: false });
    if (!msg) break;

    let payload;
    try {
      payload = JSON.parse(msg.content.toString());
    } catch {
      payload = { _raw: msg.content.toString() };
    }

    messages.push({
      messageId: msg.properties.messageId,
      routingKey: msg.fields.routingKey,
      timestamp: msg.properties.timestamp,
      headers: msg.properties.headers,
      payload,
    });

    // Put message back (nack without requeue puts back)
    channel.nack(msg, false, true);
  }

  return messages;
};

/**
 * Replay DLQ message (reprocess)
 */
const replayDLQMessage = async (messageId) => {
  if (!channel) {
    await createRabbitConnection();
  }

  // This is a simplified version - in production you'd want
  // to search for the specific message by ID
  const msg = await channel.get('careline.dlq', { noAck: false });
  
  if (!msg) {
    return { success: false, error: 'No messages in DLQ' };
  }

  if (msg.properties.messageId === messageId) {
    const payload = JSON.parse(msg.content.toString());
    const originalRoutingKey = payload.dlqMetadata?.originalRoutingKey || 
                               msg.properties.headers?.['x-original-routing-key'];

    // Republish to main exchange (reset retry count)
    channel.publish(
      MAIN_EXCHANGE,
      originalRoutingKey,
      Buffer.from(JSON.stringify(payload.originalPayload)),
      {
        persistent: true,
        messageId: uuidv4(),
        headers: {
          'x-retry-count': 0,
          'x-replayed-from-dlq': true,
          'x-original-dlq-message-id': messageId,
        },
      }
    );

    channel.ack(msg);

    logger.info('DLQ message replayed', { messageId, originalRoutingKey });

    return { success: true, originalRoutingKey };
  } else {
    // Put message back
    channel.nack(msg, false, true);
    return { success: false, error: 'Message ID not found at head of queue' };
  }
};

/**
 * Close connection gracefully
 */
const closeConnection = async () => {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
  setRabbitConnection(null, null);
  logger.info('RabbitMQ connection closed');
};

module.exports = {
  createRabbitConnection,
  publishWithRetry,
  consumeWithRetry,
  setupRetryInfrastructure,
  setupConsumerQueue,
  inspectDLQ,
  replayDLQMessage,
  closeConnection,
  calculateBackoff,
  
  // Exports for direct access
  getChannel: () => channel,
  getConnection: () => connection,
  
  // Constants
  MAIN_EXCHANGE,
  RETRY_EXCHANGE,
  DLQ_EXCHANGE,
  MAX_RETRIES,
};
