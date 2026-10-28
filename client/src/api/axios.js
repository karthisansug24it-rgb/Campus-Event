import axios from 'axios';

function resolveApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  const clean = envUrl.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true'
  }
});

// Request interceptor to attach JWT token and handle multipart FormData
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // When sending FormData, delete Content-Type so browser sets multipart/form-data with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthorized access & diagnostic warnings
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and user on authentication expiry
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If not already on login page, redirect
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (error.response && error.response.status === 404 && !import.meta.env.VITE_API_URL && window.location.hostname !== 'localhost') {
      console.warn(
        '[FXEC API Notice] Received 404 on API request while hosted without VITE_API_URL configured. ' +
        'Please configure VITE_API_URL in your Netlify site settings to connect your live backend.'
      );
    }

    return Promise.reject(error);
  }
);

export default api;
