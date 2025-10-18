import api from './api';

// ==================== REGISTRATIONS BULK OPERATIONS ====================

export const bulkVerifyRegistrations = async (ids, data = {}) => {
  const response = await api.post('/bulk/registrations/verify', { ids, data });
  return response.data;
};

export const bulkApproveRegistrations = async (ids, data = {}) => {
  const response = await api.post('/bulk/registrations/approve', { ids, data });
  return response.data;
};

export const bulkRejectRegistrations = async (ids, data = {}) => {
  const response = await api.post('/bulk/registrations/reject', { ids, data });
  return response.data;
};

// ==================== TICKETS BULK OPERATIONS ====================

export const bulkAssignTickets = async (ids, data = {}) => {
  const response = await api.post('/bulk/tickets/assign', { ids, data });
  return response.data;
};

export const bulkUpdateTicketStatus = async (ids, data = {}) => {
  const response = await api.post('/bulk/tickets/update-status', { ids, data });
  return response.data;
};

export const bulkUpdateTicketPriority = async (ids, data = {}) => {
  const response = await api.post('/bulk/tickets/update-priority', { ids, data });
  return response.data;
};

// ==================== CUSTOMERS BULK OPERATIONS ====================

export const bulkUpdateCustomerStatus = async (ids, data = {}) => {
  const response = await api.post('/bulk/customers/update-status', { ids, data });
  return response.data;
};

export const bulkDeleteCustomers = async (ids) => {
  const response = await api.post('/bulk/customers/delete', { ids });
  return response.data;
};

// ==================== EXPORT ====================

const bulkOperationsService = {
  // Registrations
  bulkVerifyRegistrations,
  bulkApproveRegistrations,
  bulkRejectRegistrations,
  
  // Tickets
  bulkAssignTickets,
  bulkUpdateTicketStatus,
  bulkUpdateTicketPriority,
  
  // Customers
  bulkUpdateCustomerStatus,
  bulkDeleteCustomers,
};

export default bulkOperationsService;

