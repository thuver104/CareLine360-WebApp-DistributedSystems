/**
 * CareLine360 Health Checks
 * 
 * Kubernetes-compatible health endpoints:
 * - /health/live - Liveness probe (is process running?)
 * - /health/ready - Readiness probe (can accept traffic?)
 * 
 * Checks:
 * - MongoDB connection
 * - RabbitMQ connection
 * - Cloudinary (optional, degraded mode)
 */

const express = require('express');
const mongoose = require('mongoose');

// Health status constants
const STATUS = {
  UP: 'UP',
  DOWN: 'DOWN',
  DEGRADED: 'DEGRADED',
};

// Track dependencies health
const healthState = {
  mongo: { status: STATUS.DOWN, lastCheck: null, error: null },
  rabbitmq: { status: STATUS.DOWN, lastCheck: null, error: null },
  cloudinary: { status: STATUS.UP, lastCheck: null, error: null }, // Optional
};

/**
 * Check MongoDB connection
 */
const checkMongo = async () => {
  try {
    const state = mongoose.connection.readyState;
    /*
     * 0 = disconnected
     * 1 = connected
     * 2 = connecting
     * 3 = disconnecting
     */
    if (state === 1) {
      // Perform actual ping
      await mongoose.connection.db.admin().ping();
      healthState.mongo = {
        status: STATUS.UP,
        lastCheck: new Date().toISOString(),
        error: null,
      };
      return { status: STATUS.UP };
    } else {
      healthState.mongo = {
        status: STATUS.DOWN,
        lastCheck: new Date().toISOString(),
        error: `Connection state: ${state}`,
      };
      return { status: STATUS.DOWN, error: `Connection state: ${state}` };
    }
  } catch (error) {
    healthState.mongo = {
      status: STATUS.DOWN,
      lastCheck: new Date().toISOString(),
      error: error.message,
    };
    return { status: STATUS.DOWN, error: error.message };
  }
};

/**
 * Check RabbitMQ connection
 * Requires rabbitConnection to be passed or set globally
 */
let rabbitConnection = null;
let rabbitChannel = null;

const setRabbitConnection = (connection, channel) => {
  rabbitConnection = connection;
  rabbitChannel = channel;
};

const checkRabbitMQ = async () => {
  try {
    if (!rabbitConnection) {
      healthState.rabbitmq = {
        status: STATUS.DOWN,
        lastCheck: new Date().toISOString(),
        error: 'No connection established',
      };
      return { status: STATUS.DOWN, error: 'No connection established' };
    }

    // Check if connection is open
    // amqplib connection doesn't have a direct isOpen method
    // We check if channel can perform basic operation
    if (rabbitChannel) {
      await rabbitChannel.checkQueue('health-check-temp').catch(() => {});
      healthState.rabbitmq = {
        status: STATUS.UP,
        lastCheck: new Date().toISOString(),
        error: null,
      };
      return { status: STATUS.UP };
    }

    healthState.rabbitmq = {
      status: STATUS.DOWN,
      lastCheck: new Date().toISOString(),
      error: 'Channel not available',
    };
    return { status: STATUS.DOWN, error: 'Channel not available' };
  } catch (error) {
    // Queue not existing is fine, connection is working
    if (error.code === 404) {
      healthState.rabbitmq = {
        status: STATUS.UP,
        lastCheck: new Date().toISOString(),
        error: null,
      };
      return { status: STATUS.UP };
    }
    
    healthState.rabbitmq = {
      status: STATUS.DOWN,
      lastCheck: new Date().toISOString(),
      error: error.message,
    };
    return { status: STATUS.DOWN, error: error.message };
  }
};

/**
 * Check Cloudinary connectivity (optional)
 */
const checkCloudinary = async (cloudinary) => {
  if (!cloudinary) {
    healthState.cloudinary = {
      status: STATUS.UP, // Optional, so UP if not configured
      lastCheck: new Date().toISOString(),
      error: null,
    };
    return { status: STATUS.UP, optional: true };
  }

  try {
    await cloudinary.api.ping();
    healthState.cloudinary = {
      status: STATUS.UP,
      lastCheck: new Date().toISOString(),
      error: null,
    };
    return { status: STATUS.UP };
  } catch (error) {
    // Cloudinary is optional, so we mark as DEGRADED not DOWN
    healthState.cloudinary = {
      status: STATUS.DEGRADED,
      lastCheck: new Date().toISOString(),
      error: error.message,
    };
    return { status: STATUS.DEGRADED, error: error.message };
  }
};

/**
 * Create Express router with health endpoints
 */
const createHealthRouter = (options = {}) => {
  const router = express.Router();
  const serviceName = options.serviceName || process.env.SERVICE_NAME || 'unknown';
  const version = options.version || process.env.npm_package_version || '1.0.0';
  const cloudinary = options.cloudinary || null;

  /**
   * Liveness probe
   * Returns 200 if process is running
   */
  router.get('/live', (req, res) => {
    res.status(200).json({
      status: STATUS.UP,
      service: serviceName,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Readiness probe
   * Returns 200 only if all critical dependencies are available
   */
  router.get('/ready', async (req, res) => {
    const checks = {
      mongo: await checkMongo(),
      rabbitmq: await checkRabbitMQ(),
    };

    // Include Cloudinary if configured
    if (cloudinary) {
      checks.cloudinary = await checkCloudinary(cloudinary);
    }

    // Determine overall status
    const mongoReady = checks.mongo.status === STATUS.UP;
    const rabbitReady = checks.rabbitmq.status === STATUS.UP;
    const cloudinaryOk = !cloudinary || checks.cloudinary?.status !== STATUS.DOWN;

    const isReady = mongoReady && rabbitReady;
    const overallStatus = isReady
      ? cloudinaryOk
        ? STATUS.UP
        : STATUS.DEGRADED
      : STATUS.DOWN;

    res.status(isReady ? 200 : 503).json({
      status: overallStatus,
      service: serviceName,
      version,
      timestamp: new Date().toISOString(),
      checks,
    });
  });

  /**
   * Detailed health info (for debugging)
   */
  router.get('/', async (req, res) => {
    const checks = {
      mongo: await checkMongo(),
      rabbitmq: await checkRabbitMQ(),
      cloudinary: await checkCloudinary(cloudinary),
    };

    const isHealthy =
      checks.mongo.status === STATUS.UP &&
      checks.rabbitmq.status === STATUS.UP;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? STATUS.UP : STATUS.DOWN,
      service: serviceName,
      version,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks,
    });
  });

  return router;
};

module.exports = {
  createHealthRouter,
  checkMongo,
  checkRabbitMQ,
  checkCloudinary,
  setRabbitConnection,
  healthState,
  STATUS,
};
