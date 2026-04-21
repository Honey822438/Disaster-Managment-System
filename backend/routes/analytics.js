const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/dashboard', analyticsController.getDashboardSummary);
router.get('/incidents', analyticsController.getIncidentDistribution);
router.get('/resources', analyticsController.getResourceUtilization);
router.get('/response-time', analyticsController.getResponseTime);
router.get('/finance', analyticsController.getFinanceBreakdown);

module.exports = router;
