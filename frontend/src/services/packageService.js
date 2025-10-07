import api from './api'

export const packageService = {
  // Get all packages
  getPackages: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await api.get(`/packages?${queryString}`)
    return response
  },

  // Get package by ID
  getPackage: async (id) => {
    const response = await api.get(`/packages/${id}`)
    return response
  },

  // Create new package
  createPackage: async (packageData) => {
    const response = await api.post('/packages', packageData)
    return response
  },

  // Update package
  updatePackage: async (id, packageData) => {
    const response = await api.put(`/packages/${id}`, packageData)
    return response
  },

  // Toggle package status
  togglePackageStatus: async (id) => {
    const response = await api.patch(`/packages/${id}/toggle-status`)
    return response
  },

  // Delete package
  deletePackage: async (id) => {
    const response = await api.delete(`/packages/${id}`)
    return response
  },

  // Get package statistics
  getPackageStats: async () => {
    const response = await api.get('/packages/stats/overview')
    return response
  }
}
