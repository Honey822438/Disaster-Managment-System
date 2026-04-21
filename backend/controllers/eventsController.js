const eventsService = require('../services/eventsService');
const { createAuditLog } = require('../utils/audit');
const { paginate } = require('../utils/pagination');

/**
 * Create disaster event
 * POST /api/events
 */
async function createEvent(req, res) {
  try {
    const event = await eventsService.createEvent(req.body);

    await createAuditLog(
      req.user.id,
      'CREATE',
      'DisasterEvent',
      event.id,
      null,
      event
    );

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
}

/**
 * Get all events with pagination
 * GET /api/events
 */
async function getEvents(req, res) {
  try {
    const { events, total } = await eventsService.getEvents(req.query);
    const { page = 1, limit = 20 } = req.query;

    res.json(paginate(events, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
}

/**
 * Get single event by ID
 * GET /api/events/:id
 */
async function getEventById(req, res) {
  try {
    const event = await eventsService.getEventById(req.params.id);
    res.json(event);
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch event', details: error.message });
  }
}

/**
 * Update event
 * PUT /api/events/:id
 */
async function updateEvent(req, res) {
  try {
    const previousEvent = await eventsService.getEventById(req.params.id);
    const event = await eventsService.updateEvent(req.params.id, req.body);

    await createAuditLog(
      req.user.id,
      'UPDATE',
      'DisasterEvent',
      event.id,
      previousEvent,
      event
    );

    res.json(event);
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update event', details: error.message });
  }
}

/**
 * Delete event
 * DELETE /api/events/:id
 */
async function deleteEvent(req, res) {
  try {
    const event = await eventsService.getEventById(req.params.id);
    await eventsService.deleteEvent(req.params.id);

    await createAuditLog(
      req.user.id,
      'DELETE',
      'DisasterEvent',
      parseInt(req.params.id),
      event,
      null
    );

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Cannot delete')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete event', details: error.message });
  }
}

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
};
