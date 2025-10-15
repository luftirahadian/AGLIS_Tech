import api from './api';

export const whatsappGroupService = {
  // Get all WhatsApp groups
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/whatsapp-groups?${queryString}`);
  },

  // Get single WhatsApp group
  getById: async (id) => {
    return api.get(`/whatsapp-groups/${id}`);
  },

  // Create WhatsApp group
  create: async (data) => {
    return api.post('/whatsapp-groups', data);
  },

  // Update WhatsApp group
  update: async (id, data) => {
    return api.put(`/whatsapp-groups/${id}`, data);
  },

  // Delete WhatsApp group
  delete: async (id) => {
    return api.delete(`/whatsapp-groups/${id}`);
  },

  // Test send message to group
  testSend: async (id, message) => {
    return api.post(`/whatsapp-groups/${id}/test`, { message });
  },

  // Get delivery logs for group
  getLogs: async (id, limit = 50) => {
    return api.get(`/whatsapp-groups/${id}/logs?limit=${limit}`);
  }
};

export default whatsappGroupService;

