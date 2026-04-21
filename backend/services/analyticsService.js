const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Gets dashboard summary metrics
 */
async function getDashboardSummary() {
  // Active incidents count
  const activeIncidents = await prisma.emergencyReport.count({
    where: { status: { in: ['Pending', 'Assigned', 'InProgress'] } }
  });

  // Available teams count
  const availableTeams = await prisma.rescueTeam.count({
    where: { status: 'Available' }
  });

  // Low-stock resources count (quantity < threshold)
  const allResources = await prisma.resource.findMany({
    select: { quantity: true, threshold: true }
  });
  const lowStockResources = allResources.filter(r => r.quantity < r.threshold).length;

  // Hospital occupancy rate
  const hospitals = await prisma.hospital.findMany({
    select: { totalBeds: true, availableBeds: true }
  });
  const totalBeds = hospitals.reduce((sum, h) => sum + h.totalBeds, 0);
  const occupiedBeds = hospitals.reduce((sum, h) => sum + (h.totalBeds - h.availableBeds), 0);
  const hospitalOccupancy = totalBeds > 0
    ? parseFloat((occupiedBeds / totalBeds * 100).toFixed(2))
    : 0;

  // Total donations
  const donationsSum = await prisma.donation.aggregate({ _sum: { amount: true } });
  const totalDonations = parseFloat(donationsSum._sum.amount || 0);

  // Total expenses
  const expensesSum = await prisma.expense.aggregate({ _sum: { amount: true } });
  const totalExpenses = parseFloat(expensesSum._sum.amount || 0);

  // Pending approvals
  const pendingApprovals = await prisma.approvalWorkflow.count({
    where: { status: 'pending' }
  });

  return {
    activeIncidents,
    availableTeams,
    lowStockResources,
    hospitalOccupancy,
    totalDonations,
    totalExpenses,
    netBalance: totalDonations - totalExpenses,
    pendingApprovals
  };
}

/**
 * Gets incident distribution grouped by location, type, and severity
 * Returns byType and bySeverity as plain objects { key: count } for chart compatibility
 */
async function getIncidentDistribution(filters = {}) {
  const { startDate, endDate } = filters;

  const where = {};
  if (startDate || endDate) {
    where.reportedAt = {};
    if (startDate) where.reportedAt.gte = new Date(startDate);
    if (endDate) where.reportedAt.lte = new Date(endDate);
  }

  // Group by location (top 10)
  const byLocationRaw = await prisma.emergencyReport.groupBy({
    by: ['location'],
    where,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10
  });

  // Group by disaster type
  const byTypeRaw = await prisma.emergencyReport.groupBy({
    by: ['disasterType'],
    where,
    _count: { id: true }
  });

  // Group by severity
  const bySeverityRaw = await prisma.emergencyReport.groupBy({
    by: ['severity'],
    where,
    _count: { id: true }
  });

  // Convert to plain objects for chart compatibility
  const byType = {};
  byTypeRaw.forEach(item => { byType[item.disasterType] = item._count.id; });

  const bySeverity = {};
  bySeverityRaw.forEach(item => { bySeverity[item.severity] = item._count.id; });

  const byLocation = byLocationRaw.map(item => ({
    location: item.location,
    count: item._count.id
  }));

  return { byLocation, byType, bySeverity };
}

/**
 * Gets resource utilization rates per warehouse and resource type
 */
async function getResourceUtilization() {
  const warehouses = await prisma.warehouse.findMany({
    include: { resources: true }
  });

  const byWarehouse = warehouses.map(warehouse => {
    const totalQuantity = warehouse.resources.reduce((sum, r) => sum + r.quantity, 0);
    const utilizationRate = warehouse.capacity > 0
      ? parseFloat((totalQuantity / warehouse.capacity * 100).toFixed(2))
      : 0;
    return {
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      totalCapacity: warehouse.capacity,
      totalQuantity,
      utilizationRate,
      resourceCount: warehouse.resources.length
    };
  });

  const byResourceTypeRaw = await prisma.resource.groupBy({
    by: ['resourceType'],
    _sum: { quantity: true },
    _count: { id: true }
  });

  const byResourceType = byResourceTypeRaw.map(item => ({
    resourceType: item.resourceType,
    totalQuantity: item._sum.quantity,
    resourceCount: item._count.id
  }));

  return { byWarehouse, byResourceType };
}

