// Should be at the very top of your controller
const { Article, User, Like, Comment } = require('../models');
const logger = require('../utils/logger');
const MonitoringService = require('../services/monitoringService');
const { trackUserAction, trackError } = require('../middleware/monitoringHooks');

// Create Article
exports.createArticle = async (req, res) => {
  try {
    const { title, body, tags } = req.body;
    const authorId = req.user.userId;

    const startTime = Date.now();
    const newArticle = await Article.create({
      title,
      body,
      tags,
      authorId,
      published_status: 0,
    });
    const duration = Date.now() - startTime;

    // Track article creation
    logger.info({
      type: 'article_created',
      userId: authorId,
      articleId: newArticle.id,
      title,
      tags,
      duration: `${duration}ms`
    });

    MonitoringService.trackArticle(req, 'create', newArticle);
    trackUserAction(req, 'create_article', { 
      articleId: newArticle.id, 
      title 
    });

    res.status(201).json({
      message: 'Article created successfully',
      article: newArticle,
    });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'article_creation_error',
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Current User's Articles with author info
exports.getArticles = async (req, res) => {
  try {
    const userId = req.user.userId;
    const startTime = Date.now();
    
    const articles = await Article.findAll({
      where: { authorId: userId },
      include: {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email'],
      },
      order: [['createdAt', 'DESC']]
    });

    const duration = Date.now() - startTime;

    // Log database performance
    logger.debug({
      type: 'database_query',
      operation: 'findAll',
      model: 'Article',
      userId,
      articleCount: articles.length,
      duration: `${duration}ms`
    });

    let totalLikes = 0;
    let totalComments = 0;

    const formattedArticles = articles.map(a => {
      const likes = a.likesCount || 0;
      const comments = a.commentsCount || 0;
      
      totalLikes += likes;
      totalComments += comments;

      return {
        id: a.id,
        title: a.title,
        body: a.body,
        createdAt: a.createdAt,
        tags: typeof a.tags === 'string' ? a.tags.split(',').map(t => t.trim()) : a.tags,
        published_status: a.published_status,
        authorId: a.authorId,
        authorName: a.author ? a.author.name : 'Unknown',
        likesCount: likes,
        commentsCount: comments
      };
    });

    // Track view action
    trackUserAction(req, 'view_articles', { count: articles.length });

    res.status(200).json({ 
      articles: formattedArticles,
      authorTotals: {
        totalLikes,
        totalComments,
        totalArticles: articles.length,
        publishedCount: articles.filter(a => a.published_status === 1).length,
        draftCount: articles.filter(a => a.published_status === 0).length
      }
    });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'get_articles_error',
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Single Article (with ownership check)
exports.getArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const startTime = Date.now();
    
    const article = await Article.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id', 'name', 'comment', 'createdAt'],
          order: [['createdAt', 'DESC']],
          limit: 20
        }
      ]
    });

    const duration = Date.now() - startTime;

    if (!article) {
      logger.warn({
        type: 'article_not_found',
        articleId: id,
        userId
      });
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check ownership
    if (article.authorId !== userId) {
      logger.warn({
        type: 'unauthorized_access',
        userId,
        articleId: id,
        action: 'view_article'
      });
      return res.status(403).json({ error: 'You do not have permission to view this article' });
    }

    // Get likes count
    const likesCount = await Like.count({ where: { articleId: id } });

    // Log database performance
    logger.debug({
      type: 'database_query',
      operation: 'getArticle',
      articleId: id,
      duration: `${duration}ms`,
      hasComments: article.comments?.length > 0
    });

    const formattedArticle = {
      id: article.id,
      title: article.title,
      createdAt: article.createdAt,
      body: article.body,
      tags: typeof article.tags === 'string' ? article.tags.split(',').map(t => t.trim()) : article.tags,
      published_status: article.published_status,
      authorId: article.authorId,
      authorName: article.author ? article.author.name : 'Unknown',
      likesCount: likesCount,
      commentsCount: article.commentsCount || 0,
      comments: article.comments || []
    };

    // Track view action
    trackUserAction(req, 'view_article', { articleId: id, title: article.title });

    res.status(200).json({ article: formattedArticle });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'get_article_error',
      error: error.message,
      stack: error.stack,
      articleId: req.params.id,
      userId: req.user?.userId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Update Article (with ownership check)
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, tags } = req.body;
    const userId = req.user.userId;

    const article = await Article.findByPk(id);
    if (!article) {
      logger.warn({
        type: 'article_not_found',
        articleId: id,
        userId,
        action: 'update'
      });
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.authorId !== userId) {
      logger.warn({
        type: 'unauthorized_access',
        userId,
        articleId: id,
        action: 'update_article'
      });
      return res.status(403).json({ error: 'You do not have permission to update this article' });
    }

    const changes = {};
    if (title && title !== article.title) changes.title = { from: article.title, to: title };
    if (body && body !== article.body) changes.body = { from: article.body.length, to: body.length };
    if (tags && tags !== article.tags) changes.tags = { from: article.tags, to: tags };

    article.title = title || article.title;
    article.body = body || article.body;
    article.tags = tags || article.tags;

    await article.save();

    // Track update
    logger.info({
      type: 'article_updated',
      userId,
      articleId: id,
      changes: Object.keys(changes).length > 0 ? changes : 'no_changes'
    });

    MonitoringService.trackArticle(req, 'update', article);
    trackUserAction(req, 'update_article', { articleId: id, changes: Object.keys(changes) });

    res.status(200).json({ message: 'Article updated successfully', article });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'update_article_error',
      error: error.message,
      stack: error.stack,
      articleId: req.params.id,
      userId: req.user?.userId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete Article (with ownership check)
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const article = await Article.findByPk(id);
    if (!article) {
      logger.warn({
        type: 'article_not_found',
        articleId: id,
        userId,
        action: 'delete'
      });
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.authorId !== userId) {
      logger.warn({
        type: 'unauthorized_access',
        userId,
        articleId: id,
        action: 'delete_article'
      });
      return res.status(403).json({ error: 'You do not have permission to delete this article' });
    }

    const title = article.title;
    await article.destroy();

    // Track deletion
    logger.info({
      type: 'article_deleted',
      userId,
      articleId: id,
      title
    });

    MonitoringService.trackArticle(req, 'delete', { id, title });
    trackUserAction(req, 'delete_article', { articleId: id, title });

    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'delete_article_error',
      error: error.message,
      stack: error.stack,
      articleId: req.params.id,
      userId: req.user?.userId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Publish/Unpublish Article (with ownership check)
