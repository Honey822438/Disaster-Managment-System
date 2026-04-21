const express = require('express');
const router = express.Router();
const resourcesController = require('../controllers/resourcesController');
const warehousesController = require('../controllers/warehousesController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// All routes require authentication
router.use(authenticateToken);

// Warehouse routes
router.post('/warehouses', requireRole(['admin', 'warehouse_manager']), warehousesController.createWarehouse);
router.get('/warehouses', warehousesController.getWarehouses);
router.get('/warehouses/:id', warehousesController.getWarehouseById);
router.put('/warehouses/:id', requireRole(['admin', 'warehouse_manager']), warehousesController.updateWarehouse);
router.delete('/warehouses/:id', requireRole(['admin', 'warehouse_manager']), warehousesController.deleteWarehouse);

// Resource routes
router.post('/', requireRole(['admin', 'warehouse_manager']), resourcesController.createResource);
router.get('/', resourcesController.getResources);
router.get('/:id', resourcesController.getResourceById);
router.put('/:id', requireRole(['admin', 'warehouse_manager']), resourcesController.updateResource);
router.delete('/:id', requireRole(['admin', 'warehouse_manager']), resourcesController.deleteResource);
router.post('/:id/allocate', requireRole(['admin', 'warehouse_manager']), resourcesController.allocateResource);

module.exports = router;
