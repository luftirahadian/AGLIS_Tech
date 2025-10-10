import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useQuery, useQueryClient } from 'react-query'
import { 
  Ticket, 
  Users, 
  Wrench, 
  Package, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  XCircle,
  FileCheck
} from 'lucide-react'
import analyticsService from '../services/analyticsService'
import LoadingSpinner from '../components/LoadingSpinner'
import KPICard from '../components/dashboard/KPICard'
import { formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const DashboardPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch dashboard overview data
  const { data: overview, isLoading: overviewLoading } = useQuery(
    'dashboard-overview',
    () => analyticsService.getDashboardOverview(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds (reduced from 60s)
      refetchOnWindowFocus: true,
      refetchOnMount: 'always', // Always refetch when component mounts
      staleTime: 0 // Data is always considered stale
    }
  )

  // Fetch recent activities (all today's activities)
  const { data: activities, isLoading: activitiesLoading } = useQuery(
    'dashboard-activities',
    () => analyticsService.getRecentActivities(50), // Get up to 50 today's activities
    {
      refetchInterval: 15000, // Refetch every 15 seconds (reduced from 30s)
      refetchOnWindowFocus: true,
      refetchOnMount: 'always', // Always refetch when component mounts
      staleTime: 0 // Data is always considered stale
    }
  )

  // Listen to socket events for real-time updates
  useEffect(() => {
    // Function to handle ticket updates
    const handleTicketUpdate = () => {
      // Invalidate and refetch dashboard data
      queryClient.invalidateQueries('dashboard-overview')
      queryClient.invalidateQueries('dashboard-activities')
      console.log('📊 Dashboard data refreshed due to ticket update')
    }

    // Listen to custom events from socket
    window.addEventListener('ticket-updated', handleTicketUpdate)
    window.addEventListener('ticket-created', handleTicketUpdate)
    window.addEventListener('ticket-assigned', handleTicketUpdate)
    window.addEventListener('ticket-completed', handleTicketUpdate)

    // Cleanup
    return () => {
      window.removeEventListener('ticket-updated', handleTicketUpdate)
      window.removeEventListener('ticket-created', handleTicketUpdate)
      window.removeEventListener('ticket-assigned', handleTicketUpdate)
      window.removeEventListener('ticket-completed', handleTicketUpdate)
    }
  }, [queryClient])

  if (overviewLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  // Map API response to stats object
  const apiData = overview?.data || {}
  const byStatus = apiData.tickets?.byStatus || {}
  const stats = {
    total_tickets: apiData.tickets?.total || 0,
    open_tickets: byStatus.open || 0,
    assigned_tickets: byStatus.assigned || 0,
    in_progress_tickets: byStatus.in_progress || 0,
    on_hold_tickets: byStatus.on_hold || 0,
    completed_tickets: byStatus.completed || 0,
    cancelled_tickets: byStatus.cancelled || 0,
    ticket_growth: null, // API doesn't provide this yet
    avg_resolution_time: apiData.resolution?.averageHours || null,
    avg_customer_rating: apiData.satisfaction?.averageRating || null,
    sla_compliance: apiData.sla?.complianceRate || null,
    active_technicians: apiData.technicians?.available || 0,
    approaching_sla: 0, // API doesn't provide this in overview
    overdue_tickets: 0 // API doesn't provide this in overview
  }

  const QuickAction = ({ title, description, icon: Icon, color = 'blue', onClick }) => (
    <button
      onClick={onClick}
      className="card hover:shadow-md transition-shadow text-left w-full h-full"
    >
      <div className="card-body flex items-center h-full">
        <div className={`p-2 rounded-lg bg-${color}-100 mr-3 flex-shrink-0`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 truncate">{description}</p>
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

      {/* Stats Grid - All Ticket Status */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <KPICard
          title="Total"
          value={stats.total_tickets || 0}
          icon={Ticket}
          color="blue"
        />
        <KPICard
          title="Open"
          value={stats.open_tickets || 0}
          icon={FileCheck}
          color="blue"
        />
        <KPICard
          title="Assigned"
          value={stats.assigned_tickets || 0}
          icon={Users}
          color="indigo"
        />
        <KPICard
          title="Progress"
          value={stats.in_progress_tickets || 0}
          icon={PlayCircle}
          color="orange"
        />
        <KPICard
          title="On Hold"
          value={stats.on_hold_tickets || 0}
          icon={PauseCircle}
          color="yellow"
        />
        <KPICard
          title="Completed"
          value={stats.completed_tickets || 0}
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          title="Cancelled"
          value={stats.cancelled_tickets || 0}
          icon={XCircle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="card h-full">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                <QuickAction
                  title="Create New Ticket"
                  description="Add a new service request"
                  icon={Ticket}
                  color="blue"
                  onClick={() => navigate('/tickets')}
                />
                <QuickAction
                  title="Add Customer"
                  description="Register new customer"
                  icon={Users}
                  color="green"
                  onClick={() => navigate('/customers')}
                />
                <QuickAction
                  title="Manage Technicians"
                  description="View and manage technicians"
                  icon={Wrench}
                  color="purple"
                  onClick={() => navigate('/technicians')}
                />
                <QuickAction
                  title="Check Inventory"
                  description="View stock levels"
                  icon={Package}
                  color="orange"
                  onClick={() => navigate('/inventory')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Activity */}
        <div>
          <div className="card h-full flex flex-col">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Today's Activity</h2>
            </div>
            <div className="card-body flex-1 overflow-hidden">
              {activitiesLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : activities?.data && activities.data.length > 0 ? (
                <div className="space-y-4 overflow-y-auto h-full pr-2" style={{ maxHeight: '180px' }}>
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
                  Tidak ada aktivitas hari ini
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
