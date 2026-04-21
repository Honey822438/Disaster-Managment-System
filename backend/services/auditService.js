const { PrismaClient } = require('@prisma/client');
const { calculateSkip } = require('../utils/pagination');

const prisma = new PrismaClient();

/**
 * Gets paginated list of audit logs with filters
 */
async function getAuditLogs(filters = {}) {
  const { page = 1, limit = 20, actor, entityType, action, startDate, endDate } = filters;

  const where = {};
  
  if (actor) {
    where.userId = parseInt(actor);
  }
  
  if (entityType) {
    where.entityType = entityType;
  }
  
  if (action) {
    where.action = action;
  }
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const total = await prisma.auditLog.count({ where });

  const logs = await prisma.auditLog.findMany({
    where,
    skip: calculateSkip(page, limit),
    take: parseInt(limit),
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return { logs, total };
}

module.exports = {
  getAuditLogs
};
