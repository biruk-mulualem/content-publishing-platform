// backend/controllers/logController.js
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

// ============================================================================
// EXISTING LOG FUNCTIONS
// ============================================================================






// ============================================================================
const systemHealth = () => {
  const used = process.memoryUsage();
  const uptimeMinutes = Math.round(process.uptime() / 60);
  
  const healthData = {
    memory: {
      rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(used.external / 1024 / 1024)}MB`
    },
    uptime: `${uptimeMinutes} minutes`
  };
  
  // Also log to file when called
  logger.info({
    type: 'system_health',
    ...healthData,
    timestamp: new Date().toISOString()
  });
  
  return healthData;
};
// Get logs with filtering and pagination
exports.getLogs = async (req, res) => {
  try {
    const { 
      type = 'all',
      level = 'all',
      limit = 100,
      offset = 0,
      startDate,
      endDate,
      userId,
      search,
      
      // ✅ IMPROVED DEFAULTS - Show everything useful by default
      showHttp = 'true',        // Show HTTP requests (find slow endpoints)
      showOptions = 'false',    // Hide OPTIONS (always useless)
      showDatabase = 'true',    // Show DB queries (find performance issues)
      actionOnly = 'false'      // Show all logs, not just actions
    } = req.query;

    const logFile = path.join(__dirname, '../logs/combined.log');
    
    // Read log file
    const data = await fs.readFile(logFile, 'utf8');
    
    // Parse logs (reverse to show newest first)
    let logs = data
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return { raw: line, error: 'Invalid JSON' };
        }
      })
      .filter(log => !log.error)
      .reverse();

    // 🔥 FILTER 1: Show only meaningful actions if requested
    if (actionOnly === 'true') {
      logs = logs.filter(log => {
        const type = log.type || log.message?.type;
        const method = log.message?.method || log.method;
        
        const meaningfulTypes = [
          'article_created',
          'article_updated', 
          'article_deleted',
          'article_publish_toggled',
          'login_success',
          'login_failed',
          'registration_success',
          'registration_failed',
          'comment_created',
          'like',
          'unlike',
          'user_action',
          'user_event',
          'article_event',
          'comment_event',
          'like_event',
          'public_article_viewed',
          'unauthorized_access',
          'author_not_found'
        ];
        
        return meaningfulTypes.includes(type) || 
               (type === 'error') ||
               (type && type.startsWith('admin_'));
      });
    }

    // 🔥 FILTER 2: Show/hide HTTP requests based on user preference
    if (showHttp === 'false') {
      logs = logs.filter(log => {
        const type = log.type || log.message?.type;
        return type !== 'http_request';
      });
    }

    // 🔥 FILTER 3: Always hide OPTIONS unless explicitly requested
    if (showOptions === 'false') {
      logs = logs.filter(log => {
        const method = log.message?.method || log.method;
        return method !== 'OPTIONS';
      });
    }

    // 🔥 FILTER 4: Show/hide database logs based on user preference
    if (showDatabase === 'false') {
      logs = logs.filter(log => {
        const type = log.type || log.message?.type;
        return type !== 'database_query' && type !== 'database_operation';
      });
    }

    // 🔥 FILTER 5: Hide system health checks (always noise for log viewer)
    logs = logs.filter(log => {
      const type = log.type || log.message?.type;
      return type !== 'system_health';
    });

    // Apply standard filters
    if (type !== 'all') {
      logs = logs.filter(log => log.message?.type === type || log.type === type);
    }
    
    if (level !== 'all') {
      logs = logs.filter(log => log.level === level);
    }
    
    if (startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(startDate));
    }
    
    if (endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(endDate));
    }
    
    if (userId) {
      logs = logs.filter(log => 
        log.message?.userId === parseInt(userId) || 
        log.userId === parseInt(userId)
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      logs = logs.filter(log => 
        JSON.stringify(log).toLowerCase().includes(searchLower)
      );
    }

    // Paginate
    const total = logs.length;
    const paginatedLogs = logs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    // Add summary of filtered logs
    const summary = {
      total,
      showing: paginatedLogs.length,
      filtered: logs.length - paginatedLogs.length,
      actionTypes: [...new Set(paginatedLogs.map(l => l.type || l.message?.type).filter(Boolean))]
    };

    res.json({
      logs: paginatedLogs,
      pagination: {
        total,
        offset: parseInt(offset),
        limit: parseInt(limit),
        hasMore: total > parseInt(offset) + parseInt(limit)
      },
      summary
    });
  } catch (error) {
    logger.error({
      type: 'log_retrieval_error',
      error: error.message,
      adminId: req.user?.userId
    });
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
};

// Get log statistics
exports.getLogStats = async (req, res) => {
  try {
    const logFile = path.join(__dirname, '../logs/combined.log');
    const data = await fs.readFile(logFile, 'utf8');
    
    const allLogs = data
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      })
      .filter(log => log);

    // For stats, we want to analyze ALL logs, but separate meaningful ones
    const meaningfulLogs = allLogs.filter(log => {
      const type = log.type || log.message?.type;
      const method = log.message?.method || log.method;
      
      // Exclude only OPTIONS (useless) and system health (noise)
      if (method === 'OPTIONS') return false;
      if (type === 'system_health') return false;
      
      return true; // Keep everything else!
    });

    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    // Calculate stats
    const stats = {
      // Total logs
      total: meaningfulLogs.length,
      rawTotal: allLogs.length,
      
      byLevel: {
        error: meaningfulLogs.filter(l => l.level === 'error').length,
        warn: meaningfulLogs.filter(l => l.level === 'warn').length,
        info: meaningfulLogs.filter(l => l.level === 'info').length,
        debug: meaningfulLogs.filter(l => l.level === 'debug').length
      },
      
      // Action counts by type
      byAction: {},
      
      recentErrors: meaningfulLogs
        .filter(l => l.level === 'error' && new Date(l.timestamp) > oneDayAgo)
        .slice(0, 10),
      
      // Activity metrics
      lastHour: meaningfulLogs.filter(l => new Date(l.timestamp) > oneHourAgo).length,
      last24Hours: meaningfulLogs.filter(l => new Date(l.timestamp) > oneDayAgo).length,
      
      // User engagement
      topUsers: {},
      
      // Content metrics
      totalArticlesCreated: 0,
      totalArticlesPublished: 0,
      totalComments: 0,
      totalLikes: 0,
      totalLogins: 0,
      totalRegistrations: 0,
      
      // Performance metrics
      responseTimeAvg: 0,
      slowRequests: []
    };

    let totalResponseTime = 0;
    let responseTimeCount = 0;

    meaningfulLogs.forEach(log => {
      const type = log.message?.type || log.type;
      const userId = log.message?.userId || log.userId;
      
      // Count by action type
      if (type) {
        stats.byAction[type] = (stats.byAction[type] || 0) + 1;
      }

      // Track user activity
      if (userId && userId !== 'anonymous') {
        stats.topUsers[userId] = (stats.topUsers[userId] || 0) + 1;
      }

      // Count specific meaningful actions
      switch(type) {
        case 'article_created':
          stats.totalArticlesCreated++;
          break;
        case 'article_publish_toggled':
          if (log.message?.newStatus === 'published') {
            stats.totalArticlesPublished++;
          }
          break;
        case 'comment_created':
          stats.totalComments++;
          break;
        case 'like':
          stats.totalLikes++;
          break;
        case 'login_success':
          stats.totalLogins++;
          break;
        case 'registration_success':
          stats.totalRegistrations++;
          break;
      }

      // Calculate response time
      const duration = log.message?.duration || log.duration;
      if (duration) {
        const ms = parseInt(duration);
        if (!isNaN(ms)) {
          totalResponseTime += ms;
          responseTimeCount++;
          
          if (ms > 1000) {
            stats.slowRequests.push({
              url: log.message?.url || log.url,
              duration,
              timestamp: log.timestamp
            });
          }
        }
      }
    });

    stats.responseTimeAvg = responseTimeCount > 0 
      ? Math.round(totalResponseTime / responseTimeCount) + 'ms' 
      : 'N/A';

    // Sort and limit
    stats.topUsers = Object.entries(stats.topUsers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ id, count }));

    stats.slowRequests = stats.slowRequests.slice(0, 10);

    // Add summary
    stats.summary = {
      totalLogs: meaningfulLogs.length,
      httpRequests: allLogs.filter(l => l.type === 'http_request' || l.message?.type === 'http_request').length,
      databaseQueries: allLogs.filter(l => l.type === 'database_query' || l.message?.type === 'database_query').length,
      userActions: allLogs.filter(l => l.type === 'user_action' || l.message?.type === 'user_action').length,
      errors: allLogs.filter(l => l.level === 'error').length
    };

    res.json(stats);
  } catch (error) {
    logger.error({
      type: 'log_stats_error',
      error: error.message,
      adminId: req.user?.userId
    });
    res.status(500).json({ error: 'Failed to get stats' });
  }
};

// Clear logs (admin only)
exports.clearLogs = async (req, res) => {
  try {
    const logFile = path.join(__dirname, '../logs/combined.log');
    await fs.writeFile(logFile, '');
    
    logger.info({
      type: 'logs_cleared',
      adminId: req.user?.userId
    });

    res.json({ message: 'Logs cleared successfully' });
  } catch (error) {
    logger.error({
      type: 'logs_clear_error',
      error: error.message,
      adminId: req.user?.userId
    });
    res.status(500).json({ error: 'Failed to clear logs' });
  }
};


exports.getSystemHealth = async (req, res) => {
  try {
    const health = systemHealth(); // Now defined above!
    
    const response = {
      success: true,
      ...health,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logger.error({
      type: 'health_check_error',
      error: error.message
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get health data' 
    });
  }
};

/**
 * 📊 Get Detailed System Health (Admin only)
 */
exports.getDetailedSystemHealth = async (req, res) => {
  try {
    const health = systemHealth();
    
    const os = require('os');
    const cpus = os.cpus();
    
    const detailedHealth = {
      success: true,
      ...health,
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        uptime: `${Math.round(os.uptime() / 60 / 60)} hours`,
        loadAverage: os.loadavg(),
        cpus: {
          count: cpus.length,
          model: cpus[0]?.model,
          speed: cpus[0]?.speed
        },
        memory: {
          total: `${Math.round(os.totalmem() / 1024 / 1024)}MB`,
          free: `${Math.round(os.freemem() / 1024 / 1024)}MB`,
          used: `${Math.round((os.totalmem() - os.freemem()) / 1024 / 1024)}MB`,
          usagePercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
        }
      },
      process: {
        pid: process.pid,
        version: process.version,
        uptime: `${Math.round(process.uptime() / 60)} minutes`,
        memoryUsage: process.memoryUsage()
      },
      timestamp: new Date().toISOString()
    };

    logger.info({
      type: 'admin_viewed_health',
      adminId: req.user?.userId,
      timestamp: new Date().toISOString()
    });

    res.json(detailedHealth);
  } catch (error) {
    logger.error({
      type: 'detailed_health_error',
      error: error.message,
      adminId: req.user?.userId
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get detailed health data' 
    });
  }
};

/**
 * 📈 Get Health Check History
 */
exports.getHealthHistory = async (req, res) => {
  try {
    const { hours = 24, limit = 100 } = req.query;
    
    const logFile = path.join(__dirname, '../logs/combined.log');
    const data = await fs.readFile(logFile, 'utf8');
    
    const healthLogs = data
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      })
      .filter(log => log && log.type === 'system_health')
      .filter(log => {
        const logTime = new Date(log.timestamp).getTime();
        const cutoff = Date.now() - (parseInt(hours) * 60 * 60 * 1000);
        return logTime > cutoff;
      })
      .reverse()
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      count: healthLogs.length,
      hours: parseInt(hours),
      logs: healthLogs
    });
  } catch (error) {
    logger.error({
      type: 'health_history_error',
      error: error.message,
      adminId: req.user?.userId
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get health history' 
    });
  }
};

/**
 * 🔧 Internal function for periodic health checks (used by setInterval)
 */
exports.runHealthCheck = () => {
  try {
    const health = systemHealth();
    console.log('🏥 Health check completed at', new Date().toLocaleString());
    return health;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return null;
  }
};





