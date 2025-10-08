import api from './api'

const serviceCategoryService = {
  getAll: async (serviceTypeCode = null, activeOnly = false) => {
    try {
      const params = new URLSearchParams()
      if (serviceTypeCode) params.append('service_type_code', serviceTypeCode)
      if (activeOnly) params.append('active_only', 'true')
      
      const queryString = params.toString()
      const data = await api.get(`/service-categories${queryString ? '?' + queryString : ''}`)
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('❌ ServiceCategoryService error:', error)
      return []
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

