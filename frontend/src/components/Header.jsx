import React, { useState, useRef, useEffect } from 'react'
import { Menu, Bell, User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { Link } from 'react-router-dom'

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const { unreadCount, notifications, markAsRead, markAllAsRead, isSocketConnected } = useNotifications()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const notificationRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      {/* Updated with PostCSS config */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Title */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              {/* Logo */}
              <img 
                src="/aglis-logo.svg" 
                alt="AGLIS Net" 
                className="h-9 w-auto"
              />
              
              {/* Title */}
              <div>
                <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
                  AGLIS Management System
                </h1>
                <h1 className="text-lg font-semibold text-gray-900 sm:hidden">
                  AGLIS
                </h1>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {/* Connection status indicator */}
                <span className={`absolute -bottom-1 -right-1 h-2 w-2 rounded-full ${
                  isSocketConnected ? 'bg-green-400' : 'bg-gray-400'
                }`} title={isSocketConnected ? 'Real-time connected' : 'Offline mode'} />
              </button>

              {/* Notification Dropdown */}
              {notificationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-[9999] max-h-96 overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-500 text-sm">
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            !notification.is_read ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => !notification.is_read && markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                              !notification.is_read ? 'bg-blue-500' : 'bg-gray-300'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                      <Link
                        to="/notifications"
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => setNotificationDropdownOpen(false)}
                      >
                        View all notifications
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-sm">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden lg:block text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-[9999] border border-gray-200 ring-1 ring-black ring-opacity-5">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-3 text-gray-400" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3 text-red-500" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Logout Button - Mobile Only */}
            <button 
              onClick={handleLogout}
              className="lg:hidden p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
