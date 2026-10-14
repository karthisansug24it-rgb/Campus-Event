import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('fxec_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('fxec_token'));
  const [loading, setLoading] = useState(true);

  // Validate session on app launch
  useEffect(() => {
    async function verifyUser() {
      const savedToken = localStorage.getItem('fxec_token');
      if (!savedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data && res.data.success) {
          setUser(res.data.data.user);
          localStorage.setItem('fxec_user', JSON.stringify(res.data.data.user));
        }
      } catch (err) {
        console.warn('Session verification failed:', err.message);
        localStorage.removeItem('fxec_token');
        localStorage.removeItem('fxec_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    verifyUser();
  }, []);

  const login = async (email, password, role) => {
    const res = await api.post('/auth/login', { email, password, role });
    if (res.data && res.data.success) {
      const { token: newToken, user: userData } = res.data.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('fxec_token', newToken);
      localStorage.setItem('fxec_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const signup = async (payload) => {
    const res = await api.post('/auth/signup', payload);
    if (res.data && res.data.success) {
      const { token: newToken, user: userData } = res.data.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('fxec_token', newToken);
      localStorage.setItem('fxec_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('fxec_token');
    localStorage.removeItem('fxec_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
