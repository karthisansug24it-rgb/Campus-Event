const { pool } = require('../config/db');
const { parseCollegeEmail, ROMAN_YEARS } = require('../utils/emailParser');

/**
 * GET /api/admin/stats
 * Admin dashboard overview stats
 */
async function getAdminStats(req, res) {
  try {
    const [[eventsCount]] = await pool.query('SELECT COUNT(*) AS total_events FROM events');
    const [[pendingCount]] = await pool.query(
      "SELECT COUNT(*) AS pending_requests FROM registration_requests WHERE status = 'pending'"
    );
    const [[approvedCount]] = await pool.query(
      "SELECT COUNT(*) AS approved_registrations FROM registration_requests WHERE status = 'approved'"
    );
    const [[rejectedCount]] = await pool.query(
      "SELECT COUNT(*) AS rejected_requests FROM registration_requests WHERE status = 'rejected'"
    );
    const [[studentsCount]] = await pool.query(
      "SELECT COUNT(*) AS total_students FROM users WHERE role = 'student'"
    );
    const [[pointsCount]] = await pool.query(
      'SELECT COALESCE(SUM(total_points), 0) AS total_points_awarded FROM users'
    );

    // Recent 5 requests
    const [recentRequests] = await pool.query(
      `SELECT r.id, r.name, r.email, r.status, r.created_at, e.title AS event_title
       FROM registration_requests r
       JOIN events e ON r.event_id = e.id
       ORDER BY r.created_at DESC
       LIMIT 5`
    );

    return res.json({
      success: true,
      message: 'Dashboard stats retrieved.',
      data: {
        total_events: eventsCount.total_events || 0,
        pending_requests: pendingCount.pending_requests || 0,
        approved_registrations: approvedCount.approved_registrations || 0,
        rejected_requests: rejectedCount.rejected_requests || 0,
        total_students: studentsCount.total_students || 0,
        total_points_awarded: pointsCount.total_points_awarded || 0,
        recent_requests: recentRequests
      }
    });
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin stats.'
    });
  }
}

/**
 * GET /api/admin/requests
 * Lists requests with filtering by status and event, with server-derived mismatch detection
 */
async function getRequests(req, res) {
  try {
    const { status, eventId } = req.query;

    let query = `
      SELECT r.*,
             e.title AS event_title,
             e.event_date,
             e.venue AS event_venue,
             e.event_type,
             e.category AS event_category,
             e.max_seats,
             d.name AS department_name,
             u.name AS reviewer_name
      FROM registration_requests r
      JOIN events e ON r.event_id = e.id
      LEFT JOIN departments d ON r.department_code = d.code
      LEFT JOIN users u ON r.reviewed_by = u.id
      WHERE 1=1
    `;

    const params = [];

    if (status && status !== 'all') {
      query += ` AND r.status = ?`;
      params.push(status.toLowerCase());
    }

    if (eventId && eventId !== 'all') {
      query += ` AND r.event_id = ?`;
      params.push(parseInt(eventId, 10));
    }

    query += ` ORDER BY r.created_at DESC`;

    const [rows] = await pool.query(query, params);

    // Process each row to derive email truth and flag any discrepancies
    const enrichedRequests = rows.map((reqRow) => {
      const emailParse = parseCollegeEmail(reqRow.email);
      let isMismatch = false;
      const mismatchReasons = [];

      if (!emailParse.valid) {
        isMismatch = true;
        mismatchReasons.push(`Invalid email: ${emailParse.error}`);
      } else {
        // Check if student's saved department code matches email-derived dept
        if (reqRow.department_code.toLowerCase() !== emailParse.departmentCode.toLowerCase()) {
          isMismatch = true;
          mismatchReasons.push(
            `Department mismatch: entered '${reqRow.department_code}' vs email '${emailParse.departmentCode}'`
          );
        }

        // Check if student's saved admission year matches email-derived year
        if (parseInt(reqRow.admission_year, 10) !== emailParse.admissionYear) {
          isMismatch = true;
          mismatchReasons.push(
            `Admission year mismatch: entered '${reqRow.admission_year}' vs email '${emailParse.admissionYear}'`
          );
        }
      }

      const yearLabel = ROMAN_YEARS[reqRow.year_of_study] || `Year ${reqRow.year_of_study}`;

      return {
        ...reqRow,
        derived_year_label: yearLabel,
        derived_department_name: emailParse.valid ? emailParse.departmentName : reqRow.department_name,
        is_mismatch: isMismatch,
        mismatch_reasons: mismatchReasons
      };
    });

    return res.json({
      success: true,
      message: 'Requests retrieved successfully.',
      data: enrichedRequests
    });
  } catch (error) {
    console.error('Error in getRequests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve registration requests.'
    });
  }
}

