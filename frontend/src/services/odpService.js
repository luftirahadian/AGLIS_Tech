import api from './api'

const odpService = {
  getAll: async () => {
    try {
      const data = await api.get('/odp')
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('❌ ODPService error:', error)
      return []
    }
  },

  getById: async (id) => {
    return await api.get(`/odp/${id}`)
  },

  create: async (data) => {
    return await api.post('/odp', data)
  },

  update: async (id, data) => {
    return await api.put(`/odp/${id}`, data)
  },

  delete: async (id) => {
    return await api.delete(`/odp/${id}`)
  }
}

export default odpService

