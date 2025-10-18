import React, { useState, useRef, useEffect } from 'react'
import { Menu, Bell, User, LogOut, Settings, ChevronDown, TestTube } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import NotificationBell from './NotificationBell'
import NotificationBadge from './NotificationBadge'
import NotificationSettings from './NotificationSettings'
import TestNotificationPanel from './TestNotificationPanel'

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false)
  const [testNotificationOpen, setTestNotificationOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
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
            {/* Notification Center (New) */}
            <NotificationBadge />
            
            {/* Old Notification Bell (Keep for backward compatibility) */}
            {/* <NotificationBell /> */}

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
                      onClick={() => {
                        setNotificationSettingsOpen(true)
                        setDropdownOpen(false)
                      }}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Bell className="h-4 w-4 mr-3 text-gray-400" />
                      Notification Settings
                    </button>
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => {
                          setTestNotificationOpen(true)
                          setDropdownOpen(false)
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <TestTube className="h-4 w-4 mr-3 text-gray-400" />
                        Test Notifications
                      </button>
                    )}
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
      
      {/* Notification Settings Modal */}
      <NotificationSettings 
        isOpen={notificationSettingsOpen} 
        onClose={() => setNotificationSettingsOpen(false)} 
      />
      
      {/* Test Notification Panel */}
      <TestNotificationPanel 
        isOpen={testNotificationOpen} 
        onClose={() => setTestNotificationOpen(false)} 
      />
    </header>
  )
}

export default Header
