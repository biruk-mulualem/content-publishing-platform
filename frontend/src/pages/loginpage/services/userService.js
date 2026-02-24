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
export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });

    // Save the token and user info to localStorage
    const { token, user } = response.data;

    // Save token and user data
    localStorage.setItem('token', token);
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userRole', user.role); // Save role

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

// Get current user role
export const getUserRole = () => {
  return localStorage.getItem('userRole');
};

// Check if current user is admin
export const isAdmin = () => {
  return localStorage.getItem('userRole') === 'admin';
};

// Optional: Log out function to remove the token
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole'); // Remove role
};

// Get all stored user info
export const getUserInfo = () => {
  return {
    token: localStorage.getItem('token'),
    userId: localStorage.getItem('userId'),
    userName: localStorage.getItem('userName'),
    userEmail: localStorage.getItem('userEmail'),
    userRole: localStorage.getItem('userRole')
  };
};