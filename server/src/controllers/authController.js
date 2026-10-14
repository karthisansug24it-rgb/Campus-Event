const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { parseCollegeEmail } = require('../utils/emailParser');

// Constants
const REGISTER_NUMBER_REGEX = /^[A-Za-z0-9]{8,15}$/;
const VALID_SECTIONS = ['A', 'B', 'C', 'D'];

/**
 * Helper to generate JWT token (1-day expiry)
 */
function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'fxec_campus_event_jwt_super_secret_key_2026_x89!secure';
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

/**
 * POST /api/auth/parse-email
 * Public endpoint to parse email and preview derived details in real-time.
 */
async function parseEmailEndpoint(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const parseResult = parseCollegeEmail(email);
  if (!parseResult.valid) {
    return res.status(400).json({
      success: false,
      message: parseResult.error,
      data: { valid: false, isAlumni: parseResult.isAlumni || false }
    });
  }

  return res.json({
    success: true,
    message: 'College email parsed successfully',
    data: parseResult
  });
}

/**
 * POST /api/auth/signup
 * Student self-registration with automatic email derivation.
 */
async function signup(req, res) {
  const { name, email, password, section, registerNumber } = req.body;

  // 1. Validate Email with College Parser
  const parseResult = parseCollegeEmail(email);
  if (!parseResult.valid) {
    return res.status(400).json({
      success: false,
      message: parseResult.error
    });
  }

  // 2. Validate Password Length
  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  // 3. Validate Section
  const normalizedSection = (section || '').toUpperCase().trim();
  if (normalizedSection && !VALID_SECTIONS.includes(normalizedSection)) {
    return res.status(400).json({
      success: false,
      message: `Invalid section "${section}". Must be one of: ${VALID_SECTIONS.join(', ')}`
    });
  }

  // 4. Validate Register Number
  const normalizedReg = (registerNumber || '').toUpperCase().trim();
  if (normalizedReg && !REGISTER_NUMBER_REGEX.test(normalizedReg)) {
    return res.status(400).json({
      success: false,
      message: 'Register number must be alphanumeric between 8 and 15 characters'
    });
  }

  // Final display name: user-supplied or email-derived
  const displayName = (name && name.trim()) || parseResult.name;

  try {
    // Check if email already registered
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this college email already exists. Please log in.'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user into database
    const [insertResult] = await pool.execute(
      `INSERT INTO users 
        (name, email, password_hash, role, department_code, admission_year, study_level, section, register_number, total_points)
       VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?, 0)`,
      [
        displayName,
        email.toLowerCase().trim(),
        passwordHash,
        parseResult.departmentCode,
        parseResult.admissionYear,
        parseResult.level,
        normalizedSection || null,
        normalizedReg || null
      ]
    );

    const newUserId = insertResult.insertId;

    const [userRows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.role, u.department_code, d.name AS department_name, 
              u.admission_year, u.study_level, u.section, u.register_number, u.total_points, u.created_at
       FROM users u
       LEFT JOIN departments d ON u.department_code = d.code
       WHERE u.id = ? LIMIT 1`,
      [newUserId]
    );

    const user = userRows[0];
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Francis Xavier Event Portal.',
      data: {
        token,
        user: {
          ...user,
          yearOfStudy: parseResult.yearOfStudy,
          yearOfStudyRoman: parseResult.yearOfStudyRoman
        }
      }
    });
  } catch (error) {
    console.error('[Auth Signup Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating your account. Please try again.'
    });
  }
}

/**
 * POST /api/auth/login
 * Unified login endpoint supporting Student and Admin roles with role check.
 */
async function login(req, res) {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  const requestedRole = (role || 'student').toLowerCase().trim();
  if (!['student', 'admin'].includes(requestedRole)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role specified. Must be "student" or "admin".'
    });
  }

  try {
    const [users] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.department_code, d.name AS department_name,
              u.admission_year, u.study_level, u.section, u.register_number, u.total_points, u.created_at
       FROM users u
       LEFT JOIN departments d ON u.department_code = d.code
       WHERE u.email = ? LIMIT 1`,
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // Verify Password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Role check: ensure the user's role in DB matches their login toggle
    if (user.role !== requestedRole) {
      return res.status(403).json({
        success: false,
        message: requestedRole === 'admin'
          ? 'Access denied. This account does not possess administrator privileges.'
          : 'This account is an Administrator. Please toggle to "Admin Login".'
      });
    }

    // Compute dynamic year of study for student
    let yearOfStudy = null;
    let yearOfStudyRoman = null;
    if (user.role === 'student' && user.email) {
      const parsed = parseCollegeEmail(user.email);
      if (parsed.valid) {
        yearOfStudy = parsed.yearOfStudy;
        yearOfStudyRoman = parsed.yearOfStudyRoman;
      }
    }

    const { password_hash, ...sanitizedUser } = user;
    const token = generateToken(user);

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      data: {
        token,
        user: {
          ...sanitizedUser,
          yearOfStudy,
          yearOfStudyRoman
        }
      }
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during authentication. Please try again.'
    });
  }
}

/**
 * GET /api/auth/me
 * Fetch authenticated user profile.
 */
async function getProfile(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.role, u.department_code, d.name AS department_name,
              u.admission_year, u.study_level, u.section, u.register_number, u.total_points, u.created_at
       FROM users u
       LEFT JOIN departments d ON u.department_code = d.code
       WHERE u.id = ? LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const user = rows[0];
    let yearOfStudy = null;
    let yearOfStudyRoman = null;
    if (user.role === 'student' && user.email) {
      const parsed = parseCollegeEmail(user.email);
      if (parsed.valid) {
        yearOfStudy = parsed.yearOfStudy;
        yearOfStudyRoman = parsed.yearOfStudyRoman;
      }
    }

    return res.json({
      success: true,
      data: {
        user: {
          ...user,
          yearOfStudy,
          yearOfStudyRoman
        }
      }
    });
  } catch (error) {
    console.error('[Auth Profile Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.'
    });
  }
}

module.exports = {
  parseEmailEndpoint,
  signup,
  login,
  getProfile,
  REGISTER_NUMBER_REGEX,
  VALID_SECTIONS
};
