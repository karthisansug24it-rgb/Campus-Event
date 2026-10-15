const express = require('express');
const { body } = require('express-validator');
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  parsePoster
} = require('../controllers/eventController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { handlePosterUpload } = require('../middleware/upload');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();

// Validation rules for creating/updating events
const eventValidationRules = [
  body('title').trim().notEmpty().withMessage('Event title is required'),
  body('description').trim().notEmpty().withMessage('Event description is required'),
  body('event_type').isIn(['internal', 'external']).withMessage('Event type must be internal or external'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('venue').trim().notEmpty().withMessage('Venue is required'),
  body('organizer').trim().notEmpty().withMessage('Organizer is required'),
  body('event_date').notEmpty().withMessage('Event date is required'),
  body('registration_deadline').notEmpty().withMessage('Registration deadline is required'),
  body('max_seats').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Max seats must be a positive number'),
  body('reward_points').optional().isInt({ min: 0 }).withMessage('Reward points must be non-negative')
];

// POST /api/events/parse-poster (Admin only, auto-extract details from poster)
router.post(
  '/parse-poster',
  authenticateToken,
  requireRole('admin'),
  handlePosterUpload('poster'),
  parsePoster
);

// GET /api/events (Public / optional auth to include user status)
router.get('/', optionalAuth, getAllEvents);

// GET /api/events/:id (Public / optional auth)
router.get('/:id', optionalAuth, getEventById);

// POST /api/events (Admin only, multipart upload)
router.post(
  '/',
  authenticateToken,
  requireRole('admin'),
  handlePosterUpload('poster'),
  eventValidationRules,
  validateRequest,
  createEvent
);

// PUT /api/events/:id (Admin only, multipart upload)
router.put(
  '/:id',
  authenticateToken,
  requireRole('admin'),
  handlePosterUpload('poster'),
  eventValidationRules,
  validateRequest,
  updateEvent
);

// DELETE /api/events/:id (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  requireRole('admin'),
  deleteEvent
);

module.exports = router;
