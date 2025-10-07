import api from './api'

export const customerService = {
  // Get all customers with enhanced filtering
  getCustomers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await api.get(`/customers?${queryString}`)
    return response
  },

  // Get customer by ID with full details
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

  // Delete customer (soft delete)
  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`)
    return response
  },

  // Add equipment to customer
  addEquipment: async (customerId, equipmentData) => {
    const response = await api.post(`/customers/${customerId}/equipment`, equipmentData)
    return response
  },

  // Add payment record
  addPayment: async (customerId, paymentData) => {
    const response = await api.post(`/customers/${customerId}/payments`, paymentData)
    return response
  },

  // Get customer statistics
  getCustomerStats: async () => {
    const response = await api.get('/customers/stats/overview')
    return response
  }
}
