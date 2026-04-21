const usersService = require('../services/usersService');
const { createAuditLog } = require('../utils/audit');
const { paginate } = require('../utils/pagination');

/**
 * Get all users with pagination
 * GET /api/users
 */
async function getUsers(req, res) {
  try {
    const { users, total } = await usersService.getUsers(req.query);
    const { page = 1, limit = 20 } = req.query;

    res.json(paginate(users, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
}

/**
 * Get single user by ID
 * GET /api/users/:id
 */
async function getUserById(req, res) {
  try {
    const user = await usersService.getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
}

/**
 * Update user
 * PUT /api/users/:id
 */
async function updateUser(req, res) {
  try {
    const previousUser = await usersService.getUserById(req.params.id);
    const user = await usersService.updateUser(req.params.id, req.body);

    await createAuditLog(
      req.user.id,
      'UPDATE',
      'User',
      user.id,
      previousUser,
      user
    );

    res.json(user);
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
}

/**
 * Delete user
 * DELETE /api/users/:id
 */
async function deleteUser(req, res) {
  try {
    const user = await usersService.getUserById(req.params.id);
    await usersService.deleteUser(req.params.id);

    await createAuditLog(
      req.user.id,
      'DELETE',
      'User',
      parseInt(req.params.id),
      user,
      null
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
}

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
