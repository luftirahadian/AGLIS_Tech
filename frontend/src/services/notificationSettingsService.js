// ═══════════════════════════════════════════════════════════════
// ⚙️ NOTIFICATION SETTINGS SERVICE (Frontend)
// ═══════════════════════════════════════════════════════════════

import api from './api';

class NotificationSettingsService {
  /**
   * Get advanced settings
   */
  async getAdvancedSettings() {
    const response = await api.get('/notification-settings/advanced');
    return response.data;
  }

  /**
   * Update advanced settings
   */
  async updateAdvancedSettings(settings) {
    const response = await api.put('/notification-settings/advanced', settings);
    return response.data;
  }

  /**
   * Update type-specific settings
   */
  async updateTypeSettings(type, settings) {
    const response = await api.put(`/notification-settings/type/${type}`, settings);
    return response.data;
  }

  /**
   * Register device for push notifications
   */
  async registerDevice(deviceData) {
    const response = await api.post('/notification-settings/devices/register', deviceData);
    return response.data;
  }

  /**
   * Unregister device
   */
  async unregisterDevice(deviceToken) {
    const response = await api.post('/notification-settings/devices/unregister', {
      device_token: deviceToken
    });
    return response.data;
  }

  /**
   * Get user devices
   */
  async getDevices() {
    const response = await api.get('/notification-settings/devices');
    return response.data;
  }
}

export default new NotificationSettingsService();

