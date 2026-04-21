const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// All routes require authentication
router.use(authenticateToken);

// Read operations - all authenticated users
router.get('/', eventsController.getEvents);
router.get('/:id', eventsController.getEventById);

// Mutating operations - admin and operator only
router.post('/', requireRole(['admin', 'operator']), eventsController.createEvent);
router.put('/:id', requireRole(['admin', 'operator']), eventsController.updateEvent);
router.delete('/:id', requireRole(['admin', 'operator']), eventsController.deleteEvent);

module.exports = router;
