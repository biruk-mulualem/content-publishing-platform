// backend/routes/logRoutes.js
const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const authMiddleware = require('../middleware/authMiddleware');

// ============================================================================
// 🏥 PUBLIC ROUTE - NO AUTH NEEDED
// ============================================================================
router.get('/health', logController.getSystemHealth);  // ← ADD THIS LINE!

// ============================================================================
// ADMIN ROUTES - require authentication
// ============================================================================
router.use(authMiddleware('admin'));

// 📋 Log routes (admin only)
router.get('/', logController.getLogs);              // GET /api/admin/logs
router.get('/stats', logController.getLogStats);     // GET /api/admin/logs/stats
router.delete('/', logController.clearLogs);         // DELETE /api/admin/logs

// 🏥 Detailed health routes (admin only)
router.get('/health/detailed', logController.getDetailedSystemHealth);
router.get('/health/history', logController.getHealthHistory);

module.exports = router;