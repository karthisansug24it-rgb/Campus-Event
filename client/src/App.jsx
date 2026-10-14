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

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/events" replace />;
}

export default function App() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Show public/student navbar when not on admin dashboard layout */}
      {!isAdminPath && <Navbar />}

      <div className="flex-1">
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />

          {/* Student Flow */}
          <Route path="/events" element={<Home />} />
          <Route
            path="/my-requests"
            element={
              <ProtectedRoute requiredRole="student">
                <MyRequests />
              </ProtectedRoute>
            }
          />

          {/* Admin Flow */}
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
          <Route path="*" element={<Navigate to="/events" replace />} />
        </Routes>
      </div>

      {/* Footer */}
      {!isAdminPath && (
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
