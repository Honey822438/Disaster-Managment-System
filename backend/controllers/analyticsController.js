const analyticsService = require('../services/analyticsService');

/**
 * Get dashboard summary metrics
 * GET /api/analytics/dashboard
 */
async function getDashboardSummary(req, res) {
  try {
    const summary = await analyticsService.getDashboardSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard summary', details: error.message });
  }
}

/**
 * Get incident distribution
 * GET /api/analytics/incidents
 */
async function getIncidentDistribution(req, res) {
  try {
    const distribution = await analyticsService.getIncidentDistribution(req.query);
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch incident distribution', details: error.message });
  }
}

/**
 * Get resource utilization
 * GET /api/analytics/resources
 */
async function getResourceUtilization(req, res) {
  try {
    const utilization = await analyticsService.getResourceUtilization();
    res.json(utilization);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resource utilization', details: error.message });
  }
}

/**
 * Get response time metrics
 * GET /api/analytics/response-time
 */
async function getResponseTime(req, res) {
  try {
    const responseTime = await analyticsService.getResponseTime(req.query);
    res.json(responseTime);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch response time', details: error.message });
  }
}

/**
 * Get finance breakdown
 * GET /api/analytics/finance
 */
async function getFinanceBreakdown(req, res) {
  try {
    const breakdown = await analyticsService.getFinanceBreakdown(req.query);
    res.json(breakdown);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch finance breakdown', details: error.message });
  }
}

module.exports = {
  getDashboardSummary,
  getIncidentDistribution,
  getResourceUtilization,
  getResponseTime,
  getFinanceBreakdown
};
