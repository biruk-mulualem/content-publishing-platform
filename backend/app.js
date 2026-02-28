// backend/app.js
const express = require('express');
const cors = require('cors');
const app = express();

// Import routes
const userRoutes = require('./routes/userRoutes');
const articleRoutes = require('./routes/articleRoutes');
const adminRoutes = require('./routes/adminRoutes');
const logRoutes = require('./routes/logRoutes');

// Import monitoring hooks
const { 
  requestId, 
  requestMonitor, 
  trackError
} = require('./middleware/monitoringHooks');

// Import logController for systemHealth
const logController = require('./controllers/logController');

// ============================================================================
// GLOBAL MIDDLEWARE
// ============================================================================
app.use(requestId);
app.use(requestMonitor);
app.use(cors());
app.use(express.json());

// ============================================================================
// ROUTES
// ============================================================================
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/logs', logRoutes);

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================
app.use((err, req, res, next) => {
  trackError(err, req);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ============================================================================
// 404 HANDLER
// ============================================================================
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ============================================================================
// PERIODIC HEALTH CHECKS (every 5 minutes)
// ============================================================================
setInterval(() => {
  logController.runHealthCheck(); // ✅ Use the new internal function
}, 300000);

module.exports = app;