exports.togglePublishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const article = await Article.findByPk(id);
    if (!article) {
      logger.warn({
        type: 'article_not_found',
        articleId: id,
        userId,
        action: 'toggle_publish'
      });
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.authorId !== userId) {
      logger.warn({
        type: 'unauthorized_access',
        userId,
        articleId: id,
        action: 'toggle_publish'
      });
      return res.status(403).json({ error: 'You do not have permission to modify this article' });
    }

    const oldStatus = article.published_status;
    article.published_status = article.published_status === 1 ? 0 : 1;
    await article.save();

    // Track publish/unpublish
    logger.info({
      type: 'article_publish_toggled',
      userId,
      articleId: id,
      title: article.title,
      oldStatus: oldStatus === 1 ? 'published' : 'draft',
      newStatus: article.published_status === 1 ? 'published' : 'draft'
    });

    MonitoringService.trackArticle(req, 
      article.published_status ? 'publish' : 'unpublish', 
      article
    );
    trackUserAction(req, 'toggle_publish', { 
      articleId: id, 
      newStatus: article.published_status ? 'published' : 'draft' 
    });

    res.status(200).json({
      message: `Article ${article.published_status === 1 ? 'published' : 'unpublished'} successfully`,
      article,
    });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'toggle_publish_error',
      error: error.message,
      stack: error.stack,
      articleId: req.params.id,
      userId: req.user?.userId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get ALL published articles from ALL authors (PUBLIC endpoint - no auth needed)
