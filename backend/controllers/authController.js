const authService = require('../services/authService');

/**
 * Register a new user
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'username, email, password, and role are required'
      });
    }

    // Validate role
    const validRoles = ['admin', 'operator', 'field_officer', 'warehouse_manager', 'finance_officer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role',
        details: `Role must be one of: ${validRoles.join(', ')}`
      });
    }

    const user = await authService.registerUser(username, email, password, role);
    const token = authService.generateToken(user);

    res.status(201).json({ 
      token,
      user 
    });
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'email and password are required'
      });
    }

    const result = await authService.loginUser(email, password);

    res.json(result);
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
}

/**
 * Get current user profile
 * GET /api/auth/me
 */
async function getMe(req, res) {
  try {
    // req.user is set by authenticateToken middleware
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user profile', details: error.message });
  }
}

/**
 * Change password
 * POST /api/auth/change-password
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'currentPassword and newPassword are required'
      });
    }

    await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error.message === 'Current password is incorrect') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to change password', details: error.message });
  }
}

module.exports = {
  register,
  login,
  getMe,
  changePassword
};
