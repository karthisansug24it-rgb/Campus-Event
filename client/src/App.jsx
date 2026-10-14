import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Home from './pages/student/Home';
import MyRequests from './pages/student/MyRequests';

// Admin components & pages
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminEvents from './pages/admin/Events';
import AdminRequests from './pages/admin/Requests';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
            <Navbar />
            <div className="flex-1">
              <Routes>
                {/* Public & Student Routes */}
                <Route path="/" element={<Navigate to="/events" replace />} />
                <Route path="/events" element={<Home />} />
                <Route path="/login" element={<Login />} />

                {/* Protected Student Routes */}
                <Route
                  path="/my/requests"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <MyRequests />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="events" element={<AdminEvents />} />
                  <Route path="requests" element={<AdminRequests />} />
                </Route>

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/events" replace />} />
              </Routes>
            </div>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
