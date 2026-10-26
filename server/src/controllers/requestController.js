const { pool } = require('../config/db');
const { parseCollegeEmail } = require('../utils/emailParser');
const { REGISTER_NUMBER_REGEX, VALID_SECTIONS } = require('./authController');

/**
 * POST /api/events/:id/requests
 * Student registers for an event. Optionally uploads registration screenshot proof.
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
  if (!parsed.valid || parsed.accountType !== 'student') {
    return res.status(400).json({
      success: false,
      message: parsed.error || 'Only verified students can submit registration requests for campus events.'
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
  const screenshotUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.registration_screenshot || null);

  try {
    // 6. Check Event existence, deadline, and capacity
    const [eventRows] = await pool.execute(
      `SELECT e.*, 
              COUNT(CASE WHEN rr.status IN ('registration_approved', 'approved', 'participated', 'ranked') THEN 1 END) AS approved_count
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
      'SELECT id, status, registration_screenshot FROM registration_requests WHERE event_id = ? AND user_id = ? LIMIT 1',
      [eventId, req.user.id]
    );

    if (existing.length > 0) {
      const currentStatus = existing[0].status;

      // 1. Rule: Once registered, student cannot submit duplicate registration requests
      if (['registered', 'pending', 'registration_approved', 'approved', 'participated', 'ranked'].includes(currentStatus)) {
        return res.status(400).json({
          success: false,
          message: 'You have already registered for this event. You cannot register again.'
        });
      }

      // 2. Rule: After admin rejection, student cannot register again
      if (currentStatus === 'rejected') {
        return res.status(400).json({
          success: false,
          message: 'Your registration was rejected by the admin. You cannot register again for this event.'
        });
      }
    }

    // 8. Insert new registration request with status 'registered'
    const [insertResult] = await pool.execute(
      `INSERT INTO registration_requests (
        event_id, user_id, name, department_code, section, register_number, 
        email, admission_year, year_of_study, status, registration_screenshot, screenshot_uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'registered', ?, ?)`,
      [
        eventId,
        req.user.id,
        studentName,
        parsed.departmentCode,
        normalizedSection,
        regNumber,
        studentEmail,
        parsed.admissionYear,
        parsed.yearOfStudy,
        screenshotUrl,
        screenshotUrl ? new Date() : null
      ]
    );

    // Also update student's profile defaults if they weren't saved before
    await pool.execute(
      `UPDATE users SET section = COALESCE(section, ?), register_number = COALESCE(register_number, ?) WHERE id = ?`,
      [normalizedSection, regNumber, req.user.id]
    );

    return res.status(201).json({
      success: true,
      message: screenshotUrl ? 'Registered! Screenshot proof submitted for admin verification.' : 'Registered! Please upload your registration screenshot proof for admin approval.',
      data: {
        requestId: insertResult.insertId,
        status: 'registered',
        registration_screenshot: screenshotUrl
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
 * POST /api/my/requests/:id/screenshot
 * Student uploads or updates registration screenshot proof.
 */
