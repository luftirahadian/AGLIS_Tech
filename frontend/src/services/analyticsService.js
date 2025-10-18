import api from './api';

const analyticsService = {
  // Get ticket trend data
  getTicketTrend: async (range = '7days') => {
    const response = await api.get(`/analytics/ticket-trend?range=${range}`);
    return response.data;
  },

  // Get status distribution
  getStatusDistribution: async () => {
    const response = await api.get('/analytics/status-distribution');
    return response.data;
  },

  // Get technician performance
  getTechnicianPerformance: async () => {
    const response = await api.get('/analytics/technician-performance');
    return response.data;
  },

  // Get revenue trend
  getRevenueTrend: async () => {
    const response = await api.get('/analytics/revenue-trend');
    return response.data;
  },

  // Get KPI metrics
  getKPIMetrics: async () => {
    const response = await api.get('/analytics/kpi');
    return response.data;
  },

  // Get response time metrics
  getResponseTimeMetrics: async () => {
    const response = await api.get('/analytics/response-time');
    return response.data;
  },

  // Get SLA compliance
  getSLACompliance: async () => {
    const response = await api.get('/analytics/sla-compliance');
    return response.data;
  }
};

export default analyticsService;
