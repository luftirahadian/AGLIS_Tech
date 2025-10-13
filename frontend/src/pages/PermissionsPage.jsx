import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Shield, Save, RefreshCw, CheckCircle, XCircle, Lock, AlertTriangle } from 'lucide-react'
import permissionService from '../services/permissionService'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const PermissionsPage = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState('supervisor')
  const [permissionChanges, setPermissionChanges] = useState({})
  const [hasChanges, setHasChanges] = useState(false)

  // Check if user is admin
  const isAdmin = user?.role === 'admin'

  // Fetch permission matrix
  const { data, isLoading, refetch } = useQuery(
    'permissionMatrix',
    permissionService.getPermissionMatrix,
    {
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to load permissions')
      }
    }
  )

  // Update permissions mutation
  const updateMutation = useMutation(
    ({ role, permissions }) => permissionService.updateRolePermissions(role, permissions),
    {
      onSuccess: () => {
        toast.success('Permissions updated successfully!')
        setPermissionChanges({})
        setHasChanges(false)
        queryClient.invalidateQueries('permissionMatrix')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update permissions')
      }
    }
  )

  const permissions = data?.data?.permissions || []
  const matrix = data?.data?.matrix || {}

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = []
    }
    acc[perm.resource].push(perm)
    return acc
  }, {})

  // Get current permission status for a role
  const isPermissionGranted = (permissionName) => {
    // Check if there are unsaved changes
    if (permissionChanges[permissionName] !== undefined) {
      return permissionChanges[permissionName]
    }
    
    // Use matrix data
    return matrix[selectedRole]?.[permissionName] || false
  }

  // Toggle permission
  const togglePermission = (permissionName) => {
    const currentValue = isPermissionGranted(permissionName)
    setPermissionChanges({
      ...permissionChanges,
      [permissionName]: !currentValue
    })
    setHasChanges(true)
  }

  // Save changes
  const handleSave = () => {
    const permissionsToUpdate = Object.entries(permissionChanges).map(([name, granted]) => {
      const perm = permissions.find(p => p.name === name)
      return {
        permissionId: perm.id,
        granted
      }
    })

    updateMutation.mutate({
      role: selectedRole,
      permissions: permissionsToUpdate
    })
  }

  // Reset changes
  const handleReset = () => {
    setPermissionChanges({})
    setHasChanges(false)
  }

  // Access denied for non-admin
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <AlertTriangle className="h-24 w-24 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">You don't have permission to manage permissions.</p>
        <p className="text-sm text-gray-500">Required role: Admin</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  const roles = [
    { value: 'supervisor', label: 'Supervisor', color: 'blue' },
    { value: 'technician', label: 'Technician', color: 'green' },
    { value: 'customer_service', label: 'Customer Service', color: 'yellow' }
  ]

  const resourceLabels = {
    'dashboard': 'Dashboard',
    'analytics': 'Analytics',
    'tickets': 'Tickets',
    'customers': 'Customers',
    'registrations': 'Registrations',
    'technicians': 'Technicians',
    'inventory': 'Inventory',
    'users': 'Users',
    'permissions': 'Permissions',
    'reports': 'Reports'
  }

  const actionLabels = {
    'view': 'View',
    'create': 'Create',
    'edit': 'Edit',
    'delete': 'Delete',
    'assign': 'Assign',
    'close': 'Close',
    'verify': 'Verify',
    'approve': 'Approve',
    'reject': 'Reject',
    'schedule': 'Schedule',
    'transactions': 'Transactions',
    'reset_password': 'Reset Password',
    'manage': 'Manage',
    'export': 'Export'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 mr-3 text-purple-600" />
            Permission Management
          </h1>
          <p className="text-gray-600 mt-1">Configure role-based access control for the system</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="btn-secondary"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Lock className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">About Permissions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Admin</strong> role always has full access to all features</li>
              <li>Customize permissions for Supervisor, Technician, and Customer Service roles</li>
              <li>Changes take effect immediately after saving</li>
              <li>Be careful when revoking permissions - it may affect user workflows</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Role Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Role to Manage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map(role => (
            <button
              key={role.value}
              onClick={() => {
                if (hasChanges) {
                  if (window.confirm('You have unsaved changes. Are you sure you want to switch roles?')) {
                    setSelectedRole(role.value)
                    setPermissionChanges({})
                    setHasChanges(false)
                  }
                } else {
                  setSelectedRole(role.value)
                }
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedRole === role.value
                  ? `border-${role.color}-500 bg-${role.color}-50`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{role.label}</p>
                  <p className="text-sm text-gray-500">
                    {Object.values(matrix[role.value] || {}).filter(Boolean).length} permissions
                  </p>
                </div>
                {selectedRole === role.value && (
                  <CheckCircle className={`h-6 w-6 text-${role.color}-600`} />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Permissions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Permissions for {roles.find(r => r.value === selectedRole)?.label}
          </h3>
          {hasChanges && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-orange-600 font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Unsaved changes
              </span>
              <button
                onClick={handleReset}
                className="btn-secondary text-sm"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isLoading}
                className="btn-primary text-sm"
              >
                {updateMutation.isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {Object.entries(groupedPermissions).map(([resource, perms]) => (
            <div key={resource} className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                {resourceLabels[resource] || resource}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {perms.map(perm => {
                  const granted = isPermissionGranted(perm.name)
                  const hasChange = permissionChanges[perm.name] !== undefined
                  
                  return (
                    <div
                      key={perm.id}
                      className={`flex items-center justify-between p-3 bg-white rounded-lg border-2 transition-all ${
                        hasChange 
                          ? 'border-orange-300 bg-orange-50' 
                          : granted 
                            ? 'border-green-200 hover:border-green-300' 
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center flex-1">
                        <label className="flex items-center cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={granted}
                            onChange={() => togglePermission(perm.name)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {actionLabels[perm.action] || perm.action}
                            </p>
                            <p className="text-xs text-gray-500">{perm.description}</p>
                          </div>
                        </label>
                      </div>
                      {granted ? (
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-start">
          <Shield className="h-6 w-6 text-purple-600 mt-1 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Permission Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {roles.map(role => {
                const rolePerms = matrix[role.value] || {}
                const grantedCount = Object.values(rolePerms).filter(Boolean).length
                const totalCount = permissions.length
                
                return (
                  <div key={role.value} className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">{role.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {grantedCount}<span className="text-sm text-gray-500">/{totalCount}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((grantedCount / totalCount) * 100)}% access
                    </p>
                  </div>
                )
              })}
              <div className="bg-purple-100 rounded-lg p-4 border border-purple-300">
                <p className="text-xs text-purple-700 font-medium">Admin</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {permissions.length}<span className="text-sm text-purple-600">/{permissions.length}</span>
                </p>
                <p className="text-xs text-purple-700 mt-1">100% access (always)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Important Notes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Admin role cannot be modified and always has full access</li>
              <li>Removing critical permissions may prevent users from doing their jobs</li>
              <li>Test permission changes with a test account before applying to all users</li>
              <li>Permission changes take effect immediately - active users may need to refresh</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PermissionsPage

