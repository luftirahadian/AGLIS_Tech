import api from './api'

const userService = {
  getAll: async () => {
    const data = await api.get('/users')
    return data
  },

  getById: async (id) => {
    const data = await api.get(`/users/${id}`)
    return data
  },

  create: async (data) => {
    const result = await api.post('/users', data)
    return result
  },

  update: async (id, data) => {
    const result = await api.put(`/users/${id}`, data)
    return result
  },

  delete: async (id) => {
    const result = await api.delete(`/users/${id}`)
    return result
  },

  updatePassword: async (id, data) => {
    const result = await api.put(`/users/${id}/password`, data)
    return result
  }
}

export default userService

