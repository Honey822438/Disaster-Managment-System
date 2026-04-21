/**
 * Middleware to enforce role-based access control
 * @param {Array<string>} allowedRoles - Array of roles permitted to access the route
 * @returns {Function} Express middleware function
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        details: `This operation requires one of the following roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
}

module.exports = { requireRole };
