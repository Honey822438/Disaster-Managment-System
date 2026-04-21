const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

// Full audit log — admin only
// But allow any authenticated user to fetch a small recent activity feed (limit=8)
// The controller handles this: if not admin and limit > 20, cap it
router.get('/', auditController.getAuditLogs);

module.exports = router;
