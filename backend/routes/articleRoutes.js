// backend/routes/articleRoutes.js
const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, validateParams, validateQuery } = require('../middleware/validationMiddleware');
const { articleSchemas, commentSchemas, likeSchemas, querySchemas } = require('../validators/schemas');

// ==================== PUBLIC ROUTES ====================

// Get all published articles
router.get('/public', 
  validateQuery(querySchemas.pagination),
  articleController.getPublishedArticles
);

// Get single published article
router.get('/public/:id',
  validateParams(articleSchemas.articleId),
  articleController.getPublishedArticleById
);

// Like routes
router.post('/public/:articleId/like',
  validateParams(likeSchemas.articleId),
  articleController.toggleLike
);

router.get('/public/:articleId/like/status',
  validateParams(likeSchemas.articleId),
  articleController.getLikeStatus
);

router.get('/public/:articleId/like/count',
  validateParams(likeSchemas.articleId),
  articleController.getLikesCount
);

// Comment routes
router.post('/public/:articleId/comments',
  validateParams(likeSchemas.articleId),
  validate(commentSchemas.create),
  articleController.createComment
);

router.get('/public/:articleId/comments',
  validateParams(likeSchemas.articleId),
  validateQuery(querySchemas.pagination),
  articleController.getArticleComments
);

// ==================== PROTECTED ROUTES ====================

// Create article
router.post('/create',
  authMiddleware(),
  validate(articleSchemas.create),
  articleController.createArticle
);

// Get user's articles
router.get('/',
  authMiddleware(),
  validateQuery(querySchemas.pagination),
  articleController.getArticles
);

// Get single article
router.get('/:id',
  authMiddleware(),
  validateParams(articleSchemas.articleId),
  articleController.getArticle
);

// Update article
router.put('/:id',
  authMiddleware(),
  validateParams(articleSchemas.articleId),
  validate(articleSchemas.update),
  articleController.updateArticle
);

// Delete article
router.delete('/:id',
  authMiddleware(),
  validateParams(articleSchemas.articleId),
  articleController.deleteArticle
);

// Toggle publish status
router.patch('/:id/publish',
  authMiddleware(),
  validateParams(articleSchemas.articleId),
  articleController.togglePublishStatus
);

module.exports = router;