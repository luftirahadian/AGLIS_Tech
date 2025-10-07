import api from './api'

export const customerService = {
  // Get all customers
  getCustomers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await api.get(`/customers?${queryString}`)
    return response
  },

  // Get customer by ID
  getCustomer: async (id) => {
    const response = await api.get(`/customers/${id}`)
    return response
  },

  // Create new customer
  createCustomer: async (customerData) => {
    const response = await api.post('/customers', customerData)
    return response
  },

  // Update customer
  updateCustomer: async (id, customerData) => {
    const response = await api.put(`/customers/${id}`, customerData)
    return response
  },

  // Delete customer
  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`)
    return response
  }
}
