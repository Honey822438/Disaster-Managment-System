const { PrismaClient } = require('@prisma/client');
const { calculateSkip } = require('../utils/pagination');

const prisma = new PrismaClient();

/**
 * Creates a new warehouse
 */
async function createWarehouse(data) {
  const warehouse = await prisma.warehouse.create({
    data: {
      name: data.name,
      location: data.location,
      capacity: data.capacity
    }
  });

  return warehouse;
}

/**
 * Gets paginated list of warehouses
 */
async function getWarehouses(filters = {}) {
  const { page = 1, limit = 20 } = filters;

  const total = await prisma.warehouse.count();

  const warehouses = await prisma.warehouse.findMany({
    skip: calculateSkip(page, limit),
    take: parseInt(limit),
    include: {
      resources: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  return { warehouses, total };
}

/**
 * Gets a single warehouse by ID
 */
async function getWarehouseById(id) {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: parseInt(id) },
    include: {
      resources: true
    }
  });

  if (!warehouse) {
    throw new Error('Warehouse not found');
  }

  return warehouse;
}

/**
 * Updates a warehouse
 */
async function updateWarehouse(id, data) {
  const warehouse = await prisma.warehouse.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      location: data.location,
      capacity: data.capacity
    }
  });

  return warehouse;
}

/**
 * Deletes a warehouse
 */
async function deleteWarehouse(id) {
  await prisma.warehouse.delete({
    where: { id: parseInt(id) }
  });
}

module.exports = {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse
};
