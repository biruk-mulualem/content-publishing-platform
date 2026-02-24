const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const authenticateJWT = require('../middleware/authMiddleware');



// ==================== PUBLIC LIKE & COMMENT ROUTES (no auth needed) ====================
router.get('/public', articleController.getPublishedArticles);
router.get('/public/:id', articleController.getPublishedArticleById);
router.post('/public/:articleId/like', articleController.toggleLike);
router.get('/public/:articleId/like/status', articleController.getLikeStatus);
router.get('/public/:articleId/like/count', articleController.getLikesCount);
router.post('/public/:articleId/comments', articleController.createComment);
router.get('/public/:articleId/comments', articleController.getArticleComments);


// PROTECTED ROUTES - All require authentication
router.post('/create', authenticateJWT, articleController.createArticle);
router.get('/', authenticateJWT, articleController.getArticles);
router.get('/:id', authenticateJWT, articleController.getArticle);
router.put('/:id', authenticateJWT, articleController.updateArticle);
router.delete('/:id', authenticateJWT, articleController.deleteArticle);
router.patch('/:id/publish', authenticateJWT, articleController.togglePublishStatus);







module.exports = router;