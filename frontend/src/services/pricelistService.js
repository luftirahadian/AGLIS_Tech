import api from './api';

const pricelistService = {
  // Get all price list
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.service_type) queryParams.append('service_type', params.service_type)
      if (params.package_type) queryParams.append('package_type', params.package_type)
      if (params.is_free) queryParams.append('is_free', params.is_free)
      if (params.is_active) queryParams.append('is_active', params.is_active)
      if (params.search) queryParams.append('search', params.search)
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.sort_by) queryParams.append('sort_by', params.sort_by)
      if (params.sort_order) queryParams.append('sort_order', params.sort_order)
      
      const queryString = queryParams.toString()
      const response = await api.get(`/pricelist${queryString ? '?' + queryString : ''}`)
      return response
    } catch (error) {
      console.error('❌ PricelistService error:', error)
      return { data: [], pagination: {}, summary: [] }
    }
  },

  // Get single price list item
  getById: async (id) => {
    const response = await api.get(`/pricelist/${id}`);
    return response;
  },

  // Get price list by service type
  getByServiceType: async (serviceType, params = {}) => {
    const response = await api.get(`/pricelist/by-service/${serviceType}`, { params });
    return response;
  },

  // Create new price list item
  create: async (data) => {
    const response = await api.post('/pricelist', data);
    return response;
  },

  // Update price list item
  update: async (id, data) => {
    const response = await api.put(`/pricelist/${id}`, data);
    return response;
  },

  // Delete price list item (soft delete)
  delete: async (id) => {
    const response = await api.delete(`/pricelist/${id}`);
    return response;
  },

  // Get pricing summary
  getSummary: async () => {
    const response = await api.get('/pricelist/reports/summary');
    return response;
  }
};

export default pricelistService;

