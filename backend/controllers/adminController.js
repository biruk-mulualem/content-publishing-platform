// backend/controllers/adminController.js
const { Article, User, Like, Comment, sequelize } = require('../models');
const { Op } = require('sequelize');
const { trackUserAction } = require('../middleware/monitoringHooks');

// ============================================================================
// STATS ENDPOINTS - Only track WHAT admin views, not HOW long it took
// ============================================================================

// Get article stats
exports.getArticleStats = async (req, res) => {
  try {
    const total = await Article.count();
    const published = await Article.count({ where: { published_status: 1 } });
    const drafts = await Article.count({ where: { published_status: 0 } });
    
    // ✅ Track that admin viewed article stats
    trackUserAction(req, 'admin_view_article_stats', { total, published, drafts });

    res.json({ total, published, drafts });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get author stats
exports.getAuthorStats = async (req, res) => {
  try {
    const total = await User.count();
    
    // ✅ Track that admin viewed author stats
    trackUserAction(req, 'admin_view_author_stats', { totalAuthors: total });

    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get like stats
exports.getLikeStats = async (req, res) => {
  try {
    const total = await Like.count();
    
    // ✅ Track that admin viewed like stats
    trackUserAction(req, 'admin_view_like_stats', { totalLikes: total });

    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get comment stats
exports.getCommentStats = async (req, res) => {
  try {
    const total = await Comment.count();
    const articlesWithComments = await Comment.aggregate('articleId', 'count', { distinct: true });
    
    // ✅ Track that admin viewed comment stats
    trackUserAction(req, 'admin_view_comment_stats', { 
      totalComments: total, 
      articlesWithComments 
    });

    res.json({ total, articlesWithComments });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get tag stats
exports.getTagStats = async (req, res) => {
  try {
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

    const totalTags = Object.keys(tagCount).length;
    
    // ✅ Track that admin viewed tag stats
    trackUserAction(req, 'admin_view_tag_stats', { totalTags });

    res.json({ total: totalTags, tags: tagCount });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ============================================================================
// AUTHOR ENDPOINTS
// ============================================================================

// Get top authors
exports.getTopAuthors = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const users = await User.findAll({
      attributes: ['id', 'name', 'email']
    });
    
    const authorsWithStats = await Promise.all(users.map(async (user) => {
      const articles = await Article.findAll({
        where: { authorId: user.id },
        attributes: ['id', 'likesCount', 'commentsCount']
      });
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        articleCount: articles.length,
        totalLikes: articles.reduce((sum, article) => sum + (article.likesCount || 0), 0),
        totalComments: articles.reduce((sum, article) => sum + (article.commentsCount || 0), 0)
      };
    }));
    
    const topAuthors = authorsWithStats
      .sort((a, b) => b.articleCount - a.articleCount)
      .slice(0, parseInt(limit));

    // ✅ Track that admin viewed top authors
    trackUserAction(req, 'admin_view_top_authors', { count: topAuthors.length });

    res.json(topAuthors);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all authors with their stats
exports.getAllAuthors = async (req, res) => {
  try {
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
        totalLikes = await Like.count({ where: { articleId: { [Op.in]: articleIds } } });
        totalComments = await Comment.count({ where: { articleId: { [Op.in]: articleIds } } });
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

    // ✅ Track that admin viewed all authors
    trackUserAction(req, 'admin_view_all_authors', { count: authorsWithStats.length });

    res.json(authorsWithStats);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ============================================================================
// ACTIVITY ENDPOINTS
// ============================================================================

// Get recent activity
exports.getRecentActivity = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const [recentArticles, recentComments, recentLikes] = await Promise.all([
      Article.findAll({
        where: { published_status: 1 },
        include: [{ model: User, as: 'author', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
      }),
      Comment.findAll({
        include: [{ model: Article, as: 'article', attributes: ['title'] }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
      }),
      Like.findAll({
        include: [{ model: Article, as: 'article', attributes: ['title'] }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
      })
    ]);

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
    ]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, parseInt(limit));

    // ✅ Track that admin viewed recent activity
    trackUserAction(req, 'admin_view_recent_activity', { count: activity.length });

    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get popular tags
exports.getPopularTags = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const articles = await Article.findAll({
      where: { published_status: 1 },
      attributes: ['tags']
    });

    let totalArticlesWithTags = 0;
    const tagCount = {};

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

    // ✅ Track that admin viewed popular tags
    trackUserAction(req, 'admin_view_popular_tags', { count: popularTags.length });

    res.json({ tags: popularTags });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ============================================================================
// CHARTS ENDPOINTS
// ============================================================================

// Get daily stats for charts
exports.getDailyStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const formatDate = (date) => date.toISOString().split('T')[0];

    const [articles, likes, comments] = await Promise.all([
      Article.findAll({
        where: { createdAt: { [Op.gte]: startDate } },
        attributes: ['createdAt']
      }),
      Like.findAll({
        where: { createdAt: { [Op.gte]: startDate } },
        attributes: ['createdAt']
      }),
      Comment.findAll({
        where: { createdAt: { [Op.gte]: startDate } },
        attributes: ['createdAt']
      })
    ]);

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

    // ✅ Track that admin viewed daily stats
    trackUserAction(req, 'admin_view_daily_stats', { days });

    res.json({ dailyArticles, dailyLikes, dailyComments });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};