// backend/controllers/adminController.js
const { Article, User, Like, Comment, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { trackUserAction, trackError } = require('../middleware/monitoringHooks');

// Get article stats
exports.getArticleStats = async (req, res) => {
  try {
    const startTime = Date.now();
    
    const total = await Article.count();
    const published = await Article.count({ where: { published_status: 1 } });
    const drafts = await Article.count({ where: { published_status: 0 } });
    
    const duration = Date.now() - startTime;

    logger.info({
      type: 'admin_article_stats',
      adminId: req.user?.userId,
      total,
      published,
      drafts,
      duration: `${duration}ms`
    });

    trackUserAction(req, 'view_article_stats', { total, published, drafts });

    res.json({ total, published, drafts });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'admin_article_stats_error',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.userId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get author stats
exports.getAuthorStats = async (req, res) => {
  try {
    const startTime = Date.now();
    const total = await User.count();
    const duration = Date.now() - startTime;

    logger.info({
      type: 'admin_author_stats',
      adminId: req.user?.userId,
      totalAuthors: total,
      duration: `${duration}ms`
    });

    trackUserAction(req, 'view_author_stats', { totalAuthors: total });

    res.json({ total });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'admin_author_stats_error',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.userId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get like stats
exports.getLikeStats = async (req, res) => {
  try {
    const startTime = Date.now();
    const total = await Like.count();
    const duration = Date.now() - startTime;

    logger.info({
      type: 'admin_like_stats',
      adminId: req.user?.userId,
      totalLikes: total,
      duration: `${duration}ms`
    });

    trackUserAction(req, 'view_like_stats', { totalLikes: total });

    res.json({ total });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'admin_like_stats_error',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.userId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get comment stats
exports.getCommentStats = async (req, res) => {
  try {
    const startTime = Date.now();
    const total = await Comment.count();
    const articlesWithComments = await Comment.aggregate('articleId', 'count', { distinct: true });
    const duration = Date.now() - startTime;

    logger.info({
      type: 'admin_comment_stats',
      adminId: req.user?.userId,
      totalComments: total,
      articlesWithComments,
      duration: `${duration}ms`
    });

    trackUserAction(req, 'view_comment_stats', { totalComments: total, articlesWithComments });

    res.json({ total, articlesWithComments });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'admin_comment_stats_error',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.userId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get tag stats
exports.getTagStats = async (req, res) => {
  try {
    const startTime = Date.now();
    
    const articles = await Article.findAll({
      where: { published_status: 1 },
      attributes: ['tags']
    });

    const tagCount = {};
    articles.forEach(article => {
      if (article.tags) {
        const tags = typeof article.tags === 'string' 
          ? article.tags.split(',').map(t => t.trim())
          : article.tags || [];
        
        tags.forEach(tag => {
          if (tag) tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });

    const duration = Date.now() - startTime;
    const totalTags = Object.keys(tagCount).length;

    logger.info({
      type: 'admin_tag_stats',
      adminId: req.user?.userId,
      totalTags,
      topTags: Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count })),
      duration: `${duration}ms`
    });

    trackUserAction(req, 'view_tag_stats', { totalTags });

    res.json({ 
      total: totalTags,
      tags: tagCount 
    });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'admin_tag_stats_error',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.userId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get top authors
exports.getTopAuthors = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const startTime = Date.now();
    
    const users = await User.findAll({
      attributes: ['id', 'name', 'email']
    });
    
    const authorsWithStats = await Promise.all(users.map(async (user) => {
      const articles = await Article.findAll({
        where: { authorId: user.id },
        attributes: ['id', 'likesCount', 'commentsCount']
      });
      
      const articleCount = articles.length;
      const totalLikes = articles.reduce((sum, article) => sum + (article.likesCount || 0), 0);
      const totalComments = articles.reduce((sum, article) => sum + (article.commentsCount || 0), 0);
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        articleCount,
        totalLikes,
        totalComments
      };
    }));
    
    const topAuthors = authorsWithStats
      .sort((a, b) => b.articleCount - a.articleCount)
      .slice(0, parseInt(limit));

    const duration = Date.now() - startTime;

    logger.info({
      type: 'admin_top_authors',
      adminId: req.user?.userId,
      topAuthorCount: topAuthors.length,
      topAuthor: topAuthors[0]?.name,
      topAuthorArticles: topAuthors[0]?.articleCount,
      duration: `${duration}ms`
    });

    trackUserAction(req, 'view_top_authors', { count: topAuthors.length });

    res.json(topAuthors);
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'admin_top_authors_error',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.userId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all authors with their stats
exports.getAllAuthors = async (req, res) => {
  try {
    const startTime = Date.now();

    const authors = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    const authorsWithStats = await Promise.all(authors.map(async (author) => {
      const articles = await Article.findAll({
        where: { authorId: author.id },
        attributes: ['id']
      });
      
      const articleIds = articles.map(a => a.id);
      const articleCount = articles.length;
      
      let totalLikes = 0;
      let totalComments = 0;
      
      if (articleIds.length > 0) {
        totalLikes = await Like.count({
          where: { articleId: { [Op.in]: articleIds } }
        });
        
        totalComments = await Comment.count({
          where: { articleId: { [Op.in]: articleIds } }
        });
      }
      
      return {
        id: author.id,
        name: author.name,
        email: author.email,
        role: author.role,
        joinedAt: author.createdAt,
        articleCount,
        totalLikes,
        totalComments
      };
    }));

    const duration = Date.now() - startTime;

    logger.info({
      type: 'admin_all_authors',
      adminId: req.user?.userId,
      totalAuthors: authorsWithStats.length,
      authorsWithContent: authorsWithStats.filter(a => a.articleCount > 0).length,
      duration: `${duration}ms`
    });

    trackUserAction(req, 'view_all_authors', { count: authorsWithStats.length });

    res.json(authorsWithStats);
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'admin_all_authors_error',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.userId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get recent activity
exports.getRecentActivity = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const startTime = Date.now();

    const recentArticles = await Article.findAll({
      where: { published_status: 1 },
      include: [{ model: User, as: 'author', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    const recentComments = await Comment.findAll({
      include: [
        { model: Article, as: 'article', attributes: ['title'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    const recentLikes = await Like.findAll({
      include: [
        { model: Article, as: 'article', attributes: ['title'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    const activity = [
      ...recentArticles.map(a => ({
        id: `article-${a.id}`,
        type: 'article',
        action: 'published',
        user: a.author?.name || 'Unknown',
        target: a.title,
        time: a.createdAt
      })),
      ...recentComments.map(c => ({
        id: `comment-${c.id}`,
        type: 'comment',
        action: 'commented on',
        user: c.name || 'Anonymous',
        target: c.article?.title,
        time: c.createdAt
      })),
      ...recentLikes.map(l => ({
        id: `like-${l.id}`,
        type: 'like',
        action: 'liked',
        user: 'Someone',
        target: l.article?.title,
        time: l.createdAt
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, parseInt(limit));

    const duration = Date.now() - startTime;

    logger.info({
      type: 'admin_recent_activity',
      adminId: req.user?.userId,
      activityCount: activity.length,
      articlesCount: recentArticles.length,
      commentsCount: recentComments.length,
      likesCount: recentLikes.length,
      duration: `${duration}ms`
    });

    trackUserAction(req, 'view_recent_activity', { count: activity.length });

    res.json(activity);
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'admin_recent_activity_error',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.userId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get popular tags
exports.getPopularTags = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const startTime = Date.now();

    const articles = await Article.findAll({
      where: { published_status: 1 },
      attributes: ['tags']
    });

    const tagCount = {};
    let totalArticlesWithTags = 0;

    articles.forEach(article => {
      if (article.tags) {
        const tags = typeof article.tags === 'string' 
          ? article.tags.split(',').map(t => t.trim()).filter(t => t)
          : article.tags || [];
        
        if (tags.length > 0) {
          totalArticlesWithTags++;
          tags.forEach(tag => {
            if (tag) tagCount[tag] = (tagCount[tag] || 0) + 1;
          });
        }
      }
    });

    const popularTags = Object.entries(tagCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalArticlesWithTags > 0 ? ((count / totalArticlesWithTags) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, parseInt(limit));

    const duration = Date.now() - startTime;

    logger.info({
      type: 'admin_popular_tags',
      adminId: req.user?.userId,
      totalTags: popularTags.length,
      topTag: popularTags[0]?.name,
      topTagCount: popularTags[0]?.count,
      duration: `${duration}ms`
    });

    trackUserAction(req, 'view_popular_tags', { count: popularTags.length });

    res.json({ tags: popularTags });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'admin_popular_tags_error',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.userId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get daily stats for charts
exports.getDailyStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startTime = Date.now();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };

    const articles = await Article.findAll({
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      attributes: ['createdAt']
    });

    const likes = await Like.findAll({
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      attributes: ['createdAt']
    });

    const comments = await Comment.findAll({
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      attributes: ['createdAt']
    });

    const dateRange = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dateRange.unshift(formatDate(date));
    }

    const dailyArticles = dateRange.map(date => ({
      date,
      count: articles.filter(a => formatDate(new Date(a.createdAt)) === date).length
    }));

    const dailyLikes = dateRange.map(date => ({
      date,
      count: likes.filter(l => formatDate(new Date(l.createdAt)) === date).length
    }));

    const dailyComments = dateRange.map(date => ({
      date,
      count: comments.filter(c => formatDate(new Date(c.createdAt)) === date).length
    }));

    const duration = Date.now() - startTime;

    // Calculate totals
    const totalArticles = dailyArticles.reduce((sum, day) => sum + day.count, 0);
    const totalLikes = dailyLikes.reduce((sum, day) => sum + day.count, 0);
    const totalComments = dailyComments.reduce((sum, day) => sum + day.count, 0);

    logger.info({
      type: 'admin_daily_stats',
      adminId: req.user?.userId,
      days,
      totalArticles,
      totalLikes,
      totalComments,
      peakDay: dailyArticles.reduce((max, day) => day.count > max.count ? day : max, { count: 0 }).date,
      duration: `${duration}ms`
    });

    trackUserAction(req, 'view_daily_stats', { days, totalArticles, totalLikes, totalComments });

    res.json({
      dailyArticles,
      dailyLikes,
      dailyComments
    });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'admin_daily_stats_error',
      error: error.message,
      stack: error.stack,
      adminId: req.user?.userId
    });
    res.status(500).json({ error: 'Server error' });
  }
};