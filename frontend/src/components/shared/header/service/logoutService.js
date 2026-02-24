// logoutService.js

// Function to log out the user
export const logoutUser = () => {
  // Clear the authentication token from localStorage (or sessionStorage)
  localStorage.removeItem('authToken'); // For JWT in localStorage
  window.location.href = "/";  // Redirect to the login page after logout
};