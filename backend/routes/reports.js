const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// All routes require authentication
router.use(authenticateToken);

// CRUD operations
router.post('/', reportsController.createReport);
router.get('/', reportsController.getReports);
router.get('/:id', reportsController.getReportById);
router.put('/:id', reportsController.updateReport);
router.delete('/:id', requireRole(['admin']), reportsController.deleteReport);

module.exports = router;
