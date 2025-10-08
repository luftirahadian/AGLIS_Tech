import api from './api'

export const technicianService = {
  // Get all technicians with filtering
  getTechnicians: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await api.get(`/technicians?${queryString}`)
    return response
  },

  // Get technician by ID with detailed information
  getTechnician: async (id) => {
    const response = await api.get(`/technicians/${id}`)
    return response
  },

  // Create new technician
  createTechnician: async (technicianData) => {
    const response = await api.post('/technicians', technicianData)
    return response
  },

  // Update technician
  updateTechnician: async (id, technicianData) => {
    const response = await api.put(`/technicians/${id}`, technicianData)
    return response
  },

  // Update technician availability status
  updateAvailability: async (id, availabilityData) => {
    const response = await api.patch(`/technicians/${id}/availability`, availabilityData)
    return response
  },

  // Add skill to technician
  addSkill: async (id, skillData) => {
    const response = await api.post(`/technicians/${id}/skills`, skillData)
    return response
  },

  // Get technician statistics
  getTechnicianStats: async () => {
    const response = await api.get('/technicians/stats/overview')
    return response
  },

  // Get available technicians for assignment
  getAvailableTechnicians: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await api.get(`/technicians/available/assignment?${queryString}`)
    return response
  },

  // Get technician performance data
  getTechnicianPerformance: async (id, period = 'month') => {
    const response = await api.get(`/technicians/${id}/performance?period=${period}`)
    return response
  },

  // Update technician location
  updateLocation: async (id, locationData) => {
    const response = await api.patch(`/technicians/${id}/location`, locationData)
    return response
  },

  // Get technician schedule
  getTechnicianSchedule: async (id, startDate, endDate) => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    })
    const response = await api.get(`/technicians/${id}/schedule?${params}`)
    return response
  },

  // Update technician schedule
  updateSchedule: async (id, scheduleData) => {
    const response = await api.put(`/technicians/${id}/schedule`, scheduleData)
    return response
  }
}
