const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// All routes require authentication
router.use(authenticateToken);

// Donation routes
router.post('/donations', requireRole(['admin', 'finance_officer']), financeController.createDonation);
router.get('/donations', financeController.getDonations);

// Expense routes
router.post('/expenses', requireRole(['admin', 'finance_officer']), financeController.createExpense);
router.get('/expenses', financeController.getExpenses);

// Summary route
router.get('/summary', financeController.getFinancialSummary);

module.exports = router;
