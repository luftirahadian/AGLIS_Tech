import api from './api'

export const authService = {
  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response
  },

  // Register user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/me')
    return response
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData)
    return response
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData)
    return response
  },

  // Logout (client-side only)
  logout: () => {
    localStorage.removeItem('token')
  }
}
