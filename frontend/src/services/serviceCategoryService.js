import api from './api'

const serviceCategoryService = {
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.service_type_code) queryParams.append('service_type_code', params.service_type_code)
      if (params.active_only) queryParams.append('active_only', params.active_only)
      if (params.search) queryParams.append('search', params.search)
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.sort_by) queryParams.append('sort_by', params.sort_by)
      if (params.sort_order) queryParams.append('sort_order', params.sort_order)
      
      const queryString = queryParams.toString()
      const response = await api.get(`/service-categories${queryString ? '?' + queryString : ''}`)
      return response
    } catch (error) {
      console.error('❌ ServiceCategoryService error:', error)
      return { data: [], pagination: {} }
    }
  },

  getById: async (id) => {
    return await api.get(`/service-categories/${id}`)
  },

  create: async (data) => {
    return await api.post('/service-categories', data)
  },

  update: async (id, data) => {
    return await api.put(`/service-categories/${id}`, data)
  },

  delete: async (id) => {
    return await api.delete(`/service-categories/${id}`)
  }
}

export default serviceCategoryService

