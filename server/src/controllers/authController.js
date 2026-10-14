const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const {
  parseCollegeEmail,
  DEPARTMENT_MAP,
  REGISTER_NUMBER_REGEX,
  VALID_SECTIONS
} = require('../utils/emailParser');

/**
 * Generate 1-day JWT token
 */
function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'supersecret_fxec_campus_events_jwt_key_2026_production';
  return jwt.sign(
    {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role
    },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

/**
 * POST /api/auth/parse-email
 * Public endpoint to parse and validate college email for real-time form autofill
 */
async function parseEmailEndpoint(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email address is required.',
      data: null
    });
  }

  const result = parseCollegeEmail(email);

  if (!result.valid) {
    return res.status(400).json({
      success: false,
      message: result.error,
      data: result
    });
  }

  return res.json({
    success: true,
    message: 'Valid Francis Xavier Engineering College email.',
    data: result
  });
}

/**
 * POST /api/auth/signup
 * Student self-registration (Admin signup is strictly prohibited here)
 */
async function signup(req, res) {
  try {
    const { name, email, password, section, registerNumber } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // 1. Strict server-side college email verification & parsing
    const parsed = parseCollegeEmail(email);
    if (!parsed.valid) {
      return res.status(400).json({
        success: false,
        message: parsed.error,
        data: parsed
      });
    }

    // 2. Validate section if provided
    let cleanSection = null;
    if (section) {
      cleanSection = section.toUpperCase().trim();
      if (!VALID_SECTIONS.includes(cleanSection)) {
        return res.status(400).json({
          success: false,
          message: `Section must be one of: ${VALID_SECTIONS.join(', ')}`
        });
      }
    }

    // 3. Validate register number if provided
    let cleanRegNo = null;
    if (registerNumber) {
      cleanRegNo = registerNumber.trim();
      if (!REGISTER_NUMBER_REGEX.test(cleanRegNo)) {
        return res.status(400).json({
          success: false,
          message: 'Register number must be 8 to 15 alphanumeric characters.'
        });
      }
    }

    // 4. Ensure email is not already registered
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [parsed.email]
    );

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this college email already exists. Please log in.'
      });
    }

    // 5. Use user-provided name if non-empty, otherwise fallback to parsed name
    const finalName = (name && name.trim().length > 0) ? name.trim() : parsed.name;

    // 6. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 7. Insert user with strictly server-derived college credentials
    const [insertResult] = await pool.query(
      `INSERT INTO users (
        name, email, password_hash, role, department_code,
        admission_year, study_level, section, register_number, total_points
      ) VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?, 0)`,
      [
        finalName,
        parsed.email,
        passwordHash,
        parsed.departmentCode,
        parsed.admissionYear,
        parsed.level,
        cleanSection,
        cleanRegNo
      ]
    );

    const newUserId = insertResult.insertId;

    const userPayload = {
      id: newUserId,
      name: finalName,
      email: parsed.email,
      role: 'student',
      departmentCode: parsed.departmentCode,
      departmentName: parsed.departmentName,
      admissionYear: parsed.admissionYear,
      studyLevel: parsed.level,
      yearOfStudy: parsed.yearOfStudy,
      yearLabel: parsed.yearLabel,
      section: cleanSection,
      registerNumber: cleanRegNo,
      totalPoints: 0
    };

    const token = generateToken(userPayload);

    return res.status(201).json({
      success: true,
      message: 'Student registration successful.',
      data: {
        token,
        user: userPayload
      }
    });
  } catch (error) {
    console.error('Error in signup:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during signup. Please try again.'
    });
  }
}

/**
 * POST /api/auth/login
 * Unified login with Student / Admin role toggle check
 */
async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query user
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.department_code,
              u.admission_year, u.study_level, u.section, u.register_number, u.total_points,
              d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON u.department_code = d.code
       WHERE u.email = ?`,
      [cleanEmail]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = rows[0];

    // If client specified role (e.g. toggle on UI), verify that the account matches that role
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: `Account role mismatch: Selected role is "${role}", but this account is registered as a "${user.role}".`
      });
    }

    // Verify bcrypt password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // For students, recalculate current dynamic year of study
    let yearOfStudy = null;
    let yearLabel = null;
    let deptName = user.department_name || DEPARTMENT_MAP[user.department_code] || null;

    if (user.role === 'student' && user.email) {
      const parsed = parseCollegeEmail(user.email);
      if (parsed.valid) {
        yearOfStudy = parsed.yearOfStudy;
        yearLabel = parsed.yearLabel;
        deptName = parsed.departmentName;
      }
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentCode: user.department_code,
      departmentName: deptName,
      admissionYear: user.admission_year,
      studyLevel: user.study_level,
      yearOfStudy,
      yearLabel,
      section: user.section,
      registerNumber: user.register_number,
      totalPoints: user.total_points || 0
    };

    const token = generateToken(userPayload);

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        token,
        user: userPayload
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.'
    });
  }
}

/**
 * GET /api/auth/me
 * Returns current authenticated user profile
 */
async function getMe(req, res) {
  try {
    const user = req.user;

    let yearOfStudy = null;
    let yearLabel = null;
    let deptName = DEPARTMENT_MAP[user.department_code] || null;

    if (user.role === 'student' && user.email) {
      const parsed = parseCollegeEmail(user.email);
      if (parsed.valid) {
        yearOfStudy = parsed.yearOfStudy;
        yearLabel = parsed.yearLabel;
        deptName = parsed.departmentName;
      }
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentCode: user.department_code,
          departmentName: deptName,
          admissionYear: user.admission_year,
          studyLevel: user.study_level,
          yearOfStudy,
          yearLabel,
          section: user.section,
          registerNumber: user.register_number,
          totalPoints: user.total_points || 0
        }
      }
    });
  } catch (error) {
    console.error('Error in getMe:', error);
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
  getMe
};
