const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { parseEmailEndpoint, signup, login, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();

// Strict rate limiter for login to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for parse-email
const parseEmailLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'Too many email parse requests. Please wait a moment.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// POST /api/auth/parse-email (Public, rate-limited)
router.post(
  '/parse-email',
  parseEmailLimiter,
  [
    body('email').isEmail().withMessage('A valid email address is required')
  ],
  validateRequest,
  parseEmailEndpoint
);

// POST /api/auth/signup (Student signup)
router.post(
  '/signup',
  [
    body('email')
      .isEmail().withMessage('A valid college email address is required')
      .custom(val => val.toLowerCase().endsWith('@francisxavier.ac.in'))
      .withMessage('Only @francisxavier.ac.in emails are accepted'),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('section')
      .optional({ checkFalsy: true })
      .isIn(['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd'])
      .withMessage('Section must be A, B, C, or D'),
    body('registerNumber')
      .optional({ checkFalsy: true })
      .matches(/^[A-Za-z0-9]{8,15}$/)
      .withMessage('Register number must be 8 to 15 alphanumeric characters')
  ],
  validateRequest,
  signup
);

// POST /api/auth/login (Student / Admin unified login)
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').optional().isIn(['student', 'admin']).withMessage('Role must be student or admin')
  ],
  validateRequest,
  login
);

// GET /api/auth/me (Protected current user profile)
router.get('/me', authenticateToken, getProfile);

module.exports = router;
