const { pool } = require('../config/db');

/**
 * Helper to compute seats left and registration availability for an event
 */
function enrichEventData(event, studentRequest = null) {
  const now = new Date();
  const deadline = new Date(event.registration_deadline);
  const isRegistrationClosed = now > deadline;
  const approvedCount = parseInt(event.approved_count || 0, 10);
  const maxSeats = event.max_seats !== null ? parseInt(event.max_seats, 10) : null;
  const seatsLeft = maxSeats !== null ? Math.max(0, maxSeats - approvedCount) : null;
  const isSeatsFull = maxSeats !== null && seatsLeft <= 0;

  // Compute button state for student
  // "Register" (enabled) | "Request Pending" (disabled) | "Registered ✓" (approved) | "Register Again" (after rejection) | "Registration Closed" or "Seats Full" (disabled)
  let studentStatus = null;
  let buttonState = 'Register';
  let buttonDisabled = false;

  if (studentRequest) {
    studentStatus = studentRequest.status;
    if (studentStatus === 'pending') {
      buttonState = 'Request Pending';
      buttonDisabled = true;
    } else if (studentStatus === 'approved') {
      buttonState = 'Registered ✓';
      buttonDisabled = true;
    } else if (studentStatus === 'rejected') {
      buttonState = 'Register Again';
      buttonDisabled = false; // allowed to re-apply
    }
  }

  // If not already registered / approved / pending, check if event is closed or full
  if (!studentRequest || studentStatus === 'rejected') {
    if (isRegistrationClosed) {
      buttonState = 'Registration Closed';
      buttonDisabled = true;
    } else if (isSeatsFull) {
      buttonState = 'Seats Full';
      buttonDisabled = true;
    }
  }

  return {
    ...event,
    approved_count: approvedCount,
    seats_left: seatsLeft,
    is_seats_full: isSeatsFull,
    is_registration_closed: isRegistrationClosed,
    student_request: studentRequest,
    button_state: buttonState,
    button_disabled: buttonDisabled
  };
}

/**
 * GET /api/events
 * List events with filtering (type, category, q, upcoming)
 */
