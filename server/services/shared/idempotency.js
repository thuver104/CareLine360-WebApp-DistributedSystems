/**
 * CareLine360 Idempotent Event Processing
 * 
 * Ensures duplicate event safety using:
 * - eventId tracking in MongoDB
 * - TTL-based cleanup
 * - Atomic check-and-set operations
 * 
 * Supported events:
 * - user.registered
 * - appointment.created
 * - appointment.completed
 * - prescription.created
 */

const mongoose = require('mongoose');
const { createLogger } = require('./logger');

const logger = createLogger({ serviceName: 'idempotency' });

// TTL for processed events (7 days default)
const PROCESSED_EVENT_TTL = parseInt(process.env.PROCESSED_EVENT_TTL_DAYS) || 7;

/**
 * Processed Event Schema
 * Tracks which events have been processed to prevent duplicates
 */
const processedEventSchema = new mongoose.Schema({
  // Unique event identifier
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  
  // Event routing key (e.g., 'user.registered')
  routingKey: {
    type: String,
    required: true,
    index: true,
  },
  
  // Service that processed this event
  processedBy: {
    type: String,
    required: true,
  },
  
  // When the event was processed
  processedAt: {
    type: Date,
    default: Date.now,
    index: { expires: PROCESSED_EVENT_TTL * 24 * 60 * 60 }, // TTL index
  },
  
  // Optional: result of processing
  result: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  
  // Correlation ID for tracing
  correlationId: String,
  
  // Source service that published the event
  sourceService: String,
});

// Compound index for efficient lookups
processedEventSchema.index({ eventId: 1, processedBy: 1 }, { unique: true });

const ProcessedEvent = mongoose.model('ProcessedEvent', processedEventSchema);

/**
 * Check if an event has already been processed
 */
const isEventProcessed = async (eventId, options = {}) => {
  const serviceName = options.serviceName || process.env.SERVICE_NAME || 'unknown';
  
  try {
    const existing = await ProcessedEvent.findOne({
      eventId,
      processedBy: serviceName,
    }).lean();
    
    return !!existing;
  } catch (error) {
    logger.error('Error checking event processed status', {
      eventId,
      error: error.message,
    });
    // Fail open - allow processing on error
    return false;
  }
};

/**
 * Mark an event as processed
 */
const markEventProcessed = async (eventId, routingKey, options = {}) => {
  const serviceName = options.serviceName || process.env.SERVICE_NAME || 'unknown';
  
  try {
    await ProcessedEvent.create({
      eventId,
      routingKey,
      processedBy: serviceName,
      correlationId: options.correlationId,
      sourceService: options.sourceService,
      result: options.result,
    });
    
    logger.debug('Event marked as processed', { eventId, routingKey, serviceName });
    return true;
  } catch (error) {
    // Handle duplicate key error (already processed)
    if (error.code === 11000) {
      logger.debug('Event already marked as processed', { eventId });
      return false;
    }
    
    logger.error('Error marking event as processed', {
      eventId,
      routingKey,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Atomic check-and-mark operation
 * Returns true if this is the first processor, false if duplicate
 */
const tryProcessEvent = async (eventId, routingKey, options = {}) => {
  const serviceName = options.serviceName || process.env.SERVICE_NAME || 'unknown';
  
  try {
    const result = await ProcessedEvent.findOneAndUpdate(
      {
        eventId,
        processedBy: serviceName,
      },
      {
        $setOnInsert: {
          eventId,
          routingKey,
          processedBy: serviceName,
          processedAt: new Date(),
          correlationId: options.correlationId,
          sourceService: options.sourceService,
        },
      },
      {
        upsert: true,
        new: false, // Return null if inserted (first processor)
      }
    );
    
    // If result is null, this is the first processor
    return result === null;
  } catch (error) {
    if (error.code === 11000) {
      // Race condition - another process won
      return false;
    }
    throw error;
  }
};

/**
 * Create idempotent consumer wrapper
 * Wraps a handler to automatically check for duplicates
 */
const createIdempotentConsumer = (handler, options = {}) => {
  const serviceName = options.serviceName || process.env.SERVICE_NAME || 'unknown';
  
  return async (routingKey, payload, messageContext = {}) => {
    const eventId = payload.eventId || messageContext.eventId;
    
    if (!eventId) {
      logger.warn('Message missing eventId, processing anyway', { routingKey });
      return handler(routingKey, payload, messageContext);
    }
    
    // Check if already processed
    const isFirstProcessor = await tryProcessEvent(eventId, routingKey, {
      serviceName,
      correlationId: payload.correlationId,
      sourceService: payload.sourceService,
    });
    
    if (!isFirstProcessor) {
      logger.info('Duplicate event skipped', {
        eventId,
        routingKey,
        messageId: messageContext.messageId,
      });
      return { skipped: true, reason: 'duplicate' };
    }
    
    // Process the event
    try {
      const result = await handler(routingKey, payload, messageContext);
      
      // Update with result (optional)
      if (options.trackResult) {
        await ProcessedEvent.updateOne(
          { eventId, processedBy: serviceName },
          { result }
        );
      }
      
      return result;
    } catch (error) {
      // On error, remove the processed mark to allow retry
      if (options.removeOnError) {
        await ProcessedEvent.deleteOne({ eventId, processedBy: serviceName });
      }
      throw error;
    }
  };
};

/**
 * Cleanup old processed events (manual cleanup if TTL index isn't working)
 */
const cleanupOldEvents = async (olderThanDays = PROCESSED_EVENT_TTL) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  const result = await ProcessedEvent.deleteMany({
    processedAt: { $lt: cutoffDate },
  });
  
  logger.info('Cleaned up old processed events', {
    deletedCount: result.deletedCount,
    olderThanDays,
  });
  
  return result.deletedCount;
};

/**
 * Get processing statistics
 */
const getProcessingStats = async (options = {}) => {
  const serviceName = options.serviceName || process.env.SERVICE_NAME;
  const since = options.since || new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const match = {
    processedAt: { $gte: since },
  };
  if (serviceName) {
    match.processedBy = serviceName;
  }
  
  const stats = await ProcessedEvent.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          routingKey: '$routingKey',
          processedBy: '$processedBy',
        },
        count: { $sum: 1 },
        lastProcessed: { $max: '$processedAt' },
      },
    },
    {
      $group: {
        _id: '$_id.processedBy',
        events: {
          $push: {
            routingKey: '$_id.routingKey',
            count: '$count',
            lastProcessed: '$lastProcessed',
          },
        },
        totalCount: { $sum: '$count' },
      },
    },
  ]);
  
  return stats;
};

module.exports = {
  ProcessedEvent,
  isEventProcessed,
  markEventProcessed,
  tryProcessEvent,
  createIdempotentConsumer,
  cleanupOldEvents,
  getProcessingStats,
  PROCESSED_EVENT_TTL,
};
