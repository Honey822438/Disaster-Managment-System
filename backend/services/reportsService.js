const { PrismaClient } = require('@prisma/client');
const { calculateSkip } = require('../utils/pagination');

const prisma = new PrismaClient();

/**
 * Creates a new emergency report
 */
async function createReport(data) {
  const report = await prisma.emergencyReport.create({
    data: {
      location: data.location,
      disasterType: data.disasterType,
      severity: data.severity,
      description: data.description,
      reportedBy: data.reportedBy || null,
      contactNumber: data.contactNumber || null,
      disasterEventId: data.disasterEventId || null
    },
    include: {
      disasterEvent: true
    }
  });

  return report;
}

/**
 * Gets paginated list of reports with optional filters
 */
async function getReports(filters = {}) {
  const { page = 1, limit = 20, location, disasterType, severity, status } = filters;

  // Build where clause
  const where = {};
  if (location) where.location = { contains: location };
  if (disasterType) where.disasterType = disasterType;
  if (severity) where.severity = severity;
  if (status) where.status = status;

  // Get total count
  const total = await prisma.emergencyReport.count({ where });

  // Get paginated data
  const reports = await prisma.emergencyReport.findMany({
    where,
    skip: calculateSkip(page, limit),
    take: parseInt(limit),
    include: {
      disasterEvent: true,
      teamAssignments: {
        include: {
          rescueTeam: true
        }
      }
    },
    orderBy: {
      reportedAt: 'desc'
    }
  });

  return { reports, total };
}

/**
 * Gets a single report by ID
 */
async function getReportById(id) {
  const report = await prisma.emergencyReport.findUnique({
    where: { id: parseInt(id) },
    include: {
      disasterEvent: true,
      teamAssignments: {
        include: {
          rescueTeam: true
        }
      },
      patients: true
    }
  });

  if (!report) {
    throw new Error('Report not found');
  }

  return report;
}

/**
 * Updates an emergency report
 */
async function updateReport(id, data) {
  const report = await prisma.emergencyReport.update({
    where: { id: parseInt(id) },
    data: {
      location: data.location,
      disasterType: data.disasterType,
      severity: data.severity,
      description: data.description,
      reportedBy: data.reportedBy,
      contactNumber: data.contactNumber,
      status: data.status,
      disasterEventId: data.disasterEventId
    },
    include: {
      disasterEvent: true
    }
  });

  return report;
}

/**
 * Deletes an emergency report
 */
async function deleteReport(id) {
  await prisma.emergencyReport.delete({
    where: { id: parseInt(id) }
  });
}

module.exports = {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport
};
