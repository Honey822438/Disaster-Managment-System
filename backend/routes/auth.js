const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Citizen self-registration (forces role to field_officer)
router.post('/register-citizen', (req, res, next) => {
  req.body.role = 'field_officer';
  return authController.register(req, res, next);
});

// Protected routes
router.get('/me', authenticateToken, authController.getMe);
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
