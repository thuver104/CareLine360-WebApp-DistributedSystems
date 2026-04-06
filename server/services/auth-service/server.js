/**
 * auth-service - Main Server Entry Point
 * Handles authentication, authorization, and user management
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('../shared/utils/db');
const { connectRabbitMQ } = require('../shared/rabbitmq/connection');
const errorHandler = require('../shared/middleware/errorHandler');
const logger = require('../shared/utils/logger');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// ===== Middleware =====
app.use(cors({ 
  origin: process.env.CLIENT_URL || '*', 
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(helmet());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ===== Database Connection =====
connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/careline_auth_db')
  .then(() => {
    logger.info('✅ auth-service database connected');
  })
  .catch((err) => {
    logger.error('❌ Database connection failed:', err);
    process.exit(1);
  });

// ===== RabbitMQ Connection =====
connectRabbitMQ()
  .then(() => {
    logger.info('✅ auth-service RabbitMQ connected');
  })
  .catch((err) => {
    logger.warn('⚠️  RabbitMQ connection failed (will retry):', err.message);
    // Don't exit - service can still work without messaging
  });

// ===== Routes =====
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// Backward compatibility routes (old API paths)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ===== Health Check =====
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'auth-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'auth-service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
    },
  });
});

// ===== Error Handler =====
app.use(errorHandler);

// ===== Start Server =====
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  logger.info(`🔐 auth-service running on port ${PORT}`);
  console.log(`🔐 auth-service running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Database: ${process.env.MONGO_URI}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});

// ===== Graceful Shutdown =====
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = app; // For testing
