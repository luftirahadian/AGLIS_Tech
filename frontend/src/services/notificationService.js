import api from './api'

const notificationService = {
  // Get notifications with pagination and filters
  getNotifications: async (params = {}) => {
    const queryParams = new URLSearchParams()
    
    // Add pagination
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    
    // Add filters
    if (params.type) queryParams.append('type', params.type)
    if (params.is_read !== undefined) queryParams.append('is_read', params.is_read)
    if (params.priority) queryParams.append('priority', params.priority)
    if (params.include_archived) queryParams.append('include_archived', params.include_archived)
    
    const queryString = queryParams.toString()
    const url = `/notifications${queryString ? `?${queryString}` : ''}`
    
    return api.get(url)
  },

  // Get single notification
  getNotification: async (id) => {
    return api.get(`/notifications/${id}`)
  },

  // Mark notification as read
  markAsRead: async (id) => {
    return api.patch(`/notifications/${id}/read`)
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return api.patch('/notifications/read-all')
  },

  // Archive notification
  archive: async (id) => {
    return api.patch(`/notifications/${id}/archive`)
  },

  // Delete notification
  delete: async (id) => {
    return api.delete(`/notifications/${id}`)
  },

  // Get notification settings
  getSettings: async () => {
    return api.get('/notifications/settings/preferences')
  },

  // Update notification settings
  updateSettings: async (settings) => {
    return api.put('/notifications/settings/preferences', settings)
  },

  // Cleanup expired notifications (admin only)
  cleanupExpired: async () => {
    return api.delete('/notifications/cleanup/expired')
  },

  // Create notification (usually called by system)
  create: async (notificationData) => {
    return api.post('/notifications', notificationData)
  }
}

export default notificationService