const { PrismaClient } = require('@prisma/client');
const { calculateSkip } = require('../utils/pagination');

const prisma = new PrismaClient();

/**
 * Creates a new resource
 */
async function createResource(data) {
  const resource = await prisma.resource.create({
    data: {
      name: data.name,
      resourceType: data.resourceType,
      quantity: data.quantity,
      threshold: data.threshold || 100,
      unit: data.unit,
      warehouseId: data.warehouseId
    },
    include: {
      warehouse: true
    }
  });

  return resource;
}

/**
 * Gets paginated list of resources with low-stock flags
 */
async function getResources(filters = {}) {
  const { page = 1, limit = 20, resourceType, warehouseId } = filters;

  const where = {};
  if (resourceType) where.resourceType = resourceType;
  if (warehouseId) where.warehouseId = parseInt(warehouseId);

  const total = await prisma.resource.count({ where });

  const resources = await prisma.resource.findMany({
    where,
    skip: calculateSkip(page, limit),
    take: parseInt(limit),
    include: {
      warehouse: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Add lowStock flag to each resource
  const resourcesWithFlags = resources.map(resource => ({
    ...resource,
    lowStock: resource.quantity < resource.threshold
  }));

  return { resources: resourcesWithFlags, total };
}

/**
 * Gets a single resource by ID
 */
async function getResourceById(id) {
  const resource = await prisma.resource.findUnique({
    where: { id: parseInt(id) },
    include: {
      warehouse: true,
      resourceAllocations: {
        include: {
          disasterEvent: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!resource) {
    throw new Error('Resource not found');
  }

  // Add lowStock flag
  return {
    ...resource,
    lowStock: resource.quantity < resource.threshold
  };
}

/**
 * Updates a resource
 */
async function updateResource(id, data) {
  const resource = await prisma.resource.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      resourceType: data.resourceType,
      quantity: data.quantity,
      threshold: data.threshold,
      unit: data.unit,
      warehouseId: data.warehouseId
    },
    include: {
      warehouse: true
    }
  });

  return {
    ...resource,
    lowStock: resource.quantity < resource.threshold
  };
}

/**
 * Deletes a resource
 */
async function deleteResource(id) {
  await prisma.resource.delete({
    where: { id: parseInt(id) }
  });
}

/**
 * Allocates a resource (creates allocation request with pending status)
 * Creates ResourceAllocation and ApprovalWorkflow records
 */
async function allocateResource(resourceId, disasterEventId, quantity, requestedBy, requesterId) {
  // Verify resource exists
  const resource = await prisma.resource.findUnique({
    where: { id: parseInt(resourceId) }
  });

  if (!resource) {
    throw new Error('Resource not found');
  }

  // Verify disaster event exists
  const event = await prisma.disasterEvent.findUnique({
    where: { id: parseInt(disasterEventId) }
  });

  if (!event) {
    throw new Error('Disaster event not found');
  }

  // Check if sufficient quantity available
  if (resource.quantity < quantity) {
    throw new Error('Insufficient resource quantity available');
  }

  // Create allocation and approval workflow in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create resource allocation with pending status
    const allocation = await tx.resourceAllocation.create({
      data: {
        resourceId: parseInt(resourceId),
        disasterEventId: parseInt(disasterEventId),
        quantity: parseInt(quantity),
        status: 'pending',
        requestedBy
      },
      include: {
        resource: {
          include: {
            warehouse: true
          }
        },
        disasterEvent: true
      }
    });

    // Create approval workflow
    const approval = await tx.approvalWorkflow.create({
      data: {
        type: 'ResourceAllocation',
        status: 'pending',
        requesterId: requesterId,
        resourceAllocationId: allocation.id
      }
    });

    return { allocation, approval };
  });

  return result;
}

module.exports = {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  allocateResource
};
