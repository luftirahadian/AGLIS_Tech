import api from './api'

export const ticketService = {
  // Get all tickets with filters
  getTickets: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await api.get(`/tickets?${queryString}`)
    return response
  },

  // Get ticket by ID
  getTicket: async (id) => {
    const response = await api.get(`/tickets/${id}`)
    return response
  },

  // Create new ticket
  createTicket: async (ticketData) => {
    const response = await api.post('/tickets', ticketData)
    return response
  },

  // Update ticket status
  updateTicketStatus: async (id, statusData) => {
    const response = await api.put(`/tickets/${id}/status`, statusData)
    return response
  },

  // Assign ticket to technician
  assignTicket: async (id, technicianId) => {
    const response = await api.put(`/tickets/${id}/assign`, { technician_id: technicianId })
    return response
  },

  // Upload attachment
  uploadAttachment: async (ticketId, file, uploadType = 'document') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_type', uploadType)
    
    const response = await api.post(`/tickets/${ticketId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response
  }
}
