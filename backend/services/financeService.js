const { PrismaClient } = require('@prisma/client');
const { calculateSkip } = require('../utils/pagination');

const prisma = new PrismaClient();

/**
 * Creates a donation with ACID transaction + financial transaction log + financial audit log
 */
async function createDonation(data, userId) {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create donation record
    const donation = await tx.donation.create({
      data: {
        donorName: data.donorName,
        organization: data.organization || null,
        donorType: data.donorType || 'Individual',
        amount: parseFloat(data.amount),
        disasterEventId: parseInt(data.disasterEventId),
        donatedAt: data.donatedAt ? new Date(data.donatedAt) : new Date(),
        recordedById: userId || null,
      },
      include: { disasterEvent: true }
    });

    // 2. Log to FinancialTransaction table
    await tx.financialTransaction.create({
      data: {
        transactionType: 'DONATION',
        referenceId: donation.id,
        amount: parseFloat(data.amount),
        disasterEventId: parseInt(data.disasterEventId),
        performedById: userId || null,
        description: `Donation from ${data.donorName}${data.organization ? ' (' + data.organization + ')' : ''}`,
      }
    });

    // 3. Log to FinancialAuditLog (immutable audit trail)
    await tx.financialAuditLog.create({
      data: {
        userId: userId || null,
        action: 'DONATION_CREATED',
        entityType: 'Donation',
        entityId: donation.id,
        amount: parseFloat(data.amount),
        disasterEventId: parseInt(data.disasterEventId),
        newState: JSON.stringify({ donorName: data.donorName, amount: data.amount, donorType: data.donorType }),
      }
    });

    // 4. Update or create budget record for this event
    await tx.budget.upsert({
      where: { disasterEventId: parseInt(data.disasterEventId) },
      update: { allocatedAmount: { increment: parseFloat(data.amount) } },
      create: {
        disasterEventId: parseInt(data.disasterEventId),
        totalBudget: parseFloat(data.amount),
        allocatedAmount: parseFloat(data.amount),
        spentAmount: 0,
      }
    });

    return donation;
  });

  return result;
}

/**
 * Gets paginated donations with filters
 */
async function getDonations(filters = {}) {
  const { page = 1, limit = 20, startDate, endDate, eventId, donorType } = filters;

  const where = {};
  if (eventId) where.disasterEventId = parseInt(eventId);
  if (donorType) where.donorType = donorType;
  if (startDate || endDate) {
    where.donatedAt = {};
    if (startDate) where.donatedAt.gte = new Date(startDate);
    if (endDate) where.donatedAt.lte = new Date(endDate);
  }

  const total = await prisma.donation.count({ where });
  const donations = await prisma.donation.findMany({
    where,
    skip: calculateSkip(page, limit),
    take: parseInt(limit),
    include: {
      disasterEvent: true,
      recordedBy: { select: { id: true, username: true } }
    },
    orderBy: { donatedAt: 'desc' }
  });

  return { donations, total };
}

/**
 * Creates an expense with ACID transaction + approval workflow + financial log
 */
async function createExpense(data, userId) {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create expense record (starts as pending)
    const expense = await tx.expense.create({
      data: {
        category: data.category,
        amount: parseFloat(data.amount),
        description: data.description,
        disasterEventId: parseInt(data.disasterEventId),
        status: 'pending',
        recordedById: userId || null,
        receiptRef: data.receiptRef || null,
      },
      include: { disasterEvent: true }
    });

    // 2. Create approval workflow for this expense
    await tx.approvalWorkflow.create({
      data: {
        type: 'FinancialExpense',
        status: 'pending',
        requesterId: userId,
        resourceAllocationId: null,
        comment: `Expense: ${data.category} - ${data.description}`,
      }
    });

    // 3. Log to FinancialTransaction table
    await tx.financialTransaction.create({
      data: {
        transactionType: 'EXPENSE_REQUEST',
        referenceId: expense.id,
        amount: parseFloat(data.amount),
        disasterEventId: parseInt(data.disasterEventId),
        performedById: userId || null,
        description: `Expense request: ${data.category} - ${data.description}`,
      }
    });

    return expense;
  });

  return result;
}

/**
 * Approves an expense — deducts from budget atomically
 */
