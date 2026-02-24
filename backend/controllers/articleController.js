
// Should be at the very top of your controller
const { Article, User, Like, Comment } = require('../models');
// Create Article
exports.createArticle = async (req, res) => {
  try {
    const { title, body, tags } = req.body;
    const authorId = req.user.userId;  // from JWT

    const newArticle = await Article.create({
      title,
      body,
      tags,
      authorId,
      published_status: 0,
    });

    res.status(201).json({
      message: 'Article created successfully',
      article: newArticle,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};




// Get Current User's Articles with author info
exports.getArticles = async (req, res) => {
  try {
    // Get the authenticated user's ID from the JWT token
    const userId = req.user.userId;
    
    const articles = await Article.findAll({
      where: {
        authorId: userId  // Only get articles belonging to the current user
      },
      include: {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email'],
      },
      order: [['createdAt', 'DESC']]
    });

    // Calculate totals for the author
    let totalLikes = 0;
    let totalComments = 0;

    const formattedArticles = articles.map(a => {
      const likes = a.likesCount || 0;
      const comments = a.commentsCount || 0;
      
      // Add to totals
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

    // Return both articles and author totals
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
    console.error('Error in getArticles:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Single Article (with ownership check)
// exports.getArticle = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user.userId; // Get from JWT for protected route
    
//     const article = await Article.findByPk(id, {
//       include: {
//         model: User,
//         as: 'author',
//         attributes: ['id', 'name', 'email'],
//       },
//     });

//     if (!article) {
//       return res.status(404).json({ error: 'Article not found' });
//     }

//     // Check if the article belongs to the current user
//     if (article.authorId !== userId) {
//       return res.status(403).json({ error: 'You do not have permission to view this article' });
//     }

//     const formattedArticle = {
//       id: article.id,
//       title: article.title,
//        createdAt: article.createdAt,
//       body: article.body,
//       tags: typeof article.tags === 'string' ? article.tags.split(',').map(t => t.trim()) : article.tags,
//       published_status: article.published_status,
//       authorId: article.authorId,
//       authorName: article.author ? article.author.name : 'Unknown',
//     };

//     res.status(200).json({ article: formattedArticle });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// };
// Get Single Article (with ownership check)
exports.getArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId; // Get from JWT for protected route
    
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

    // Check if the article belongs to the current user
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

    res.status(200).json({ article: formattedArticle });
  } catch (error) {
    console.error(error);
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
    if (!article) return res.status(404).json({ error: 'Article not found' });

    // Check if the article belongs to the current user
    if (article.authorId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to update this article' });
    }

    article.title = title || article.title;
    article.body = body || article.body;
    article.tags = tags || article.tags;

    await article.save();

    res.status(200).json({ message: 'Article updated successfully', article });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete Article (with ownership check)
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const article = await Article.findByPk(id);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    // Check if the article belongs to the current user
    if (article.authorId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this article' });
    }

    await article.destroy();

    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Publish/Unpublish Article (with ownership check)
exports.togglePublishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const article = await Article.findByPk(id);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    // Check if the article belongs to the current user
    if (article.authorId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to modify this article' });
    }

    article.published_status = article.published_status === 1 ? 0 : 1;
    await article.save();

    res.status(200).json({
      message: `Article ${article.published_status === 1 ? 'published' : 'unpublished'} successfully`,
      article,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};






// Get ALL published articles from ALL authors (PUBLIC endpoint - no auth needed)
exports.getPublishedArticles = async (req, res) => {
  try {
    // NO userId filter - get ALL published articles from ALL authors
    const articles = await Article.findAll({
      where: {
        published_status: 1  // Only get published articles
      },
      include: {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email'],
      },
      order: [['createdAt', 'DESC']] // Sort by newest first
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
    console.error('Error in getPublishedArticles:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get a SINGLE published article by ID (PUBLIC endpoint - no auth needed)
exports.getPublishedArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the article by ID and ensure it's published
    const article = await Article.findOne({
      where: {
        id: id,
        published_status: 1  // Only get if published
      },
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
    console.error('Error in getPublishedArticleById:', error);
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

    // Check if article exists and is published
    const article = await Article.findOne({
      where: {
        id: articleId,
        published_status: 1
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Published article not found' });
    }

    // Check if user already liked this article
    const existingLike = await Like.findOne({
      where: {
        articleId,
        sessionId
      }
    });

    if (existingLike) {
      // Unlike: remove the like
      await existingLike.destroy();
      
      // Update article likes count
      await article.decrement('likesCount');
      
      // Get updated like count
      const likesCount = await Like.count({ where: { articleId } });

      return res.status(200).json({
        liked: false,
        likesCount,
        message: 'Like removed successfully'
      });
    } else {
      // Like: create new like
      await Like.create({
        articleId,
        sessionId,
        ipAddress
      });

      // Update article likes count
      await article.increment('likesCount');

      // Get updated like count
      const likesCount = await Like.count({ where: { articleId } });

      return res.status(201).json({
        liked: true,
        likesCount,
        message: 'Like added successfully'
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get like status for current user (PUBLIC - no auth needed)
exports.getLikeStatus = async (req, res) => {
  try {
    const { articleId } = req.params;
    const sessionId = req.headers['x-session-id'] || req.sessionID || 'session-' + Date.now();

    const like = await Like.findOne({
      where: {
        articleId,
        sessionId
      }
    });

    const likesCount = await Like.count({ where: { articleId } });

    res.status(200).json({
      liked: !!like,
      likesCount
    });
  } catch (error) {
    console.error('Error getting like status:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get likes count for an article (PUBLIC - no auth needed)
exports.getLikesCount = async (req, res) => {
  try {
    const { articleId } = req.params;

    const likesCount = await Like.count({ where: { articleId } });

    res.status(200).json({
      likesCount
    });
  } catch (error) {
    console.error('Error getting likes count:', error);
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

    // Validation
    if (!name || !comment) {
      return res.status(400).json({ error: 'Name and comment are required' });
    }

    if (name.length > 100) {
      return res.status(400).json({ error: 'Name must be less than 100 characters' });
    }

    if (comment.length > 2000) {
      return res.status(400).json({ error: 'Comment must be less than 2000 characters' });
    }

    // Check if article exists and is published
    const article = await Article.findOne({
      where: {
        id: articleId,
        published_status: 1
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Published article not found' });
    }

    // Create comment
    const newComment = await Comment.create({
      articleId,
      name,
      comment,
      sessionId,
      ipAddress
    });

    // Update article comments count
    await article.increment('commentsCount');

    // Get updated comments count
    const commentsCount = await Comment.count({ where: { articleId } });

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
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all comments for an article (PUBLIC - no auth needed)
exports.getArticleComments = async (req, res) => {
  try {
    const { articleId } = req.params;

    // Check if article exists
    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const comments = await Comment.findAll({
      where: { articleId },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'comment', 'createdAt']
    });

    res.status(200).json({
      comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Server error' });
  }
};