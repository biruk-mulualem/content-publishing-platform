// src/services/interceptor.js - Simplified version
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const baseURL = API_URL || 'https://content-publishing-backend-latest.onrender.com/api';

const api = axios.create({
  baseURL: baseURL,
  timeout: 30000,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

// ==================== REQUEST INTERCEPTOR ====================
api.interceptors.request.use(
  (config) => {
    // DON'T add cache-busting parameters automatically
    // Let the backend handle caching headers instead

    // Add auth token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add session ID for public endpoints
    if (config.url.includes('/public/')) {
      let sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('sessionId', sessionId);
      }
      config.headers['x-session-id'] = sessionId;
    }

    config.headers['Content-Type'] = 'application/json';

    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== RESPONSE INTERCEPTOR ====================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Special handling for logout endpoint - don't show errors
    if (error.config?.url === '/users/logout') {
      console.log('Logout endpoint response (ignoring error)');
      return Promise.resolve({ data: { success: true } });
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      
      // Use the correct login page path with cache busting
      if (!window.location.pathname.includes('/page/loginpage')) {
        window.location.href = '/page/loginpage?t=' + Date.now();
      }
    }
    
    // Handle 400 Bad Request - log the error details
    if (error.response?.status === 400) {
      console.error('Bad Request Details:', {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        data: error.response?.data
      });
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      window.location.href = '/unauthorized';
    }

    return Promise.reject(error);
  }
);

export default api;