import api from './api'

const packageService = {
  // Alias for compatibility
  getPackages: async (params = {}) => {
    return packageService.getAll(params)
  },

  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.type) queryParams.append('type', params.type)
      if (params.search) queryParams.append('search', params.search)
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.sort_by) queryParams.append('sort_by', params.sort_by)
      if (params.sort_order) queryParams.append('sort_order', params.sort_order)
      if (params.is_active) queryParams.append('is_active', params.is_active)
      
      const queryString = queryParams.toString()
      const response = await api.get(`/packages${queryString ? '?' + queryString : ''}`)
      return response
    } catch (error) {
      console.error('❌ PackageService error:', error);
      return { data: [], pagination: {} }
    }
  },

  getById: async (id) => {
    return await api.get(`/packages/${id}`)
  },

  create: async (data) => {
    return await api.post('/packages', data)
  },

  update: async (id, data) => {
    return await api.put(`/packages/${id}`, data)
  },

  delete: async (id) => {
    return await api.delete(`/packages/${id}`)
  }
}

export default packageService
