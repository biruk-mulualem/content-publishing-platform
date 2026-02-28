// components/PublicOnlyRoute.jsx
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';

const PublicOnlyRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  // 🔍 DEBUG LOG
  useEffect(() => {
  
  }, [token, userRole]);

  // If authenticated, redirect to appropriate dashboard
  if (token) {
    console.log('⛔ User already logged in - redirecting to', 
      userRole === 'admin' ? 'admin dashboard' : 'user dashboard'
    );
    
    if (userRole === 'admin') {
      return <Navigate to="/page/adminDashboard" replace />;
    }
    return <Navigate to="/page/dashboard" replace />;
  }

  // console.log('✅ No token - showing public page');
  return children;
};

export default PublicOnlyRoute;