const { PrismaClient } = require('@prisma/client');
const { calculateSkip } = require('../utils/pagination');

const prisma = new PrismaClient();

/**
 * Creates a new rescue team
 */
async function createTeam(data) {
  const team = await prisma.rescueTeam.create({
    data: {
      name: data.name,
      type: data.type,
      location: data.location,
      memberCount: data.memberCount,
      status: data.status || 'Available'
    }
  });

  return team;
}

/**
 * Gets paginated list of teams with optional filters
 */
async function getTeams(filters = {}) {
  const { page = 1, limit = 20, type, status } = filters;

  const where = {};
  if (type) where.type = type;
  if (status) where.status = status;

  const total = await prisma.rescueTeam.count({ where });

  const teams = await prisma.rescueTeam.findMany({
    where,
    skip: calculateSkip(page, limit),
    take: parseInt(limit),
    include: {
      teamAssignments: {
        include: {
          emergencyReport: true
        },
        orderBy: {
          assignedAt: 'desc'
        },
        take: 5
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return { teams, total };
}

/**
 * Gets a single team by ID
 */
async function getTeamById(id) {
  const team = await prisma.rescueTeam.findUnique({
    where: { id: parseInt(id) },
    include: {
      teamAssignments: {
        include: {
          emergencyReport: true
        },
        orderBy: {
          assignedAt: 'desc'
        }
      }
    }
  });

  if (!team) {
    throw new Error('Team not found');
  }

  return team;
}

/**
 * Updates a rescue team
 */
async function updateTeam(id, data) {
  const team = await prisma.rescueTeam.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      type: data.type,
      location: data.location,
      memberCount: data.memberCount,
      status: data.status
    }
  });

  return team;
}

/**
 * Deletes a rescue team
 */
async function deleteTeam(id) {
  await prisma.rescueTeam.delete({
    where: { id: parseInt(id) }
  });
}

/**
 * Assigns a team to an emergency report
 * Creates TeamAssignment and triggers status update via database trigger
 */
async function assignTeam(teamId, emergencyReportId, notes = null) {
  // Verify team exists and is available
  const team = await prisma.rescueTeam.findUnique({
    where: { id: parseInt(teamId) }
  });

  if (!team) {
    throw new Error('Team not found');
  }

  // Verify emergency report exists
  const report = await prisma.emergencyReport.findUnique({
    where: { id: parseInt(emergencyReportId) }
  });

  if (!report) {
    throw new Error('Emergency report not found');
  }

  // Create team assignment
  // The database trigger will automatically update team status to 'Assigned'
  const assignment = await prisma.teamAssignment.create({
    data: {
      rescueTeamId: parseInt(teamId),
      emergencyReportId: parseInt(emergencyReportId),
      notes
    },
    include: {
      rescueTeam: true,
      emergencyReport: true
    }
  });

  return assignment;
}

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  assignTeam
};
