/**
 * CareLine360 Shared Infrastructure Package
 * 
 * Provides production-grade observability, resilience, and recovery patterns:
 * - Structured logging with correlation IDs
 * - Request tracing across services
 * - Health checks (liveness + readiness)
 * - Prometheus metrics
 * - RabbitMQ retry with DLQ
 * - Idempotent event consumers
 * - Graceful shutdown handling
 */

// Logger
const { createLogger, requestLogger, eventLogger } = require('./logger');

// Tracing
const { 
  tracingMiddleware, 
  getCorrelationId, 
  createTracedAxios,
  addTraceToEvent 
} = require('./tracing');

// Health Checks
const { 
  createHealthRouter, 
  checkMongo, 
  checkRabbitMQ,
  checkCloudinary 
} = require('./health');

// Metrics
const { 
  metricsMiddleware, 
  metricsRouter,
  httpRequestDuration,
  httpRequestTotal,
  rabbitConsumeFailures,
  dbQueryDuration,
  pdfGenerationDuration,
  uploadMetrics,
  businessMetrics
} = require('./metrics');

// RabbitMQ Retry/DLQ
const { 
  createRabbitConnection,
  publishWithRetry,
  consumeWithRetry,
  setupRetryInfrastructure,
  inspectDLQ
} = require('./rabbitmq');

// Idempotency
const { 
  ProcessedEvent,
  isEventProcessed,
  markEventProcessed,
  createIdempotentConsumer 
} = require('./idempotency');

// Graceful Shutdown
const { 
  setupGracefulShutdown,
  onShutdown 
} = require('./shutdown');

module.exports = {
  // Logger
  createLogger,
  requestLogger,
  eventLogger,
  
  // Tracing
  tracingMiddleware,
  getCorrelationId,
  createTracedAxios,
  addTraceToEvent,
  
  // Health
  createHealthRouter,
  checkMongo,
  checkRabbitMQ,
  checkCloudinary,
  
  // Metrics
  metricsMiddleware,
  metricsRouter,
  httpRequestDuration,
  httpRequestTotal,
  rabbitConsumeFailures,
  dbQueryDuration,
  pdfGenerationDuration,
  uploadMetrics,
  businessMetrics,
  
  // RabbitMQ
  createRabbitConnection,
  publishWithRetry,
  consumeWithRetry,
  setupRetryInfrastructure,
  inspectDLQ,
  
  // Idempotency
  ProcessedEvent,
  isEventProcessed,
  markEventProcessed,
  createIdempotentConsumer,
  
  // Shutdown
  setupGracefulShutdown,
  onShutdown,
};
