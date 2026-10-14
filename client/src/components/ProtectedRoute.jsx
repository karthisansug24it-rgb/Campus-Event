import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-bg text-dark-text">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-dark-surface border border-cyan-500/30 flex items-center justify-center shadow-glow-cyan mb-4">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          </div>
        </div>
        <p className="text-xs font-mono text-cyan-400/80 uppercase tracking-wider">Verifying session credentials...</p>
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