async function uploadRegistrationScreenshot(req, res) {
  try {
    const requestId = parseInt(req.params.id, 10);
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No screenshot file provided. Please upload a valid image (JPG, PNG, WebP).'
      });
    }

    const [rows] = await pool.execute(
      'SELECT id, event_id, status FROM registration_requests WHERE id = ? AND user_id = ? LIMIT 1',
      [requestId, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration record not found.'
      });
    }

    const request = rows[0];
    if (request.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot upload screenshot for a rejected registration.'
      });
    }

    const screenshotUrl = `/uploads/${req.file.filename}`;

    await pool.execute(
      `UPDATE registration_requests SET
        registration_screenshot = ?,
        screenshot_uploaded_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [screenshotUrl, requestId, req.user.id]
    );

    return res.json({
      success: true,
      message: 'Registration screenshot uploaded successfully! Admin will verify and approve.',
      data: {
        requestId,
        registration_screenshot: screenshotUrl,
        screenshot_uploaded_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[uploadRegistrationScreenshot Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload registration screenshot.'
    });
  }
}

/**
 * POST /api/my/requests/:id/certificate
 * Student uploads participation certificate for an approved event.
 */
async function uploadParticipationCertificate(req, res) {
  try {
    const requestId = parseInt(req.params.id, 10);
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No certificate file provided. Please upload an image (JPG, PNG) or PDF document.'
      });
    }

    const [rows] = await pool.execute(
      `SELECT rr.id, rr.event_id, rr.status, e.title AS event_title, e.certificate_deadline, e.event_date
       FROM registration_requests rr
       JOIN events e ON rr.event_id = e.id
       WHERE rr.id = ? AND rr.user_id = ? LIMIT 1`,
      [requestId, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration record not found.'
      });
    }

    const request = rows[0];
    const allowedStatuses = ['registration_approved', 'approved', 'participated', 'ranked'];
    if (!allowedStatuses.includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: 'Certificate can only be uploaded after your event registration is approved by the admin.'
      });
    }

    // Check certificate deadline if set
    if (request.certificate_deadline && new Date() > new Date(request.certificate_deadline)) {
      return res.status(400).json({
        success: false,
        message: `Certificate submission deadline (${new Date(request.certificate_deadline).toLocaleString()}) has passed.`
      });
    }

    const certUrl = `/uploads/${req.file.filename}`;
    const nextStatus = request.status === 'ranked' ? 'ranked' : 'participated';

    await pool.execute(
      `UPDATE registration_requests SET
        certificate_url = ?,
        certificate_uploaded_at = NOW(),
        status = ?
       WHERE id = ? AND user_id = ?`,
      [certUrl, nextStatus, requestId, req.user.id]
    );

    return res.json({
      success: true,
      message: 'Participation certificate uploaded successfully! Admin will verify and rank your participation.',
      data: {
        requestId,
        certificate_url: certUrl,
        certificate_uploaded_at: new Date().toISOString(),
        status: nextStatus
      }
    });
  } catch (error) {
    console.error('[uploadParticipationCertificate Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload participation certificate.'
    });
  }
}

/**
 * GET /api/my/requests
 * Student retrieves all their own registration requests with progress stages and uploaded proof.
 */
async function getMyRequests(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        rr.id,
        rr.event_id,
        rr.status,
        rr.registration_screenshot,
        rr.screenshot_uploaded_at,
        rr.certificate_url,
        rr.certificate_uploaded_at,
        rr.rank_position,
        rr.rank_points_awarded,
        rr.ranked_at,
        rr.admin_note,
        rr.created_at AS requested_at,
        rr.reviewed_at,
        rr.section,
        rr.register_number,
        rr.year_of_study,
        rr.attended,
        e.title AS event_title,
        e.description AS event_description,
        e.poster_url,
        e.event_type,
        e.category,
        e.venue,
        e.organizer,
        e.event_date,
        e.registration_deadline,
        e.certificate_deadline,
        e.max_seats,
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
 * GET /api/my/alerts
 * Student deadline alerts and action notifications.
 */
async function getStudentAlerts(req, res) {
  try {
    const studentId = req.user.id;

    // 1. Pending registration screenshots
    const [missingScreenshots] = await pool.execute(
      `SELECT rr.id, rr.event_id, e.title AS event_title, e.registration_deadline, e.event_date
       FROM registration_requests rr
       JOIN events e ON rr.event_id = e.id
       WHERE rr.user_id = ?
         AND rr.status IN ('registered', 'pending')
         AND (rr.registration_screenshot IS NULL OR rr.registration_screenshot = '')
       ORDER BY e.registration_deadline ASC`,
      [studentId]
    );

    // 2. Pending certificates (Event approved, event finished or approaching cert deadline)
    const [pendingCertificates] = await pool.execute(
      `SELECT rr.id, rr.event_id, e.title AS event_title, e.event_date, e.certificate_deadline, e.reward_points
       FROM registration_requests rr
       JOIN events e ON rr.event_id = e.id
       WHERE rr.user_id = ?
         AND rr.status IN ('registration_approved', 'approved')
         AND (rr.certificate_url IS NULL OR rr.certificate_url = '')
         AND (e.certificate_deadline IS NULL OR e.certificate_deadline > NOW())
       ORDER BY e.certificate_deadline ASC, e.event_date ASC`,
      [studentId]
    );

    // 3. Recently ranked / verified events
    const [recentAwards] = await pool.execute(
      `SELECT rr.id, rr.event_id, rr.rank_position, rr.rank_points_awarded, e.title AS event_title, rr.ranked_at
       FROM registration_requests rr
       JOIN events e ON rr.event_id = e.id
       WHERE rr.user_id = ? AND rr.status = 'ranked'
       ORDER BY rr.ranked_at DESC
       LIMIT 5`,
      [studentId]
    );

    return res.json({
      success: true,
      data: {
        missingScreenshots,
        pendingCertificates,
        recentAwards
      }
    });
  } catch (error) {
    console.error('[getStudentAlerts Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student alerts.'
    });
  }
}

/**
 * GET /api/admin/requests
 * Admin views all requests with multi-stage filter (registered, registration_approved, participated, ranked, rejected).
 */
async function getAdminRequests(req, res) {
  try {
    const { status, eventId } = req.query;

    let query = `
      SELECT 
        rr.id,
        rr.status,
        rr.registration_screenshot,
        rr.screenshot_uploaded_at,
        rr.certificate_url,
        rr.certificate_uploaded_at,
        rr.rank_position,
        rr.rank_points_awarded,
        rr.ranked_at,
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
        rr.attended,
        e.id AS event_id,
        e.title AS event_title,
        e.poster_url,
        e.event_date,
        e.registration_deadline,
        e.certificate_deadline,
        e.venue AS event_venue,
        e.event_type,
        e.category AS event_category,
        e.max_seats,
        e.reward_points,
        u_reviewer.name AS reviewer_name,
        u_ranked.name AS ranked_by_name,
        CASE 
          WHEN rr.department_code != SUBSTRING_INDEX(SUBSTRING_INDEX(rr.email, '@', 1), '.', -1) THEN 1
          ELSE 0
        END AS has_mismatch
       FROM registration_requests rr
       JOIN events e ON rr.event_id = e.id
       JOIN departments d ON rr.department_code = d.code
       LEFT JOIN users u_reviewer ON rr.reviewed_by = u_reviewer.id
       LEFT JOIN users u_ranked ON rr.ranked_by = u_ranked.id
       WHERE 1=1
    `;

    const params = [];

    // Stage & Status Filtering
    if (status && status !== 'all') {
      if (status === 'registered' || status === 'pending') {
        query += " AND rr.status IN ('registered', 'pending')";
      } else if (status === 'registration_approved' || status === 'approved') {
        query += " AND rr.status IN ('registration_approved', 'approved')";
      } else if (status === 'participated') {
        query += " AND rr.status = 'participated'";
      } else if (status === 'ranked') {
        query += " AND rr.status = 'ranked'";
      } else if (status === 'rejected') {
        query += " AND rr.status = 'rejected'";
      }
    }

    if (eventId) {
      query += ' AND rr.event_id = ?';
      params.push(parseInt(eventId, 10));
    }

    if (req.query.department && req.query.department !== 'all') {
      query += ' AND rr.department_code = ?';
      params.push(req.query.department);
    }

    if (req.query.year && req.query.year !== 'all') {
      query += ' AND (rr.year_of_study = ? OR CAST(rr.year_of_study AS CHAR) = ?)';
      params.push(req.query.year, req.query.year);
    }

    if (req.query.timeline === 'past') {
      query += ' AND e.event_date < NOW()';
    } else if (req.query.timeline === 'upcoming') {
      query += ' AND e.event_date >= NOW()';
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
 * Admin approves a student's registration and verifies screenshot proof within a transaction.
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

    if (['registration_approved', 'approved'].includes(request.status)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'This registration request is already approved.'
      });
    }

    // 2. Lock event row to check seat availability safely
    const [eventRows] = await connection.execute(
      `SELECT e.id, e.title, e.max_seats,
              (SELECT COUNT(*) FROM registration_requests WHERE event_id = e.id AND status IN ('registration_approved', 'approved', 'participated', 'ranked')) AS approved_count
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

    // 3. Update request status to registration_approved
    await connection.execute(
      `UPDATE registration_requests SET
        status = 'registration_approved',
        admin_note = NULL,
        reviewed_by = ?,
        reviewed_at = NOW()
       WHERE id = ?`,
      [req.user.id, requestId]
    );

    await connection.commit();

    return res.json({
      success: true,
      message: 'Registration screenshot verified and approved! Student seat is confirmed.'
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
 * PATCH /api/admin/requests/:id/rank
 * Admin verifies student certificate and awards rank: 1, 2, 3, or participated + reward points.
 */
async function rankRequest(req, res) {
  const requestId = parseInt(req.params.id, 10);
  const { rank_position, bonus_points, custom_points, note } = req.body;

  const validRanks = ['1', '2', '3', 'participated'];
  if (!validRanks.includes(rank_position)) {
    return res.status(400).json({
      success: false,
      message: 'Rank must be one of: 1, 2, 3, or participated.'
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT rr.id, rr.user_id, rr.event_id, rr.status, rr.rank_position, rr.rank_points_awarded,
              rr.certificate_url, e.title AS event_title, e.reward_points
       FROM registration_requests rr
       JOIN events e ON rr.event_id = e.id
       WHERE rr.id = ? LIMIT 1 FOR UPDATE`,
      [requestId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Registration record not found.'
      });
    }

    const request = rows[0];
    const basePoints = parseInt(request.reward_points || 0, 10);
    let totalPoints = basePoints;

    if (custom_points !== undefined && custom_points !== null && !isNaN(custom_points)) {
      totalPoints = parseInt(custom_points, 10);
    } else {
      let rankBonus = 0;
      if (rank_position === '1') rankBonus = 50;
      else if (rank_position === '2') rankBonus = 30;
      else if (rank_position === '3') rankBonus = 20;

      if (bonus_points !== undefined && !isNaN(bonus_points)) {
        rankBonus = parseInt(bonus_points, 10);
      }
      totalPoints = basePoints + rankBonus;
    }

    const previousPoints = parseInt(request.rank_points_awarded || 0, 10);
    const pointsDelta = totalPoints - previousPoints;

    // Update registration request
    await connection.execute(
      `UPDATE registration_requests SET
        status = 'ranked',
        rank_position = ?,
        rank_points_awarded = ?,
        ranked_by = ?,
        ranked_at = NOW(),
        attended = 1,
        admin_note = COALESCE(?, admin_note)
       WHERE id = ?`,
      [rank_position, totalPoints, req.user.id, note ? note.trim() : null, requestId]
    );

    // Update student's user profile total points
    if (pointsDelta !== 0 && request.user_id) {
      await connection.execute(
        'UPDATE users SET total_points = GREATEST(0, total_points + ?) WHERE id = ?',
        [pointsDelta, request.user_id]
      );

      // Clean old points log for this event/request
      await connection.execute(
        'DELETE FROM points_log WHERE user_id = ? AND event_id = ?',
        [request.user_id, request.event_id]
      );

      const rankTitle = rank_position === '1' ? '1st Place Winner' :
                        rank_position === '2' ? '2nd Place Runner Up' :
                        rank_position === '3' ? '3rd Place Runner Up' : 'Verified Participation';

      await connection.execute(
        `INSERT INTO points_log (user_id, event_id, points, reason)
         VALUES (?, ?, ?, ?)`,
        [request.user_id, request.event_id, totalPoints, `${rankTitle} - ${request.event_title}`]
      );
    }

    await connection.commit();

    return res.json({
      success: true,
      message: `Verified and awarded Rank ${rank_position.toUpperCase()} with ${totalPoints} PTS!`,
      data: {
        requestId,
        rank_position,
        rank_points_awarded: totalPoints,
        ranked_at: new Date().toISOString()
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('[rankRequest Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify and rank student.'
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
 * Dashboard statistics for Admin across stages.
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
        COUNT(CASE WHEN status IN ('registered', 'pending') THEN 1 END) AS registered_requests,
        COUNT(CASE WHEN status IN ('registration_approved', 'approved') THEN 1 END) AS approved_registrations,
        COUNT(CASE WHEN status = 'participated' THEN 1 END) AS participated_requests,
        COUNT(CASE WHEN status = 'ranked' THEN 1 END) AS ranked_requests,
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
        registeredRequests: Number(requestStats.registered_requests || 0),
        pendingRequests: Number(requestStats.registered_requests || 0),
        approvedRegistrations: Number(requestStats.approved_registrations || 0),
        participatedRequests: Number(requestStats.participated_requests || 0),
        rankedRequests: Number(requestStats.ranked_requests || 0),
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

/**
 * GET /api/admin/alerts
 * Critical pending counts and upcoming deadlines for administrators.
 */
async function getAdminAlerts(req, res) {
  try {
    const [[{ pendingScreenshots }]] = await pool.execute(`
      SELECT COUNT(*) AS pendingScreenshots
      FROM registration_requests
      WHERE status IN ('registered', 'pending')
    `);

    const [[{ pendingCertificates }]] = await pool.execute(`
      SELECT COUNT(*) AS pendingCertificates
      FROM registration_requests
      WHERE status = 'participated' AND certificate_url IS NOT NULL
    `);

    const [closingSoon] = await pool.execute(`
      SELECT id, title, registration_deadline, max_seats,
             (SELECT COUNT(*) FROM registration_requests WHERE event_id = e.id AND status IN ('registration_approved', 'approved', 'participated', 'ranked')) AS approved_count
      FROM events e
      WHERE registration_deadline BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 48 HOUR)
      ORDER BY registration_deadline ASC
    `);

    const [certClosingSoon] = await pool.execute(`
      SELECT id, title, certificate_deadline
      FROM events
      WHERE certificate_deadline BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 72 HOUR)
      ORDER BY certificate_deadline ASC
    `);

    return res.json({
      success: true,
      data: {
        pendingScreenshots: Number(pendingScreenshots || 0),
        pendingCertificates: Number(pendingCertificates || 0),
        closingSoon,
        certClosingSoon
      }
    });
  } catch (error) {
    console.error('[getAdminAlerts Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve administrative alerts.'
    });
  }
}

/**
 * PATCH /api/admin/requests/bulk-approve
 * Admin bulk approves registration requests with seat limit checks.
 */
async function bulkApproveRequests(req, res) {
  const { requestIds } = req.body;
  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'requestIds must be a non-empty array of registration request IDs.'
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const approved = [];
    const skipped = [];

    for (const rawId of requestIds) {
      const reqId = parseInt(rawId, 10);
      if (isNaN(reqId)) continue;

      const [reqRows] = await connection.execute(
        'SELECT id, event_id, user_id, status, name FROM registration_requests WHERE id = ? FOR UPDATE',
        [reqId]
      );

      if (reqRows.length === 0) {
        skipped.push({ id: reqId, reason: 'Request not found' });
        continue;
      }

      const request = reqRows[0];
      if (['registration_approved', 'approved'].includes(request.status)) {
        skipped.push({ id: reqId, name: request.name, reason: 'Already approved' });
        continue;
      }

      // Check event seat limit
      const [eventRows] = await connection.execute(
        `SELECT id, title, max_seats,
                (SELECT COUNT(*) FROM registration_requests WHERE event_id = e.id AND status IN ('registration_approved', 'approved', 'participated', 'ranked')) AS approved_count
         FROM events e
         WHERE e.id = ? FOR UPDATE`,
        [request.event_id]
      );

      if (eventRows.length === 0) {
        skipped.push({ id: reqId, name: request.name, reason: 'Associated event not found' });
        continue;
      }

      const event = eventRows[0];
      if (event.max_seats !== null && Number(event.approved_count) >= event.max_seats) {
        skipped.push({
          id: reqId,
          name: request.name,
          reason: `Event "${event.title}" is full (${event.max_seats} seats limit)`
        });
        continue;
      }

      await connection.execute(
        `UPDATE registration_requests SET
          status = 'registration_approved',
          admin_note = NULL,
          reviewed_by = ?,
          reviewed_at = NOW()
         WHERE id = ?`,
        [req.user.id, reqId]
      );

      approved.push({ id: reqId, name: request.name, eventId: request.event_id });
    }

    await connection.commit();

    return res.json({
      success: true,
      message: `Approved ${approved.length} student registration(s).${skipped.length > 0 ? ` (${skipped.length} skipped)` : ''}`,
      data: {
        approvedCount: approved.length,
        skippedCount: skipped.length,
        approved,
        skipped
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('[bulkApproveRequests Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete bulk approval.'
    });
  } finally {
    connection.release();
  }
}

/**
 * PATCH /api/admin/requests/bulk-reject
 * Admin bulk rejects registration requests with an optional reason note.
 */
async function bulkRejectRequests(req, res) {
  const { requestIds, admin_note, note } = req.body;
  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'requestIds must be a non-empty array of registration request IDs.'
    });
  }

  const reason = (admin_note || note || '').trim() || 'Rejected by administration.';

  try {
    const validIds = requestIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid request IDs provided.' });
    }

    const placeholders = validIds.map(() => '?').join(',');
    const [result] = await pool.query(
      `UPDATE registration_requests SET
        status = 'rejected',
        admin_note = ?,
        reviewed_by = ?,
        reviewed_at = NOW()
       WHERE id IN (${placeholders})`,
      [reason, req.user.id, ...validIds]
    );

    return res.json({
      success: true,
      message: `Rejected ${result.affectedRows} student request(s).`,
      data: {
        rejectedCount: result.affectedRows
      }
    });
  } catch (error) {
    console.error('[bulkRejectRequests Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete bulk rejection.'
    });
  }
}

/**
 * GET /api/admin/events/:id/attendees
 * Retrieve all registered students for a specific event with rank and stage tracking.
 */
async function getEventAttendees(req, res) {
  const eventId = parseInt(req.params.id, 10);
  try {
    const [eventRows] = await pool.execute(
      `SELECT e.*, 
              COUNT(CASE WHEN rr.status IN ('registration_approved', 'approved', 'participated', 'ranked') THEN 1 END) AS approved_count,
              COUNT(CASE WHEN rr.status IN ('registered', 'pending') THEN 1 END) AS pending_count,
              COUNT(CASE WHEN rr.status = 'rejected' THEN 1 END) AS rejected_count,
              COUNT(CASE WHEN rr.status = 'ranked' THEN 1 END) AS ranked_count,
              COUNT(CASE WHEN rr.attended = 1 THEN 1 END) AS attended_count
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
    event.is_past = new Date(event.event_date) < now;

    const [attendees] = await pool.execute(
      `SELECT 
        rr.id,
        rr.user_id,
        rr.name,
        rr.email,
        rr.department_code,
        d.name AS department_name,
        rr.section,
        rr.register_number,
        rr.admission_year,
        rr.year_of_study,
        rr.status,
        rr.registration_screenshot,
        rr.screenshot_uploaded_at,
        rr.certificate_url,
        rr.certificate_uploaded_at,
        rr.rank_position,
        rr.rank_points_awarded,
        rr.ranked_at,
        rr.admin_note,
        rr.reviewed_at,
        rr.attended,
        rr.created_at,
        u_reviewer.name AS reviewer_name,
        u_ranked.name AS ranked_by_name
       FROM registration_requests rr
       JOIN departments d ON rr.department_code = d.code
       LEFT JOIN users u_reviewer ON rr.reviewed_by = u_reviewer.id
       LEFT JOIN users u_ranked ON rr.ranked_by = u_ranked.id
       WHERE rr.event_id = ?
       ORDER BY 
         CASE 
           WHEN rr.rank_position = '1' THEN 0
           WHEN rr.rank_position = '2' THEN 1
           WHEN rr.rank_position = '3' THEN 2
           WHEN rr.status = 'ranked' THEN 3
           WHEN rr.status = 'participated' THEN 4
           WHEN rr.status IN ('registration_approved', 'approved') THEN 5
           WHEN rr.status IN ('registered', 'pending') THEN 6
           ELSE 7
         END,
         rr.name ASC`,
      [eventId]
    );

    return res.json({
      success: true,
      data: {
        event,
        attendees
      }
    });
  } catch (error) {
    console.error('[getEventAttendees Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve event registered students.'
    });
  }
}

/**
 * PATCH /api/admin/requests/:id/attendance
 * Toggle attendance status for a student request and credit/revert reward points.
 */
async function toggleAttendance(req, res) {
  const requestId = parseInt(req.params.id, 10);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT rr.id, rr.user_id, rr.event_id, rr.attended, rr.status,
              e.title AS event_title, e.reward_points
       FROM registration_requests rr
       JOIN events e ON rr.event_id = e.id
       WHERE rr.id = ? LIMIT 1 FOR UPDATE`,
      [requestId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Registration request not found.'
      });
    }

    const request = rows[0];
    const newAttended = request.attended ? 0 : 1;
    const rewardPoints = parseInt(request.reward_points || 0, 10);

    // Update attendance status on the registration request
    await connection.execute(
      'UPDATE registration_requests SET attended = ? WHERE id = ?',
      [newAttended, requestId]
    );

    if (rewardPoints > 0 && request.user_id) {
      if (newAttended === 1) {
        // Credit points to student user account
        await connection.execute(
          'UPDATE users SET total_points = total_points + ? WHERE id = ?',
          [rewardPoints, request.user_id]
        );

        // Record in points_log
        await connection.execute(
          `INSERT INTO points_log (user_id, event_id, points, reason)
           VALUES (?, ?, ?, ?)`,
          [request.user_id, request.event_id, rewardPoints, `Attended Event: ${request.event_title}`]
        );
      } else {
        // Revert points if attendance is marked Absent
        await connection.execute(
          'UPDATE users SET total_points = GREATEST(0, total_points - ?) WHERE id = ?',
          [rewardPoints, request.user_id]
        );

        // Clean up points log entry
        await connection.execute(
          'DELETE FROM points_log WHERE user_id = ? AND event_id = ? LIMIT 1',
          [request.user_id, request.event_id]
        );
      }
    }

    await connection.commit();

    return res.json({
      success: true,
      message: newAttended
        ? `Student marked as Present. Credited +${rewardPoints} reward points!`
        : `Student marked as Absent. Reverted ${rewardPoints} reward points.`,
      data: {
        requestId,
        attended: Boolean(newAttended),
        rewardPoints: newAttended ? rewardPoints : 0
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('[toggleAttendance Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update attendance status.'
    });
  } finally {
    connection.release();
  }
}

/**
 * GET /api/admin/departments
 * List all college academic departments
 */
async function getDepartments(req, res) {
  try {
    const [rows] = await pool.execute('SELECT code, name FROM departments ORDER BY name ASC');
    return res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('[getDepartments Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve departments list.'
    });
  }
}

module.exports = {
  submitRegistrationRequest,
  uploadRegistrationScreenshot,
  uploadParticipationCertificate,
  getMyRequests,
  getStudentAlerts,
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
};
