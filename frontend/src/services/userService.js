import api from './api'

const userService = {
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.role) queryParams.append('role', params.role)
      if (params.status) queryParams.append('status', params.status)
      if (params.search) queryParams.append('search', params.search)
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.sort_by) queryParams.append('sort_by', params.sort_by)
      if (params.sort_order) queryParams.append('sort_order', params.sort_order)
      
      const queryString = queryParams.toString()
      const response = await api.get(`/users${queryString ? '?' + queryString : ''}`)
      return response
    } catch (error) {
      console.error('❌ UserService error:', error)
      return { data: [], pagination: {} }
    }
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

