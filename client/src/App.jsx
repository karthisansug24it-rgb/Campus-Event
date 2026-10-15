import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';

// Student Layout & Pages
import StudentLayout from './components/student/StudentLayout';
import Login from './pages/Login';
import Home from './pages/student/Home';
import MyRequests from './pages/student/MyRequests';

// Admin components & pages
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminEvents from './pages/admin/Events';
import AdminRequests from './pages/admin/Requests';
import MobileAppBanner from './components/MobileAppBanner';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-white text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
            <MobileAppBanner />
            <Routes>
                {/* Student Portal Routes with Dedicated StudentLayout */}
                <Route element={<StudentLayout />}>
                  <Route path="/" element={<Navigate to="/events" replace />} />
                  <Route path="/events" element={<Home />} />
                  <Route
                    path="/my/requests"
                    element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <MyRequests />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/applied" element={<Navigate to="/my/requests" replace />} />
                </Route>

                <Route path="/login" element={<Login />} />

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
          </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
