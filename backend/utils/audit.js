const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Creates an audit log entry
 * @param {number} userId - ID of the user performing the action
 * @param {string} action - Action type (e.g., 'CREATE', 'UPDATE', 'DELETE')
 * @param {string} entityType - Type of entity affected (e.g., 'EmergencyReport', 'Resource')
 * @param {number} entityId - ID of the affected entity
 * @param {object} previousState - Previous state of the entity (optional)
 * @param {object} newState - New state of the entity (optional)
 * @returns {Promise<object>} Created audit log record
 */
async function createAuditLog(userId, action, entityType, entityId, previousState = null, newState = null) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        previousState: previousState ? JSON.stringify(previousState) : null,
        newState: newState ? JSON.stringify(newState) : null
      }
    });
    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main operation
  }
}

module.exports = { createAuditLog };
