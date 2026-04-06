/**
 * CareLine360 Request Tracing
 * 
 * Distributed tracing across:
 * - API Gateway → Services
 * - Service → Service HTTP calls
 * - RabbitMQ events
 * 
 * Propagates:
 * - x-request-id: Unique request identifier
 * - x-correlation-id: End-to-end transaction ID
 */

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// AsyncLocalStorage for context propagation
const { AsyncLocalStorage } = require('async_hooks');
const asyncLocalStorage = new AsyncLocalStorage();

/**
 * Get current trace context
 */
const getTraceContext = () => {
  return asyncLocalStorage.getStore() || {};
};

/**
 * Get correlation ID from current context
 */
const getCorrelationId = () => {
  const context = getTraceContext();
  return context.correlationId;
};

/**
 * Get request ID from current context
 */
const getRequestId = () => {
  const context = getTraceContext();
  return context.requestId;
};

/**
 * Express middleware for request tracing
 * Extracts or generates trace IDs and stores in context
 */
const tracingMiddleware = (options = {}) => {
  const serviceName = options.serviceName || process.env.SERVICE_NAME || 'unknown';

  return (req, res, next) => {
    // Extract or generate trace IDs
    const requestId = req.headers['x-request-id'] || uuidv4();
    const correlationId = req.headers['x-correlation-id'] || requestId;

    // Store in request object
    req.requestId = requestId;
    req.correlationId = correlationId;

    // Set response headers
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Correlation-ID', correlationId);
    res.setHeader('X-Service', serviceName);

    // Run in async context
    asyncLocalStorage.run(
      {
        requestId,
        correlationId,
        serviceName,
        startTime: Date.now(),
      },
      () => next()
    );
  };
};

/**
 * Create Axios instance with automatic trace header propagation
 */
const createTracedAxios = (baseConfig = {}) => {
  const instance = axios.create(baseConfig);

  // Add request interceptor to inject trace headers
  instance.interceptors.request.use((config) => {
    const context = getTraceContext();
    
    config.headers = config.headers || {};
    
    // Propagate trace IDs
    if (context.requestId) {
      config.headers['X-Request-ID'] = context.requestId;
    }
    if (context.correlationId) {
      config.headers['X-Correlation-ID'] = context.correlationId;
    }
    
    // Add timeout if not set
    config.timeout = config.timeout || 10000;
    
    return config;
  });

  // Add response interceptor for logging
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Enhance error with trace info
      if (error.config) {
        error.requestId = error.config.headers?.['X-Request-ID'];
        error.correlationId = error.config.headers?.['X-Correlation-ID'];
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * Add trace headers to RabbitMQ event payload
 */
const addTraceToEvent = (payload, options = {}) => {
  const context = getTraceContext();
  
  return {
    ...payload,
    // Generate unique event ID
    eventId: payload.eventId || uuidv4(),
    // Propagate or create correlation ID
    correlationId: options.correlationId || context.correlationId || uuidv4(),
    // Source service
    sourceService: options.serviceName || context.serviceName || process.env.SERVICE_NAME,
    // Timestamp
    publishedAt: new Date().toISOString(),
    // Original request ID (if from HTTP request)
    originRequestId: context.requestId,
  };
};

/**
 * Extract trace context from RabbitMQ message
 */
const extractTraceFromEvent = (payload) => {
  return {
    eventId: payload.eventId,
    correlationId: payload.correlationId,
    sourceService: payload.sourceService,
    originRequestId: payload.originRequestId,
  };
};

/**
 * Run callback in trace context (for RabbitMQ consumers)
 */
const runInTraceContext = (traceInfo, callback) => {
  return asyncLocalStorage.run(
    {
      requestId: traceInfo.eventId,
      correlationId: traceInfo.correlationId,
      serviceName: process.env.SERVICE_NAME,
      startTime: Date.now(),
    },
    callback
  );
};

/**
 * Create trace-aware HTTP client for service-to-service calls
 */
const createServiceClient = (baseURL, options = {}) => {
  return createTracedAxios({
    baseURL,
    timeout: options.timeout || 10000,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};

module.exports = {
  tracingMiddleware,
  getCorrelationId,
  getRequestId,
  getTraceContext,
  createTracedAxios,
  createServiceClient,
  addTraceToEvent,
  extractTraceFromEvent,
  runInTraceContext,
};
