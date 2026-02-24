// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateQuery } = require('../middleware/validationMiddleware');
const { adminSchemas } = require('../validators/schemas');

// All admin routes require authentication and admin role
router.use(authMiddleware());

// Admin check middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.use(isAdmin);

// Stats routes
router.get('/stats/articles', adminController.getArticleStats);
router.get('/stats/authors', adminController.getAuthorStats);
router.get('/stats/likes', adminController.getLikeStats);
router.get('/stats/comments', adminController.getCommentStats);
router.get('/stats/tags', adminController.getTagStats);

// Authors routes
router.get('/authors/top', 
  validateQuery(adminSchemas.limit),
  adminController.getTopAuthors
);

router.get('/authors', adminController.getAllAuthors);

// Activity routes
router.get('/activity/recent', 
  validateQuery(adminSchemas.limit),
  adminController.getRecentActivity
);

// Tags routes
router.get('/tags/popular', 
  validateQuery(adminSchemas.limit),
  adminController.getPopularTags
);

// Charts routes
router.get('/charts/daily', 
  validateQuery(adminSchemas.days),
  adminController.getDailyStats
);

module.exports = router;