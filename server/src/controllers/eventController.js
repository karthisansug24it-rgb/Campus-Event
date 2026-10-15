const { pool } = require('../config/db');
const { extractPosterDetails } = require('../services/posterParser');

/**
 * POST /api/events/extract-poster
 * Admin only: Upload poster image and auto-extract structured event specifications.
 */
async function extractPoster(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No poster image file provided. Please upload a JPG, PNG, or WebP poster.'
      });
    }

    const customApiKey = req.body.apiKey ? String(req.body.apiKey).trim() : null;
    const result = await extractPosterDetails(req.file.path, customApiKey);

    // Provide the uploaded poster URL so it can be previewed and reused
    const posterUrl = `/uploads/${req.file.filename}`;

    return res.json({
      success: true,
      message: 'Poster analyzed successfully.',
      method: result.method, // 'gemini' or 'ocr'
      poster_url: posterUrl,
      temp_filename: req.file.filename,
      data: {
        ...result.data,
        poster_url: posterUrl
      }
    });
  } catch (error) {
    console.error('[extractPoster Error]:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to analyze poster: ${error.message}`
    });
  }
}

/**
 * GET /api/events
 * List events with optional filters (type, category, q, upcoming)
 * Returns seat availability and logged-in student request status.
 */
async function getAllEvents(req, res) {
  try {
    const { type, category, q, upcoming } = req.query;
    const currentUserId = req.user ? req.user.id : null;

    let query = `
      SELECT 
        e.id, 
        e.title, 
        e.description, 
        e.poster_url, 
        e.event_type, 
        e.category, 
        e.venue, 
        e.organizer, 
        e.event_date, 
        e.registration_deadline, 
        e.max_seats, 
        e.reward_points, 
        e.external_link,
        e.created_at,
        COUNT(CASE WHEN rr.status = 'approved' THEN 1 END) AS approved_count,
        COUNT(CASE WHEN rr.status = 'pending' THEN 1 END) AS pending_count
    `;

    if (currentUserId) {
      query += `,
        MAX(CASE WHEN rr.user_id = ? THEN rr.status ELSE NULL END) AS user_request_status,
        MAX(CASE WHEN rr.user_id = ? THEN rr.id ELSE NULL END) AS user_request_id
      `;
    }

    query += `
      FROM events e
      LEFT JOIN registration_requests rr ON e.id = rr.event_id
      WHERE 1=1
    `;

    const params = [];
    if (currentUserId) {
      params.push(currentUserId, currentUserId);
    }

    if (type && ['internal', 'external'].includes(type)) {
      query += ' AND e.event_type = ?';
      params.push(type);
    }

    if (category && category !== 'All') {
      query += ' AND e.category = ?';
      params.push(category);
    }

    if (q && q.trim()) {
      query += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.venue LIKE ? OR e.organizer LIKE ?)';
      const searchParam = `%${q.trim()}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (upcoming === 'true' || upcoming === true) {
      query += ' AND e.event_date >= NOW()';
    }

    query += ` GROUP BY e.id ORDER BY 
      CASE WHEN e.event_date >= NOW() THEN 0 ELSE 1 END ASC,
      CASE WHEN e.event_date >= NOW() THEN e.event_date END ASC,
      e.event_date DESC`;

    const [rows] = await pool.execute(query, params);

    const now = new Date();
    const formattedEvents = rows.map(ev => {
      const maxSeats = ev.max_seats;
      const approvedCount = Number(ev.approved_count || 0);
      const seatsLeft = maxSeats !== null ? Math.max(0, maxSeats - approvedCount) : null;
      const isPastDeadline = new Date(ev.registration_deadline) < now;
      const isSeatsFull = maxSeats !== null && seatsLeft <= 0;

      return {
        ...ev,
        approved_count: approvedCount,
        pending_count: Number(ev.pending_count || 0),
        seats_left: seatsLeft,
        is_past_deadline: isPastDeadline,
        is_seats_full: isSeatsFull,
        user_request_status: ev.user_request_status || null,
        user_request_id: ev.user_request_id || null
      };
    });

    return res.json({
      success: true,
      data: formattedEvents
    });
  } catch (error) {
    console.error('[getAllEvents Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve events.'
    });
  }
}

/**
 * GET /api/events/:id
 * Retrieve single event details including seat capacity and current student's registration status.
 */
async function getEventById(req, res) {
  try {
    const eventId = parseInt(req.params.id, 10);
    const currentUserId = req.user ? req.user.id : null;

    let query = `
      SELECT 
        e.*,
        u.name AS creator_name,
        COUNT(CASE WHEN rr.status = 'approved' THEN 1 END) AS approved_count,
        COUNT(CASE WHEN rr.status = 'pending' THEN 1 END) AS pending_count
    `;

    if (currentUserId) {
      query += `,
        MAX(CASE WHEN rr.user_id = ? THEN rr.status ELSE NULL END) AS user_request_status,
        MAX(CASE WHEN rr.user_id = ? THEN rr.admin_note ELSE NULL END) AS user_admin_note,
        MAX(CASE WHEN rr.user_id = ? THEN rr.created_at ELSE NULL END) AS user_requested_at,
        MAX(CASE WHEN rr.user_id = ? THEN rr.id ELSE NULL END) AS user_request_id
      `;
    }

    query += `
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN registration_requests rr ON e.id = rr.event_id
      WHERE e.id = ?
      GROUP BY e.id
      LIMIT 1
    `;

    const params = [];
    if (currentUserId) {
      params.push(currentUserId, currentUserId, currentUserId, currentUserId);
    }
    params.push(eventId);

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    const ev = rows[0];
    const now = new Date();
    const maxSeats = ev.max_seats;
    const approvedCount = Number(ev.approved_count || 0);
    const seatsLeft = maxSeats !== null ? Math.max(0, maxSeats - approvedCount) : null;
    const isPastDeadline = new Date(ev.registration_deadline) < now;
    const isSeatsFull = maxSeats !== null && seatsLeft <= 0;

    return res.json({
      success: true,
      data: {
        ...ev,
        approved_count: approvedCount,
        pending_count: Number(ev.pending_count || 0),
        seats_left: seatsLeft,
        is_past_deadline: isPastDeadline,
        is_seats_full: isSeatsFull,
        user_request_status: ev.user_request_status || null,
        user_admin_note: ev.user_admin_note || null,
        user_requested_at: ev.user_requested_at || null,
        user_request_id: ev.user_request_id || null
      }
    });
  } catch (error) {
    console.error('[getEventById Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve event details.'
    });
  }
}

/**
 * Helper to convert ISO string or date inputs to MySQL compliant YYYY-MM-DD HH:MM:SS
 */
function toMySQLDateTime(dateVal) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return dateVal;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * POST /api/events
 * Admin only: Create a new event with optional poster upload.
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

    const posterUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.poster_url || null);
    const formattedEventDate = toMySQLDateTime(event_date);
    const deadlineValue = registration_deadline || event_date;
    const formattedDeadline = toMySQLDateTime(deadlineValue);

    const [result] = await pool.execute(
      `INSERT INTO events (
        title, description, poster_url, event_type, category, 
        venue, organizer, event_date, registration_deadline, 
        max_seats, reward_points, external_link, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description.trim(),
        posterUrl,
        event_type,
        category,
        venue.trim(),
        organizer.trim(),
        formattedEventDate,
        formattedDeadline,
        max_seats ? parseInt(max_seats, 10) : null,
        reward_points ? parseInt(reward_points, 10) : 0,
        external_link ? external_link.trim() : null,
        req.user.id
      ]
    );

    const [newEventRows] = await pool.execute(
      'SELECT * FROM events WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      data: newEventRows[0]
    });
  } catch (error) {
    console.error('[createEvent Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create event.'
    });
  }
}

