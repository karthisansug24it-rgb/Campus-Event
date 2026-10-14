const express = require('express');
const { body } = require('express-validator');
const {
  submitRegistrationRequest,
  getMyRequests
} = require('../controllers/requestController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();

// POST /api/events/:id/requests (Student registers for event)
router.post(
  '/events/:id/requests',
  authenticateToken,
  requireRole('student'),
  [
    body('section')
      .trim()
      .isIn(['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd'])
      .withMessage('Section must be A, B, C, or D'),
    body('register_number')
      .optional()
      .trim()
      .matches(/^[A-Za-z0-9]{8,15}$/)
      .withMessage('Register number must be 8-15 alphanumeric characters'),
    body('registerNumber')
      .optional()
      .trim()
      .matches(/^[A-Za-z0-9]{8,15}$/)
      .withMessage('Register number must be 8-15 alphanumeric characters')
  ],
  validateRequest,
  submitRegistrationRequest
);

// GET /api/my/requests (Student views their requests)
router.get(
  '/my/requests',
  authenticateToken,
  requireRole('student'),
  getMyRequests
);

module.exports = router;
