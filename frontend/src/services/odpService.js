import api from './api'

const odpService = {
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.status) queryParams.append('status', params.status)
      if (params.area) queryParams.append('area', params.area)
      if (params.search) queryParams.append('search', params.search)
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.sort_by) queryParams.append('sort_by', params.sort_by)
      if (params.sort_order) queryParams.append('sort_order', params.sort_order)
      
      const queryString = queryParams.toString()
      const response = await api.get(`/odp${queryString ? '?' + queryString : ''}`)
      return response
    } catch (error) {
      console.error('❌ ODPService error:', error)
      return { data: [], pagination: {} }
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

