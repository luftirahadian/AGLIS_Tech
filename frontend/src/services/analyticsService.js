import api from './api';

const analyticsService = {
  // Dashboard Overview (used by DashboardPage.jsx and AnalyticsDashboard.jsx)
  getDashboardOverview: async (timeframe = 30) => {
    const response = await api.get(`/analytics/dashboard/overview?timeframe=${timeframe}`);
    return response.data;
  },

  // Recent Activities (used by DashboardPage.jsx and AnalyticsDashboard.jsx)
  getRecentActivities: async (limit = 50) => {
    const response = await api.get(`/analytics/dashboard/recent-activities?limit=${limit}`);
    return response.data;
  },

  // Ticket Trends (used by AnalyticsDashboard.jsx)
  getTicketTrends: async (timeframe = 30) => {
    const response = await api.get(`/analytics/dashboard/ticket-trends?timeframe=${timeframe}`);
    return response.data;
  },

  // Service Distribution (used by AnalyticsDashboard.jsx)
  getServiceDistribution: async () => {
    const response = await api.get('/analytics/dashboard/service-distribution');
    return response.data;
  },

  // Priority Analysis (used by AnalyticsDashboard.jsx)
  getPriorityAnalysis: async () => {
    const response = await api.get('/analytics/dashboard/priority-analysis');
    return response.data;
  },

  // Technician Performance (used by AnalyticsDashboard.jsx)
  getTechnicianPerformance: async () => {
    const response = await api.get('/analytics/dashboard/technician-performance');
    return response.data;
  },

  // Legacy functions (for backward compatibility)
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
