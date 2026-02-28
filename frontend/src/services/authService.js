import api from './interceptor'; 

// ==================== AUTHENTICATION ====================

// Register a new user
export const registerUser = async (name, email, password) => {
  try {
    const response = await api.post('/users/register', { name, email, password });
    return response.data;
  } catch (error) {
    console.error('Error during registration:', error);
    throw error.response?.data || error.message;
  }
};

// Login an existing user
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/users/login', { email, password });

    // Save user data to localStorage
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userRole', user.role);

    return response.data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error.response?.data || error.message;
  }
};

// Log out user

export const logoutUser = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Try to call logout endpoint, but don't block on it
      // Use a timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/users/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        console.log('Logout API call successful');
      } catch (fetchError) {
        console.log('Logout API call failed (continuing with local cleanup):', fetchError.message);
      }
    }
  } catch (error) {
    console.log('Logout error:', error);
  } finally {
    // ALWAYS clear local storage regardless of API response
    localStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Clear cache if possible
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      } catch (e) {
        console.error('Cache clear error:', e);
      }
    }
    
    // Add a small delay to ensure everything is cleared
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Force a hard redirect to home page with cache busting
    window.location.href = '/?nocache=' + Date.now();
  }
};

// ==================== USER INFO ====================

// Check if user is logged in
export const isUserLoggedIn = () => {
  return !!localStorage.getItem('token');
};

// Get current user role
export const getUserRole = () => {
  return localStorage.getItem('userRole');
};

// Check if current user is admin
export const isAdmin = () => {
  return localStorage.getItem('userRole') === 'admin';
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

// Get user name (quick access)
export const getUserName = () => {
  return localStorage.getItem('userName');
};

// Get user email (quick access)
export const getUserEmail = () => {
  return localStorage.getItem('userEmail');
};

// Get user ID (quick access)
export const getUserId = () => {
  return localStorage.getItem('userId');
};