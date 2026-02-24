// Import required packages
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables

// Function to generate JWT token
const generateToken = (user) => {
  // Destructure the user to extract only necessary data (e.g., user id, email)
  const { email } = user;

  // Sign the JWT token with the user's email and expiration time
  const accessToken = jwt.sign(
    { email: email }, // Payload (user's email, can add more info here)
    process.env.JWT_SECRET, // Secret key for signing
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN } // Expiration time from .env (e.g., '1h')
  );

  // Return the generated access token
  return accessToken;
};

// Example user object (for testing purposes)
const user = {
  email: 'john.doe@example.com',
};

// Generate the token for the example user
const token = generateToken(user);

console.log('Generated Access Token:', token);