const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateJWT = require('../middleware/authMiddleware');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/authors', authenticateJWT, userController.getAuthors); // all authors
router.get('/author/:id', authenticateJWT, userController.getAuthor); // single author by ID

module.exports = router;