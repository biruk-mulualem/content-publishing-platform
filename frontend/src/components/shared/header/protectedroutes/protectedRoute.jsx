// components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null,
  redirectTo = '/page/loginpage',
  fallback = <div className="loading-spinner">Loading...</div>
}) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      
      console.log('ProtectedRoute Check:', { 
        path: location.pathname,
        token: token ? 'exists' : 'missing',
        role,
        requiredRole
      });
      
      setIsAuthenticated(!!token);
      setUserRole(role);
      setIsChecking(false);
    };

    checkAuth();

    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [location.pathname, requiredRole]);

  if (isChecking) {
    return fallback;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  // 🔥 FIXED: Role-based access control
  if (requiredRole) {
    // Case 1: Admin-only route - only admins can access
    if (requiredRole === 'admin' && userRole !== 'admin') {
      // Author trying to access admin route - redirect to author dashboard
      return <Navigate to="/page/dashboard" replace />;
    }
    
    // Case 2: Author-only route - both authors and admins can access
    // (No redirect needed, admins have access to everything)
    
    // Case 3: Any other role requirement
    if (userRole !== requiredRole) {
      // Redirect to appropriate dashboard based on user's actual role
      if (userRole === 'admin') {
        return <Navigate to="/page/adminDashboard" replace />;
      }
      return <Navigate to="/page/dashboard" replace />;
    }
  }

  // All checks passed - render the protected component
  return children;
};

export default ProtectedRoute;