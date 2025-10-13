import React from 'react'
import { useQuery } from 'react-query'
import { Activity, User, Key, Trash2, RotateCcw, Edit, Clock } from 'lucide-react'
import userService from '../../services/userService'
import LoadingSpinner from '../LoadingSpinner'

const ActivityLogPanel = ({ targetUserId = null, limit = 20 }) => {
  const { data: logsResponse, isLoading } = useQuery(
    ['activity-logs', targetUserId],
    () => userService.getActivityLogs({ target_user_id: targetUserId, limit }),
    {
      refetchInterval: 30000, // Auto-refresh every 30 seconds
      refetchOnWindowFocus: false
    }
  )

  const logs = Array.isArray(logsResponse?.data) ? logsResponse.data : []

  const getActionIcon = (action) => {
    switch(action) {
      case 'created':
        return <User className="h-4 w-4 text-green-600" />
      case 'updated':
        return <Edit className="h-4 w-4 text-blue-600" />
      case 'deleted':
      case 'deleted_permanent':
        return <Trash2 className="h-4 w-4 text-red-600" />
      case 'restored':
        return <RotateCcw className="h-4 w-4 text-green-600" />
      case 'password_reset':
        return <Key className="h-4 w-4 text-orange-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionColor = (action) => {
    switch(action) {
      case 'created':
      case 'restored':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'updated':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'deleted':
      case 'deleted_permanent':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'password_reset':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getActionLabel = (action) => {
    const labels = {
      created: 'Created User',
      updated: 'Updated User',
      deleted: 'Deleted User',
      deleted_permanent: 'Permanently Deleted',
      restored: 'Restored User',
      password_reset: 'Reset Password'
    }
    return labels[action] || action
  }

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="sm" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Recent Activity
          </h3>
          <span className="text-sm text-gray-500">{logs.length} activities</span>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No activity logs yet</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  {getActionIcon(log.action)}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {getActionLabel(log.action)}
                    </p>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{log.performer_name || 'System'}</span>
                    {' → '}
                    <span className="font-medium">@{log.target_username}</span>
                  </p>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
                      {Object.entries(log.details).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          <strong>{key}:</strong> {JSON.stringify(value)}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTimestamp(log.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ActivityLogPanel

