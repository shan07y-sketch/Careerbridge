import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: ('student' | 'employer' | 'university' | 'admin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = ['student'] 
}) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md relative">
          <span className="material-symbols-outlined text-[32px] text-primary animate-spin">sync</span>
        </div>
        <p className="text-sm font-bold text-primary">Verifying Session credentials...</p>
      </div>
    );
  }

  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    if (!isAuthenticated || role !== 'admin') {
      // Redirect immediately to /login if not authenticated or not an admin
      return <Navigate to="/login" replace />;
    }
  } else {
    if (!isAuthenticated) {
      return <Navigate to="/auth?role=student" replace />;
    }

    if (role && !allowedRoles.includes(role)) {
      return <Navigate to="/403" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
