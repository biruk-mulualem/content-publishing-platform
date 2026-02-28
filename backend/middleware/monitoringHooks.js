// backend/middleware/monitoring.js
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// ============================================================================
// SECTION 1: REQUEST ID MIDDLEWARE
// ============================================================================
/**
 * 🏷️ REQUEST ID MIDDLEWARE
 * 
 * WHAT IT DOES:
 * - Assigns a UNIQUE ID to EVERY incoming request
 * - This ID is like a tracking number that follows the request everywhere
 * - Added to response headers so clients can see it
 * 
 * WHY IT'S NEEDED:
 * - Without this, you can't trace a user's journey through multiple logs
 * - Connects database queries, errors, and user actions to ONE specific request
 * - Essential for debugging: "Find everything that happened during request abc-123"
 * 
 * WHEN IT RUNS:
 * - FIRST middleware to run for EVERY request
 * - Runs BEFORE any other middleware or controller code
 * 
 * REAL-WORLD ANALOGY:
 * - Like giving each customer a numbered ticket when they enter a store
 * - Every interaction they have gets marked with that same ticket number
 */
const requestId = (req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`📋 [${req.id}] New request`);
  }
  
  next();
};

// ============================================================================
// SECTION 2: HTTP REQUEST MONITOR
// ============================================================================
/**
 * 🌐 HTTP REQUEST MONITOR
 * 
 * WHAT IT DOES:
 * - Tracks EVERY HTTP request that hits your server
 * - Measures how long each request takes (duration)
 * - Records method (GET/POST), URL, status code, IP, user agent
 * - Automatically logs based on status code:
 *   - 200-399: Success → logger.info (green)
 *   - 400-499: Client errors → logger.warn (yellow)
 *   - 500-599: Server errors → logger.error (red)
 * - Flags slow requests (>1000ms) as warnings
 * 
 * WHY IT'S NEEDED:
 * - Know which endpoints are slow and need optimization
 * - Track error rates by endpoint
 * - Monitor traffic patterns
 * - Identify problem users (by userId)
 * 
 * WHEN IT RUNS:
 * - Starts timer when request comes in
 * - Logs AFTER request completes (doesn't block user)
 * 
 * REAL-WORLD ANALOGY:
 * - Like a store greeter who notes:
 *   - Who entered (userId)
 *   - What time (timestamp)
 *   - How long they stayed (duration)
 *   - Did they buy anything? (status code)
 *   - Were they unhappy? (400/500 errors)
 */
const requestMonitor = (req, res, next) => {
  const start = Date.now();
  
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
      logger.error(logData);  // Server errors
    } else if (res.statusCode >= 400) {
      logger.warn(logData);   // Client errors
    } else {
      logger.info(logData);   // Success
    }
    
    // Alert on slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn({
        ...logData,
        type: 'slow_request',
        message: '⚠️ Request took too long',
        threshold: '1000ms'
      });
    }
  });
  
  next();
};

// ============================================================================
// SECTION 3: DATABASE OPERATION MONITOR
// ============================================================================
/**
 * 🗄️ DATABASE OPERATION MONITOR
 * 
 * WHAT IT DOES:
 * - Tracks performance of EVERY database query
 * - Records operation type (findAll, create, update, delete)
 * - Measures query duration
 * - Flags slow queries (>500ms) as warnings
 * 
 * WHY IT'S NEEDED:
 * - Slow queries are the #1 cause of slow applications
 * - Identify which tables/operations need optimization
 * - Add indexes where needed
 * - Prevent database timeouts
 * 
 * WHEN TO CALL IT:
 * - Call AFTER every database operation
 * - Pass in the operation, model, query, and duration
 * 
 * REAL-WORLD ANALOGY:
 * - Like tracking how long each customer waits in line
 * - If lines are long (>500ms), you need more cashiers (indexes)
 * - Different counters (models) have different wait times
 * 
 * EXAMPLE USAGE:
 * const start = Date.now();
 * const users = await User.findAll();
 * const duration = Date.now() - start;
 * dbMonitor('findAll', 'User', 'SELECT * FROM users', duration);
 */