exports.getPublishedArticles = async (req, res) => {
  try {
    const startTime = Date.now();
    
    const articles = await Article.findAll({
      where: { published_status: 1 },
      include: {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email'],
      },
      order: [['createdAt', 'DESC']]
    });

    const duration = Date.now() - startTime;

    // Log public access
    logger.debug({
      type: 'public_articles_fetched',
      count: articles.length,
      duration: `${duration}ms`,
      ip: req.ip
    });

    const formattedArticles = articles.map(a => ({
      id: a.id,
      title: a.title,
      body: a.body,
      createdAt: a.createdAt,
      tags: typeof a.tags === 'string' ? a.tags.split(',').map(t => t.trim()) : a.tags,
      published_status: a.published_status,
      authorId: a.authorId,
      authorName: a.author ? a.author.name : 'Unknown',
    }));

    res.status(200).json({ articles: formattedArticles });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'get_published_articles_error',
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get a SINGLE published article by ID (PUBLIC endpoint - no auth needed)
exports.getPublishedArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    const startTime = Date.now();
    
    const article = await Article.findOne({
      where: { id, published_status: 1 },
      include: {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email'],
      }
    });

    const duration = Date.now() - startTime;

    if (!article) {
      logger.warn({
        type: 'published_article_not_found',
        articleId: id,
        ip: req.ip
      });
      return res.status(404).json({ error: 'Published article not found' });
    }

    // Log public view
    logger.info({
      type: 'public_article_viewed',
      articleId: id,
      title: article.title,
      authorId: article.authorId,
      duration: `${duration}ms`,
      ip: req.ip
    });

    const formattedArticle = {
      id: article.id,
      title: article.title,
      body: article.body,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      tags: typeof article.tags === 'string' ? article.tags.split(',').map(t => t.trim()) : article.tags,
      published_status: article.published_status,
      authorId: article.authorId,
      authorName: article.author ? article.author.name : 'Unknown',
      authorEmail: article.author ? article.author.email : null,
    };

    res.status(200).json({ article: formattedArticle });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'get_published_article_error',
      error: error.message,
      stack: error.stack,
      articleId: req.params.id
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== LIKE ENDPOINTS ====================

// Toggle like on an article (PUBLIC - no auth needed)
exports.toggleLike = async (req, res) => {
  try {
    const { articleId } = req.params;
    const sessionId = req.headers['x-session-id'] || req.sessionID || 'session-' + Date.now();
    const ipAddress = req.ip || req.connection.remoteAddress;

    const article = await Article.findOne({
      where: { id: articleId, published_status: 1 }
    });

    if (!article) {
      logger.warn({
        type: 'like_failed',
        articleId,
        reason: 'article_not_found',
        sessionId,
        ip: ipAddress
      });
      return res.status(404).json({ error: 'Published article not found' });
    }

    const existingLike = await Like.findOne({
      where: { articleId, sessionId }
    });

    if (existingLike) {
      await existingLike.destroy();
      await article.decrement('likesCount');
      const likesCount = await Like.count({ where: { articleId } });

      // Track unlike
      logger.info({
        type: 'unlike',
        articleId,
        sessionId,
        ip: ipAddress,
        newCount: likesCount
      });

      return res.status(200).json({
        liked: false,
        likesCount,
        message: 'Like removed successfully'
      });
    } else {
      await Like.create({ articleId, sessionId, ipAddress });
      await article.increment('likesCount');
      const likesCount = await Like.count({ where: { articleId } });

      // Track like
      logger.info({
        type: 'like',
        articleId,
        sessionId,
        ip: ipAddress,
        newCount: likesCount
      });

      return res.status(201).json({
        liked: true,
        likesCount,
        message: 'Like added successfully'
      });
    }
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'toggle_like_error',
      error: error.message,
      stack: error.stack,
      articleId: req.params.articleId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get like status for current user (PUBLIC - no auth needed)
exports.getLikeStatus = async (req, res) => {
  try {
    const { articleId } = req.params;
    const sessionId = req.headers['x-session-id'] || req.sessionID || 'session-' + Date.now();

    const like = await Like.findOne({ where: { articleId, sessionId } });
    const likesCount = await Like.count({ where: { articleId } });

    res.status(200).json({
      liked: !!like,
      likesCount
    });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'get_like_status_error',
      error: error.message,
      stack: error.stack,
      articleId: req.params.articleId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get likes count for an article (PUBLIC - no auth needed)
exports.getLikesCount = async (req, res) => {
  try {
    const { articleId } = req.params;
    const likesCount = await Like.count({ where: { articleId } });

    res.status(200).json({ likesCount });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'get_likes_count_error',
      error: error.message,
      stack: error.stack,
      articleId: req.params.articleId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== COMMENT ENDPOINTS ====================

// Create a new comment (PUBLIC - no auth needed)
exports.createComment = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { name, comment } = req.body;
    const sessionId = req.headers['x-session-id'] || req.sessionID || 'session-' + Date.now();
    const ipAddress = req.ip || req.connection.remoteAddress;

    const article = await Article.findOne({
      where: { id: articleId, published_status: 1 }
    });

    if (!article) {
      logger.warn({
        type: 'comment_failed',
        articleId,
        reason: 'article_not_found',
        sessionId,
        ip: ipAddress
      });
      return res.status(404).json({ error: 'Published article not found' });
    }

    const newComment = await Comment.create({
      articleId,
      name,
      comment,
      sessionId,
      ipAddress
    });

    await article.increment('commentsCount');
    const commentsCount = await Comment.count({ where: { articleId } });

    // Track comment
    logger.info({
      type: 'comment_created',
      articleId,
      commentId: newComment.id,
      name,
      commentLength: comment.length,
      sessionId,
      ip: ipAddress,
      newCount: commentsCount
    });

    MonitoringService.trackComment(req, 'create', newComment);

    res.status(201).json({
      message: 'Comment added successfully',
      comment: {
        id: newComment.id,
        name: newComment.name,
        comment: newComment.comment,
        createdAt: newComment.createdAt
      },
      commentsCount
    });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'create_comment_error',
      error: error.message,
      stack: error.stack,
      articleId: req.params.articleId
    });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all comments for an article (PUBLIC - no auth needed)
exports.getArticleComments = async (req, res) => {
  try {
    const { articleId } = req.params;
    const startTime = Date.now();

    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const comments = await Comment.findAll({
      where: { articleId },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'comment', 'createdAt']
    });

    const duration = Date.now() - startTime;

    // Log comments fetch
    logger.debug({
      type: 'comments_fetched',
      articleId,
      count: comments.length,
      duration: `${duration}ms`
    });

    res.status(200).json({ comments });
  } catch (error) {
    trackError(error, req);
    logger.error({
      type: 'get_comments_error',
      error: error.message,
      stack: error.stack,
      articleId: req.params.articleId
    });
    res.status(500).json({ error: 'Server error' });
  }
};