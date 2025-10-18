import api from './api';

/**
 * Notification Center Service
 * Handles API calls for notification center
 */

const notificationCenterService = {
  /**
   * Get all notifications for current user
   * @param {Object} params - Query parameters (page, limit, type, is_read)
   * @returns {Promise} Notifications data
   */
  getNotifications: async (params = {}) => {
    const { page = 1, limit = 50, type = null, is_read = null } = params;
    
    let queryParams = `page=${page}&limit=${limit}`;
    if (type) queryParams += `&type=${type}`;
    if (is_read !== null) queryParams += `&is_read=${is_read}`;
    
    const response = await api.get(`/notification-center?${queryParams}`);
    return response.data; // Return the full response data
  },

  /**
   * Get unread notification count
   * @returns {Promise} Unread count
   */
  getUnreadCount: async () => {
    const response = await api.get('/notification-center/unread-count');
    return response.data; // Return the full response data
  },

  /**
   * Get notification statistics
   * @returns {Promise} Statistics data
   */
  getStatistics: async () => {
    const response = await api.get('/notification-center/statistics');
    return response.data.data; // Return the actual data, not the wrapper
  },

  /**
   * Mark a notification as read
   * @param {number} notificationId - Notification ID
   * @returns {Promise} Updated notification
   */
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notification-center/${notificationId}/read`);
    return response.data.data; // Return the actual data, not the wrapper
  },

  /**
   * Mark all notifications as read
   * @returns {Promise} Count of notifications marked
   */
  markAllAsRead: async () => {
    const response = await api.put('/notification-center/mark-all-read');
    return response.data.data; // Return the actual data, not the wrapper
  },

  /**
   * Delete a notification
   * @param {number} notificationId - Notification ID
   * @returns {Promise} Success status
   */
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notification-center/${notificationId}`);
    return response.data.data; // Return the actual data, not the wrapper
  },

  /**
   * Clear all read notifications
   * @returns {Promise} Count of notifications cleared
   */
  clearReadNotifications: async () => {
    const response = await api.delete('/notification-center/clear-read');
    return response.data.data; // Return the actual data, not the wrapper
  },

  /**
   * Create a notification (admin only)
   * @param {Object} notificationData - Notification data
   * @returns {Promise} Created notification
   */
  createNotification: async (notificationData) => {
    const response = await api.post('/notification-center', notificationData);
    return response.data.data; // Return the actual data, not the wrapper
  }
};

export default notificationCenterService;

