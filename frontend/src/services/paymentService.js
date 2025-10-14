// ═══════════════════════════════════════════════════════════════
// 💳 PAYMENT SERVICE (Frontend)
// ═══════════════════════════════════════════════════════════════

import api from './api';

const paymentService = {
  // Get all payments with filters
  getAll: (params) => api.get('/payments', { params }),
  
  // Get payment by ID
  getById: (id) => api.get(`/payments/${id}`),
  
  // Record new payment
  create: (data) => api.post('/payments', data),
  
  // Update payment
  update: (id, data) => api.put(`/payments/${id}`, data),
  
  // Delete payment
  delete: (id) => api.delete(`/payments/${id}`),
  
  // Verify payment
  verify: (id) => api.post(`/payments/${id}/verify`),
  
  // Refund payment
  refund: (id, data) => api.post(`/payments/${id}/refund`, data),
  
  // Get payment statistics
  getStatistics: (params) => api.get('/payments/statistics', { params }),
};

export default paymentService;

