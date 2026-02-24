// backend/services/monitoringService.js
const logger = require('../utils/logger');

class MonitoringService {
  // Track article events
  static trackArticle(req, action, article) {
    logger.info({
      type: 'article_event',
      requestId: req?.id,
      userId: req?.user?.userId,
      action,
      articleId: article.id,
      title: article.title,
      tags: article.tags,
      published: article.published_status === 1,
      timestamp: new Date().toISOString()
    });
  }
  
  // Track comment events
  static trackComment(req, action, comment) {
    logger.info({
      type: 'comment_event',
      requestId: req?.id,
      userId: req?.user?.userId || 'anonymous',
      sessionId: req?.headers['x-session-id'],
      action,
      commentId: comment.id,
      articleId: comment.articleId,
      timestamp: new Date().toISOString()
    });
  }
  
  // Track like events
  static trackLike(req, articleId, liked) {
    logger.info({
      type: 'like_event',
      requestId: req?.id,
      userId: req?.user?.userId || 'anonymous',
      sessionId: req?.headers['x-session-id'],
      action: liked ? 'like' : 'unlike',
      articleId,
      timestamp: new Date().toISOString()
    });
  }
  
  // Track user events
  static trackUser(req, action, user) {
    logger.info({
      type: 'user_event',
      requestId: req?.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      action,
      timestamp: new Date().toISOString()
    });
  }
  
  // Get monitoring statistics (for admin dashboard)
  static async getStats() {
    // In a real app, you'd query a logs database
    // For now, return sample stats
    return {
      overview: {
        totalRequests: 15420,
        averageResponseTime: '187ms',
        errorRate: '0.8%',
        activeUsers: 342
      },
      topEndpoints: [
        { endpoint: '/api/articles/public', count: 5230, avgTime: '45ms' },
        { endpoint: '/api/articles', count: 3421, avgTime: '120ms' },
        { endpoint: '/api/users/login', count: 2134, avgTime: '89ms' },
        { endpoint: '/api/comments', count: 1876, avgTime: '67ms' }
      ],
      errors: {
        last24h: 42,
        byType: {
          '404': 18,
          '400': 12,
          '500': 8,
          '403': 4
        }
      },
      users: {
        total: 156,
        active: 89,
        authors: 134,
        admins: 22
      }
    };
  }
}

module.exports = MonitoringService;