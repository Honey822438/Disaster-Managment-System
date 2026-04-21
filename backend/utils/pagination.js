/**
 * Formats paginated response data
 * @param {Array} data - Array of data items
 * @param {number} total - Total count of items
 * @param {number} page - Current page number (default: 1)
 * @param {number} limit - Items per page (default: 20)
 * @returns {object} Formatted pagination response
 */
function paginate(data, total, page = 1, limit = 20) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages
  };
}

/**
 * Calculates skip value for Prisma queries
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {number} Number of items to skip
 */
function calculateSkip(page, limit) {
  return (parseInt(page) - 1) * parseInt(limit);
}

module.exports = { paginate, calculateSkip };
