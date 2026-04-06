/**
 * CareLine360 Graceful Shutdown Handler
 * 
 * Production-grade shutdown handling:
 * - SIGTERM/SIGINT signal handling
 * - Connection cleanup (MongoDB, RabbitMQ)
 * - In-flight request completion
 * - Unhandled rejection protection
 * - Uncaught exception handling
 */

const { createLogger } = require('./logger');

const logger = createLogger({ serviceName: 'shutdown' });

// Shutdown state
let isShuttingDown = false;
const shutdownCallbacks = [];
const SHUTDOWN_TIMEOUT = parseInt(process.env.SHUTDOWN_TIMEOUT_MS) || 30000;

/**
 * Register a shutdown callback
 * Callbacks are executed in reverse order (LIFO)
 */
const onShutdown = (name, callback) => {
  shutdownCallbacks.push({ name, callback });
  logger.debug('Shutdown callback registered', { name });
};

/**
 * Execute graceful shutdown
 */
const gracefulShutdown = async (signal) => {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring signal', { signal });
    return;
  }

  isShuttingDown = true;
  logger.info('Graceful shutdown initiated', { signal });

  // Set timeout for force exit
  const forceExitTimer = setTimeout(() => {
    logger.error('Shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  // Execute callbacks in reverse order (LIFO - close consumers before connections)
  const callbacks = [...shutdownCallbacks].reverse();
  
  for (const { name, callback } of callbacks) {
    try {
      logger.info(`Executing shutdown callback: ${name}`);
      await Promise.race([
        callback(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Callback timeout')), 10000)
        ),
      ]);
      logger.info(`Shutdown callback completed: ${name}`);
    } catch (error) {
      logger.error(`Shutdown callback failed: ${name}`, {
        error: error.message,
      });
    }
  }

  clearTimeout(forceExitTimer);
  logger.info('Graceful shutdown complete');
  process.exit(0);
};

/**
 * Setup graceful shutdown handlers
 */
const setupGracefulShutdown = (options = {}) => {
  const httpServer = options.httpServer;

  // Handle SIGTERM (Docker/K8s stop)
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', {
      error: error.message,
      stack: error.stack,
    });
    
    // Don't exit immediately - give time for logging
    setTimeout(() => {
      gracefulShutdown('uncaughtException');
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
    });
    
    // In production, you might want to exit
    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => {
        gracefulShutdown('unhandledRejection');
      }, 1000);
    }
  });

  // If HTTP server provided, add shutdown handler
  if (httpServer) {
    onShutdown('http-server', async () => {
      return new Promise((resolve) => {
        httpServer.close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      });
    });
  }

  logger.info('Graceful shutdown handlers registered');
};

/**
 * Check if shutdown is in progress
 */
const isShuttingDownNow = () => isShuttingDown;

/**
 * Create middleware to reject requests during shutdown
 */
const shutdownMiddleware = () => {
  return (req, res, next) => {
    if (isShuttingDown) {
      res.status(503).json({
        error: 'Service is shutting down',
        retryAfter: 5,
      });
      res.setHeader('Retry-After', '5');
      return;
    }
    next();
  };
};

/**
 * Wait for in-flight requests to complete
 */
const waitForInFlightRequests = (httpServer, maxWaitMs = 15000) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkConnections = () => {
      httpServer.getConnections((err, count) => {
        if (err || count === 0 || Date.now() - startTime > maxWaitMs) {
          resolve();
        } else {
          logger.debug(`Waiting for ${count} connections to close`);
          setTimeout(checkConnections, 500);
        }
      });
    };
    
    checkConnections();
  });
};

/**
 * Create startup with retry logic
 */
const startWithRetry = async (startFn, options = {}) => {
  const maxRetries = options.maxRetries || 5;
  const retryDelay = options.retryDelay || 5000;
  const name = options.name || 'service';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Starting ${name} (attempt ${attempt}/${maxRetries})`);
      await startFn();
      logger.info(`${name} started successfully`);
      return;
    } catch (error) {
      logger.error(`Failed to start ${name}`, {
        attempt,
        maxRetries,
        error: error.message,
      });

      if (attempt < maxRetries) {
        logger.info(`Retrying in ${retryDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        logger.error(`Max retries exceeded for ${name}`);
        throw error;
      }
    }
  }
};

/**
 * MongoDB connection with retry
 */
const connectMongoWithRetry = async (mongoose, uri, options = {}) => {
  return startWithRetry(
    async () => {
      await mongoose.connect(uri, {
        maxPoolSize: options.maxPoolSize || 10,
        serverSelectionTimeoutMS: options.serverSelectionTimeoutMS || 5000,
        socketTimeoutMS: options.socketTimeoutMS || 45000,
      });

      // Handle disconnection
      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        if (!isShuttingDown) {
          logger.info('Attempting MongoDB reconnection...');
        }
      });

      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error', { error: error.message });
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });
    },
    {
      name: 'MongoDB',
      maxRetries: options.maxRetries || 5,
      retryDelay: options.retryDelay || 5000,
    }
  );
};

module.exports = {
  setupGracefulShutdown,
  onShutdown,
  gracefulShutdown,
  isShuttingDownNow,
  shutdownMiddleware,
  waitForInFlightRequests,
  startWithRetry,
  connectMongoWithRetry,
  SHUTDOWN_TIMEOUT,
};