async function approveExpense(expenseId, approverId) {
  const result = await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.findUnique({
      where: { id: parseInt(expenseId) }
    });

    if (!expense) throw new Error('Expense not found');
    if (expense.status !== 'pending') throw new Error('Expense already processed');

    // Check budget
    const budget = await tx.budget.findUnique({
      where: { disasterEventId: expense.disasterEventId }
    });

    if (budget) {
      const remaining = parseFloat(budget.totalBudget) - parseFloat(budget.spentAmount);
      if (parseFloat(expense.amount) > remaining) {
        throw new Error(`Insufficient budget. Available: ${remaining}, Required: ${expense.amount}`);
      }
      // Deduct from budget
      await tx.budget.update({
        where: { disasterEventId: expense.disasterEventId },
        data: { spentAmount: { increment: parseFloat(expense.amount) } }
      });
    }

    // Approve expense
    const updated = await tx.expense.update({
      where: { id: parseInt(expenseId) },
      data: { status: 'approved', approvedById: approverId },
      include: { disasterEvent: true }
    });

    // Log approval to FinancialAuditLog
    await tx.financialAuditLog.create({
      data: {
        userId: approverId,
        action: 'EXPENSE_APPROVED',
        entityType: 'Expense',
        entityId: expense.id,
        amount: parseFloat(expense.amount),
        disasterEventId: expense.disasterEventId,
        previousState: JSON.stringify({ status: 'pending' }),
        newState: JSON.stringify({ status: 'approved', approvedById: approverId }),
      }
    });

    // Log approval
    await tx.financialTransaction.create({
      data: {
        transactionType: 'EXPENSE_APPROVED',
        referenceId: expense.id,
        amount: parseFloat(expense.amount),
        disasterEventId: expense.disasterEventId,
        performedById: approverId,
        description: `Expense approved: ${expense.category}`,
      }
    });

    return updated;
  });

  return result;
}

/**
 * Gets paginated expenses with filters
 */
