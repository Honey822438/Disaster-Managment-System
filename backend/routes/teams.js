const express = require('express');
const router = express.Router();
const teamsController = require('../controllers/teamsController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

// Read — all authenticated users
router.get('/', teamsController.getTeams);
router.get('/:id', teamsController.getTeamById);

// Create/Delete — admin and operator only
router.post('/', requireRole(['admin', 'operator']), teamsController.createTeam);
router.delete('/:id', requireRole(['admin', 'operator']), teamsController.deleteTeam);

// Update — admin, operator, AND field_officer (for location updates + mark complete)
router.put('/:id', requireRole(['admin', 'operator', 'field_officer']), teamsController.updateTeam);

// Assign — admin, operator, AND field_officer (rescue portal users)
router.post('/:id/assign', requireRole(['admin', 'operator', 'field_officer']), teamsController.assignTeam);

module.exports = router;
