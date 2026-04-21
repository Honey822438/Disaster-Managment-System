const financeService = require('../services/financeService');
const { createAuditLog } = require('../utils/audit');
const { paginate } = require('../utils/pagination');

/**
 * Create donation
 * POST /api/finance/donations
 */
async function createDonation(req, res) {
  try {
    const donation = await financeService.createDonation(req.body);

    await createAuditLog(
      req.user.id,
      'CREATE',
      'Donation',
      donation.id,
      null,
      donation
    );

    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create donation', details: error.message });
  }
}

/**
 * Get all donations with pagination and filters
 * GET /api/finance/donations
 */
async function getDonations(req, res) {
  try {
    const { donations, total } = await financeService.getDonations(req.query);
    const { page = 1, limit = 20 } = req.query;

    res.json(paginate(donations, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch donations', details: error.message });
  }
}

/**
 * Create expense
 * POST /api/finance/expenses
 */
async function createExpense(req, res) {
  try {
    const expense = await financeService.createExpense(req.body);

    await createAuditLog(
      req.user.id,
      'CREATE',
      'Expense',
      expense.id,
      null,
      expense
    );

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense', details: error.message });
  }
}

/**
 * Get all expenses with pagination and filters
 * GET /api/finance/expenses
 */
async function getExpenses(req, res) {
  try {
    const { expenses, total } = await financeService.getExpenses(req.query);
    const { page = 1, limit = 20 } = req.query;

    res.json(paginate(expenses, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses', details: error.message });
  }
}

/**
 * Get financial summary
 * GET /api/finance/summary
 */
async function getFinancialSummary(req, res) {
  try {
    const summary = await financeService.getFinancialSummary(req.query);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch financial summary', details: error.message });
  }
}

module.exports = {
  createDonation,
  getDonations,
  createExpense,
  getExpenses,
  getFinancialSummary
};
