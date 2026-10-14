import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const ACCOUNTS_STORAGE_KEY = 'fxec_saved_accounts';
const ACTIVE_EMAIL_KEY = 'fxec_active_email';

function getStoredAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Error reading stored accounts:', err);
  }

  // Fallback migration from single user storage
  const legacyToken = localStorage.getItem('fxec_token');
  const legacyUser = localStorage.getItem('fxec_user');
  if (legacyToken && legacyUser) {
    try {
      const userObj = JSON.parse(legacyUser);
      return [{ user: userObj, token: legacyToken, lastActive: Date.now() }];
    } catch {}
  }
  return [];
}

export function AuthProvider({ children }) {
  const [accounts, setAccounts] = useState(getStoredAccounts);
  const [activeEmail, setActiveEmail] = useState(() => localStorage.getItem(ACTIVE_EMAIL_KEY) || '');
  const [loading, setLoading] = useState(true);

  // Determine current active account
  const activeAccount = accounts.find((a) => a.user?.email?.toLowerCase() === activeEmail?.toLowerCase()) || accounts[0] || null;
  const user = activeAccount?.user || null;
  const token = activeAccount?.token || null;

  // Keep single-user localStorage keys synced for Axios interceptor
  useEffect(() => {
    if (token && user) {
      localStorage.setItem('fxec_token', token);
      localStorage.setItem('fxec_user', JSON.stringify(user));
      localStorage.setItem(ACTIVE_EMAIL_KEY, user.email);
    } else {
      localStorage.removeItem('fxec_token');
      localStorage.removeItem('fxec_user');
      localStorage.removeItem(ACTIVE_EMAIL_KEY);
    }
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  }, [token, user, accounts]);

  // Validate active account session on startup
  useEffect(() => {
    async function verifyActiveSession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data && res.data.success) {
          const freshUser = res.data.data.user;
          setAccounts((prev) =>
            prev.map((acc) =>
              acc.user?.email?.toLowerCase() === freshUser.email.toLowerCase()
                ? { ...acc, user: freshUser, lastActive: Date.now() }
                : acc
            )
          );
        }
      } catch (err) {
        console.warn('Session verification notice:', err.message);
        // If expired, remove this account from device
        if (err.response?.status === 401) {
          logoutAccount(user?.email);
        }
      } finally {
        setLoading(false);
      }
    }

    verifyActiveSession();
  }, [token, user?.email]);

  // Save account to multi-account device list
  const saveAccountToDevice = useCallback((newUser, newToken) => {
    setAccounts((prev) => {
      const filtered = prev.filter((a) => a.user?.email?.toLowerCase() !== newUser.email.toLowerCase());
      const updated = [
        { user: newUser, token: newToken, lastActive: Date.now() },
        ...filtered
      ];
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    setActiveEmail(newUser.email);
    localStorage.setItem('fxec_token', newToken);
    localStorage.setItem('fxec_user', JSON.stringify(newUser));
    localStorage.setItem(ACTIVE_EMAIL_KEY, newUser.email);
  }, []);

  // Login handler
  const login = async (loginEmail, password, role) => {
    const res = await api.post('/auth/login', { email: loginEmail, password, role });
    if (res.data && res.data.success) {
      const { token: newToken, user: userData } = res.data.data;
      saveAccountToDevice(userData, newToken);
      return userData;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  // Signup handler
  const signup = async (payload) => {
    const res = await api.post('/auth/signup', payload);
    if (res.data && res.data.success) {
      const { token: newToken, user: userData } = res.data.data;
      saveAccountToDevice(userData, newToken);
      return userData;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  // Switch between saved accounts on this device
  const switchAccount = (targetEmail) => {
    const found = accounts.find((a) => a.user?.email?.toLowerCase() === targetEmail.toLowerCase());
    if (found) {
      setActiveEmail(found.user.email);
      localStorage.setItem('fxec_token', found.token);
      localStorage.setItem('fxec_user', JSON.stringify(found.user));
      localStorage.setItem(ACTIVE_EMAIL_KEY, found.user.email);
      return found.user;
    }
    return null;
  };

  // Logout specific account from this device
  const logoutAccount = (targetEmail) => {
    const emailToRemove = (targetEmail || user?.email || '').toLowerCase();
    setAccounts((prev) => {
      const remaining = prev.filter((a) => a.user?.email?.toLowerCase() !== emailToRemove);
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(remaining));

      if (remaining.length > 0) {
        const nextActive = remaining[0];
        setActiveEmail(nextActive.user.email);
        localStorage.setItem('fxec_token', nextActive.token);
        localStorage.setItem('fxec_user', JSON.stringify(nextActive.user));
        localStorage.setItem(ACTIVE_EMAIL_KEY, nextActive.user.email);
      } else {
        setActiveEmail('');
        localStorage.removeItem('fxec_token');
        localStorage.removeItem('fxec_user');
        localStorage.removeItem(ACTIVE_EMAIL_KEY);
      }

      return remaining;
    });
  };

  // Logout all accounts from this device
  const logoutAll = () => {
    localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_EMAIL_KEY);
    localStorage.removeItem('fxec_token');
    localStorage.removeItem('fxec_user');
    setAccounts([]);
    setActiveEmail('');
  };

  const value = {
    user,
    token,
    accounts,
    activeEmail,
    loading,
    login,
    signup,
    switchAccount,
    logout: logoutAccount,
    logoutAccount,
    logoutAll,
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
