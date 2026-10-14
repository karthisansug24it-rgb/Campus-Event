const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const {
  signup,
  login,
  getMe,
  parseEmailEndpoint
} = require('../controllers/authController');

// Rate limiters for security
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
  }
});

const parseEmailLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 60, // allow active typing lookups
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many email check requests. Please slow down.'
  }
});

// POST /api/auth/parse-email
router.post(
  '/parse-email',
  parseEmailLimiter,
  [body('email').isString().notEmpty().withMessage('Email is required.')],
  handleValidationErrors,
  parseEmailEndpoint
);

// POST /api/auth/signup (student only)
router.post(
  '/signup',
  [
    body('email').isString().notEmpty().withMessage('College email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
  ],
  handleValidationErrors,
  signup
);

// POST /api/auth/login
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isString().notEmpty().withMessage('Email is required.'),
    body('password').notEmpty().withMessage('Password is required.')
  ],
  handleValidationErrors,
  login
);

// GET /api/auth/me
router.get('/me', authenticateToken, getMe);

module.exports = router;