/**
 * Gets average response time between report creation and first team assignment
 */
async function getResponseTime(filters = {}) {
  const { disasterType, severity } = filters;

  const where = {};
  if (disasterType) where.disasterType = disasterType;
  if (severity) where.severity = severity;

  const reports = await prisma.emergencyReport.findMany({
    where,
    include: {
      teamAssignments: {
        orderBy: { assignedAt: 'asc' },
        take: 1
      }
    }
  });

  const responseTimes = reports
    .filter(r => r.teamAssignments.length > 0)
    .map(r => {
      const diffMinutes = (new Date(r.teamAssignments[0].assignedAt) - new Date(r.reportedAt)) / 60000;
      return {
        reportId: r.id,
        disasterType: r.disasterType,
        severity: r.severity,
        responseTimeMinutes: Math.round(diffMinutes)
      };
    });

  const avgOverall = responseTimes.length > 0
    ? responseTimes.reduce((sum, rt) => sum + rt.responseTimeMinutes, 0) / responseTimes.length
    : 0;

  const byTypeMap = {};
  const bySeverityMap = {};
  responseTimes.forEach(rt => {
    if (!byTypeMap[rt.disasterType]) byTypeMap[rt.disasterType] = [];
    byTypeMap[rt.disasterType].push(rt.responseTimeMinutes);
    if (!bySeverityMap[rt.severity]) bySeverityMap[rt.severity] = [];
    bySeverityMap[rt.severity].push(rt.responseTimeMinutes);
  });

  const byDisasterType = Object.keys(byTypeMap).map(type => ({
    disasterType: type,
    avgResponseTimeMinutes: Math.round(byTypeMap[type].reduce((s, t) => s + t, 0) / byTypeMap[type].length)
  }));

  const bySeverity = Object.keys(bySeverityMap).map(sev => ({
    severity: sev,
    avgResponseTimeMinutes: Math.round(bySeverityMap[sev].reduce((s, t) => s + t, 0) / bySeverityMap[sev].length)
  }));

  return {
    avgResponseTimeMinutes: Math.round(avgOverall),
    byDisasterType,
    bySeverity,
    sampleSize: responseTimes.length
  };
}

/**
 * Gets financial breakdown by disaster event
 * Returns { byEvent: [...] } for chart compatibility
 */
async function getFinanceBreakdown(filters = {}) {
  const { startDate, endDate } = filters;

  const events = await prisma.disasterEvent.findMany({
    include: {
      donations: {
        where: {
          ...(startDate && { donatedAt: { gte: new Date(startDate) } }),
          ...(endDate && { donatedAt: { lte: new Date(endDate) } })
        }
      },
      expenses: {
        where: {
          ...(startDate && { createdAt: { gte: new Date(startDate) } }),
          ...(endDate && { createdAt: { lte: new Date(endDate) } })
        }
      }
    }
  });

  const byEvent = events.map(event => {
    const totalDonations = event.donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const totalExpenses = event.expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    return {
      eventId: event.id,
      eventName: event.name,
      eventType: event.type,
      totalDonations,
      totalExpenses,
      netBalance: totalDonations - totalExpenses,
      donationCount: event.donations.length,
      expenseCount: event.expenses.length
    };
  });

  return { byEvent };
}

module.exports = {
  getDashboardSummary,
  getIncidentDistribution,
  getResourceUtilization,
  getResponseTime,
  getFinanceBreakdown
};
