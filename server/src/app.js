const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { testConnection } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const requestRoutes = require('./routes/requestRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { startDeadlineScheduler } = require('./services/deadlineReminderJob');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Security Headers with Helmet (configured for cross-origin poster image access)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false
  })
);

// 2. CORS configuration limited to client URL
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  })
);

// 3. Request body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Static files serving for uploaded posters
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// 5. Health Check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Francis Xavier Engineering College EMS API is operational.',
    timestamp: new Date().toISOString()
  });
});

// 6. REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', requestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// 7. 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.method} ${req.originalUrl} not found.`
  });
});

// 8. Central Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server (only when executed directly, not when imported as serverless function)
if (require.main === module && !process.env.NETLIFY) {
  app.listen(PORT, async () => {
    console.log(`=======================================================`);
    console.log(`  FXEC Campus Event Management Server running on port ${PORT}`);
    console.log(`  API Base URL: http://localhost:${PORT}/api`);
    console.log(`  Allowed Client: ${CLIENT_URL}`);
    console.log(`=======================================================`);
    try {
      await testConnection();
      try {
        const { autoMigrate } = require('./scripts/autoMigrate');
        await autoMigrate();
      } catch (mErr) {
        console.warn('[AutoMigrate Notice]:', mErr.message);
      }
      startDeadlineScheduler();
    } catch (err) {
      console.error('[Warning] Initial DB connection check failed. Ensure MySQL is running.');
    }
  });
}

module.exports = app;
