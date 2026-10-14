const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { uploadsDir } = require('./middleware/upload');

const app = express();

// Security HTTP headers with cross-origin resource policy for poster images
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS configuration limited to client URL
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS policy.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploaded posters
app.use('/uploads', express.static(uploadsDir));

// Root landing endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Francis Xavier Engineering College (FXEC) - Campus Event Management API is online.',
    frontend_application: 'http://localhost:5173',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      events: 'GET /api/events',
      event_details: 'GET /api/events/:id',
      parse_email: 'POST /api/auth/parse-email',
      student_signup: 'POST /api/auth/signup',
      login: 'POST /api/auth/login',
      my_requests: 'GET /api/my/requests',
      admin_stats: 'GET /api/admin/stats',
      admin_requests: 'GET /api/admin/requests'
    }
  });
});

// API index endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'FXEC Campus Events API Root',
    health: '/api/health',
    events: '/api/events'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'FXEC Campus Event Management API is healthy.',
    timestamp: new Date().toISOString()
  });
});

// Mount API routes (with /api and without /api alias)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/events', eventRoutes);
app.use('/events', eventRoutes);

app.use('/api/my', studentRoutes);
app.use('/my', studentRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

// Catch-all JSON 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}. Route not found on this server.`,
    hint: 'Check GET / for available API endpoints or visit the frontend application at http://localhost:5173'
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Central Error Handler]', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

module.exports = app;
