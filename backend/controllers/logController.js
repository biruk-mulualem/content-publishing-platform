// backend/controllers/logController.js
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

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
      // Control what to show
      showHttp = 'false',      // Hide HTTP by default
      showOptions = 'false',   // Hide OPTIONS by default
      showDatabase = 'false',  // Hide DB queries by default
      actionOnly = 'true'      // Show only user actions by default
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

    // 🔥 FILTER 1: Show only meaningful actions by default
    if (actionOnly === 'true') {
      logs = logs.filter(log => {
        const type = log.type || log.message?.type;
        const method = log.message?.method || log.method;
        
        // Keep only meaningful user actions
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
               (type === 'error') || // Always show errors
               (type && type.startsWith('admin_')); // Always show admin actions
      });
    }

    // 🔥 FILTER 2: Hide HTTP requests unless specifically requested
    if (showHttp === 'false') {
      logs = logs.filter(log => {
        const type = log.type || log.message?.type;
        return type !== 'http_request';
      });
    }

    // 🔥 FILTER 3: Hide OPTIONS requests unless specifically requested
    if (showOptions === 'false') {
      logs = logs.filter(log => {
        const method = log.message?.method || log.method;
        return method !== 'OPTIONS';
      });
    }

    // 🔥 FILTER 4: Hide database debug logs unless requested
    if (showDatabase === 'false') {
      logs = logs.filter(log => {
        const type = log.type || log.message?.type;
        return type !== 'database_query' && type !== 'database_operation';
      });
    }

    // 🔥 FILTER 5: Hide system health checks
    logs = logs.filter(log => {
      const type = log.type || log.message?.type;
      return type !== 'system_health';
    });

    // Apply existing filters
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

// Get log statistics - FIXED VERSION with clean counts
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

    // Create filtered logs that exclude noise
    const meaningfulLogs = allLogs.filter(log => {
      const type = log.type || log.message?.type;
      const method = log.message?.method || log.method;
      
      // Exclude noise
      if (type === 'http_request') return false;
      if (method === 'OPTIONS') return false;
      if (type === 'database_query') return false;
      if (type === 'database_operation') return false;
      if (type === 'system_health') return false;
      
      return true;
    });

    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    // Calculate stats based on meaningful logs only
    const stats = {
      // Total meaningful logs (not including noise)
      total: meaningfulLogs.length,
      
      // Also show raw total for comparison
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
      
      // Response time (still useful for performance)
      responseTimeAvg: 0,
      slowRequests: []
    };

    let totalResponseTime = 0;
    let responseTimeCount = 0;

    meaningfulLogs.forEach(log => {
      const type = log.message?.type || log.type;
      const userId = log.message?.userId || log.userId;
      const articleId = log.message?.articleId || log.articleId;
      
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

      // Calculate response time (still useful)
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

    // Add summary of activity
    stats.summary = {
      meaningfulLogs: meaningfulLogs.length,
      noiseRemoved: allLogs.length - meaningfulLogs.length,
      noisePercentage: allLogs.length > 0 
        ? Math.round(((allLogs.length - meaningfulLogs.length) / allLogs.length) * 100) 
        : 0
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