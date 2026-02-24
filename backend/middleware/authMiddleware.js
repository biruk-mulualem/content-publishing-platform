// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT token
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];  // "Bearer <token>"

  if (!token) {
    return res.sendStatus(403); // Forbidden: No token provided
  }

  // Verify the token using the secret from environment variables
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden: Invalid or expired token
    }

    req.user = user; // This will contain the decoded JWT payload
    next(); // Proceed to the next middleware or route handler
  });
};

module.exports = authenticateJWT;