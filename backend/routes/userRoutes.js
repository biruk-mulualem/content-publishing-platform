// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, validateParams } = require('../middleware/validationMiddleware');
const { userSchemas } = require('../validators/schemas');

// Public routes with validation
router.post('/register', 
  validate(userSchemas.register), 
  userController.register
);

router.post('/login', 
  validate(userSchemas.login), 
  userController.login
);

// Protected routes
router.get('/authors', 
  authMiddleware(), 
  userController.getAuthors
);

router.get('/author/:id', 
  authMiddleware(), 
  validateParams(userSchemas.userId), 
  userController.getAuthor
);

module.exports = router;