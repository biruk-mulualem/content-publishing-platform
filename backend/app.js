// app.js
const express = require('express');
const cors = require('cors');  // Import CORS
const app = express();
const userRoutes = require('./routes/userRoutes');  // Import user routes
const articleRoutes=require('./routes/articleRoutes');
// Enable CORS for all origins (you can restrict it to specific origins if needed)
app.use(cors());  // Allow all origins

// Middleware to parse JSON request bodies
app.use(express.json());

// Use user routes for handling requests starting with /api/users
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);  // Article routes

// Error handling for 404 routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports = app;