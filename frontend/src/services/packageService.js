import api from './api'

const packageService = {
  getAll: async () => {
    try {
      // api interceptor already returns response.data, so response is the data itself
      const data = await api.get('/packages')
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('❌ PackageService error:', error);
      return []
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
