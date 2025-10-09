import api from './api'

const registrationService = {
  // PUBLIC ROUTES (No auth required)
  
  /**
   * Request OTP for WhatsApp verification
   */
  requestOTP: async (phone, full_name) => {
    try {
      const response = await api.post('/registrations/public/request-otp', {
        phone,
        full_name
      })
      return response
    } catch (error) {
      throw error
    }
  },

  /**
   * Verify OTP code
   */
  verifyOTP: async (phone, otp) => {
    try {
      const response = await api.post('/registrations/public/verify-otp', {
        phone,
        otp
      })
      return response
    } catch (error) {
      throw error
    }
  },

  /**
   * Submit public registration form
   */
  submitRegistration: async (data) => {
    try {
      const response = await api.post('/registrations/public', data)
      return response
    } catch (error) {
      throw error
    }
  },

  /**
   * Track registration status by registration number or email
   */
  trackStatus: async (identifier) => {
    try {
      const response = await api.get(`/registrations/public/status/${identifier}`)
      return response
    } catch (error) {
      throw error
    }
  },

  // PROTECTED ROUTES (Require authentication)

  /**
   * Get all registrations with filters
   */
  getAll: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString()
      const response = await api.get(`/registrations?${queryString}`)
      return response
    } catch (error) {
      throw error
    }
  },

  /**
   * Get registration statistics
   */
  getStats: async () => {
    try {
      const response = await api.get('/registrations/stats')
      return response
    } catch (error) {
      throw error
    }
  },

  /**
   * Get single registration by ID
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/registrations/${id}`)
      return response
    } catch (error) {
      throw error
    }
  },

  /**
   * Update registration status
   */
  updateStatus: async (id, data) => {
    try {
      const response = await api.put(`/registrations/${id}/status`, data)
      return response
    } catch (error) {
      throw error
    }
  },

  /**
   * Create customer and installation ticket from approved registration
   */
  createCustomer: async (id) => {
    try {
      const response = await api.post(`/registrations/${id}/create-customer`)
      return response
    } catch (error) {
      throw error
    }
  }
}

export default registrationService

