const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

// Full audit log — admin only for full access
// Non-admins get a capped activity feed (max 20 entries) for dashboard widgets
router.get('/', auditController.getAuditLogs);

module.exports = router;
