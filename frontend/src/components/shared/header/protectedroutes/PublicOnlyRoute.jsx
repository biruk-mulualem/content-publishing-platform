// components/PublicOnlyRoute.jsx
import { Navigate } from 'react-router-dom';

const PublicOnlyRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  // If authenticated, redirect to appropriate dashboard
  if (token) {
    if (userRole === 'admin') {
      return <Navigate to="/page/adminDashboard" replace />;
    }
    return <Navigate to="/page/dashboard" replace />;
  }

  // Not authenticated - show public page
  return children;
};

export default PublicOnlyRoute;