/**
 * PATCH /api/admin/requests/:id/approve
 * Approves a registration request inside a transaction, re-checking seat limit
 */
async function approveRequest(req, res) {
  const requestId = parseInt(req.params.id, 10);
  const reviewerId = req.user.id;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Fetch the request FOR UPDATE
    const [requestRows] = await connection.query(
      'SELECT * FROM registration_requests WHERE id = ? FOR UPDATE',
      [requestId]
    );

    if (!requestRows || requestRows.length === 0) {
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
        message: 'This request is already approved.'
      });
    }

    // 2. Lock event record and check seating capacity
    const [eventRows] = await connection.query(
      'SELECT id, title, max_seats FROM events WHERE id = ? FOR UPDATE',
      [request.event_id]
    );

    if (!eventRows || eventRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Associated event not found.'
      });
    }

    const event = eventRows[0];

    if (event.max_seats !== null) {
      const [[{ currentApproved }]] = await connection.query(
        "SELECT COUNT(*) AS currentApproved FROM registration_requests WHERE event_id = ? AND status = 'approved'",
        [event.id]
      );

      if (currentApproved >= event.max_seats) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Cannot approve: Event has reached its maximum capacity of ${event.max_seats} seats.`
        });
      }
    }

    // 3. Update request status to 'approved'
    await connection.query(
      `UPDATE registration_requests SET
        status = 'approved',
        admin_note = NULL,
        reviewed_by = ?,
        reviewed_at = NOW()
      WHERE id = ?`,
      [reviewerId, requestId]
    );

    await connection.commit();

    return res.json({
      success: true,
      message: 'Request approved successfully. Student is now registered for the event.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error in approveRequest:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve request. Transaction rolled back.'
    });
  } finally {
    connection.release();
  }
}

/**
 * PATCH /api/admin/requests/:id/reject
 * Rejects a registration request with an optional note
 */
async function rejectRequest(req, res) {
  try {
    const requestId = parseInt(req.params.id, 10);
    const reviewerId = req.user.id;
    const { note } = req.body;

    const [requestRows] = await pool.query(
      'SELECT id, status FROM registration_requests WHERE id = ?',
      [requestId]
    );

    if (!requestRows || requestRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration request not found.'
      });
    }

    const cleanNote = note ? note.trim() : null;

    await pool.query(
      `UPDATE registration_requests SET
        status = 'rejected',
        admin_note = ?,
        reviewed_by = ?,
        reviewed_at = NOW()
      WHERE id = ?`,
      [cleanNote, reviewerId, requestId]
    );

    return res.json({
      success: true,
      message: 'Request rejected.',
      data: {
        id: requestId,
        status: 'rejected',
        admin_note: cleanNote
      }
    });
  } catch (error) {
    console.error('Error in rejectRequest:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject request.'
    });
  }
}

/**
 * PATCH /api/admin/requests/:id/attendance
 * Phase 2: Mark attendance and award reward points
 */
async function markAttendance(req, res) {
  const requestId = parseInt(req.params.id, 10);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT r.*, e.reward_points, e.title AS event_title
       FROM registration_requests r
       JOIN events e ON r.event_id = e.id
       WHERE r.id = ? FOR UPDATE`,
      [requestId]
    );

    if (!rows || rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const reqData = rows[0];

    if (reqData.status !== 'approved') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Only approved attendees can have attendance marked.'
      });
    }

    if (reqData.attended) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Attendance has already been marked for this student.'
      });
    }

    // Mark attended
    await connection.query('UPDATE registration_requests SET attended = TRUE WHERE id = ?', [requestId]);

    // Credit points to student if event has points
    const points = reqData.reward_points || 0;
    if (points > 0) {
      await connection.query(
        'UPDATE users SET total_points = total_points + ? WHERE id = ?',
        [points, reqData.user_id]
      );

      await connection.query(
        'INSERT INTO points_log (user_id, event_id, points, reason) VALUES (?, ?, ?, ?)',
        [reqData.user_id, reqData.event_id, points, `Attended: ${reqData.event_title}`]
      );
    }

    await connection.commit();

    return res.json({
      success: true,
      message: `Attendance marked. Awarded ${points} points to student.`
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error in markAttendance:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark attendance.' });
  } finally {
    connection.release();
  }
}

module.exports = {
  getAdminStats,
  getRequests,
  approveRequest,
  rejectRequest,
  markAttendance
};
