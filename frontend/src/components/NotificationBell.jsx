import React, { useState } from 'react'
import { Bell } from 'lucide-react'
import { useUnreadCount } from '../hooks/useNotifications'
import NotificationCenter from './NotificationCenter'

const NotificationBell = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = useUnreadCount()

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ${className}`}
        title="Notifikasi"
      >
        <Bell className="h-5 w-5" />
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Ripple effect for urgent notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full animate-ping opacity-75"></span>
        )}
      </button>

      {/* Notification Center Modal */}
      <NotificationCenter 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  )
}

export default NotificationBell
