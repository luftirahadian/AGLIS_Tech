import api from './api'

const equipmentService = {
  getAll: async () => {
    // api interceptor already returns response.data, so this is the actual array
    const data = await api.get('/equipment')
    return data
  },

  getById: async (id) => {
    // api interceptor already returns response.data
    const data = await api.get(`/equipment/${id}`)
    return data
  },

  create: async (data) => {
    // api interceptor already returns response.data
    const result = await api.post('/equipment', data)
    return result
  },

  update: async (id, data) => {
    // api interceptor already returns response.data
    const result = await api.put(`/equipment/${id}`, data)
    return result
  },

  delete: async (id) => {
    // api interceptor already returns response.data
    const result = await api.delete(`/equipment/${id}`)
    return result
  }
}

export default equipmentService

