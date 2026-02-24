// backend/app.js
const logRoutes = require('./routes/logRoutes');



// backend/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const app = express();
const userRoutes = require('./routes/userRoutes');
const articleRoutes = require('./routes/articleRoutes');
const adminRoutes = require('./routes/adminRoutes');
const logger = require('./utils/logger');
const { 
  requestId, 
  requestMonitor, 
  trackError,
  systemHealth 
} = require('./middleware/monitoringHooks');

// Add request ID and monitoring
app.use(requestId);
app.use(requestMonitor);

// Use morgan for HTTP logging (integrated with winston)
app.use(morgan('combined', { stream: logger.stream }));

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/admin', adminRoutes);


// Add with other routes
app.use('/api/admin/logs', logRoutes);


// Health check endpoint
app.get('/health', (req, res) => {
  systemHealth();
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  trackError(err, req);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  logger.warn({
    type: '404',
    requestId: req.id,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  res.status(404).json({ error: 'Not found' });
});

// Run system health check every 5 minutes
setInterval(systemHealth, 300000);

module.exports = app;