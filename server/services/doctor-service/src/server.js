const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { connectRabbitMQ, closeRabbitMQ } = require('./config/rabbitmq');
const { initCloudinary } = require('./config/cloudinary');
const { startAuthConsumer } = require('./consumers/authConsumer');
const doctorRoutes = require('./routes/doctorRoutes');
const logger = require('./config/logger');

const app = express();
const PORT = process.env.PORT || 5003;

// ========================================
// MIDDLEWARE
// ========================================

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

// ========================================
// ROUTES
// ========================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'doctor-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/v1/doctors', doctorRoutes);

// Backward compatibility (old route prefix)
app.use('/api/doctor', doctorRoutes);

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ========================================
// SERVER STARTUP
// ========================================

const startService = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize Cloudinary
    initCloudinary();

    // Connect to RabbitMQ
    await connectRabbitMQ();

    // Start event consumers
    await startAuthConsumer();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🩺 doctor-service running on port ${PORT}`);
      logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`   Database: ${process.env.MONGO_URI}`);
      logger.info(`   Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    logger.error('Failed to start service:', error);
    process.exit(1);
  }
};

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);

  try {
    await closeRabbitMQ();
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    logger.info('Service shut down successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the service
startService();

module.exports = app; // For testing
