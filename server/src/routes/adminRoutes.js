const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const {
  getAdminStats,
  getRequests,
  approveRequest,
  rejectRequest,
  markAttendance
} = require('../controllers/adminController');

// All routes require authenticated admin
router.use(authenticateToken, requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', getAdminStats);

// GET /api/admin/requests?status=&eventId=
router.get('/requests', getRequests);

// PATCH /api/admin/requests/:id/approve
router.patch('/requests/:id/approve', approveRequest);

// PATCH /api/admin/requests/:id/reject
router.patch('/requests/:id/reject', rejectRequest);

// PATCH /api/admin/requests/:id/attendance
router.patch('/requests/:id/attendance', markAttendance);

module.exports = router;
