import api from './api';

const inventoryStockService = {
  // Get all inventory stock
  getAll: async (params = {}) => {
    const response = await api.get('/inventory-stock', { params });
    return response; // api.js interceptor already extracts response.data
  },

  // Get single inventory stock item
  getById: async (id) => {
    const response = await api.get(`/inventory-stock/${id}`);
    return response;
  },

  // Update inventory stock
  update: async (id, data) => {
    const response = await api.put(`/inventory-stock/${id}`, data);
    return response;
  },

  // Get low stock alerts
  getLowStockAlerts: async () => {
    const response = await api.get('/inventory-stock/alerts/low-stock');
    return response;
  },

  // Get inventory value by category
  getValueByCategory: async () => {
    const response = await api.get('/inventory-stock/reports/value-by-category');
    return response;
  },

  // Get inventory statistics
  getStats: async () => {
    const response = await api.get('/inventory-stock/stats');
    return response;
  }
};

export default inventoryStockService;

