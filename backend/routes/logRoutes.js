// backend/routes/logRoutes.js
const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const authMiddleware = require('../middleware/authMiddleware');

// All log routes require admin access
router.use(authMiddleware('admin'));

router.get('/', logController.getLogs);
router.get('/stats', logController.getLogStats);
router.delete('/clear', logController.clearLogs);

module.exports = router;