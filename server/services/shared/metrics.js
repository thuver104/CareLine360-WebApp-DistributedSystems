/**
 * CareLine360 Prometheus Metrics
 * 
 * Exposes /metrics endpoint for Prometheus scraping
 * 
 * Metrics:
 * - HTTP request count and latency
 * - RabbitMQ consume failures
 * - Database query latency
 * - PDF generation time
 * - Upload success/failure
 * - Business metrics (appointments, prescriptions)
 */

const express = require('express');
const client = require('prom-client');

// Service name for labels
const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown';

// Enable default metrics (CPU, memory, event loop, etc.)
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({
  prefix: 'careline_',
  labels: { service: SERVICE_NAME },
});

// ================================================================
// HTTP METRICS
// ================================================================

/**
 * HTTP request duration histogram
 */
const httpRequestDuration = new client.Histogram({
  name: 'careline_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['service', 'method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

/**
 * HTTP request counter
 */
const httpRequestTotal = new client.Counter({
  name: 'careline_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['service', 'method', 'route', 'status_code'],
});

/**
 * Active HTTP connections gauge
 */
const httpActiveConnections = new client.Gauge({
  name: 'careline_http_active_connections',
  help: 'Number of active HTTP connections',
  labelNames: ['service'],
});

// ================================================================
// RABBITMQ METRICS
// ================================================================

/**
 * RabbitMQ message consume failures
 */
const rabbitConsumeFailures = new client.Counter({
  name: 'careline_rabbitmq_consume_failures_total',
  help: 'Total RabbitMQ message consume failures',
  labelNames: ['service', 'queue', 'routing_key', 'error_type'],
});

/**
 * RabbitMQ messages processed
 */
const rabbitMessagesProcessed = new client.Counter({
  name: 'careline_rabbitmq_messages_processed_total',
  help: 'Total RabbitMQ messages processed',
  labelNames: ['service', 'queue', 'routing_key', 'status'],
});

/**
 * RabbitMQ message processing duration
 */
const rabbitProcessingDuration = new client.Histogram({
  name: 'careline_rabbitmq_processing_duration_seconds',
  help: 'RabbitMQ message processing duration',
  labelNames: ['service', 'queue', 'routing_key'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30],
});

/**
 * RabbitMQ retry count
 */
const rabbitRetryCount = new client.Counter({
  name: 'careline_rabbitmq_retries_total',
  help: 'Total RabbitMQ message retries',
  labelNames: ['service', 'queue', 'routing_key'],
});

/**
 * RabbitMQ dead letter count
 */
const rabbitDeadLetterCount = new client.Counter({
  name: 'careline_rabbitmq_dead_letters_total',
  help: 'Total messages sent to dead letter queue',
  labelNames: ['service', 'queue', 'routing_key', 'reason'],
});

// ================================================================
// DATABASE METRICS
// ================================================================

/**
 * Database query duration histogram
 */
const dbQueryDuration = new client.Histogram({
  name: 'careline_db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['service', 'operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
});

/**
 * Database query counter
 */
const dbQueryTotal = new client.Counter({
  name: 'careline_db_queries_total',
  help: 'Total database queries',
  labelNames: ['service', 'operation', 'collection', 'status'],
});

/**
 * Database connection pool gauge
 */
const dbConnectionPool = new client.Gauge({
  name: 'careline_db_connection_pool',
  help: 'Database connection pool status',
  labelNames: ['service', 'state'],
});

// ================================================================
// PDF & UPLOAD METRICS
// ================================================================

/**
 * PDF generation duration
 */
const pdfGenerationDuration = new client.Histogram({
  name: 'careline_pdf_generation_duration_seconds',
  help: 'PDF generation duration in seconds',
  labelNames: ['service', 'type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

/**
 * PDF generation counter
 */
const pdfGenerationTotal = new client.Counter({
  name: 'careline_pdf_generations_total',
  help: 'Total PDF generations',
  labelNames: ['service', 'type', 'status'],
});

/**
 * Upload metrics (Cloudinary)
 */
const uploadMetrics = {
  duration: new client.Histogram({
    name: 'careline_upload_duration_seconds',
    help: 'File upload duration in seconds',
    labelNames: ['service', 'type', 'destination'],
    buckets: [0.5, 1, 2, 5, 10, 30],
  }),
  total: new client.Counter({
    name: 'careline_uploads_total',
    help: 'Total file uploads',
    labelNames: ['service', 'type', 'destination', 'status'],
  }),
  size: new client.Histogram({
    name: 'careline_upload_size_bytes',
    help: 'Upload file sizes',
    labelNames: ['service', 'type'],
    buckets: [1024, 10240, 102400, 1048576, 10485760], // 1KB to 10MB
  }),
};

// ================================================================
// BUSINESS METRICS
// ================================================================

/**
 * Business metrics collection
 */
const businessMetrics = {
  // Appointments
  appointmentsCreated: new client.Counter({
    name: 'careline_appointments_created_total',
    help: 'Total appointments created',
    labelNames: ['service', 'type', 'status'],
  }),
  appointmentsActive: new client.Gauge({
    name: 'careline_appointments_active',
    help: 'Current active appointments',
    labelNames: ['service', 'status'],
  }),
  
  // Prescriptions
  prescriptionsGenerated: new client.Counter({
    name: 'careline_prescriptions_generated_total',
    help: 'Total prescriptions generated',
    labelNames: ['service'],
  }),
  
  // Users
  usersRegistered: new client.Counter({
    name: 'careline_users_registered_total',
    help: 'Total users registered',
    labelNames: ['service', 'role'],
  }),
  usersActive: new client.Gauge({
    name: 'careline_users_active',
    help: 'Current active users (logged in recently)',
    labelNames: ['service', 'role'],
  }),
  
  // Emergency
  emergenciesTriggered: new client.Counter({
    name: 'careline_emergencies_triggered_total',
    help: 'Total emergencies triggered',
    labelNames: ['service', 'type'],
  }),
  emergenciesActive: new client.Gauge({
    name: 'careline_emergencies_active',
    help: 'Current active emergencies',
    labelNames: ['service', 'status'],
  }),
};

// ================================================================
// EXPRESS MIDDLEWARE
// ================================================================

/**
 * Express middleware to track HTTP metrics
 */
const metricsMiddleware = (options = {}) => {
  const skipPaths = options.skipPaths || ['/metrics', '/health'];

  return (req, res, next) => {
    // Skip metrics endpoint itself
    if (skipPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    const startTime = Date.now();
    httpActiveConnections.labels(SERVICE_NAME).inc();

    // Normalize route for label (avoid high cardinality)
    const route = normalizeRoute(req.route?.path || req.path);

    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      const statusCode = res.statusCode.toString();

      httpRequestDuration
        .labels(SERVICE_NAME, req.method, route, statusCode)
        .observe(duration);

      httpRequestTotal
        .labels(SERVICE_NAME, req.method, route, statusCode)
        .inc();

      httpActiveConnections.labels(SERVICE_NAME).dec();
    });

    next();
  };
};

/**
 * Normalize route path for metric labels
 * Replaces dynamic segments with placeholders
 */
const normalizeRoute = (path) => {
  return path
    // Replace UUIDs
    .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, ':id')
    // Replace MongoDB ObjectIds
    .replace(/[a-f0-9]{24}/gi, ':id')
    // Replace numeric IDs
    .replace(/\/\d+/g, '/:id')
    // Replace APT-000001 style IDs
    .replace(/APT-\d+/gi, ':appointmentId')
    .replace(/DOC-\d+/gi, ':doctorId')
    .replace(/PAT-\d+/gi, ':patientId')
    .replace(/PRE-\d+/gi, ':prescriptionId');
};

/**
 * Express router for metrics endpoint
 */
const metricsRouter = express.Router();

metricsRouter.get('/', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    const metrics = await client.register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Track database operation
 */
const trackDbOperation = (operation, collection, duration, success = true) => {
  dbQueryDuration
    .labels(SERVICE_NAME, operation, collection)
    .observe(duration / 1000);
  
  dbQueryTotal
    .labels(SERVICE_NAME, operation, collection, success ? 'success' : 'error')
    .inc();
};

/**
 * Track RabbitMQ message processing
 */
const trackRabbitMessage = (queue, routingKey, duration, status) => {
  rabbitMessagesProcessed
    .labels(SERVICE_NAME, queue, routingKey, status)
    .inc();
  
  rabbitProcessingDuration
    .labels(SERVICE_NAME, queue, routingKey)
    .observe(duration / 1000);
};

/**
 * Track PDF generation
 */
const trackPdfGeneration = (type, duration, success = true) => {
  pdfGenerationDuration
    .labels(SERVICE_NAME, type)
    .observe(duration / 1000);
  
  pdfGenerationTotal
    .labels(SERVICE_NAME, type, success ? 'success' : 'error')
    .inc();
};

/**
 * Track file upload
 */
const trackUpload = (type, destination, duration, size, success = true) => {
  uploadMetrics.duration
    .labels(SERVICE_NAME, type, destination)
    .observe(duration / 1000);
  
  uploadMetrics.total
    .labels(SERVICE_NAME, type, destination, success ? 'success' : 'error')
    .inc();
  
  if (size) {
    uploadMetrics.size.labels(SERVICE_NAME, type).observe(size);
  }
};

module.exports = {
  // Middleware
  metricsMiddleware,
  metricsRouter,
  
  // HTTP Metrics
  httpRequestDuration,
  httpRequestTotal,
  httpActiveConnections,
  
  // RabbitMQ Metrics
  rabbitConsumeFailures,
  rabbitMessagesProcessed,
  rabbitProcessingDuration,
  rabbitRetryCount,
  rabbitDeadLetterCount,
  
  // Database Metrics
  dbQueryDuration,
  dbQueryTotal,
  dbConnectionPool,
  
  // PDF & Upload Metrics
  pdfGenerationDuration,
  pdfGenerationTotal,
  uploadMetrics,
  
  // Business Metrics
  businessMetrics,
  
  // Helpers
  trackDbOperation,
  trackRabbitMessage,
  trackPdfGeneration,
  trackUpload,
  normalizeRoute,
  
  // Prometheus client (for custom metrics)
  client,
};
