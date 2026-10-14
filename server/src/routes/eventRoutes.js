const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { uploadPoster } = require('../middleware/upload');
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');
const { submitEventRequest } = require('../controllers/studentController');

// GET /api/events - browse all events
router.get('/', optionalAuth, getEvents);

// GET /api/events/:id - view single event
router.get('/:id', optionalAuth, getEventById);

// POST /api/events/:id/requests - student registers for event
router.post('/:id/requests', authenticateToken, requireRole('student'), submitEventRequest);

// POST /api/events - admin creates event (multipart upload)
router.post(
  '/',
  authenticateToken,
  requireRole('admin'),
  uploadPoster('poster'),
  createEvent
);

// PUT /api/events/:id - admin updates event (multipart upload)
router.put(
  '/:id',
  authenticateToken,
  requireRole('admin'),
  uploadPoster('poster'),
  updateEvent
);

// DELETE /api/events/:id - admin deletes event
router.delete('/:id', authenticateToken, requireRole('admin'), deleteEvent);

module.exports = router;
