import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/student/Home';
import MyRequests from './pages/student/MyRequests';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminEvents from './pages/admin/Events';
import AdminRequests from './pages/admin/Requests';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium text-sm">Loading Francis Xavier Portal...</p>
      </div>
    );
  }

  // Strictly open login page first if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/events" replace />;
}

export default function App() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isLoginPath = location.pathname === '/login';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Show navigation bar only for authenticated views (not on login page or admin sidebar layout) */}
      {!isAdminPath && !isLoginPath && <Navbar />}

      <div className="flex-1">
        <Routes>
          {/* Default entry point: opens login page first if unauthenticated */}
          <Route path="/" element={<RootRedirect />} />

          {/* Authentication Page */}
          <Route path="/login" element={<Login />} />

          {/* Student Flow (Protected: Login required to browse or register) */}
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-requests"
            element={
              <ProtectedRoute requiredRole="student">
                <MyRequests />
              </ProtectedRoute>
            }
          />

          {/* Admin Flow (Protected: Administrator only) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="requests" element={<AdminRequests />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </div>

      {/* Footer */}
      {!isAdminPath && !isLoginPath && (
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-700">
            Francis Xavier Engineering College (Autonomous), Tirunelveli
          </p>
          <p className="mt-1 text-slate-400">
            Campus Event Management System • React + Node.js + MySQL
          </p>
        </footer>
      )}
    </div>
  );
}