async function getExpenses(filters = {}) {
  const { page = 1, limit = 20, startDate, endDate, eventId, category, status } = filters;

  const where = {};
  if (eventId) where.disasterEventId = parseInt(eventId);
  if (category) where.category = category;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const total = await prisma.expense.count({ where });
  const expenses = await prisma.expense.findMany({
    where,
    skip: calculateSkip(page, limit),
    take: parseInt(limit),
    include: {
      disasterEvent: true,
      recordedBy: { select: { id: true, username: true } },
      approvedBy: { select: { id: true, username: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return { expenses, total };
}

/**
 * Gets comprehensive financial summary per event
 */
async function getFinancialSummary(filters = {}) {
  const { eventId } = filters;

  const where = {};
  if (eventId) where.id = parseInt(eventId);

  const events = await prisma.disasterEvent.findMany({
    where,
    include: {
      donations: true,
      expenses: true,
      budget: true,
    }
  });

  let totalDonations = 0;
  let totalExpenses = 0;
  let totalApprovedExpenses = 0;
  const breakdown = [];

  for (const event of events) {
    const eventDonations = event.donations.reduce((s, d) => s + parseFloat(d.amount), 0);
    const eventExpenses = event.expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const approvedExpenses = event.expenses
      .filter(e => e.status === 'approved')
      .reduce((s, e) => s + parseFloat(e.amount), 0);
    const pendingExpenses = event.expenses
      .filter(e => e.status === 'pending')
      .reduce((s, e) => s + parseFloat(e.amount), 0);

    totalDonations += eventDonations;
    totalExpenses += eventExpenses;
    totalApprovedExpenses += approvedExpenses;

    breakdown.push({
      eventId: event.id,
      eventName: event.name,
      eventType: event.type,
      totalBudget: event.budget ? parseFloat(event.budget.totalBudget) : parseFloat(event.totalBudget || 0),
      totalDonations: eventDonations,
      totalExpenses: eventExpenses,
      approvedExpenses,
      pendingExpenses,
      netBalance: eventDonations - approvedExpenses,
      remainingBudget: event.budget
        ? parseFloat(event.budget.totalBudget) - parseFloat(event.budget.spentAmount)
        : 0,
      donationCount: event.donations.length,
      expenseCount: event.expenses.length,
    });
  }

  return {
    totalDonations,
    totalExpenses,
    totalApprovedExpenses,
    netBalance: totalDonations - totalApprovedExpenses,
    breakdown
  };
}

/**
 * Gets all financial transactions (audit trail)
 */
async function getFinancialTransactions(filters = {}) {
  const { page = 1, limit = 20, eventId, transactionType, startDate, endDate } = filters;

  const where = {};
  if (eventId) where.disasterEventId = parseInt(eventId);
  if (transactionType) where.transactionType = transactionType;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const total = await prisma.financialTransaction.count({ where });
  const transactions = await prisma.financialTransaction.findMany({
    where,
    skip: calculateSkip(page, limit),
    take: parseInt(limit),
    include: {
      disasterEvent: { select: { id: true, name: true } },
      performedBy: { select: { id: true, username: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return { transactions, total };
}

/**
 * Gets or creates budget for a disaster event
 */
async function getBudget(eventId) {
  const budget = await prisma.budget.findUnique({
    where: { disasterEventId: parseInt(eventId) },
    include: { disasterEvent: true }
  });
  return budget;
}

/**
 * Sets/updates budget for a disaster event
 */
async function setBudget(eventId, totalBudget, userId) {
  const result = await prisma.$transaction(async (tx) => {
    const budget = await tx.budget.upsert({
      where: { disasterEventId: parseInt(eventId) },
      update: { totalBudget: parseFloat(totalBudget) },
      create: {
        disasterEventId: parseInt(eventId),
        totalBudget: parseFloat(totalBudget),
        allocatedAmount: 0,
        spentAmount: 0,
      },
      include: { disasterEvent: true }
    });

    await tx.financialTransaction.create({
      data: {
        transactionType: 'BUDGET_SET',
        referenceId: parseInt(eventId),
        amount: parseFloat(totalBudget),
        disasterEventId: parseInt(eventId),
        performedById: userId,
        description: `Budget set to ${totalBudget} for event`,
      }
    });

    return budget;
  });

  return result;
}

/**
 * Gets financial audit log entries
 */
async function getFinancialAuditLog(filters = {}) {
  const { page = 1, limit = 20, entityType, action, eventId, startDate, endDate } = filters;

  const where = {};
  if (entityType) where.entityType = entityType;
  if (action) where.action = action;
  if (eventId) where.disasterEventId = parseInt(eventId);
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const total = await prisma.financialAuditLog.count({ where });
  const logs = await prisma.financialAuditLog.findMany({
    where,
    skip: calculateSkip(page, limit),
    take: parseInt(limit),
    include: {
      user: { select: { id: true, username: true } },
      disasterEvent: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return { logs, total };
}

/**
 * Purchase resources — records a Procurement expense AND increases warehouse stock atomically
 * Only finance_officer and admin can do this
 */
async function purchaseResource(data, userId) {
  const { resourceId, quantity, unitCost, disasterEventId, supplierName, receiptRef } = data;

  // Verify resource exists
  const resource = await prisma.resource.findUnique({
    where: { id: parseInt(resourceId) },
    include: { warehouse: true }
  });
  if (!resource) throw new Error('Resource not found');

  const totalAmount = parseFloat(unitCost) * parseInt(quantity);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Increase resource stock
    const updatedResource = await tx.resource.update({
      where: { id: parseInt(resourceId) },
      data: { quantity: { increment: parseInt(quantity) } },
      include: { warehouse: true }
    });

    // 2. Record as approved Procurement expense
    const expense = await tx.expense.create({
      data: {
        category: 'Procurement',
        amount: totalAmount,
        description: `Purchased ${quantity} ${resource.unit} of ${resource.name}${supplierName ? ` from ${supplierName}` : ''}`,
        disasterEventId: parseInt(disasterEventId),
        status: 'approved',
        approvedById: userId,
        recordedById: userId,
        receiptRef: receiptRef || null,
      }
    });

    // 3. Log to FinancialTransaction
    await tx.financialTransaction.create({
      data: {
        transactionType: 'PROCUREMENT',
        referenceId: expense.id,
        amount: totalAmount,
        disasterEventId: parseInt(disasterEventId),
        performedById: userId,
        description: `Procurement: ${quantity} ${resource.unit} of ${resource.name} @ ${unitCost} each`,
      }
    });

    // 4. Log to FinancialAuditLog
    await tx.financialAuditLog.create({
      data: {
        userId,
        action: 'PROCUREMENT_CREATED',
        entityType: 'Expense',
        entityId: expense.id,
        amount: totalAmount,
        disasterEventId: parseInt(disasterEventId),
        newState: JSON.stringify({ resourceId, quantity, unitCost, supplierName }),
      }
    });

    return { expense, updatedResource, totalAmount };
  });

  return result;
}

module.exports = {
  createDonation,
  getDonations,
  createExpense,
  approveExpense,
  getExpenses,
  getFinancialSummary,
  getFinancialTransactions,
  getBudget,
  setBudget,
  getFinancialAuditLog,
  purchaseResource,
};
