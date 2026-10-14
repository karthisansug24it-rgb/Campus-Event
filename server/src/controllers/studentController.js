const { pool } = require('../config/db');
const {
  parseCollegeEmail,
  REGISTER_NUMBER_REGEX,
  VALID_SECTIONS
} = require('../utils/emailParser');

/**
 * POST /api/events/:id/requests
 * Submit a registration request for an event
 */
async function submitEventRequest(req, res) {
  try {
    const eventId = parseInt(req.params.id, 10);
    const user = req.user;
    const { name, email, section, registerNumber } = req.body;

    if (!name || !email || !section || !registerNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, section, and register number are all required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Security check: Request email must strictly match logged-in account's email
    if (cleanEmail !== user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Security violation: Request email does not match logged-in account.'
      });
    }

    // 2. Strict college email parsing and validation (Server re-derives everything)
    const parsed = parseCollegeEmail(cleanEmail);
    if (!parsed.valid) {
      return res.status(400).json({
        success: false,
        message: parsed.error,
        data: parsed
      });
    }

    // 3. Section validation ('A' - 'D')
    const cleanSection = section.toUpperCase().trim();
    if (!VALID_SECTIONS.includes(cleanSection)) {
      return res.status(400).json({
        success: false,
        message: `Section must be one of: ${VALID_SECTIONS.join(', ')}`
      });
    }

    // 4. Register number validation (8-15 alphanumeric)
    const cleanRegNo = registerNumber.trim();
    if (!REGISTER_NUMBER_REGEX.test(cleanRegNo)) {
      return res.status(400).json({
        success: false,
        message: 'Register number must be 8 to 15 alphanumeric characters.'
      });
    }

    // 5. Check event existence, deadline, and seat availability
    const [events] = await pool.query(
      `SELECT e.*,
              COALESCE(SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END), 0) AS approved_count
       FROM events e
       LEFT JOIN registration_requests r ON e.id = r.event_id
       WHERE e.id = ?
       GROUP BY e.id`,
      [eventId]
    );

    if (!events || events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    const event = events[0];
    const now = new Date();
    const deadline = new Date(event.registration_deadline);

    if (now > deadline) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline for this event has passed.'
      });
    }

    if (event.max_seats !== null) {
      const seatsLeft = event.max_seats - parseInt(event.approved_count || 0, 10);
      if (seatsLeft <= 0) {
        return res.status(400).json({
          success: false,
          message: 'This event has reached maximum seating capacity.'
        });
      }
    }

    // 6. Check existing request status
    const [existingRequests] = await pool.query(
      'SELECT id, status FROM registration_requests WHERE event_id = ? AND user_id = ?',
      [eventId, user.id]
    );

    let requestId;

    if (existingRequests && existingRequests.length > 0) {
      const existing = existingRequests[0];

      if (existing.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'You are already registered for this event.'
        });
      }

      if (existing.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Your registration request is already pending review by an admin.'
        });
      }

      // If rejected, allow re-application: resets the row to 'pending'
      if (existing.status === 'rejected') {
        await pool.query(
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
            name.trim(),
            parsed.departmentCode,
            cleanSection,
            cleanRegNo,
            parsed.email,
            parsed.admissionYear,
            parsed.yearOfStudy,
            existing.id
          ]
        );
        requestId = existing.id;
      }
    } else {
      // Insert new request
      const [insertResult] = await pool.query(
        `INSERT INTO registration_requests (
          event_id, user_id, name, department_code, section,
          register_number, email, admission_year, year_of_study, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          eventId,
          user.id,
          name.trim(),
          parsed.departmentCode,
          cleanSection,
          cleanRegNo,
          parsed.email,
          parsed.admissionYear,
          parsed.yearOfStudy
        ]
      );
      requestId = insertResult.insertId;
    }

    // Also update user's profile section / register number if previously unset
    await pool.query(
      `UPDATE users SET
         section = COALESCE(section, ?),
         register_number = COALESCE(register_number, ?)
       WHERE id = ?`,
      [cleanSection, cleanRegNo, user.id]
    );

    const [savedReq] = await pool.query('SELECT * FROM registration_requests WHERE id = ?', [requestId]);

    return res.status(201).json({
      success: true,
      message: 'Request sent to admin',
      data: savedReq[0]
    });
  } catch (error) {
    console.error('Error in submitEventRequest:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit registration request. Please try again.'
    });
  }
}

/**
 * GET /api/my/requests
 * Lists the authenticated student's event requests with status and admin notes
 */
async function getMyRequests(req, res) {
  try {
    const userId = req.user.id;

    const [requests] = await pool.query(
      `SELECT r.*,
              e.title AS event_title,
              e.description AS event_description,
              e.poster_url AS event_poster_url,
              e.event_type,
              e.category AS event_category,
              e.venue AS event_venue,
              e.organizer AS event_organizer,
              e.event_date,
              e.registration_deadline,
              e.reward_points,
              d.name AS department_name
       FROM registration_requests r
       JOIN events e ON r.event_id = e.id
       LEFT JOIN departments d ON r.department_code = d.code
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      message: 'Student requests retrieved.',
      data: requests
    });
  } catch (error) {
    console.error('Error in getMyRequests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your event requests.'
    });
  }
}

module.exports = {
  submitEventRequest,
  getMyRequests
};
