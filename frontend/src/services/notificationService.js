import api from './api';

export const notificationService = {
  // Get user notifications with pagination and filters
  getNotifications: async (params = {}) => {
    const {
      page = 1,
      limit = 20,
      type,
      is_read,
      priority,
      include_archived = false
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      include_archived: include_archived.toString()
    });

    if (type) queryParams.append('type', type);
    if (is_read !== undefined) queryParams.append('is_read', is_read.toString());
    if (priority) queryParams.append('priority', priority);

    const response = await api.get(`/notifications?${queryParams}`);
    return response;
  },

  // Get single notification
  getNotification: async (id) => {
    const response = await api.get(`/notifications/${id}`);
    return response;
  },

  // Create notification (usually for system use)
  createNotification: async (notificationData) => {
    const response = await api.post('/notifications', notificationData);
    return response;
  },

  // Mark notification as read
  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response;
  },

  // Archive notification
  archiveNotification: async (id) => {
    const response = await api.patch(`/notifications/${id}/archive`);
    return response;
  },

  // Delete notification
  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response;
  },

  // Get notification settings
  getSettings: async () => {
    const response = await api.get('/notifications/settings/preferences');
    return response;
  },

  // Update notification settings
  updateSettings: async (settings) => {
    const response = await api.put('/notifications/settings/preferences', settings);
    return response;
  },

  // Cleanup expired notifications (admin only)
  cleanupExpired: async () => {
    const response = await api.delete('/notifications/cleanup/expired');
    return response;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/notifications?limit=1&is_read=false');
    return response?.data?.unreadCount || 0;
  },

  // Helper methods for different notification types
  createTicketNotification: async (ticketId, userId, type, message) => {
    return notificationService.createNotification({
      user_id: userId,
      type: `ticket_${type}`,
      title: `Ticket #${ticketId} ${type}`,
      message,
      data: { ticket_id: ticketId },
      priority: type === 'urgent' ? 'high' : 'normal'
    });
  },

  createSystemAlert: async (message, priority = 'normal', targetUsers = null) => {
    const notifications = [];
    
    if (targetUsers && Array.isArray(targetUsers)) {
      for (const userId of targetUsers) {
        notifications.push(
          notificationService.createNotification({
            user_id: userId,
            type: 'system_alert',
            title: 'System Alert',
            message,
            priority
          })
        );
      }
      return Promise.all(notifications);
    }
    
    // If no specific users, this would typically be handled by Socket.IO broadcast
    return null;
  },

  createTechnicianNotification: async (technicianId, type, message, data = {}) => {
    return notificationService.createNotification({
      user_id: technicianId,
      type: `technician_${type}`,
      title: `Technician ${type}`,
      message,
      data,
      priority: 'normal'
    });
  }
};

export default notificationService;
