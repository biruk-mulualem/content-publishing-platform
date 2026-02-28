// backend/controllers/articleController.js
const { Article, User, Like, Comment } = require('../models');
const { trackUserAction } = require('../middleware/monitoringHooks');

// ============================================================================
// ARTICLE CRUD OPERATIONS
// ============================================================================

// Create Article
exports.createArticle = async (req, res) => {
  try {
    const { title, body, tags } = req.body;
    const authorId = req.user.userId;

    const newArticle = await Article.create({
      title,
      body,
      tags,
      authorId,
      published_status: 0,
    });

    // ✅ Track article creation (important business event)
    trackUserAction(req, 'create_article', { 
      articleId: newArticle.id, 
      title 
    });

    res.status(201).json({
      message: 'Article created successfully',
      article: newArticle,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Current User's Articles
exports.getArticles = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const articles = await Article.findAll({
      where: { authorId: userId },
      include: {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email'],
      },
      order: [['createdAt', 'DESC']]
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

    // ✅ Track that user viewed their articles
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
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Single Article
exports.getArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
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

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check ownership
    if (article.authorId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to view this article' });
    }

    // Get likes count
    const likesCount = await Like.count({ where: { articleId: id } });

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

    // ✅ Track that user viewed a specific article
    trackUserAction(req, 'view_article', { articleId: id, title: article.title });

    res.status(200).json({ article: formattedArticle });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update Article
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, tags } = req.body;
    const userId = req.user.userId;

    const article = await Article.findByPk(id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.authorId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to update this article' });
    }

    const changes = {};
    if (title && title !== article.title) changes.title = { from: article.title, to: title };
    if (body && body !== article.body) changes.body = { from: article.body.length, to: body.length };
    if (tags && tags !== article.tags) changes.tags = { from: article.tags, to: tags };

    await article.update({ title, body, tags });

    // ✅ Track article update
    trackUserAction(req, 'update_article', { 
      articleId: id, 
      changes: Object.keys(changes) 
    });

    res.status(200).json({ message: 'Article updated successfully', article });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete Article
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const article = await Article.findByPk(id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.authorId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this article' });
    }

    const title = article.title;
    await article.destroy();

    // ✅ Track article deletion
    trackUserAction(req, 'delete_article', { articleId: id, title });

    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Publish/Unpublish Article
exports.togglePublishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const article = await Article.findByPk(id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.authorId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to modify this article' });
    }

    const oldStatus = article.published_status;
    const newStatus = article.published_status === 1 ? 0 : 1;
    
    await article.update({ published_status: newStatus });

    // ✅ Track publish/unpublish
    trackUserAction(req, 'toggle_publish', { 
      articleId: id, 
      newStatus: newStatus === 1 ? 'published' : 'draft' 
    });

    res.status(200).json({
      message: `Article ${newStatus === 1 ? 'published' : 'unpublished'} successfully`,
      article,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ============================================================================
// PUBLIC ENDPOINTS (No Auth Required)
// ============================================================================

// Get ALL published articles
exports.getPublishedArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({
      where: { published_status: 1 },
      include: {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email'],
      },
      order: [['createdAt', 'DESC']]
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
    res.status(500).json({ error: 'Server error' });
  }
};

// Get a SINGLE published article by ID
exports.getPublishedArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findOne({
      where: { id, published_status: 1 },
      include: {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email'],
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Published article not found' });
    }

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
    res.status(500).json({ error: 'Server error' });
  }
};

// ============================================================================
// LIKE ENDPOINTS
// ============================================================================

// Toggle like on an article
exports.toggleLike = async (req, res) => {
  try {
    const { articleId } = req.params;
    const sessionId = req.headers['x-session-id'] || 'session-' + Date.now();
    const ipAddress = req.ip;

    const article = await Article.findOne({
      where: { id: articleId, published_status: 1 }
    });

    if (!article) {
      return res.status(404).json({ error: 'Published article not found' });
    }

    const existingLike = await Like.findOne({
      where: { articleId, sessionId }
    });

    let liked;
    if (existingLike) {
      await existingLike.destroy();
      await article.decrement('likesCount');
      liked = false;
    } else {
      await Like.create({ articleId, sessionId, ipAddress });
      await article.increment('likesCount');
      liked = true;
    }

    const likesCount = await Like.count({ where: { articleId } });

    // ✅ Track like/unlike
    trackUserAction(req, liked ? 'like_article' : 'unlike_article', { 
      articleId, 
      sessionId 
    });

    res.status(200).json({
      liked,
      likesCount,
      message: liked ? 'Like added successfully' : 'Like removed successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get like status
exports.getLikeStatus = async (req, res) => {
  try {
    const { articleId } = req.params;
    const sessionId = req.headers['x-session-id'] || 'session-' + Date.now();

    const like = await Like.findOne({ where: { articleId, sessionId } });
    const likesCount = await Like.count({ where: { articleId } });

    res.status(200).json({
      liked: !!like,
      likesCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get likes count
exports.getLikesCount = async (req, res) => {
  try {
    const { articleId } = req.params;
    const likesCount = await Like.count({ where: { articleId } });

    res.status(200).json({ likesCount });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ============================================================================
// COMMENT ENDPOINTS
// ============================================================================

// Create a new comment
exports.createComment = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { name, comment } = req.body;
    const sessionId = req.headers['x-session-id'] || 'session-' + Date.now();
    const ipAddress = req.ip;

    const article = await Article.findOne({
      where: { id: articleId, published_status: 1 }
    });

    if (!article) {
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

    // ✅ Track comment creation
    trackUserAction(req, 'create_comment', { 
      articleId, 
      commentId: newComment.id 
    });

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
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all comments for an article
exports.getArticleComments = async (req, res) => {
  try {
    const { articleId } = req.params;

    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const comments = await Comment.findAll({
      where: { articleId },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'comment', 'createdAt']
    });

    res.status(200).json({ comments });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};