import React, { createContext, useContext, useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import permissionService from '../services/permissionService'
import { useAuth } from './AuthContext'

const PermissionContext = createContext()

export const usePermissions = () => {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider')
  }
  return context
}

export const PermissionProvider = ({ children }) => {
  const { user } = useAuth()
  const [userPermissions, setUserPermissions] = useState([])

  // Fetch user permissions
  const { data, isLoading } = useQuery(
    ['permissions', user?.role],
    () => permissionService.getMyPermissions(),
    {
      enabled: !!user,
      onSuccess: (response) => {
        const perms = response.data?.permissions || []
        // Convert to array of permission names for easy checking
        const permNames = Array.isArray(perms) 
          ? perms.map(p => typeof p === 'string' ? p : p.name)
          : []
        setUserPermissions(permNames)
      },
      onError: (error) => {
        console.error('Failed to load permissions:', error)
        setUserPermissions([])
      }
    }
  )

  // Check if user has a specific permission
  const hasPermission = (permissionName) => {
    // Admin has all permissions
    if (user?.role === 'admin') {
      return true
    }
    
    return userPermissions.includes(permissionName)
  }

  // Check if user has any of the permissions
  const hasAnyPermission = (...permissionNames) => {
    if (user?.role === 'admin') {
      return true
    }
    
    return permissionNames.some(perm => userPermissions.includes(perm))
  }

  // Check if user has all permissions
  const hasAllPermissions = (...permissionNames) => {
    if (user?.role === 'admin') {
      return true
    }
    
    return permissionNames.every(perm => userPermissions.includes(perm))
  }

  // Check permission for a resource and action
  const can = (resource, action) => {
    const permissionName = `${resource}.${action}`
    return hasPermission(permissionName)
  }

  // Check if user can access a page
  const canAccessPage = (pageName) => {
    const pagePermissions = {
      'dashboard': ['dashboard.view'],
      'analytics': ['analytics.view'],
      'tickets': ['tickets.view'],
      'customers': ['customers.view'],
      'registrations': ['registrations.view'],
      'technicians': ['technicians.view'],
      'inventory': ['inventory.view'],
      'users': ['users.view'],
      'permissions': ['permissions.view']
    }

    const required = pagePermissions[pageName]
    if (!required) return true // No specific permission required
    
    return hasAnyPermission(...required)
  }

  const value = {
    permissions: userPermissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    canAccessPage
  }

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

export default PermissionContext

