import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved === 'true'
  })

  // Save to localStorage whenever collapsed state changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed)
  }, [sidebarCollapsed])

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
      />
      
      {/* Floating Toggle Button - Desktop Only */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={`
          hidden lg:flex items-center justify-center
          fixed top-20 z-50
          w-6 h-12 bg-white border border-gray-200 
          rounded-r-lg shadow-md
          text-gray-600 hover:text-blue-600 hover:bg-blue-50
          transition-all duration-300
          group
          ${sidebarCollapsed ? 'left-20' : 'left-64'}
        `}
        title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="h-4 w-4 group-hover:scale-125 transition-transform" />
        ) : (
          <ChevronLeft className="h-4 w-4 group-hover:scale-125 transition-transform" />
        )}
      </button>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
