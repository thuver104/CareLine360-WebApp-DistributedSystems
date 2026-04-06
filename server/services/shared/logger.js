/**
 * CareLine360 Structured Logger
 * 
 * Production-grade JSON logging with:
 * - Service name
 * - Request/Correlation ID
 * - Route and status code
 * - Execution time
 * - User ID when available
 * - RabbitMQ message ID
 * - Error stack traces
 * 
 * Compatible with ELK Stack, Grafana Loki, CloudWatch
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { v4: uuidv4 } = require('uuid');

// Environment config
const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown-service';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Custom JSON format for structured logging
 */
const structuredFormat = winston.format.printf((info) => {
  const logEntry = {
    timestamp: info.timestamp,
    level: info.level,
    service: SERVICE_NAME,
    message: info.message,
    // Trace IDs
    requestId: info.requestId || undefined,
    correlationId: info.correlationId || undefined,
    // HTTP context
    route: info.route || undefined,
    method: info.method || undefined,
    statusCode: info.statusCode || undefined,
    duration: info.duration || undefined,
    // User context
    userId: info.userId || undefined,
    role: info.role || undefined,
    // RabbitMQ context
    messageId: info.messageId || undefined,
    routingKey: info.routingKey || undefined,
    eventId: info.eventId || undefined,
    // Error context
    error: info.error || undefined,
    stack: info.stack || undefined,
    // Additional metadata
    ...info.metadata,
  };

  // Remove undefined values
  Object.keys(logEntry).forEach((key) => {
    if (logEntry[key] === undefined) {
      delete logEntry[key];
    }
  });

  return JSON.stringify(logEntry);
});

/**
 * Create Winston logger instance
 */
const createLogger = (options = {}) => {
  const serviceName = options.serviceName || SERVICE_NAME;
  
  const transports = [
    // Console output (always)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        NODE_ENV === 'development'
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          : structuredFormat
      ),
    }),
  ];

  // File rotation in production
  if (NODE_ENV === 'production' || options.enableFileLogging) {
    transports.push(
      new DailyRotateFile({
        filename: `logs/${serviceName}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
          structuredFormat
        ),
      }),
      // Separate error log
      new DailyRotateFile({
        filename: `logs/${serviceName}-error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
          structuredFormat
        ),
      })
    );
  }

  return winston.createLogger({
    level: LOG_LEVEL,
    defaultMeta: { service: serviceName },
    transports,
    // Don't exit on error
    exitOnError: false,
  });
};

// Default logger instance
const logger = createLogger();

/**
 * Express request logging middleware
 * Logs request start and completion with timing
 */
const requestLogger = (options = {}) => {
  const log = options.logger || logger;
  const skipPaths = options.skipPaths || ['/health', '/health/live', '/health/ready', '/metrics'];

  return (req, res, next) => {
    // Skip health checks and metrics
    if (skipPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    const startTime = Date.now();
    const requestId = req.requestId || req.headers['x-request-id'] || uuidv4();
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || requestId;

    // Attach to request
    req.requestId = requestId;
    req.correlationId = correlationId;
    req.startTime = startTime;

    // Log request start
    log.info('Request started', {
      requestId,
      correlationId,
      method: req.method,
      route: req.originalUrl || req.url,
      userId: req.user?.userId,
      role: req.user?.role,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection?.remoteAddress,
    });

    // Capture response
    const originalSend = res.send;
    res.send = function (body) {
      const duration = Date.now() - startTime;

      log.info('Request completed', {
        requestId,
        correlationId,
        method: req.method,
        route: req.originalUrl || req.url,
        statusCode: res.statusCode,
        duration,
        userId: req.user?.userId,
        contentLength: body?.length,
      });

      return originalSend.call(this, body);
    };

    next();
  };
};

/**
 * RabbitMQ event logging helper
 */
const eventLogger = (log = logger) => ({
  /**
   * Log event received
   */
  received: (routingKey, payload, messageId) => {
    log.info('Event received', {
      routingKey,
      messageId,
      eventId: payload.eventId,
      correlationId: payload.correlationId,
      metadata: {
        payloadKeys: Object.keys(payload),
      },
    });
  },

  /**
   * Log event processed successfully
   */
  processed: (routingKey, payload, messageId, duration) => {
    log.info('Event processed', {
      routingKey,
      messageId,
      eventId: payload.eventId,
      correlationId: payload.correlationId,
      duration,
    });
  },

  /**
   * Log event processing failed
   */
  failed: (routingKey, payload, messageId, error, retryCount) => {
    log.error('Event processing failed', {
      routingKey,
      messageId,
      eventId: payload.eventId,
      correlationId: payload.correlationId,
      error: error.message,
      stack: error.stack,
      retryCount,
    });
  },

  /**
   * Log event sent to DLQ
   */
  deadLettered: (routingKey, payload, messageId, reason) => {
    log.warn('Event sent to DLQ', {
      routingKey,
      messageId,
      eventId: payload.eventId,
      correlationId: payload.correlationId,
      reason,
    });
  },

  /**
   * Log event published
   */
  published: (routingKey, eventId, correlationId) => {
    log.info('Event published', {
      routingKey,
      eventId,
      correlationId,
    });
  },

  /**
   * Log duplicate event skipped
   */
  duplicate: (routingKey, eventId, messageId) => {
    log.debug('Duplicate event skipped', {
      routingKey,
      eventId,
      messageId,
    });
  },
});

module.exports = {
  createLogger,
  requestLogger,
  eventLogger,
  logger, // Default instance
};
