import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  Ticket, 
  Users, 
  Wrench, 
  Package, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

const DashboardPage = () => {
  const { user } = useAuth()

  // Mock data - in real app, this would come from API
  const stats = {
    totalTickets: 156,
    openTickets: 23,
    inProgressTickets: 12,
    completedTickets: 121,
    totalCustomers: 1247,
    activeTechnicians: 15,
    lowStockItems: 8
  }

  const StatCard = ({ title, value, icon: Icon, color = 'blue', trend }) => (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-lg bg-${color}-100`}>
              <Icon className={`h-6 w-6 text-${color}-600`} />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trend && (
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">{trend}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const QuickAction = ({ title, description, icon: Icon, color = 'blue', onClick }) => (
    <button
      onClick={onClick}
      className="card hover:shadow-md transition-shadow text-left w-full"
    >
      <div className="card-body">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg bg-${color}-100 mr-3`}>
            <Icon className={`h-5 w-5 text-${color}-600`} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
      </div>
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your ISP operations today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tickets"
          value={stats.totalTickets}
          icon={Ticket}
          color="blue"
          trend="+12% from last month"
        />
        <StatCard
          title="Open Tickets"
          value={stats.openTickets}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgressTickets}
          icon={Wrench}
          color="orange"
        />
        <StatCard
          title="Completed"
          value={stats.completedTickets}
          icon={CheckCircle}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <QuickAction
                  title="Create New Ticket"
                  description="Add a new service request"
                  icon={Ticket}
                  color="blue"
                />
                <QuickAction
                  title="Add Customer"
                  description="Register new customer"
                  icon={Users}
                  color="green"
                />
                <QuickAction
                  title="Assign Technician"
                  description="Assign tickets to technicians"
                  icon={Wrench}
                  color="purple"
                />
                <QuickAction
                  title="Check Inventory"
                  description="View stock levels"
                  icon={Package}
                  color="orange"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="p-1 bg-green-100 rounded-full">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      Ticket #TKT-001 completed by John Doe
                    </p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="p-1 bg-blue-100 rounded-full">
                      <Ticket className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      New ticket created for Jane Smith
                    </p>
                    <p className="text-xs text-gray-500">15 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="p-1 bg-yellow-100 rounded-full">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      Low stock alert: Fiber cables
                    </p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="p-1 bg-purple-100 rounded-full">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      New customer registered: ABC Corp
                    </p>
                    <p className="text-xs text-gray-500">3 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      {(user?.role === 'admin' || user?.role === 'supervisor') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Performance Overview</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Resolution Time</span>
                  <span className="text-sm font-medium text-gray-900">2.4 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Customer Satisfaction</span>
                  <span className="text-sm font-medium text-gray-900">4.8/5.0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">SLA Compliance</span>
                  <span className="text-sm font-medium text-green-600">96.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Technicians</span>
                  <span className="text-sm font-medium text-gray-900">{stats.activeTechnicians}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {stats.lowStockItems} items low in stock
                    </p>
                    <p className="text-xs text-yellow-600">
                      Check inventory management
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      3 tickets approaching SLA deadline
                    </p>
                    <p className="text-xs text-blue-600">
                      Requires immediate attention
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
