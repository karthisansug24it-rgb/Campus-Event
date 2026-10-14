const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { getMyRequests } = require('../controllers/studentController');

// GET /api/my/requests
router.get('/requests', authenticateToken, requireRole('student'), getMyRequests);

module.exports = router;
