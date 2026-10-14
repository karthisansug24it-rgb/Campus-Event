const express = require('express');
const {
  getAdminRequests,
  approveRequest,
  rejectRequest,
  getAdminStats
} = require('../controllers/requestController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

const router = express.Router();

// All admin routes require admin authentication
router.use(authenticateToken, requireRole('admin'));

// GET /api/admin/requests (filter by status and eventId)
router.get('/requests', getAdminRequests);

// PATCH /api/admin/requests/:id/approve (transactional approval with seat check)
router.patch('/requests/:id/approve', approveRequest);

// PATCH /api/admin/requests/:id/reject (with optional note)
router.patch('/requests/:id/reject', rejectRequest);

// GET /api/admin/stats (Admin dashboard stats)
router.get('/stats', getAdminStats);

module.exports = router;
