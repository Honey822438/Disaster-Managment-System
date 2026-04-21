const auditService = require('../services/auditService');
const { paginate } = require('../utils/pagination');

/**
 * Get audit logs
 * - Admin: full access with all filters
 * - Other roles: limited to last 20 entries (for dashboard activity feed)
 * GET /api/audit
 */
async function getAuditLogs(req, res) {
  try {
    const isAdmin = req.user.role === 'admin';

    // Non-admins can only get a small recent feed (for dashboard)
    // They cannot filter by user or see full history
    const filters = isAdmin
      ? req.query
      : { page: 1, limit: Math.min(parseInt(req.query.limit) || 8, 20) };

    const { logs, total } = await auditService.getAuditLogs(filters);
    const { page = 1, limit = 20 } = filters;

    res.json(paginate(logs, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs', details: error.message });
  }
}

module.exports = { getAuditLogs };
