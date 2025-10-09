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
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [masterDataOpen, setMasterDataOpen] = useState(false)

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
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900">ISP Tech</h2>
            </div>
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
                  <div key={item.name}>
                    <button
                      onClick={() => setMasterDataOpen(!masterDataOpen)}
                      className={`
                        w-full group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors
                        ${isAnySubmenuActive
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <Icon className={`
                          mr-3 h-5 w-5 flex-shrink-0
                          ${isAnySubmenuActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                        `} />
                        {item.name}
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    
                    {isOpen && (
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
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={onClose}
                >
                  <Icon className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {item.name}
                </NavLink>
              )
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.full_name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