/**
 * PUT /api/events/:id
 * Admin only: Update event details and optionally replace poster.
 */
async function updateEvent(req, res) {
  try {
    const eventId = parseInt(req.params.id, 10);

    const [existing] = await pool.execute(
      'SELECT * FROM events WHERE id = ? LIMIT 1',
      [eventId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

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

    let posterUrl = existing[0].poster_url;
    if (req.file) {
      posterUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.poster_url !== undefined) {
      posterUrl = req.body.poster_url;
    }

    await pool.execute(
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
        posterUrl,
        event_type || existing[0].event_type,
        category || existing[0].category,
        venue ? venue.trim() : existing[0].venue,
        organizer ? organizer.trim() : existing[0].organizer,
        event_date ? toMySQLDateTime(event_date) : existing[0].event_date,
        registration_deadline ? toMySQLDateTime(registration_deadline) : (event_date ? toMySQLDateTime(event_date) : existing[0].registration_deadline),
        max_seats !== undefined ? (max_seats ? parseInt(max_seats, 10) : null) : existing[0].max_seats,
        reward_points !== undefined ? parseInt(reward_points, 10) : existing[0].reward_points,
        external_link !== undefined ? (external_link ? external_link.trim() : null) : existing[0].external_link,
        eventId
      ]
    );

    const [updatedRows] = await pool.execute(
      'SELECT * FROM events WHERE id = ? LIMIT 1',
      [eventId]
    );

    return res.json({
      success: true,
      message: 'Event updated successfully.',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('[updateEvent Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update event.'
    });
  }
}

/**
 * DELETE /api/events/:id
 * Admin only: Delete an event.
 */
async function deleteEvent(req, res) {
  try {
    const eventId = parseInt(req.params.id, 10);

    const [existing] = await pool.execute(
      'SELECT id, title FROM events WHERE id = ? LIMIT 1',
      [eventId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    await pool.execute('DELETE FROM events WHERE id = ?', [eventId]);

    return res.json({
      success: true,
      message: `Event "${existing[0].title}" deleted successfully.`
    });
  } catch (error) {
    console.error('[deleteEvent Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete event.'
    });
  }
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  extractPoster
};
