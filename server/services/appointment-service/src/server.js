require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { connectRabbitMQ } = require('./config/rabbitmq');
const { startProfileConsumer } = require('./consumers/profileConsumer');
const { startMeetingScheduler } = require('./services/meetingScheduler');
const { startReminderScheduler } = require('./services/reminderScheduler');
const appointmentRoutes = require('./routes/appointmentRoutes');
const logger = require('./config/logger');

const app = express();
const PORT = process.env.PORT || 5004;

// ========================================
// MIDDLEWARE
// ========================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID for tracing
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || 
    `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// ========================================
// ROUTES
// ========================================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'appointment-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Readiness check
app.get('/ready', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState === 1;
    
    if (dbState) {
      res.status(200).json({ status: 'ready', database: 'connected' });
    } else {
      res.status(503).json({ status: 'not ready', database: 'disconnected' });
    }
  } catch (error) {
    res.status(503).json({ status: 'error', error: error.message });
  }
});

// API routes
app.use('/api/v1/appointments', appointmentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    requestId: req.requestId,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    requestId: req.requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ========================================
// STARTUP
// ========================================

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('MongoDB connected');

    // Connect to RabbitMQ and start consumers
    try {
      await connectRabbitMQ();
      await startProfileConsumer();
      logger.info('RabbitMQ consumers started');
    } catch (mqError) {
      logger.error('RabbitMQ connection failed:', mqError.message);
      logger.warn('Service will run without event consumers');
    }

    // Start schedulers (only in production/development, not in test)
    if (process.env.NODE_ENV !== 'test') {
      startReminderScheduler();
      startMeetingScheduler();
      logger.info('Schedulers started');
    }

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 Appointment service running on port ${PORT}`);
      logger.info(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle shutdown gracefully
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down...');
  process.exit(0);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app; // For testing
