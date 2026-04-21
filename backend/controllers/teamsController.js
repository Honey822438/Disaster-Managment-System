const teamsService = require('../services/teamsService');
const { createAuditLog } = require('../utils/audit');
const { paginate } = require('../utils/pagination');

/**
 * Create rescue team
 * POST /api/teams
 */
async function createTeam(req, res) {
  try {
    const team = await teamsService.createTeam(req.body);

    await createAuditLog(
      req.user.id,
      'CREATE',
      'RescueTeam',
      team.id,
      null,
      team
    );

    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create team', details: error.message });
  }
}

/**
 * Get all teams with pagination and filters
 * GET /api/teams
 */
async function getTeams(req, res) {
  try {
    const { teams, total } = await teamsService.getTeams(req.query);
    const { page = 1, limit = 20 } = req.query;

    res.json(paginate(teams, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams', details: error.message });
  }
}

/**
 * Get single team by ID
 * GET /api/teams/:id
 */
async function getTeamById(req, res) {
  try {
    const team = await teamsService.getTeamById(req.params.id);
    res.json(team);
  } catch (error) {
    if (error.message === 'Team not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch team', details: error.message });
  }
}

/**
 * Update team
 * PUT /api/teams/:id
 */
async function updateTeam(req, res) {
  try {
    const previousTeam = await teamsService.getTeamById(req.params.id);
    const team = await teamsService.updateTeam(req.params.id, req.body);

    await createAuditLog(
      req.user.id,
      'UPDATE',
      'RescueTeam',
      team.id,
      previousTeam,
      team
    );

    res.json(team);
  } catch (error) {
    if (error.message === 'Team not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update team', details: error.message });
  }
}

/**
 * Delete team
 * DELETE /api/teams/:id
 */
async function deleteTeam(req, res) {
  try {
    const team = await teamsService.getTeamById(req.params.id);
    await teamsService.deleteTeam(req.params.id);

    await createAuditLog(
      req.user.id,
      'DELETE',
      'RescueTeam',
      parseInt(req.params.id),
      team,
      null
    );

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    if (error.message === 'Team not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete team', details: error.message });
  }
}

/**
 * Assign team to incident
 * POST /api/teams/:id/assign
 */
async function assignTeam(req, res) {
  try {
    const { emergencyReportId, notes } = req.body;

    if (!emergencyReportId) {
      return res.status(400).json({ 
        error: 'Missing required field',
        details: 'emergencyReportId is required'
      });
    }

    const assignment = await teamsService.assignTeam(
      req.params.id,
      emergencyReportId,
      notes
    );

    await createAuditLog(
      req.user.id,
      'ASSIGN',
      'TeamAssignment',
      assignment.id,
      null,
      assignment
    );

    res.status(201).json(assignment);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to assign team', details: error.message });
  }
}

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  assignTeam
};
