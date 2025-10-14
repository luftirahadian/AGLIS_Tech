// ═══════════════════════════════════════════════════════════════
// 🔔 NOTIFICATION TEMPLATE SERVICE (Frontend)
// ═══════════════════════════════════════════════════════════════

import api from './api';

class NotificationTemplateService {
  /**
   * Get all templates
   */
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.type) params.append('type', filters.type);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
    
    const response = await api.get(`/notification-templates?${params.toString()}`);
    return response.data;
  }

  /**
   * Get template by ID
   */
  async getById(id) {
    const response = await api.get(`/notification-templates/${id}`);
    return response.data;
  }

  /**
   * Preview template
   */
  async preview(id) {
    const response = await api.get(`/notification-templates/${id}/preview`);
    return response.data;
  }

  /**
   * Create template
   */
  async create(templateData) {
    const response = await api.post('/notification-templates', templateData);
    return response.data;
  }

  /**
   * Update template
   */
  async update(id, templateData) {
    const response = await api.put(`/notification-templates/${id}`, templateData);
    return response.data;
  }

  /**
   * Delete template
   */
  async delete(id) {
    const response = await api.delete(`/notification-templates/${id}`);
    return response.data;
  }

  /**
   * Render template with data
   */
  async render(templateCode, data) {
    const response = await api.post('/notification-templates/render', {
      template_code: templateCode,
      data
    });
    return response.data;
  }

  /**
   * Get template categories
   */
  async getCategories() {
    const response = await api.get('/notification-templates/metadata/categories');
    return response.data;
  }

  /**
   * Get template types
   */
  async getTypes() {
    const response = await api.get('/notification-templates/metadata/types');
    return response.data;
  }

  /**
   * Get template statistics
   */
  async getStats(id) {
    const response = await api.get(`/notification-templates/${id}/stats`);
    return response.data;
  }
}

export default new NotificationTemplateService();

