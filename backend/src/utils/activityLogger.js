const pool = require('../config/database');

/**
 * Log user activity for audit trail
 * @param {Object} params - Activity log parameters
 * @param {number} params.userId - User who performed the action
 * @param {string} params.action - Action type (created, updated, deleted, restored, password_reset)
 * @param {number} params.targetUserId - User who was affected
 * @param {string} params.targetUsername - Username of affected user
 * @param {Object} params.details - Additional details (JSON)
 * @param {string} params.ipAddress - IP address of requester
 * @param {string} params.userAgent - User agent of requester
 */
const logActivity = async ({
  userId,
  action,
  targetUserId,
  targetUsername,
  details = {},
  ipAddress = null,
  userAgent = null
}) => {
  try {
    await pool.query(
      `INSERT INTO user_activity_logs 
       (user_id, action, target_user_id, target_username, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        action,
        targetUserId,
        targetUsername,
        JSON.stringify(details),
        ipAddress,
        userAgent
      ]
    );
  } catch (error) {
    // Don't throw error, just log it - activity logging shouldn't break the main flow
    console.error('Activity logging error:', error);
  }
};

/**
 * Get activity logs
 * @param {Object} params - Query parameters
 * @param {number} params.userId - Filter by user who performed action
 * @param {number} params.targetUserId - Filter by affected user
 * @param {string} params.action - Filter by action type
 * @param {number} params.limit - Number of records
 * @param {number} params.offset - Offset for pagination
 */
const getActivityLogs = async ({
  userId = null,
  targetUserId = null,
  action = null,
  limit = 50,
  offset = 0
} = {}) => {
  try {
    let query = `
      SELECT 
        al.*,
        u.username as performer_username,
        u.full_name as performer_name
      FROM user_activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (userId) {
      paramCount++;
      query += ` AND al.user_id = $${paramCount}`;
      params.push(userId);
    }

    if (targetUserId) {
      paramCount++;
      query += ` AND al.target_user_id = $${paramCount}`;
      params.push(targetUserId);
    }

    if (action) {
      paramCount++;
      query += ` AND al.action = $${paramCount}`;
      params.push(action);
    }

    query += ` ORDER BY al.created_at DESC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Get activity logs error:', error);
    return [];
  }
};

module.exports = {
  logActivity,
  getActivityLogs
};

