const { pool } = require('../config/db');
const { parseCollegeEmail } = require('../utils/emailParser');
const { REGISTER_NUMBER_REGEX, VALID_SECTIONS } = require('./authController');

/**
 * POST /api/events/:id/requests
 * Student registers for an event.
 */
async function submitRegistrationRequest(req, res) {
  const eventId = parseInt(req.params.id, 10);
  const { name, section, register_number, registerNumber, email } = req.body;
  const regNumber = (register_number || registerNumber || '').toUpperCase().trim();
  const normalizedSection = (section || '').toUpperCase().trim();
  const studentEmail = (email || req.user.email || '').toLowerCase().trim();

  // 1. Role verification
  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Only registered students can apply for campus events.'
    });
  }

  // 2. Email verification: must match the logged-in user's email
  if (studentEmail !== req.user.email.toLowerCase().trim()) {
    return res.status(400).json({
      success: false,
      message: 'The email provided does not match your authenticated student account.'
    });
  }

  // 3. Strict Server-side Email Parse (never trust client-sent department or year)
  const parsed = parseCollegeEmail(studentEmail);
  if (!parsed.valid) {
    return res.status(400).json({
      success: false,
      message: parsed.error
    });
  }

  // 4. Validate Section
  if (!VALID_SECTIONS.includes(normalizedSection)) {
    return res.status(400).json({
      success: false,
      message: `Invalid section "${section}". Please choose from: ${VALID_SECTIONS.join(', ')}`
    });
  }

  // 5. Validate Register Number
  if (!REGISTER_NUMBER_REGEX.test(regNumber)) {
    return res.status(400).json({
      success: false,
      message: 'Register number must be 8 to 15 alphanumeric characters (e.g. 953624104001).'
    });
  }

  const studentName = (name && name.trim()) || parsed.name || req.user.name;

  try {
    // 6. Check Event existence, deadline, and capacity
    const [eventRows] = await pool.execute(
      `SELECT e.*, 
              COUNT(CASE WHEN rr.status = 'approved' THEN 1 END) AS approved_count
       FROM events e
       LEFT JOIN registration_requests rr ON e.id = rr.event_id
       WHERE e.id = ?
       GROUP BY e.id
       LIMIT 1`,
      [eventId]
    );

    if (eventRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    const event = eventRows[0];
    const now = new Date();

    if (new Date(event.registration_deadline) < now) {
      return res.status(400).json({
        success: false,
        message: 'Registration is closed. The deadline for this event has passed.'
      });
    }

    if (event.max_seats !== null && Number(event.approved_count) >= event.max_seats) {
      return res.status(400).json({
        success: false,
        message: 'Registration full. All available seats have been allocated.'
      });
    }

    // 7. Check for existing registration request
    const [existing] = await pool.execute(
      'SELECT id, status FROM registration_requests WHERE event_id = ? AND user_id = ? LIMIT 1',
      [eventId, req.user.id]
    );

    if (existing.length > 0) {
      const currentStatus = existing[0].status;
      if (currentStatus === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending registration request for this event.'
        });
      }
      if (currentStatus === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'You are already registered and approved for this event.'
        });
      }

      // If rejected, allow re-application by resetting the existing record
      await pool.execute(
        `UPDATE registration_requests SET
          name = ?,
          department_code = ?,
          section = ?,
          register_number = ?,
          email = ?,
          admission_year = ?,
          year_of_study = ?,
          status = 'pending',
          admin_note = NULL,
          reviewed_by = NULL,
          reviewed_at = NULL,
          created_at = NOW()
         WHERE id = ?`,
        [
          studentName,
          parsed.departmentCode,
          normalizedSection,
          regNumber,
          studentEmail,
          parsed.admissionYear,
          parsed.yearOfStudy,
          existing[0].id
        ]
      );

      return res.json({
        success: true,
        message: 'Registration request re-submitted to admin successfully!',
        data: {
          requestId: existing[0].id,
          status: 'pending'
        }
      });
    }

    // 8. Insert new registration request
    const [insertResult] = await pool.execute(
      `INSERT INTO registration_requests (
        event_id, user_id, name, department_code, section, register_number, 
        email, admission_year, year_of_study, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        eventId,
        req.user.id,
        studentName,
        parsed.departmentCode,
        normalizedSection,
        regNumber,
        studentEmail,
        parsed.admissionYear,
        parsed.yearOfStudy
      ]
    );

    // Also update student's profile defaults if they weren't saved before
    await pool.execute(
      `UPDATE users SET section = COALESCE(section, ?), register_number = COALESCE(register_number, ?) WHERE id = ?`,
      [normalizedSection, regNumber, req.user.id]
    );

    return res.status(201).json({
      success: true,
      message: 'Request sent to admin',
      data: {
        requestId: insertResult.insertId,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('[submitRegistrationRequest Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit registration request.'
    });
  }
}

/**
 * GET /api/my/requests
 * Student retrieves all their own registration requests.
 */
async function getMyRequests(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        rr.id,
        rr.event_id,
        rr.status,
        rr.admin_note,
        rr.created_at AS requested_at,
        rr.reviewed_at,
        rr.section,
        rr.register_number,
        rr.year_of_study,
        e.title AS event_title,
        e.description AS event_description,
        e.poster_url,
        e.event_type,
        e.category,
        e.venue,
        e.organizer,
        e.event_date,
        e.registration_deadline,
        e.reward_points,
        e.external_link,
        d.name AS department_name
       FROM registration_requests rr
       JOIN events e ON rr.event_id = e.id
       JOIN departments d ON rr.department_code = d.code
       WHERE rr.user_id = ?
       ORDER BY rr.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('[getMyRequests Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your requests.'
    });
  }
}

/**
 * GET /api/admin/requests
 * Admin views all requests with status and event filters.
 */
async function getAdminRequests(req, res) {
  try {
    const { status, eventId } = req.query;

    let query = `
      SELECT 
        rr.id,
        rr.status,
        rr.admin_note,
        rr.created_at AS requested_at,
        rr.reviewed_at,
        rr.name AS student_name,
        rr.email AS student_email,
        rr.department_code,
        d.name AS department_name,
        rr.section,
        rr.register_number,
        rr.year_of_study,
        rr.admission_year,
        e.id AS event_id,
        e.title AS event_title,
        e.event_date,
        e.venue AS event_venue,
        e.event_type,
        e.category AS event_category,
        e.max_seats,
        e.reward_points,
        u_reviewer.name AS reviewer_name,
        -- Warning check: Does request department match the email's parsed department?
        CASE 
          WHEN rr.department_code != SUBSTRING_INDEX(SUBSTRING_INDEX(rr.email, '@', 1), '.', -1) THEN 1
          ELSE 0
        END AS has_mismatch
       FROM registration_requests rr
       JOIN events e ON rr.event_id = e.id
       JOIN departments d ON rr.department_code = d.code
       LEFT JOIN users u_reviewer ON rr.reviewed_by = u_reviewer.id
       WHERE 1=1
    `;

    const params = [];

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query += ' AND rr.status = ?';
      params.push(status);
    }

    if (eventId) {
      query += ' AND rr.event_id = ?';
      params.push(parseInt(eventId, 10));
    }

    query += ' ORDER BY rr.created_at DESC';

    const [rows] = await pool.execute(query, params);

    return res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('[getAdminRequests Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve registration requests.'
    });
  }
}

/**
 * PATCH /api/admin/requests/:id/approve
 * Admin approves a registration request within a transaction with seat limit verification.
 */
async function approveRequest(req, res) {
  const requestId = parseInt(req.params.id, 10);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Fetch request with lock
    const [requestRows] = await connection.execute(
      'SELECT id, event_id, user_id, status FROM registration_requests WHERE id = ? FOR UPDATE',
      [requestId]
    );

    if (requestRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Registration request not found.'
      });
    }

    const request = requestRows[0];

    if (request.status === 'approved') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'This registration request is already approved.'
      });
    }

    // 2. Lock event row to check seat availability safely
    const [eventRows] = await connection.execute(
      `SELECT e.id, e.title, e.max_seats,
              (SELECT COUNT(*) FROM registration_requests WHERE event_id = e.id AND status = 'approved') AS approved_count
       FROM events e
       WHERE e.id = ? FOR UPDATE`,
      [request.event_id]
    );

    if (eventRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Associated event not found.'
      });
    }

    const event = eventRows[0];

    if (event.max_seats !== null && Number(event.approved_count) >= event.max_seats) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot approve request: Event "${event.title}" has reached its maximum capacity of ${event.max_seats} seats.`
      });
    }

    // 3. Update request status to approved
    await connection.execute(
      `UPDATE registration_requests SET
        status = 'approved',
        admin_note = NULL,
        reviewed_by = ?,
        reviewed_at = NOW()
       WHERE id = ?`,
      [req.user.id, requestId]
    );

    await connection.commit();

    return res.json({
      success: true,
      message: 'Registration request approved successfully. Student is now registered!'
    });
  } catch (error) {
    await connection.rollback();
    console.error('[approveRequest Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve registration request.'
    });
  } finally {
    connection.release();
  }
}

