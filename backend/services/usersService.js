const { PrismaClient } = require('@prisma/client');
const { calculateSkip } = require('../utils/pagination');

const prisma = new PrismaClient();

/**
 * Gets paginated list of users
 */
async function getUsers(filters = {}) {
  const { page = 1, limit = 20 } = filters;

  const total = await prisma.user.count();

  const users = await prisma.user.findMany({
    skip: calculateSkip(page, limit),
    take: parseInt(limit),
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
      // Exclude password
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return { users, total };
}

/**
 * Gets a single user by ID
 */
async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
      // Exclude password
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

/**
 * Updates a user
 */
async function updateUser(id, data) {
  const updateData = {};
  
  if (data.username) updateData.username = data.username;
  if (data.email) updateData.email = data.email;
  if (data.role) updateData.role = data.role;

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: updateData,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return user;
}

/**
 * Deletes a user
 */
async function deleteUser(id) {
  await prisma.user.delete({
    where: { id: parseInt(id) }
  });
}

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