async function getEvents(req, res) {
  try {
    const { type, category, q, upcoming } = req.query;
    const currentUserId = req.user ? req.user.id : null;

    let query = `
      SELECT e.*,
        u.name AS creator_name,
        COALESCE(SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END), 0) AS approved_count
        ${currentUserId ? `, MAX(CASE WHEN r.user_id = ? THEN r.status ELSE NULL END) AS my_request_status` : ''}
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN registration_requests r ON e.id = r.event_id
      WHERE 1=1
    `;

    const params = [];
    if (currentUserId) {
      params.push(currentUserId);
    }

    // Filter by type: 'internal' or 'external'
    if (type && type !== 'all') {
      const normalizedType = type === 'Inside' ? 'internal' : (type === 'Outside' ? 'external' : type.toLowerCase());
      query += ` AND e.event_type = ?`;
      params.push(normalizedType);
    }

    // Filter by category
    if (category && category !== 'all') {
      query += ` AND e.category = ?`;
      params.push(category);
    }

    // Filter by upcoming
    if (upcoming === 'true' || upcoming === true) {
      query += ` AND e.event_date >= NOW()`;
    }

    // Search query (title, description, organizer, venue)
    if (q && q.trim().length > 0) {
      query += ` AND (e.title LIKE ? OR e.description LIKE ? OR e.organizer LIKE ? OR e.venue LIKE ?)`;
      const searchPattern = `%${q.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` GROUP BY e.id ORDER BY e.event_date ASC`;

    const [rows] = await pool.query(query, params);

    const enrichedEvents = rows.map(ev => {
      let studentRequest = null;
      if (ev.my_request_status) {
        studentRequest = { status: ev.my_request_status };
      }
      return enrichEventData(ev, studentRequest);
    });

    return res.json({
      success: true,
      message: 'Events fetched successfully.',
      data: enrichedEvents
    });
  } catch (error) {
    console.error('Error in getEvents:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve events.'
    });
  }
}

/**
 * GET /api/events/:id
 * Retrieve single event with full detail, seats calculation, and student request status
 */
async function getEventById(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user ? req.user.id : null;

    const [events] = await pool.query(
      `SELECT e.*,
              u.name AS creator_name,
              COALESCE(SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END), 0) AS approved_count
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       LEFT JOIN registration_requests r ON e.id = r.event_id
       WHERE e.id = ?
       GROUP BY e.id`,
      [id]
    );

    if (!events || events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    const event = events[0];

    // Check student's request status if authenticated
    let studentRequest = null;
    if (currentUserId) {
      const [reqRows] = await pool.query(
        'SELECT * FROM registration_requests WHERE event_id = ? AND user_id = ?',
        [id, currentUserId]
      );
      if (reqRows && reqRows.length > 0) {
        studentRequest = reqRows[0];
      }
    }

    const enriched = enrichEventData(event, studentRequest);

    return res.json({
      success: true,
      message: 'Event details retrieved successfully.',
      data: enriched
    });
  } catch (error) {
    console.error('Error in getEventById:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve event details.'
    });
  }
}

/**
 * POST /api/events
 * Admin only: Create a new event with poster upload
 */
async function createEvent(req, res) {
  try {
    const {
      title,
      description,
      event_type,
      category,
      venue,
      organizer,
      event_date,
      registration_deadline,
      max_seats,
      reward_points,
      external_link
    } = req.body;

    if (!title || !description || !venue || !organizer || !event_date || !registration_deadline) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required event details.'
      });
    }

    // Determine poster URL (from uploaded file or body fallback)
    let poster_url = req.body.poster_url || null;
    if (req.file) {
      poster_url = `/uploads/${req.file.filename}`;
    }

    const eventDateObj = new Date(event_date);
    const deadlineObj = new Date(registration_deadline);

    if (deadlineObj > eventDateObj) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline cannot be after the event date.'
      });
    }

    const normalizedEventType = (event_type === 'external' || event_type === 'Outside College') ? 'external' : 'internal';
    const parsedMaxSeats = max_seats ? parseInt(max_seats, 10) : null;
    const parsedPoints = reward_points ? parseInt(reward_points, 10) : 0;
    const createdBy = req.user.id;

    const [result] = await pool.query(
      `INSERT INTO events (
        title, description, poster_url, event_type, category,
        venue, organizer, event_date, registration_deadline,
        max_seats, reward_points, external_link, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description.trim(),
        poster_url,
        normalizedEventType,
        category || 'Workshop',
        venue.trim(),
        organizer.trim(),
        event_date,
        registration_deadline,
        parsedMaxSeats,
        parsedPoints,
        external_link ? external_link.trim() : null,
        createdBy
      ]
    );

    const [createdEvent] = await pool.query('SELECT * FROM events WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      data: createdEvent[0]
    });
  } catch (error) {
    console.error('Error in createEvent:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create event.'
    });
  }
}

/**
 * PUT /api/events/:id
 * Admin only: Update existing event
 */
async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      event_type,
      category,
      venue,
      organizer,
      event_date,
      registration_deadline,
      max_seats,
      reward_points,
      external_link
    } = req.body;

    // Check event exists
    const [existing] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    let poster_url = existing[0].poster_url;
    if (req.file) {
      poster_url = `/uploads/${req.file.filename}`;
    } else if (req.body.poster_url !== undefined) {
      poster_url = req.body.poster_url;
    }

    const normalizedEventType = (event_type === 'external' || event_type === 'Outside College') ? 'external' : 'internal';
    const parsedMaxSeats = max_seats !== '' && max_seats !== null && max_seats !== undefined ? parseInt(max_seats, 10) : null;
    const parsedPoints = reward_points ? parseInt(reward_points, 10) : 0;

    await pool.query(
      `UPDATE events SET
        title = ?,
        description = ?,
        poster_url = ?,
        event_type = ?,
        category = ?,
        venue = ?,
        organizer = ?,
        event_date = ?,
        registration_deadline = ?,
        max_seats = ?,
        reward_points = ?,
        external_link = ?
      WHERE id = ?`,
      [
        title ? title.trim() : existing[0].title,
        description ? description.trim() : existing[0].description,
        poster_url,
        normalizedEventType,
        category || existing[0].category,
        venue ? venue.trim() : existing[0].venue,
        organizer ? organizer.trim() : existing[0].organizer,
        event_date || existing[0].event_date,
        registration_deadline || existing[0].registration_deadline,
        parsedMaxSeats,
        parsedPoints,
        external_link ? external_link.trim() : null,
        id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'Event updated successfully.',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error in updateEvent:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update event.'
    });
  }
}

/**
 * DELETE /api/events/:id
 * Admin only: Delete an event
 */
async function deleteEvent(req, res) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM events WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    await pool.query('DELETE FROM events WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'Event deleted successfully.'
    });
  } catch (error) {
    console.error('Error in deleteEvent:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete event.'
    });
  }
}

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};