/**
 * PATCH /api/admin/requests/:id/reject
 * Admin rejects a request with an optional note.
 */
async function rejectRequest(req, res) {
  const requestId = parseInt(req.params.id, 10);
  const { admin_note, note } = req.body;
  const reason = (admin_note || note || '').trim() || null;

  try {
    const [requestRows] = await pool.execute(
      'SELECT id, status FROM registration_requests WHERE id = ? LIMIT 1',
      [requestId]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration request not found.'
      });
    }

    await pool.execute(
      `UPDATE registration_requests SET
        status = 'rejected',
        admin_note = ?,
        reviewed_by = ?,
        reviewed_at = NOW()
       WHERE id = ?`,
      [reason, req.user.id, requestId]
    );

    return res.json({
      success: true,
      message: 'Registration request rejected.'
    });
  } catch (error) {
    console.error('[rejectRequest Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject registration request.'
    });
  }
}

/**
 * GET /api/admin/stats
 * Dashboard statistics for Admin.
 */
async function getAdminStats(req, res) {
  try {
    const [[eventStats]] = await pool.execute(`
      SELECT 
        COUNT(*) AS total_events,
        COUNT(CASE WHEN event_type = 'internal' THEN 1 END) AS internal_events,
        COUNT(CASE WHEN event_type = 'external' THEN 1 END) AS external_events
      FROM events
    `);

    const [[requestStats]] = await pool.execute(`
      SELECT 
        COUNT(*) AS total_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_requests,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved_registrations,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected_requests
      FROM registration_requests
    `);

    const [[userStats]] = await pool.execute(`
      SELECT COUNT(*) AS total_students 
      FROM users 
      WHERE role = 'student'
    `);

    return res.json({
      success: true,
      data: {
        totalEvents: Number(eventStats.total_events || 0),
        internalEvents: Number(eventStats.internal_events || 0),
        externalEvents: Number(eventStats.external_events || 0),
        totalRequests: Number(requestStats.total_requests || 0),
        pendingRequests: Number(requestStats.pending_requests || 0),
        approvedRegistrations: Number(requestStats.approved_registrations || 0),
        rejectedRequests: Number(requestStats.rejected_requests || 0),
        totalStudents: Number(userStats.total_students || 0)
      }
    });
  } catch (error) {
    console.error('[getAdminStats Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve administrative statistics.'
    });
  }
}

module.exports = {
  submitRegistrationRequest,
  getMyRequests,
  getAdminRequests,
  approveRequest,
  rejectRequest,
  getAdminStats
};
