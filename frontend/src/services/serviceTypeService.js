import api from './api'

const serviceTypeService = {
  getAll: async (activeOnly = false) => {
    try {
      const params = activeOnly ? '?active_only=true' : ''
      const data = await api.get(`/service-types${params}`)
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('❌ ServiceTypeService error:', error)
      return []
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

