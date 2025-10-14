// ═══════════════════════════════════════════════════════════════
// 📊 NOTIFICATION ANALYTICS SERVICE (Frontend)
// ═══════════════════════════════════════════════════════════════

import api from './api';

class NotificationAnalyticsService {
  /**
   * Track notification view
   */
  async trackView(notificationId, metadata = {}) {
    const response = await api.post('/notification-analytics/track/view', {
      notification_id: notificationId,
      metadata
    });
    return response.data;
  }

  /**
   * Track notification read
   */
  async trackRead(notificationId) {
    const response = await api.post('/notification-analytics/track/read', {
      notification_id: notificationId
    });
    return response.data;
  }

  /**
   * Track notification click
   */
  async trackClick(notificationId) {
    const response = await api.post('/notification-analytics/track/click', {
      notification_id: notificationId
    });
    return response.data;
  }

  /**
   * Get overall analytics
   */
  async getOverview(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.type) params.append('type', filters.type);
    if (filters.priority) params.append('priority', filters.priority);
    
    const response = await api.get(`/notification-analytics/overview?${params.toString()}`);
    return response.data;
  }

  /**
   * Get analytics by type
   */
  async getByType(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    
    const response = await api.get(`/notification-analytics/by-type?${params.toString()}`);
    return response.data;
  }

  /**
   * Get analytics by priority
   */
  async getByPriority(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    
    const response = await api.get(`/notification-analytics/by-priority?${params.toString()}`);
    return response.data;
  }

  /**
   * Get daily trend
   */
  async getTrend(days = 30) {
    const response = await api.get(`/notification-analytics/trend?days=${days}`);
    return response.data;
  }

  /**
   * Get device stats
   */
  async getDeviceStats() {
    const response = await api.get('/notification-analytics/devices');
    return response.data;
  }

  /**
   * Get top performing notifications
   */
  async getTopPerforming(limit = 10) {
    const response = await api.get(`/notification-analytics/top-performing?limit=${limit}`);
    return response.data;
  }
}

export default new NotificationAnalyticsService();

