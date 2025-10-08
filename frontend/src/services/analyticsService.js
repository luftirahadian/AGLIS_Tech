import api from './api';

const analyticsService = {
  // Get dashboard overview statistics
  getDashboardOverview: async (timeframe = 30) => {
    const response = await api.get(`/analytics/dashboard/overview?timeframe=${timeframe}`);
    return response;
  },

  // Get ticket trends for charts
  getTicketTrends: async (days = 30) => {
    const response = await api.get(`/analytics/dashboard/ticket-trends?days=${days}`);
    return response;
  },

  // Get service type distribution
  getServiceDistribution: async () => {
    const response = await api.get('/analytics/dashboard/service-distribution');
    return response;
  },

  // Get technician performance
  getTechnicianPerformance: async () => {
    const response = await api.get('/analytics/dashboard/technician-performance');
    return response;
  },

  // Get priority analysis
  getPriorityAnalysis: async () => {
    const response = await api.get('/analytics/dashboard/priority-analysis');
    return response;
  },

  // Get recent activities
  getRecentActivities: async (limit = 10) => {
    const response = await api.get(`/analytics/dashboard/recent-activities?limit=${limit}`);
    return response;
  }
};

export default analyticsService;
