const express = require('express');
const {
  getAdminRequests,
  approveRequest,
  rankRequest,
  rejectRequest,
  getAdminStats,
  getAdminAlerts,
  bulkApproveRequests,
  bulkRejectRequests,
  getEventAttendees,
  toggleAttendance,
  getDepartments
} = require('../controllers/requestController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

const router = express.Router();

// All admin routes require admin authentication
router.use(authenticateToken, requireRole('admin'));

// GET /api/admin/requests (filter by status, eventId, department, year, timeline)
router.get('/requests', getAdminRequests);

// PATCH /api/admin/requests/bulk-approve (bulk approve selected/filtered requests)
router.patch('/requests/bulk-approve', bulkApproveRequests);

// PATCH /api/admin/requests/bulk-reject (bulk reject selected/filtered requests)
router.patch('/requests/bulk-reject', bulkRejectRequests);

// PATCH /api/admin/requests/:id/approve (transactional approval with seat check & screenshot verification)
router.patch('/requests/:id/approve', approveRequest);

// PATCH /api/admin/requests/:id/rank (verify certificate and assign rank 1, 2, 3, or participated + reward points)
router.patch('/requests/:id/rank', rankRequest);

// PATCH /api/admin/requests/:id/reject (with optional note)
router.patch('/requests/:id/reject', rejectRequest);

// PATCH /api/admin/requests/:id/attendance (toggle attendance for past/current events)
router.patch('/requests/:id/attendance', toggleAttendance);

// GET /api/admin/events/:id/attendees (get all registered students for an event)
router.get('/events/:id/attendees', getEventAttendees);

// GET /api/admin/departments (list all departments)
router.get('/departments', getDepartments);

// GET /api/admin/stats (Admin dashboard stats across progress stages)
router.get('/stats', getAdminStats);

// GET /api/admin/alerts (Admin pending verification counts and upcoming deadlines)
router.get('/alerts', getAdminAlerts);

module.exports = router;