const dbMonitor = (operation, model, query, duration) => {
  const logData = {
    type: 'database_operation',
    operation,
    model,
    query: query?.toString().substring(0, 200),
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  };
  
  // Log slow queries (> 500ms) as warnings
  if (duration > 500) {
    logger.warn({
      ...logData,
      type: 'slow_query',
      message: '🐢 Slow database query detected'
    });
  } else {
    logger.debug(logData);
  }
};

// ============================================================================
// SECTION 4: USER ACTION TRACKER
// ============================================================================
/**
 * 👤 USER ACTION TRACKER
 * 
 * WHAT IT DOES:
 * - Records IMPORTANT user actions (login, create article, comment, etc.)
 * - Creates a complete history of user behavior
 * - Links actions to specific users and requests
 * - Includes custom details (articleId, title, etc.)
 * 
 * WHY IT'S NEEDED:
 * - Understand how users interact with your app
 * - Track feature adoption
 * - Identify power users
 * - Debug user-reported issues
 * - Business analytics and reporting
 * 
 * WHEN TO CALL IT:
 * - Call whenever a user does something significant
 * - AFTER the action completes successfully
 * 
 * REAL-WORLD ANALOGY:
 * - Like a personal shopper tracking everything a customer does:
 *   - "John looked at electronics" (view_dashboard)
 *   - "John bought a TV" (create_order)
 *   - "John left a review" (post_comment)
 * 
 * EXAMPLE USAGE:
 * trackUserAction(req, 'create_article', { 
 *   articleId: 456, 
 *   title: 'My Post' 
 * });
 */
const trackUserAction = (req, action, details = {}) => {
  if (!req) return;
  
  logger.info({
    type: 'user_action',
    requestId: req.id,
    userId: req.user?.userId || 'anonymous',
    userRole: req.user?.role || 'anonymous',
    action,
    ...details,
    timestamp: new Date().toISOString()
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`👤 [${req.id}] User ${req.user?.userId || 'anonymous'}: ${action}`);
  }
};

// ============================================================================
// SECTION 5: ERROR TRACKER
// ============================================================================
/**
 * 💥 ERROR TRACKER
 * 
 * WHAT IT DOES:
 * - Captures EVERY error that occurs in your app
 * - Records the FULL stack trace (EXACT line number where error happened)
 * - Links error to the specific request and user
 * - Includes error type, message, and code
 * 
 * WHY IT'S NEEDED:
 * - Without this, you'd know SOMETHING broke but not WHAT or WHERE
 * - Stack trace tells you EXACTLY which file and line to fix
 * - Links error to user actions for reproduction
 * - Essential for debugging production issues
 * 
 * WHEN TO CALL IT:
 * - Call in EVERY catch block
 * - Pass the error object and the request object
 * 
 * REAL-WORLD ANALOGY:
 * - Like a crash investigator at an accident:
 *   - Not just "a car crashed" (HTTP 500)
 *   - But "brake lines were cut at the factory" (stack trace)
 *   - And "driver was John" (userId)
 *   - And "it happened on Highway 101" (url)
 * 
 * EXAMPLE USAGE:
 * try {
 *   await article.save();
 * } catch(error) {
 *   trackError(error, req);
 *   res.status(500).json({ error: 'Failed' });
 * }
 */
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
  
  if (process.env.NODE_ENV === 'development') {
    console.error(`🔥 [${req?.id}] ERROR:`, error.message);
    console.error(error.stack);
  }
};



// ============================================================================
// EXPORTS
// ============================================================================
/**
 * 📦 EXPORTS
 * 
 * All monitoring tools exported as a single object
 * Import anywhere in your app:
 * 
 * const monitoring = require('./middleware/monitoring');
 * 
 * // Use in app.js
 * app.use(monitoring.requestId);
 * app.use(monitoring.requestMonitor);
 * 
 * // Use in controllers
 * monitoring.trackUserAction(req, 'login');
 * monitoring.trackError(error, req);
 * 
 * // Use for health checks
 * setInterval(monitoring.systemHealth, 300000);
 */
module.exports = {
  requestId,
  requestMonitor,
  dbMonitor,
  trackUserAction,
  trackError,

};