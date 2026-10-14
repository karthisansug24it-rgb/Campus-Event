const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * Middleware to verify JWT authentication token from Authorization header.
 * Attaches user record to req.user (excluding password_hash).
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Missing Authorization header.'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Invalid Authorization header format. Expected "Bearer <token>".'
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fxec_campus_event_jwt_super_secret_key_2026_x89!secure');

    // Fetch user from DB using prepared statement
    const [rows] = await pool.execute(
      `SELECT id, name, email, role, department_code, admission_year, study_level, section, register_number, total_points, created_at 
       FROM users WHERE id = ? LIMIT 1`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: User account no longer exists.'
      });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.'
    });
  }
}

/**
 * Optional authentication middleware: if token is present, attaches req.user; otherwise proceeds as guest.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next();
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fxec_campus_event_jwt_super_secret_key_2026_x89!secure');
    const [rows] = await pool.execute(
      `SELECT id, name, email, role, department_code, admission_year, study_level, section, register_number, total_points, created_at 
       FROM users WHERE id = ? LIMIT 1`,
      [decoded.id]
    );
    if (rows.length > 0) {
      req.user = rows[0];
    }
  } catch (err) {
    // Ignore invalid token in optionalAuth
  }
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth
};
