// backend/middleware/monitoringHooks.js
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Generate unique request ID
const requestId = (req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
};

// Monitor HTTP requests
const requestMonitor = (req, res, next) => {
  const start = Date.now();
  
  // Log when request completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const logData = {
      type: 'http_request',
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId || 'anonymous',
      userRole: req.user?.role || 'anonymous'
    };
    
    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error(logData);
    } else if (res.statusCode >= 400) {
      logger.warn(logData);
    } else {
      logger.info(logData);
    }
    
    // Alert on slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn({
        ...logData,
        type: 'slow_request',
        message: 'Request took too long',
        threshold: '1000ms'
      });
    }
  });
  
  next();
};

// Monitor database operations (to be used in models)
const dbMonitor = (operation, model, query, duration) => {
  const logData = {
    type: 'database_operation',
    operation,
    model,
    query: query?.toString().substring(0, 200),
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  };
  
  // Log slow queries (> 500ms)
  if (duration > 500) {
    logger.warn({
      ...logData,
      type: 'slow_query',
      message: 'Slow database query detected'
    });
  } else {
    logger.debug(logData);
  }
};

// Track user actions
const trackUserAction = (req, action, details = {}) => {
  logger.info({
    type: 'user_action',
    requestId: req?.id,
    userId: req?.user?.userId || 'anonymous',
    userRole: req?.user?.role || 'anonymous',
    action,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Track errors
const trackError = (error, req = null) => {
  logger.error({
    type: 'error',
    requestId: req?.id,
    userId: req?.user?.userId,
    url: req?.originalUrl,
    method: req?.method,
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    },
    timestamp: new Date().toISOString()
  });
};

// System health monitor
const systemHealth = () => {
  const used = process.memoryUsage();
  
  logger.info({
    type: 'system_health',
    memory: {
      rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(used.external / 1024 / 1024)}MB`
    },
    uptime: `${Math.round(process.uptime() / 60)} minutes`,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  requestId,
  requestMonitor,
  dbMonitor,
  trackUserAction,
  trackError,
  systemHealth
};