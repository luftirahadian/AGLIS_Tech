import api from './api'

const inventoryService = {
  getAll: async () => {
    // api interceptor already returns response.data
    const data = await api.get('/inventory')
    return data
  },

  getById: async (id) => {
    const data = await api.get(`/inventory/${id}`)
    return data
  },

  create: async (data) => {
    const result = await api.post('/inventory', data)
    return result
  },

  update: async (id, data) => {
    const result = await api.put(`/inventory/${id}`, data)
    return result
  },

  delete: async (id) => {
    const result = await api.delete(`/inventory/${id}`)
    return result
  },

  adjustStock: async (id, data) => {
    const result = await api.post(`/inventory/${id}/adjust`, data)
    return result
  }
}

export default inventoryService

