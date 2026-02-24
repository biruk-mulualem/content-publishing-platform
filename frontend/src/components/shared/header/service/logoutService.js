// services/logoutService.js
export const logoutUser = () => {
  // Clear ALL localStorage items
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
  
  window.location.href = '/';
};