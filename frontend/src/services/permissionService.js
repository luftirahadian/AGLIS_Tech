import api from './api'

const permissionService = {
  // Get all permissions (Admin only)
  getAllPermissions: async () => {
    const response = await api.get('/permissions/all')
    return response
  },

  // Get permissions for a specific role
  getRolePermissions: async (role) => {
    const response = await api.get(`/permissions/role/${role}`)
    return response
  },

  // Get permission matrix for all roles
  getPermissionMatrix: async () => {
    const response = await api.get('/permissions/matrix')
    return response
  },

  // Update role permissions
  updateRolePermissions: async (role, permissions) => {
    const response = await api.put(`/permissions/role/${role}`, { permissions })
    return response
  },

  // Get current user's permissions
  getMyPermissions: async () => {
    const response = await api.get('/permissions/me')
    return response
  }
}

export default permissionService

