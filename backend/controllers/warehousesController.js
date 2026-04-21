const warehousesService = require('../services/warehousesService');
const { createAuditLog } = require('../utils/audit');
const { paginate } = require('../utils/pagination');

/**
 * Create warehouse
 * POST /api/resources/warehouses
 */
async function createWarehouse(req, res) {
  try {
    const warehouse = await warehousesService.createWarehouse(req.body);

    await createAuditLog(
      req.user.id,
      'CREATE',
      'Warehouse',
      warehouse.id,
      null,
      warehouse
    );

    res.status(201).json(warehouse);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create warehouse', details: error.message });
  }
}

/**
 * Get all warehouses with pagination
 * GET /api/resources/warehouses
 */
async function getWarehouses(req, res) {
  try {
    const { warehouses, total } = await warehousesService.getWarehouses(req.query);
    const { page = 1, limit = 20 } = req.query;

    res.json(paginate(warehouses, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch warehouses', details: error.message });
  }
}

/**
 * Get single warehouse by ID
 * GET /api/resources/warehouses/:id
 */
async function getWarehouseById(req, res) {
  try {
    const warehouse = await warehousesService.getWarehouseById(req.params.id);
    res.json(warehouse);
  } catch (error) {
    if (error.message === 'Warehouse not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch warehouse', details: error.message });
  }
}

/**
 * Update warehouse
 * PUT /api/resources/warehouses/:id
 */
async function updateWarehouse(req, res) {
  try {
    const previousWarehouse = await warehousesService.getWarehouseById(req.params.id);
    const warehouse = await warehousesService.updateWarehouse(req.params.id, req.body);

    await createAuditLog(
      req.user.id,
      'UPDATE',
      'Warehouse',
      warehouse.id,
      previousWarehouse,
      warehouse
    );

    res.json(warehouse);
  } catch (error) {
    if (error.message === 'Warehouse not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update warehouse', details: error.message });
  }
}

/**
 * Delete warehouse
 * DELETE /api/resources/warehouses/:id
 */
async function deleteWarehouse(req, res) {
  try {
    const warehouse = await warehousesService.getWarehouseById(req.params.id);
    await warehousesService.deleteWarehouse(req.params.id);

    await createAuditLog(
      req.user.id,
      'DELETE',
      'Warehouse',
      parseInt(req.params.id),
      warehouse,
      null
    );

    res.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    if (error.message === 'Warehouse not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete warehouse', details: error.message });
  }
}

module.exports = {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse
};
