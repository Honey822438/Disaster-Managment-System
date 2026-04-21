const express = require('express');
const router = express.Router();
const approvalsController = require('../controllers/approvalsController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

// All authenticated users can view approvals
router.get('/', approvalsController.getApprovals);

// Resolve: admin, warehouse_manager, operator, finance_officer
router.post(
  '/:id/resolve',
  requireRole(['admin', 'warehouse_manager', 'operator', 'finance_officer']),
  approvalsController.resolveApproval
);

module.exports = router;
