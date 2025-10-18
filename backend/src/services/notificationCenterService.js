const pool = require('../config/database');

/**
 * Notification Center Service
 * Handles CRUD operations for user notifications
 */

class NotificationCenterService {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification details
   * @returns {Promise<Object>} Created notification
   */
  async createNotification({
    userId,
    type,
    title,
    message,
    link = null,
    data = null,
    priority = 'normal',
    expiresInDays = 30
  }) {
    try {
      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const query = `
        INSERT INTO notifications (
          user_id, type, title, message, data, priority
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      // Store link inside data JSONB
      const dataToStore = {
        ...(data || {}),
        link: link || null
      };

      const result = await pool.query(query, [
        userId,
        type,
        title,
        message,
        JSON.stringify(dataToStore),
        priority
      ]);

      console.log('✅ Notification created:', {
        id: result.rows[0].id,
        userId,
        type,
        title
      });

      return result.rows[0];
    } catch (error) {
      console.error('❌ Create notification error:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   * @param {Array<number>} userIds - Array of user IDs
   * @param {Object} notificationData - Notification details
   * @returns {Promise<Array>} Created notifications
   */
  async createBulkNotifications(userIds, notificationData) {
    try {
      const notifications = [];
      
      for (const userId of userIds) {
        const notification = await this.createNotification({
          userId,
          ...notificationData
        });
        notifications.push(notification);
      }

      console.log(`✅ Created ${notifications.length} bulk notifications`);
      return notifications;
    } catch (error) {
      console.error('❌ Bulk notification error:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   * @param {number} userId - User ID
   * @param {Object} options - Query options (page, limit, type, isRead)
   * @returns {Promise<Object>} Notifications with pagination
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        type = null,
        isRead = null
      } = options;

      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          id, type, title, message, data, 
          is_read, read_at, priority, created_at
        FROM notifications
        WHERE user_id = $1
      `;

      const params = [userId];
      let paramCount = 1;

      // Filter by type
      if (type) {
        paramCount++;
        query += ` AND type = $${paramCount}`;
        params.push(type);
      }

      // Filter by read status
      if (isRead !== null) {
        paramCount++;
        query += ` AND is_read = $${paramCount}`;
        params.push(isRead);
      }

      // Order by priority and recency
      query += ` 
        ORDER BY 
          CASE priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
          END,
          created_at DESC
      `;

      // Add pagination
      query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) 
        FROM notifications
        WHERE user_id = $1
      `;
      const countParams = [userId];
      let countParamCount = 1;

      if (type) {
        countParamCount++;
        countQuery += ` AND type = $${countParamCount}`;
        countParams.push(type);
      }

      if (isRead !== null) {
        countParamCount++;
        countQuery += ` AND is_read = $${countParamCount}`;
        countParams.push(isRead);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      return {
        notifications: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Get notifications error:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount(userId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = $1
        AND is_read = FALSE
      `;

      const result = await pool.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Get unread count error:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {number} notificationId - Notification ID
   * @param {number} userId - User ID (for security)
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(notificationId, userId) {
    try {
      const query = `
        UPDATE notifications
        SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [notificationId, userId]);

      if (result.rows.length === 0) {
        throw new Error('Notification not found or unauthorized');
      }

      return result.rows[0];
    } catch (error) {
      console.error('❌ Mark as read error:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of notifications marked
   */
  async markAllAsRead(userId) {
    try {
      const query = `
        UPDATE notifications
        SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND is_read = FALSE
        RETURNING id
      `;

      const result = await pool.query(query, [userId]);

      console.log(`✅ Marked ${result.rows.length} notifications as read for user ${userId}`);
      return result.rows.length;
    } catch (error) {
      console.error('❌ Mark all as read error:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param {number} notificationId - Notification ID
   * @param {number} userId - User ID (for security)
   * @returns {Promise<boolean>} Success status
   */
  async deleteNotification(notificationId, userId) {
    try {
      const query = `
        DELETE FROM notifications
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;

      const result = await pool.query(query, [notificationId, userId]);

      if (result.rows.length === 0) {
        throw new Error('Notification not found or unauthorized');
      }

      console.log(`✅ Notification ${notificationId} deleted`);
      return true;
    } catch (error) {
      console.error('❌ Delete notification error:', error);
      throw error;
    }
  }

  /**
   * Clear all read notifications for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of notifications deleted
   */
  async clearReadNotifications(userId) {
    try {
      const query = `
        DELETE FROM notifications
        WHERE user_id = $1 AND is_read = TRUE
        RETURNING id
      `;

      const result = await pool.query(query, [userId]);

      console.log(`✅ Cleared ${result.rows.length} read notifications for user ${userId}`);
      return result.rows.length;
    } catch (error) {
      console.error('❌ Clear notifications error:', error);
      throw error;
    }
  }

  /**
   * Delete old notifications (cleanup job)
   * @param {number} daysOld - Delete notifications older than this many days
   * @returns {Promise<number>} Number of notifications deleted
   */
  async deleteOldNotifications(daysOld = 30) {
    try {
      const query = `
        DELETE FROM notifications
        WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
        AND is_read = TRUE
        RETURNING id
      `;

      const result = await pool.query(query);

      if (result.rows.length > 0) {
        console.log(`🧹 Cleaned up ${result.rows.length} old notifications (>${daysOld} days)`);
      }

      return result.rows.length;
    } catch (error) {
      console.error('❌ Delete old notifications error:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread,
          COUNT(CASE WHEN type = 'ticket' THEN 1 END) as tickets,
          COUNT(CASE WHEN type = 'registration' THEN 1 END) as registrations,
          COUNT(CASE WHEN type = 'invoice' THEN 1 END) as invoices,
          COUNT(CASE WHEN type = 'system' THEN 1 END) as system,
          COUNT(CASE WHEN type = 'alert' THEN 1 END) as alerts,
          COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent
        FROM notifications
        WHERE user_id = $1
      `;

      const result = await pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Get statistics error:', error);
      throw error;
    }
  }
}

module.exports = new NotificationCenterService();

