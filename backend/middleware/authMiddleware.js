// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Central middleware that handles both auth and optional role checking
const authMiddleware = (requiredRole = null) => {
  return (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      req.user = user;

      // If a specific role is required, check it
      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({ 
          error: `${requiredRole} access required` 
        });
      }

      next();
    });
  };
};

module.exports = authMiddleware;