const express = require('express');
const { body } = require('express-validator');
const {
  submitRegistrationRequest,
  uploadRegistrationScreenshot,
  uploadParticipationCertificate,
  getMyRequests,
  getStudentAlerts
} = require('../controllers/requestController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { validateRequest } = require('../middleware/validate');
const { handleScreenshotUpload, handleCertificateUpload } = require('../middleware/upload');

const router = express.Router();

// POST /api/events/:id/requests (Student registers for event with optional screenshot upload)
router.post(
  '/events/:id/requests',
  authenticateToken,
  requireRole('student'),
  handleScreenshotUpload('screenshot'),
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

// POST /api/my/requests/:id/screenshot (Student uploads/updates screenshot proof)
router.post(
  '/my/requests/:id/screenshot',
  authenticateToken,
  requireRole('student'),
  handleScreenshotUpload('screenshot'),
  uploadRegistrationScreenshot
);

// POST /api/my/requests/:id/certificate (Student uploads participation certificate)
router.post(
  '/my/requests/:id/certificate',
  authenticateToken,
  requireRole('student'),
  handleCertificateUpload('certificate'),
  uploadParticipationCertificate
);

// GET /api/my/requests (Student views their requests & progress status)
router.get(
  '/my/requests',
  authenticateToken,
  requireRole('student'),
  getMyRequests
);

// GET /api/my/alerts (Student deadline alerts and pending actions)
router.get(
  '/my/alerts',
  authenticateToken,
  requireRole('student'),
  getStudentAlerts
);

module.exports = router;
