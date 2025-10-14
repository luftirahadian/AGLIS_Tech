import React, { useState } from 'react'
import { Play, Trash2, Settings } from 'lucide-react'
import testNotificationService from '../services/testNotificationService'
import { toast } from 'react-hot-toast'

const TestNotificationPanel = ({ isOpen, onClose }) => {
  const [isCreating, setIsCreating] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const handleCreateSample = async () => {
    try {
      setIsCreating(true)
      const response = await testNotificationService.createSample()
      toast.success(`Created ${response.data.notifications.length} sample notifications`)
    } catch (error) {
      console.error('Failed to create sample notifications:', error)
      toast.error('Failed to create sample notifications')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClearAll = async () => {
    try {
      setIsClearing(true)
      await testNotificationService.clearAll()
      toast.success('All notifications cleared')
    } catch (error) {
      console.error('Failed to clear notifications:', error)
      toast.error('Failed to clear notifications')
    } finally {
      setIsClearing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Test Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Gunakan panel ini untuk membuat notifikasi sample untuk testing Notification Center.
          </p>

          <div className="space-y-4">
            {/* Create Sample Button */}
            <button
              onClick={handleCreateSample}
              disabled={isCreating}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="h-5 w-5" />
              <span>{isCreating ? 'Creating...' : 'Create Sample Notifications'}</span>
            </button>

            {/* Clear All Button */}
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="h-5 w-5" />
              <span>{isClearing ? 'Clearing...' : 'Clear All Notifications'}</span>
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Sample notifications include:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Ticket assigned notification</li>
              <li>• Ticket status update</li>
              <li>• System alert (urgent priority)</li>
              <li>• Technician status update</li>
              <li>• New ticket created</li>
              <li>• Ticket completed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestNotificationPanel
