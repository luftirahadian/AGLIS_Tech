import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  Wrench, 
  Package, 
  UserCheck,
  X,
  BarChart3,
  Database,
  ChevronDown,
  ChevronRight,
  UserPlus
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Sidebar = ({ isOpen, onClose, collapsed }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [masterDataOpen, setMasterDataOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState(null)

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'supervisor', 'technician', 'customer_service']
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      roles: ['admin', 'supervisor']
    },
    {
      name: 'Tickets',
      href: '/tickets',
      icon: Ticket,
      roles: ['admin', 'supervisor', 'technician', 'customer_service']
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: Users,
      roles: ['admin', 'supervisor', 'customer_service']
    },
    {
      name: 'Registrations',
      href: '/registrations',
      icon: UserPlus,
      roles: ['admin', 'supervisor', 'customer_service']
    },
    {
      name: 'Reg Analytics',
      href: '/registration-analytics',
      icon: BarChart3,
      roles: ['admin', 'supervisor']
    },
    {
      name: 'Technicians',
      href: '/technicians',
      icon: Wrench,
      roles: ['admin', 'supervisor']
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Package,
      roles: ['admin', 'supervisor', 'technician']
    },
    {
      name: 'Master Data',
      icon: Database,
      roles: ['admin', 'supervisor'],
      hasSubmenu: true,
      submenu: [
        {
          name: 'Service Types',
          href: '/master-data/service-types'
        },
        {
          name: 'Service Categories',
          href: '/master-data/service-categories'
        },
        {
          name: 'Paket Langganan',
          href: '/master-data/packages'
        },
        {
          name: 'Equipment',
          href: '/master-data/equipment'
        },
        {
          name: 'ODP',
          href: '/master-data/odp'
        }
      ]
    },
    {
      name: 'Users',
      href: '/users',
      icon: UserCheck,
      roles: ['admin', 'supervisor']
    }
  ]

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  )

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 bg-white shadow-lg transform transition-all duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${collapsed ? 'lg:w-20' : 'lg:w-64'}
        w-64
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center overflow-hidden">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-white" />
              </div>
            </div>
            {!collapsed && (
              <div className="ml-3 transition-opacity duration-300">
                <h2 className="text-lg font-semibold text-gray-900 whitespace-nowrap">ISP Tech</h2>
              </div>
            )}
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              
              // Handle submenu items
              if (item.hasSubmenu) {
                const isAnySubmenuActive = item.submenu?.some(sub => 
                  location.pathname.startsWith(sub.href)
                )
                const isOpen = masterDataOpen || isAnySubmenuActive
                
                return (
                  <div key={item.name} className="relative group/submenu">
                    <button
                      onClick={() => !collapsed && setMasterDataOpen(!masterDataOpen)}
                      onMouseEnter={() => setHoveredItem(item.name)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`
                        w-full group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors
                        ${isAnySubmenuActive
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                        ${collapsed ? 'justify-center' : ''}
                      `}
                    >
                      <div className="flex items-center">
                        <Icon className={`
                          h-5 w-5 flex-shrink-0
                          ${collapsed ? '' : 'mr-3'}
                          ${isAnySubmenuActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                        `} />
                        {!collapsed && item.name}
                      </div>
                      {!collapsed && (
                        isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )
                      )}
                    </button>
                    
                    {/* Tooltip for collapsed mode */}
                    {collapsed && hoveredItem === item.name && (
                      <div className="absolute left-full ml-2 top-0 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-lg">
                        {item.name}
                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    )}
                    
                    {isOpen && !collapsed && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.submenu.map((subItem) => {
                          const isSubActive = location.pathname === subItem.href
                          
                          return (
                            <NavLink
                              key={subItem.name}
                              to={subItem.href}
                              className={`
                                block px-3 py-2 text-sm rounded-lg transition-colors
                                ${isSubActive
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }
                              `}
                              onClick={onClose}
                            >
                              {subItem.name}
                            </NavLink>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }
              
              // Regular menu items
              const isActive = location.pathname.startsWith(item.href)
              
              return (
                <div key={item.name} className="relative group/item">
                  <NavLink
                    to={item.href}
                    onMouseEnter={() => setHoveredItem(item.name)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                      ${collapsed ? 'justify-center' : ''}
                    `}
                    onClick={onClose}
                  >
                    <Icon className={`
                      h-5 w-5 flex-shrink-0
                      ${collapsed ? '' : 'mr-3'}
                      ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `} />
                    {!collapsed && item.name}
                  </NavLink>
                  
                  {/* Tooltip for collapsed mode */}
                  {collapsed && hoveredItem === item.name && (
                    <div className="absolute left-full ml-2 top-0 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-lg">
                      {item.name}
                      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className={`flex items-center ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex-shrink-0 relative group">
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer">
                <span className="text-white font-medium text-sm">
                  {user?.full_name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              
              {/* Tooltip for collapsed mode */}
              {collapsed && (
                <div className="hidden group-hover:block absolute left-full ml-2 bottom-0 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-lg min-w-max">
                  <p className="font-medium">{user?.full_name}</p>
                  <p className="text-xs text-gray-300 capitalize">
                    {user?.role?.replace('_', ' ')}
                  </p>
                  <div className="absolute left-0 bottom-3 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-500 capitalize truncate">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
