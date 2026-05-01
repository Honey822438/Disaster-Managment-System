const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

// Donations — finance_officer and admin can create; all authenticated can read
router.post('/donations', requireRole(['admin', 'finance_officer']), financeController.createDonation);
router.get('/donations', financeController.getDonations);

// Expenses — finance_officer creates; admin/finance_officer approves
router.post('/expenses', requireRole(['admin', 'finance_officer']), financeController.createExpense);
router.get('/expenses', financeController.getExpenses);
router.post('/expenses/:id/approve', requireRole(['admin', 'finance_officer']), financeController.approveExpense);

// Financial summary and transactions
router.get('/summary', financeController.getFinancialSummary);
router.get('/transactions', financeController.getFinancialTransactions);

// Budget management — admin and finance_officer
router.get('/budget/:eventId', financeController.getBudget);
router.post('/budget/:eventId', requireRole(['admin', 'finance_officer']), financeController.setBudget);

// Financial Audit Log — admin and finance_officer only
router.get('/audit-log', requireRole(['admin', 'finance_officer']), financeController.getFinancialAuditLog);

// Resource Purchase (Procurement) — finance_officer and admin only
// Records expense + increases warehouse stock atomically
router.post('/purchase-resource', requireRole(['admin', 'finance_officer']), financeController.purchaseResource);

module.exports = router;
