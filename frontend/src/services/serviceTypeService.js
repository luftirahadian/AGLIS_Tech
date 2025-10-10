import api from './api'

const serviceTypeService = {
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.active_only) queryParams.append('active_only', params.active_only)
      if (params.search) queryParams.append('search', params.search)
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.sort_by) queryParams.append('sort_by', params.sort_by)
      if (params.sort_order) queryParams.append('sort_order', params.sort_order)
      
      const queryString = queryParams.toString()
      const response = await api.get(`/service-types${queryString ? '?' + queryString : ''}`)
      return response
    } catch (error) {
      console.error('❌ ServiceTypeService error:', error)
      return { data: [], pagination: {} }
    }
  },

  getById: async (id) => {
    return await api.get(`/service-types/${id}`)
  },

  create: async (data) => {
    return await api.post('/service-types', data)
  },

  update: async (id, data) => {
    return await api.put(`/service-types/${id}`, data)
  },

  delete: async (id) => {
    return await api.delete(`/service-types/${id}`)
  }
}

export default serviceTypeService

