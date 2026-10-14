import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-800">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shadow-soft-blue mb-4">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          </div>
        </div>
        <p className="text-xs font-mono text-blue-700 font-semibold uppercase tracking-wider">Verifying session credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If an authenticated user attempts to access a forbidden role route, send to their home
    return <Navigate to={user.role === 'admin' ? '/admin' : '/events'} replace />;
  }

  return children;
};

export default ProtectedRoute;
