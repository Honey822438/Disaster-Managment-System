const { PrismaClient } = require('@prisma/client');
const { calculateSkip } = require('../utils/pagination');

const prisma = new PrismaClient();

/**
 * Creates a new disaster event
 */
async function createEvent(data) {
  const event = await prisma.disasterEvent.create({
    data: {
      name: data.name,
      type: data.type,
      location: data.location,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      description: data.description || null
    }
  });

  return event;
}

/**
 * Gets paginated list of events
 */
async function getEvents(filters = {}) {
  const { page = 1, limit = 20 } = filters;

  const total = await prisma.disasterEvent.count();

  const events = await prisma.disasterEvent.findMany({
    skip: calculateSkip(page, limit),
    take: parseInt(limit),
    include: {
      _count: {
        select: {
          emergencyReports: true,
          resourceAllocations: true,
          donations: true,
          expenses: true
        }
      }
    },
    orderBy: {
      startDate: 'desc'
    }
  });

  return { events, total };
}

/**
 * Gets a single event by ID
 */
async function getEventById(id) {
  const event = await prisma.disasterEvent.findUnique({
    where: { id: parseInt(id) },
    include: {
      emergencyReports: true,
      resourceAllocations: true,
      donations: true,
      expenses: true
    }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  return event;
}

/**
 * Updates a disaster event
 */
async function updateEvent(id, data) {
  const event = await prisma.disasterEvent.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      type: data.type,
      location: data.location,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : null,
      description: data.description
    }
  });

  return event;
}

/**
 * Deletes a disaster event with cascade check
 */
async function deleteEvent(id) {
  // Check for active emergency reports
  const activeReports = await prisma.emergencyReport.count({
    where: {
      disasterEventId: parseInt(id),
      status: {
        in: ['Pending', 'Assigned', 'InProgress']
      }
    }
  });

  if (activeReports > 0) {
    throw new Error('Cannot delete event with active emergency reports');
  }

  // Check for open resource allocations
  const openAllocations = await prisma.resourceAllocation.count({
    where: {
      disasterEventId: parseInt(id),
      status: 'pending'
    }
  });

  if (openAllocations > 0) {
    throw new Error('Cannot delete event with pending resource allocations');
  }

  await prisma.disasterEvent.delete({
    where: { id: parseInt(id) }
  });
}

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
};
