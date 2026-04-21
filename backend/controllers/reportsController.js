const reportsService = require('../services/reportsService');
const { createAuditLog } = require('../utils/audit');
const { paginate } = require('../utils/pagination');

/**
 * Create emergency report
 * POST /api/reports
 */
async function createReport(req, res) {
  try {
    const report = await reportsService.createReport(req.body);

    // Create audit log
    await createAuditLog(
      req.user.id,
      'CREATE',
      'EmergencyReport',
      report.id,
      null,
      report
    );

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create report', details: error.message });
  }
}

/**
 * Get all reports with pagination and filters
 * GET /api/reports
 */
async function getReports(req, res) {
  try {
    const { reports, total } = await reportsService.getReports(req.query);
    const { page = 1, limit = 20 } = req.query;

    res.json(paginate(reports, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports', details: error.message });
  }
}

/**
 * Get single report by ID
 * GET /api/reports/:id
 */
async function getReportById(req, res) {
  try {
    const report = await reportsService.getReportById(req.params.id);
    res.json(report);
  } catch (error) {
    if (error.message === 'Report not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch report', details: error.message });
  }
}

/**
 * Update report
 * PUT /api/reports/:id
 */
async function updateReport(req, res) {
  try {
    // Get previous state for audit
    const previousReport = await reportsService.getReportById(req.params.id);
    
    const report = await reportsService.updateReport(req.params.id, req.body);

    // Create audit log
    await createAuditLog(
      req.user.id,
      'UPDATE',
      'EmergencyReport',
      report.id,
      previousReport,
      report
    );

    res.json(report);
  } catch (error) {
    if (error.message === 'Report not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update report', details: error.message });
  }
}

/**
 * Delete report (admin only)
 * DELETE /api/reports/:id
 */
async function deleteReport(req, res) {
  try {
    // Get report for audit before deletion
    const report = await reportsService.getReportById(req.params.id);
    
    await reportsService.deleteReport(req.params.id);

    // Create audit log
    await createAuditLog(
      req.user.id,
      'DELETE',
      'EmergencyReport',
      parseInt(req.params.id),
      report,
      null
    );

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    if (error.message === 'Report not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete report', details: error.message });
  }
}

module.exports = {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport
};
