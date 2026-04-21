const { PrismaClient } = require('@prisma/client');
const { calculateSkip } = require('../utils/pagination');

const prisma = new PrismaClient();

/**
 * Creates a new donation record
 */
async function createDonation(data) {
  const donation = await prisma.donation.create({
    data: {
      donorName: data.donorName,
      organization: data.organization || null,
      amount: data.amount,
      disasterEventId: data.disasterEventId,
      donatedAt: data.donatedAt ? new Date(data.donatedAt) : new Date()
    },
    include: {
      disasterEvent: true
    }
  });

  return donation;
}

/**
 * Gets paginated list of donations with filters
 */
async function getDonations(filters = {}) {
  const { page = 1, limit = 20, startDate, endDate, eventId } = filters;

  const where = {};
  
  if (eventId) {
    where.disasterEventId = parseInt(eventId);
  }
  
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
      disasterEvent: true
    },
    orderBy: {
      donatedAt: 'desc'
    }
  });

  return { donations, total };
}

/**
 * Creates a new expense record
 */
async function createExpense(data) {
  const expense = await prisma.expense.create({
    data: {
      category: data.category,
      amount: data.amount,
      description: data.description,
      disasterEventId: data.disasterEventId
    },
    include: {
      disasterEvent: true
    }
  });

  return expense;
}

/**
 * Gets paginated list of expenses with filters
 */
async function getExpenses(filters = {}) {
  const { page = 1, limit = 20, startDate, endDate, eventId, category } = filters;

  const where = {};
  
  if (eventId) {
    where.disasterEventId = parseInt(eventId);
  }
  
  if (category) {
    where.category = category;
  }
  
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
      disasterEvent: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return { expenses, total };
}

/**
 * Gets financial summary with aggregations
 */
async function getFinancialSummary(filters = {}) {
  const { eventId } = filters;

  // Build where clause for filtering
  const where = {};
  if (eventId) {
    where.id = parseInt(eventId);
  }

  // Get all disaster events with their donations and expenses
  const events = await prisma.disasterEvent.findMany({
    where,
    include: {
      donations: true,
      expenses: true
    }
  });

  // Calculate totals
  let totalDonations = 0;
  let totalExpenses = 0;
  const breakdown = [];

  for (const event of events) {
    const eventDonations = event.donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const eventExpenses = event.expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    totalDonations += eventDonations;
    totalExpenses += eventExpenses;

    breakdown.push({
      eventId: event.id,
      eventName: event.name,
      donations: eventDonations,
      expenses: eventExpenses,
      netBalance: eventDonations - eventExpenses,
      donationCount: event.donations.length,
      expenseCount: event.expenses.length
    });
  }

  return {
    totalDonations,
    totalExpenses,
    netBalance: totalDonations - totalExpenses,
    breakdown
  };
}

module.exports = {
  createDonation,
  getDonations,
  createExpense,
  getExpenses,
  getFinancialSummary
};
