import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { parseCollegeEmail } from '../utils/collegeEmailParser';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Sync current user profile from backend on app mount
  const refreshProfile = useCallback(async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Demo/offline session token check
    if (savedToken.startsWith('fxec_demo_token_')) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.data?.user) {
        setUser(res.data.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.data.user));
      }
    } catch (err) {
      console.warn('Failed to refresh profile:', err?.response?.data?.message || err.message);
      // If token expired or invalid (401), clear state
      if (err?.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Login handler
  const login = async (email, password, role) => {
    try {
      const res = await api.post('/auth/login', { email, password, role });
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser } = res.data.data;
        localStorage.setItem('token', receivedToken);
        localStorage.setItem('user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
        return res.data;
      }
      throw new Error(res.data.message || 'Login failed');
    } catch (err) {
      // Re-throw so caller can examine response status
      throw err;
    }
  };

  // Demo / Offline Evaluation Login Fallback
  const loginDemo = (email, role = 'student') => {
    const parsed = parseCollegeEmail(email);
    const demoUser = {
      id: role === 'admin' ? 901 : 101,
      name: parsed.name || (role === 'admin' ? 'Faculty Administrator' : 'Student Scholar'),
      email: email.trim().toLowerCase(),
      role: role === 'admin' ? 'admin' : 'student',
      department: parsed.departmentName || 'Information Technology',
      departmentCode: parsed.departmentCode || 'it',
      yearOfStudy: parsed.yearOfStudy || 3,
      yearOfStudyRoman: parsed.yearOfStudyRoman || 'III Year',
      total_points: role === 'admin' ? 0 : 85,
      isDemoSession: true
    };
    const demoToken = `fxec_demo_token_${Date.now()}`;
    localStorage.setItem('token', demoToken);
    localStorage.setItem('user', JSON.stringify(demoUser));
    setToken(demoToken);
    setUser(demoUser);
    return { success: true, data: { user: demoUser, token: demoToken } };
  };

  // Student Signup handler
  const signup = async (payload) => {
    const res = await api.post('/auth/signup', payload);
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data.data;
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return res.data;
    }
    throw new Error(res.data.message || 'Signup failed');
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Parse email preview utility with client fallback
  const parseEmail = async (email) => {
    try {
      const res = await api.post('/auth/parse-email', { email });
      if (res.data?.success) {
        return res.data;
      }
    } catch {
      // Backend not reached or returned 404 - use instant client-side parser
    }

    const clientParsed = parseCollegeEmail(email);
    if (clientParsed.valid) {
      return { success: true, data: clientParsed };
    }
    throw new Error(clientParsed.error || 'Invalid college email format.');
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    login,
    loginDemo,
    signup,
    logout,
    refreshProfile,
    parseEmail
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
