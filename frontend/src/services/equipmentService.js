import api from './api'

const equipmentService = {
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.category) queryParams.append('category', params.category)
      if (params.status) queryParams.append('status', params.status)
      if (params.search) queryParams.append('search', params.search)
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.sort_by) queryParams.append('sort_by', params.sort_by)
      if (params.sort_order) queryParams.append('sort_order', params.sort_order)
      
      const queryString = queryParams.toString()
      const response = await api.get(`/equipment${queryString ? '?' + queryString : ''}`)
      
      // API interceptor returns response.data which is {success, data: [...]}
      // Return the data array directly for easier consumption
      return response.data || []
    } catch (error) {
      console.error('❌ EquipmentService.getAll error:', error)
      return []
    }
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

