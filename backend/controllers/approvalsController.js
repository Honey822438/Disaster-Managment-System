const approvalsService = require('../services/approvalsService');
const { createAuditLog } = require('../utils/audit');
const { paginate } = require('../utils/pagination');

/**
 * Get all approval workflows with pagination and filters
 * GET /api/approvals
 */
async function getApprovals(req, res) {
  try {
    const { approvals, total } = await approvalsService.getApprovals(req.query);
    const { page = 1, limit = 20 } = req.query;

    res.json(paginate(approvals, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch approvals', details: error.message });
  }
}

/**
 * Resolve approval workflow (approve or reject)
 * POST /api/approvals/:id/resolve
 */
async function resolveApproval(req, res) {
  try {
    const { decision, comment } = req.body;

    if (!decision) {
      return res.status(400).json({ 
        error: 'Missing required field',
        details: 'decision is required (must be "approved" or "rejected")'
      });
    }

    const approval = await approvalsService.resolveApproval(
      req.params.id,
      decision,
      req.user.id,
      comment
    );

    await createAuditLog(
      req.user.id,
      'RESOLVE',
      'ApprovalWorkflow',
      approval.id,
      { status: 'pending' },
      { status: decision, comment }
    );

    res.json(approval);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('already been resolved')) {
      return res.status(409).json({ error: error.message });
    }
    if (error.message.includes('Insufficient stock')) {
      return res.status(409).json({ error: error.message });
    }
    if (error.message.includes('Decision must be')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to resolve approval', details: error.message });
  }
}

module.exports = {
  getApprovals,
  resolveApproval
};
