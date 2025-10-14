import api from './api'

const testNotificationService = {
  // Create sample notifications for testing
  createSample: async () => {
    return api.post('/test-notifications/create-sample')
  },

  // Clear all notifications
  clearAll: async () => {
    return api.delete('/test-notifications/clear-all')
  }
}

export default testNotificationService
