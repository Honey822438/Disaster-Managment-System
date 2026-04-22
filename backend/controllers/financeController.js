const financeService = require('../services/financeService');
const { createAuditLog } = require('../utils/audit');
const { paginate } = require('../utils/pagination');

async function createDonation(req, res) {
  try {
    const { donorName, amount, disasterEventId } = req.body;
    if (!donorName || !amount || !disasterEventId) {
      return res.status(400).json({ error: 'donorName, amount, and disasterEventId are required' });
    }
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    const donation = await financeService.createDonation(req.body, req.user.id);
    await createAuditLog(req.user.id, 'CREATE', 'Donation', donation.id, null, donation);
    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create donation', details: error.message });
  }
}

async function getDonations(req, res) {
  try {
    const { donations, total } = await financeService.getDonations(req.query);
    const { page = 1, limit = 20 } = req.query;
    res.json(paginate(donations, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch donations', details: error.message });
  }
}

async function createExpense(req, res) {
  try {
    const { category, amount, description, disasterEventId } = req.body;
    if (!category || !amount || !description || !disasterEventId) {
      return res.status(400).json({ error: 'category, amount, description, and disasterEventId are required' });
    }
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    const expense = await financeService.createExpense(req.body, req.user.id);
    await createAuditLog(req.user.id, 'CREATE', 'Expense', expense.id, null, expense);
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense', details: error.message });
  }
}

async function approveExpense(req, res) {
  try {
    const expense = await financeService.approveExpense(req.params.id, req.user.id);
    await createAuditLog(req.user.id, 'APPROVE', 'Expense', expense.id, { status: 'pending' }, expense);
    res.json(expense);
  } catch (error) {
    if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
    if (error.message.includes('Insufficient')) return res.status(409).json({ error: error.message });
    if (error.message.includes('already processed')) return res.status(409).json({ error: error.message });
    res.status(500).json({ error: 'Failed to approve expense', details: error.message });
  }
}

async function getExpenses(req, res) {
  try {
    const { expenses, total } = await financeService.getExpenses(req.query);
    const { page = 1, limit = 20 } = req.query;
    res.json(paginate(expenses, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses', details: error.message });
  }
}

async function getFinancialSummary(req, res) {
  try {
    const summary = await financeService.getFinancialSummary(req.query);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch financial summary', details: error.message });
  }
}

async function getFinancialTransactions(req, res) {
  try {
    const { transactions, total } = await financeService.getFinancialTransactions(req.query);
    const { page = 1, limit = 20 } = req.query;
    res.json(paginate(transactions, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
  }
}

async function getBudget(req, res) {
  try {
    const budget = await financeService.getBudget(req.params.eventId);
    if (!budget) return res.status(404).json({ error: 'Budget not found for this event' });
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch budget', details: error.message });
  }
}

async function setBudget(req, res) {
  try {
    const { totalBudget } = req.body;
    if (!totalBudget || parseFloat(totalBudget) <= 0) {
      return res.status(400).json({ error: 'totalBudget must be greater than 0' });
    }
    const budget = await financeService.setBudget(req.params.eventId, totalBudget, req.user.id);
    await createAuditLog(req.user.id, 'SET_BUDGET', 'Budget', budget.id, null, budget);
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: 'Failed to set budget', details: error.message });
  }
}

module.exports = {
  createDonation, getDonations,
  createExpense, approveExpense, getExpenses,
  getFinancialSummary, getFinancialTransactions,
  getBudget, setBudget,
};
