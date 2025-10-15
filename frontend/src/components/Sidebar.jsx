import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  Wrench, 
  Package, 
  UserCheck,
  Shield,
  X,
  BarChart3,
  Database,
  ChevronDown,
  ChevronRight,
  UserPlus,
  Bell,
  Zap,
  FileText,
  CreditCard,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Sidebar = ({ isOpen, onClose, collapsed }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [hoveredItem, setHoveredItem] = useState(null)
  
  // State for collapsible sections
  const [coreOpsOpen, setCoreOpsOpen] = useState(true)  // ✅ OPEN by default
  const [customerMgmtOpen, setCustomerMgmtOpen] = useState(false)  // ❌ CLOSED by default
  const [financialOpen, setFinancialOpen] = useState(false)  // ❌ CLOSED by default
  const [operationsOpen, setOperationsOpen] = useState(false)  // ❌ CLOSED by default
  const [analyticsOpen, setAnalyticsOpen] = useState(false)  // ❌ CLOSED by default
  const [systemAdminOpen, setSystemAdminOpen] = useState(false)  // ❌ CLOSED by default
  
  // State for nested submenus (existing)
  const [masterDataOpen, setMasterDataOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const navigationSections = [
    {
      id: 'core-operations',
      section: 'Core Operations',
      icon: LayoutDashboard,
      roles: ['admin', 'supervisor', 'manager', 'noc', 'technician', 'customer_service'],
      isOpen: coreOpsOpen,
      setIsOpen: setCoreOpsOpen,
      items: [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          roles: ['admin', 'supervisor', 'manager', 'noc', 'technician', 'customer_service']
        },
        {
          name: 'Tickets',
          href: '/tickets',
          icon: Ticket,
          roles: ['admin', 'supervisor', 'manager', 'noc', 'technician', 'customer_service']
        }
      ]
    },
    {
      id: 'customer-management',
      section: 'Customer Management',
      icon: Users,
      roles: ['admin', 'supervisor', 'manager', 'noc', 'customer_service'],
      isOpen: customerMgmtOpen,
      setIsOpen: setCustomerMgmtOpen,
      items: [
        {
          name: 'Customers',
          href: '/customers',
          icon: Users,
          roles: ['admin', 'supervisor', 'manager', 'noc', 'customer_service']
        },
        {
          name: 'Registrations',
          href: '/registrations',
          icon: UserPlus,
          roles: ['admin', 'supervisor', 'manager', 'customer_service']
        }
      ]
    },
    {
      id: 'financial-management',
      section: 'Financial',
      icon: DollarSign,
      roles: ['admin', 'supervisor', 'customer_service'],
      isOpen: financialOpen,
      setIsOpen: setFinancialOpen,
      items: [
        {
          name: 'Invoices',
          href: '/invoices',
          icon: FileText,
          roles: ['admin', 'supervisor', 'customer_service']
        },
        {
          name: 'Payments',
          href: '/payments',
          icon: CreditCard,
          roles: ['admin', 'supervisor', 'customer_service']
        }
      ]
    },
    {
      id: 'operations',
      section: 'Operations',
      icon: Wrench,
      roles: ['admin', 'supervisor', 'manager', 'noc', 'technician'],
      isOpen: operationsOpen,
      setIsOpen: setOperationsOpen,
      items: [
        {
          name: 'Technicians',
          href: '/technicians',
          icon: Wrench,
          roles: ['admin', 'supervisor', 'manager', 'noc']
        },
        {
          name: 'Inventory',
          href: '/inventory-stock',
          icon: Package,
          roles: ['admin', 'supervisor', 'manager', 'noc', 'technician']
        }
      ]
    },
    {
      id: 'analytics-reports',
      section: 'Analytics & Reports',
      icon: TrendingUp,
      roles: ['admin', 'supervisor', 'manager', 'noc'],
      isOpen: analyticsOpen,
      setIsOpen: setAnalyticsOpen,
      items: [
        {
          name: 'Analytics',
          href: '/analytics',
          icon: BarChart3,
          roles: ['admin', 'supervisor', 'manager', 'noc']
        },
        {
          name: 'Reg Analytics',
          href: '/registration-analytics',
          icon: BarChart3,
          roles: ['admin', 'supervisor', 'manager']
        },
        {
          name: 'Performance',
          href: '/performance',
          icon: Zap,
          roles: ['admin', 'manager']
        }
      ]
    },
    {
      id: 'system-admin',
      section: 'System & Admin',
      icon: Shield,
      roles: ['admin', 'supervisor'],
      isOpen: systemAdminOpen,
      setIsOpen: setSystemAdminOpen,
      items: [
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
              name: 'Price List',
              href: '/master-data/price-list'
            },
            {
              name: 'Equipment',
              href: '/master-data/equipment'
            },
            {
              name: 'ODP',
              href: '/master-data/odp'
            },
            {
              name: 'Skill Levels',
              href: '/master-data/skill-levels'
            },
            {
              name: 'Specializations',
              href: '/master-data/specializations'
            },
            {
              name: 'WhatsApp Groups',
              href: '/master-data/whatsapp-groups'
            }
          ]
        },
        {
          name: 'Notifications',
          icon: Bell,
          roles: ['admin', 'supervisor'],
          hasSubmenu: true,
          submenu: [
            {
              name: 'Templates',
              href: '/notifications/templates'
            },
            {
              name: 'Analytics',
              href: '/notifications/analytics'
            },
            {
              name: 'Settings',
              href: '/notifications/settings'
            }
          ]
        },
        {
          name: 'Users',
          href: '/users',
          icon: UserCheck,
          roles: ['admin', 'supervisor']
        },
        {
          name: 'Permissions',
          href: '/permissions',
          icon: Shield,
          roles: ['admin']
        }
      ]
    }
  ]

  // Filter sections based on user role
  const filteredSections = navigationSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.roles.includes(user?.role))
    }))
    .filter(section => 
      section.roles.includes(user?.role) && section.items.length > 0
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
              <img 
                src="/aglis-logo.svg" 
                alt="AGLIS Net" 
                className="h-8 w-8"
              />
            </div>
            {!collapsed && (
              <h2 className="ml-3 text-lg font-semibold text-gray-800 whitespace-nowrap">
                AGLIS
              </h2>
            )}
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {filteredSections.map((section) => (
            <div key={section.id} className="mb-2">
              {/* Section Header */}
              <button
                onClick={() => section.setIsOpen(!section.isOpen)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md
                  transition-colors duration-150
                  ${collapsed ? 'justify-center' : ''}
                  text-gray-600 hover:bg-gray-100 hover:text-gray-900
                `}
                onMouseEnter={() => !collapsed && setHoveredItem(section.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <section.icon className={`flex-shrink-0 h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
                  {!collapsed && (
                    <span className="truncate font-semibold text-xs uppercase tracking-wide">
                      {section.section}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  section.isOpen ? 
                    <ChevronDown className="h-4 w-4 flex-shrink-0" /> : 
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                )}
              </button>

              {/* Section Items */}
              {section.isOpen && !collapsed && (
                <div className="mt-1 space-y-1 ml-2">
                  {section.items.map((item) => {
                    if (item.hasSubmenu) {
                      // Nested submenu item (Master Data, Notifications)
                      const isSubmenuOpen = item.name === 'Master Data' ? masterDataOpen : notificationsOpen
                      const setSubmenuOpen = item.name === 'Master Data' ? setMasterDataOpen : setNotificationsOpen
                      
                      return (
                        <div key={item.name}>
                          <button
                            onClick={() => setSubmenuOpen(!isSubmenuOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          >
                            <div className="flex items-center">
                              <item.icon className="mr-3 flex-shrink-0 h-4 w-4" />
                              <span>{item.name}</span>
                            </div>
                            {isSubmenuOpen ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </button>
                          
                          {isSubmenuOpen && (
                            <div className="ml-8 mt-1 space-y-1">
                              {item.submenu.map((subItem) => (
                                <NavLink
                                  key={subItem.href}
                                  to={subItem.href}
                                  className={({ isActive }) => `
                                    flex items-center px-3 py-2 text-sm rounded-md transition-colors
                                    ${isActive
                                      ? 'bg-blue-50 text-blue-700 font-medium'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }
                                  `}
                                >
                                  <span className="truncate">{subItem.name}</span>
                                </NavLink>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    }

                    // Regular menu item
                    return (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        className={({ isActive }) => `
                          flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                          ${isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                      >
                        <item.icon className="mr-3 flex-shrink-0 h-4 w-4" />
                        <span className="truncate">{item.name}</span>
                      </NavLink>
                    )
                  })}
                </div>
              )}

              {/* Tooltip for collapsed sidebar */}
              {collapsed && hoveredItem === section.id && (
                <div className="absolute left-20 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-50">
                  {section.section}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`}>
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
            </div>
            {!collapsed && (
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">
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
