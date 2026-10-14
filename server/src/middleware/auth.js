const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * Authentication middleware that verifies JWT from 'Authorization: Bearer <token>'
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_fxec_campus_events_jwt_key_2026_production');

    const [rows] = await pool.query(
      'SELECT id, name, email, role, department_code, admission_year, study_level, section, register_number, total_points FROM users WHERE id = ?',
      [decoded.userId || decoded.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session: User account not found.'
      });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    const message = error.name === 'TokenExpiredError'
      ? 'Session expired. Please log in again.'
      : 'Invalid authentication token.';

    return res.status(401).json({
      success: false,
      message
    });
  }
}

/**
 * Optional authentication middleware: attaches user if token is valid, but allows unauthenticated visitors.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_fxec_campus_events_jwt_key_2026_production');
    const [rows] = await pool.query(
      'SELECT id, name, email, role, department_code, admission_year, study_level, section, register_number, total_points FROM users WHERE id = ?',
      [decoded.userId || decoded.id]
    );
    req.user = rows && rows.length > 0 ? rows[0] : null;
  } catch {
    req.user = null;
  }
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth
};
