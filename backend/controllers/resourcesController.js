const resourcesService = require('../services/resourcesService');
const { createAuditLog } = require('../utils/audit');
const { paginate } = require('../utils/pagination');

/**
 * Create resource
 * POST /api/resources
 */
async function createResource(req, res) {
  try {
    const resource = await resourcesService.createResource(req.body);

    await createAuditLog(
      req.user.id,
      'CREATE',
      'Resource',
      resource.id,
      null,
      resource
    );

    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create resource', details: error.message });
  }
}

/**
 * Get all resources with pagination and filters
 * GET /api/resources
 */
async function getResources(req, res) {
  try {
    const { resources, total } = await resourcesService.getResources(req.query);
    const { page = 1, limit = 20 } = req.query;

    res.json(paginate(resources, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resources', details: error.message });
  }
}

/**
 * Get single resource by ID
 * GET /api/resources/:id
 */
async function getResourceById(req, res) {
  try {
    const resource = await resourcesService.getResourceById(req.params.id);
    res.json(resource);
  } catch (error) {
    if (error.message === 'Resource not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch resource', details: error.message });
  }
}

/**
 * Update resource
 * PUT /api/resources/:id
 */
async function updateResource(req, res) {
  try {
    const previousResource = await resourcesService.getResourceById(req.params.id);
    const resource = await resourcesService.updateResource(req.params.id, req.body);

    await createAuditLog(
      req.user.id,
      'UPDATE',
      'Resource',
      resource.id,
      previousResource,
      resource
    );

    res.json(resource);
  } catch (error) {
    if (error.message === 'Resource not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update resource', details: error.message });
  }
}

/**
 * Delete resource
 * DELETE /api/resources/:id
 */
async function deleteResource(req, res) {
  try {
    const resource = await resourcesService.getResourceById(req.params.id);
    await resourcesService.deleteResource(req.params.id);

    await createAuditLog(
      req.user.id,
      'DELETE',
      'Resource',
      parseInt(req.params.id),
      resource,
      null
    );

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    if (error.message === 'Resource not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete resource', details: error.message });
  }
}

/**
 * Allocate resource
 * POST /api/resources/:id/allocate
 */
async function allocateResource(req, res) {
  try {
    const { disasterEventId, quantity, requestedBy } = req.body;

    if (!disasterEventId || !quantity || !requestedBy) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'disasterEventId, quantity, and requestedBy are required'
      });
    }

    const result = await resourcesService.allocateResource(
      req.params.id,
      disasterEventId,
      quantity,
      requestedBy,
      req.user.id
    );

    await createAuditLog(
      req.user.id,
      'ALLOCATE',
      'ResourceAllocation',
      result.allocation.id,
      null,
      result.allocation
    );

    res.status(201).json(result);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Insufficient')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to allocate resource', details: error.message });
  }
}

module.exports = {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  allocateResource
};
