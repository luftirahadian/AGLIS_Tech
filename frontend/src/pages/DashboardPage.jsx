import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useQuery } from 'react-query'
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
import analyticsService from '../services/analyticsService'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const DashboardPage = () => {
  const { user } = useAuth()

  // Fetch dashboard overview data
  const { data: overview, isLoading: overviewLoading } = useQuery(
    'dashboard-overview',
    () => analyticsService.getDashboardOverview(),
    {
      refetchInterval: 60000, // Refetch every 1 minute
      refetchOnWindowFocus: true
    }
  )

  // Fetch recent activities
  const { data: activities, isLoading: activitiesLoading } = useQuery(
    'dashboard-activities',
    () => analyticsService.getRecentActivities(5),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchOnWindowFocus: true
    }
  )

  if (overviewLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  // Map API response to stats object
  const apiData = overview?.data || {}
  const stats = {
    total_tickets: apiData.tickets?.total || 0,
    open_tickets: apiData.tickets?.byStatus?.open || 0,
    in_progress_tickets: apiData.tickets?.byStatus?.in_progress || 0,
    completed_tickets: apiData.tickets?.byStatus?.completed || 0,
    ticket_growth: null, // API doesn't provide this yet
    avg_resolution_time: apiData.resolution?.averageHours || null,
    avg_customer_rating: apiData.satisfaction?.averageRating || null,
    sla_compliance: apiData.sla?.complianceRate || null,
    active_technicians: apiData.technicians?.available || 0,
    approaching_sla: 0, // API doesn't provide this in overview
    overdue_tickets: 0 // API doesn't provide this in overview
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
          value={stats.total_tickets || 0}
          icon={Ticket}
          color="blue"
          trend={stats.ticket_growth ? `${stats.ticket_growth > 0 ? '+' : ''}${stats.ticket_growth}% from last month` : null}
        />
        <StatCard
          title="Open Tickets"
          value={stats.open_tickets || 0}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="In Progress"
          value={stats.in_progress_tickets || 0}
          icon={Wrench}
          color="orange"
        />
        <StatCard
          title="Completed"
          value={stats.completed_tickets || 0}
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
              {activitiesLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : activities?.data && activities.data.length > 0 ? (
                <div className="space-y-4">
                  {activities.data.map((activity, index) => {
                    // Generate description from activity data
                    let description = ''
                    let Icon = Ticket
                    let color = 'blue'
                    
                    if (activity.status === 'completed') {
                      description = `Ticket #${activity.ticketNumber} completed`
                      Icon = CheckCircle
                      color = 'green'
                    } else if (activity.status === 'assigned') {
                      description = `Ticket #${activity.ticketNumber} assigned to technician`
                      Icon = Wrench
                      color = 'purple'
                    } else if (activity.status === 'in_progress') {
                      description = `Ticket #${activity.ticketNumber} in progress`
                      Icon = Clock
                      color = 'orange'
                    } else if (activity.status === 'open') {
                      description = `New ticket created: ${activity.title}`
                      Icon = Ticket
                      color = 'blue'
                    } else {
                      description = `Ticket #${activity.ticketNumber} - ${activity.title}`
                    }
                    
                    return (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`p-1 bg-${color}-100 rounded-full`}>
                            <Icon className={`h-4 w-4 text-${color}-600`} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            {description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.timestamp && !isNaN(new Date(activity.timestamp).getTime()) 
                              ? formatDistanceToNow(new Date(activity.timestamp), { 
                                  addSuffix: true,
                                  locale: localeId 
                                })
                              : 'Baru saja'
                            }
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Tidak ada aktivitas terbaru
                </p>
              )}
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
                  <span className="text-sm font-medium text-gray-900">
                    {stats.avg_resolution_time ? `${stats.avg_resolution_time.toFixed(1)} hours` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Customer Satisfaction</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.avg_customer_rating ? `${stats.avg_customer_rating.toFixed(1)}/5.0` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">SLA Compliance</span>
                  <span className={`text-sm font-medium ${stats.sla_compliance >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {stats.sla_compliance ? `${stats.sla_compliance.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Technicians</span>
                  <span className="text-sm font-medium text-gray-900">{stats.active_technicians || 0}</span>
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
                {stats.approaching_sla > 0 && (
                  <div className="flex items-center p-3 bg-red-50 rounded-lg">
                    <Clock className="h-5 w-5 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        {stats.approaching_sla} tickets approaching SLA deadline
                      </p>
                      <p className="text-xs text-red-600">
                        Requires immediate attention
                      </p>
                    </div>
                  </div>
                )}
                
                {stats.overdue_tickets > 0 && (
                  <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        {stats.overdue_tickets} tickets overdue
                      </p>
                      <p className="text-xs text-yellow-600">
                        Past SLA deadline
                      </p>
                    </div>
                  </div>
                )}

                {(!stats.approaching_sla || stats.approaching_sla === 0) && (!stats.overdue_tickets || stats.overdue_tickets === 0) && (
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        All tickets on track
                      </p>
                      <p className="text-xs text-green-600">
                        No urgent alerts
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
