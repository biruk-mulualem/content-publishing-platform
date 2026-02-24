import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users'; // Adjust if your backend is hosted somewhere else

// Register a new user
export const registerUser = async (name, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/register`, { name, email, password });
    return response.data;
  } catch (error) {
    console.error('Error during registration:', error);
    throw error.response?.data || error.message;
  }
};

// Login an existing user and get the JWT token
// Login an existing user and get the JWT token
export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });

    // Save the token and userId to localStorage
    const { token, user } = response.data;

    // Save token and userId
    localStorage.setItem('token', token); // Store token in localStorage
    localStorage.setItem('userId', user.id); // Store userId in localStorage

    return response.data; // Return the token and user data
  } catch (error) {
    console.error('Error during login:', error);
    throw error.response?.data || error.message;
  }
};

// Optional: Utility function to check if the user is logged in by checking the token
export const isUserLoggedIn = () => {
  return !!localStorage.getItem('token'); // Returns true if token exists in localStorage
};

// Optional: Log out function to remove the token
export const logoutUser = () => {
  localStorage.removeItem('token'); // Remove the token from localStorage
};