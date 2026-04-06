/**
 * patient-service - Main Server Entry Point
 * Handles patient profiles, medical records, and document management
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Local config
const { connectDB } = require('./config/db');
const { connectRabbitMQ, getChannel, closeRabbitMQ } = require('./config/rabbitmq');
const cloudinary = require('./config/cloudinary');

// Routes
const patientRoutes = require('./routes/patientRoutes');
const documentRoutes = require('./routes/documentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');

// Consumers
const { startAuthConsumer } = require('./consumers/authConsumer');

// Publishers
const { publishPatientEvent } = require('./publishers/patientPublisher');

const app = express();
const SERVICE_NAME = 'patient-service';
const PORT = process.env.PORT || 5002;

// ===== Middleware =====
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(helmet());

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  req.correlationId = req.headers['x-correlation-id'] || req.requestId;
  res.setHeader('x-request-id', req.requestId);
  res.setHeader('x-correlation-id', req.correlationId);
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      service: SERVICE_NAME,
      level: 'info',
      message: 'HTTP Request',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      requestId: req.requestId,
      correlationId: req.correlationId,
      userId: req.user?.userId
    }));
  });
  next();
});

// ===== Health Checks =====
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: SERVICE_NAME,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME });
});

app.get('/health/ready', async (req, res) => {
  const checks = {
    mongodb: mongoose.connection.readyState === 1,
    rabbitmq: !!getChannel(),
    cloudinary: !!cloudinary.config().cloud_name
  };

  const allHealthy = Object.values(checks).every(Boolean);
  const status = allHealthy ? 'ready' : 'degraded';

  res.status(allHealthy ? 200 : 503).json({
    status,
    service: SERVICE_NAME,
    checks,
    timestamp: new Date().toISOString()
  });
});

// ===== Routes =====
app.use('/api/v1/patient', patientRoutes);
app.use('/api/v1/patient/documents', documentRoutes);
app.use('/api/v1/patient/medical-records', medicalRecordRoutes);

// Backward compatibility routes
app.use('/api/patient', patientRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    version: '1.0.0',
    endpoints: {
      health: '/health',
      live: '/health/live',
      ready: '/health/ready',
      patient: '/api/v1/patient',
      documents: '/api/v1/patient/documents',
      medicalRecords: '/api/v1/patient/medical-records'
    }
  });
});

// ===== Error Handler =====
app.use((err, req, res, next) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    service: SERVICE_NAME,
    level: 'error',
    message: 'Unhandled error',
    error: err.message,
    stack: err.stack,
    requestId: req.requestId
  }));

  // Multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large (max 5MB)'
        : err.message
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    requestId: req.requestId
  });
});

// ===== Start Server =====
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log(`✅ ${SERVICE_NAME} MongoDB connected`);

    // Connect to RabbitMQ
    await connectRabbitMQ();
    console.log(`✅ ${SERVICE_NAME} RabbitMQ connected`);

    // Start consumers
    await startAuthConsumer();
    console.log(`✅ ${SERVICE_NAME} Auth event consumer started`);

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🏥 ${SERVICE_NAME} running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Database: ${process.env.MONGODB_URI}`);
      console.log(`   Health check: http://localhost:${PORT}/health/ready`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log('HTTP server closed');

        try {
          await mongoose.connection.close();
          console.log('MongoDB connection closed');

          await closeRabbitMQ();
          console.log('RabbitMQ connection closed');

          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      });

      // Force shutdown after 30s
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Promise Rejection:', err);
    });

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
