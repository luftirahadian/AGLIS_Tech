// ═══════════════════════════════════════════════════════════════
// 💰 INVOICE SERVICE (Frontend)
// ═══════════════════════════════════════════════════════════════

import api from './api';

const invoiceService = {
  // Get all invoices with filters
  getAll: (params) => api.get('/invoices', { params }),
  
  // Get invoice by ID
  getById: (id) => api.get(`/invoices/${id}`),
  
  // Create new invoice
  create: (data) => api.post('/invoices', data),
  
  // Update invoice
  update: (id, data) => api.put(`/invoices/${id}`, data),
  
  // Delete invoice
  delete: (id) => api.delete(`/invoices/${id}`),
  
  // Mark invoice as sent
  markAsSent: (id) => api.post(`/invoices/${id}/send`),
  
  // Get invoice statistics
  getStatistics: (params) => api.get('/invoices/statistics', { params }),
  
  // Check overdue invoices
  checkOverdue: () => api.post('/invoices/check-overdue'),
};

export default invoiceService;

