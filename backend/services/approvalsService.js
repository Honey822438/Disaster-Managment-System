const { PrismaClient } = require('@prisma/client');
const { calculateSkip } = require('../utils/pagination');

const prisma = new PrismaClient();

/**
 * Gets paginated list of approval workflows with filters
 */
async function getApprovals(filters = {}) {
  const { page = 1, limit = 20, status, type } = filters;

  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const total = await prisma.approvalWorkflow.count({ where });

  const approvals = await prisma.approvalWorkflow.findMany({
    where,
    skip: calculateSkip(page, limit),
    take: parseInt(limit),
    include: {
      requester: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true
        }
      },
      resourceAllocation: {
        include: {
          resource: {
            include: {
              warehouse: true
            }
          },
          disasterEvent: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return { approvals, total };
}

/**
 * Resolves an approval workflow (approve or reject)
 * Uses transaction to atomically update approval, allocation, and resource stock
 */
async function resolveApproval(id, decision, resolverId, comment = null) {
  // Validate decision
  if (!['approved', 'rejected'].includes(decision)) {
    throw new Error('Decision must be either "approved" or "rejected"');
  }

  // Get approval workflow
  const approval = await prisma.approvalWorkflow.findUnique({
    where: { id: parseInt(id) },
    include: {
      resourceAllocation: {
        include: {
          resource: true
        }
      }
    }
  });

  if (!approval) {
    throw new Error('Approval workflow not found');
  }

  if (approval.status !== 'pending') {
    throw new Error('Approval workflow has already been resolved');
  }

  // Execute resolution in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update approval workflow
    const updatedApproval = await tx.approvalWorkflow.update({
      where: { id: parseInt(id) },
      data: {
        status: decision,
        resolverId: resolverId,
        resolvedAt: new Date(),
        comment: comment
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true
          }
        },
        resourceAllocation: {
          include: {
            resource: {
              include: {
                warehouse: true
              }
            },
            disasterEvent: true
          }
        }
      }
    });

    if (decision === 'approved') {
      // Update resource allocation status
      await tx.resourceAllocation.update({
        where: { id: approval.resourceAllocationId },
        data: { status: 'approved' }
      });

      // Check if stock would go negative
      const resource = approval.resourceAllocation.resource;
      const newQuantity = resource.quantity - approval.resourceAllocation.quantity;

      if (newQuantity < 0) {
        throw new Error('Insufficient stock: approval would result in negative quantity');
      }

      // Deduct stock (trigger will also handle this, but we do it explicitly for safety)
      await tx.resource.update({
        where: { id: resource.id },
        data: { quantity: newQuantity }
      });
    } else {
      // Update resource allocation status to rejected
      await tx.resourceAllocation.update({
        where: { id: approval.resourceAllocationId },
        data: { status: 'rejected' }
      });
    }

    return updatedApproval;
  });

  return result;
}

module.exports = {
  getApprovals,
  resolveApproval
};
