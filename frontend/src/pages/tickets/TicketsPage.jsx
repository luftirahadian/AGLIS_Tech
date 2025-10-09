import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { Ticket, Plus, Search, Filter, Eye, Target, CheckCircle, Clock, AlertCircle, Users, PlayCircle, PauseCircle, XCircle, FileCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ticketService } from '../../services/ticketService'
import TicketCreateForm from '../../components/TicketCreateForm'
import SmartAssignmentModal from '../../components/SmartAssignmentModal'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatsCard from '../../components/common/StatsCard'

const TicketsPage = () => {
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [selectedTicketForAssignment, setSelectedTicketForAssignment] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    priority: ''
  })

  // Format type name for display
  const formatTypeName = (type) => {
    const typeNames = {
      'installation': 'Installation',
      'repair': 'Repair',
      'maintenance': 'Maintenance',
      'upgrade': 'Upgrade',
      'wifi_setup': 'WiFi Setup',
      'speed_test': 'Speed Test',
      'bandwidth_upgrade': 'Bandwidth Upgrade',
      'redundancy_setup': 'Redundancy Setup',
      'network_config': 'Network Config',
      'security_audit': 'Security Audit'
    }
    return typeNames[type] || type
  }

  // Fetch tickets
  const { data: ticketsData, isLoading, refetch } = useQuery(
    ['tickets', filters],
    () => ticketService.getTickets(filters),
    { keepPreviousData: true }
  )

  // Fetch ticket statistics
  const { data: statsData } = useQuery(
    'ticket-stats',
    () => ticketService.getTicketStats(),
    {
      refetchOnWindowFocus: true,
      refetchOnMount: 'always'
    }
  )

  // Listen to socket events for real-time ticket updates
  useEffect(() => {
    const handleTicketUpdate = () => {
      // Invalidate and refetch ticket data
      queryClient.invalidateQueries(['tickets'])
      queryClient.invalidateQueries('ticket-stats')
      console.log('🎫 Ticket list & stats refreshed due to ticket update')
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

  const handleCreateSuccess = () => {
    refetch()
  }

  const handleAssignTicket = (ticket) => {
    setSelectedTicketForAssignment(ticket)
    setShowAssignmentModal(true)
  }

  const closeAssignmentModal = () => {
    setShowAssignmentModal(false)
    setSelectedTicketForAssignment(null)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { class: 'badge-info', label: 'Open' },
      assigned: { class: 'badge-warning', label: 'Assigned' },
      in_progress: { class: 'badge-warning', label: 'In Progress' },
      completed: { class: 'badge-success', label: 'Completed' },
      cancelled: { class: 'badge-gray', label: 'Cancelled' },
      on_hold: { class: 'badge-gray', label: 'On Hold' }
    }
    const config = statusConfig[status] || statusConfig.open
    return <span className={`badge ${config.class}`}>{config.label}</span>
  }

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { class: 'badge-gray', label: 'Low' },
      normal: { class: 'badge-info', label: 'Normal' },
      high: { class: 'badge-warning', label: 'High' },
      critical: { class: 'badge-danger', label: 'Critical' }
    }
    const config = priorityConfig[priority] || priorityConfig.normal
    return <span className={`badge ${config.class}`}>{config.label}</span>
  }

  const stats = statsData?.data || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600">Manage service requests and work orders</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </button>
      </div>

      {/* Statistics Cards - All Ticket Status */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <StatsCard
          icon={Ticket}
          title="Total"
          value={stats.total_tickets || 0}
          iconColor="blue"
        />
        <StatsCard
          icon={FileCheck}
          title="Open"
          value={stats.open_tickets || 0}
          iconColor="blue"
        />
        <StatsCard
          icon={Users}
          title="Assigned"
          value={stats.assigned_tickets || 0}
          iconColor="indigo"
        />
        <StatsCard
          icon={PlayCircle}
          title="Progress"
          value={stats.in_progress_tickets || 0}
          iconColor="orange"
        />
        <StatsCard
          icon={PauseCircle}
          title="On Hold"
          value={stats.on_hold_tickets || 0}
          iconColor="yellow"
        />
        <StatsCard
          icon={CheckCircle}
          title="Completed"
          value={stats.completed_tickets || 0}
          iconColor="green"
        />
        <StatsCard
          icon={XCircle}
          title="Cancelled"
          value={stats.cancelled_tickets || 0}
          iconColor="red"
        />
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Cari tiket..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="form-input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Semua Status</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe
            </label>
            <select
              className="form-input"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">Semua Tipe</option>
              <option value="installation">Installation</option>
              <option value="repair">Repair</option>
              <option value="maintenance">Maintenance</option>
              <option value="upgrade">Upgrade</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioritas
            </label>
            <select
              className="form-input"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <option value="">Semua Prioritas</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">
            All Tickets
            {ticketsData?.data && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({ticketsData.data.pagination.total} total)
              </span>
            )}
          </h2>
        </div>
        <div className="card-body p-0">
          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner className="mx-auto" />
            </div>
          ) : ticketsData?.data?.tickets?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Ticket</th>
                    <th className="table-header-cell">Customer</th>
                    <th className="table-header-cell">Type</th>
                    <th className="table-header-cell">Priority</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Technician</th>
                    <th className="table-header-cell">Created</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {ticketsData.data.tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="table-cell">
                        <div>
                          <div className="font-medium text-gray-900">
                            {ticket.ticket_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.title}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div>
                          <div className="font-medium text-gray-900">
                            {ticket.customer_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.customer_phone}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="capitalize">{formatTypeName(ticket.type)}</span>
                      </td>
                      <td className="table-cell">
                        {getPriorityBadge(ticket.priority)}
                      </td>
                      <td className="table-cell">
                        {getStatusBadge(ticket.status)}
                      </td>
                      <td className="table-cell">
                        {ticket.technician_name ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              {ticket.technician_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {ticket.employee_id}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(ticket.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <Link
                            to={`/tickets/${ticket.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {ticket.status === 'open' && (
                            <button
                              onClick={() => handleAssignTicket(ticket)}
                              className="inline-flex items-center justify-center w-8 h-8 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                              title="Assign Technician"
                            >
                              <Target className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first ticket.
              </p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Ticket
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Form Modal */}
      <TicketCreateForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Smart Assignment Modal */}
      <SmartAssignmentModal
        isOpen={showAssignmentModal}
        onClose={closeAssignmentModal}
        ticket={selectedTicketForAssignment}
      />
    </div>
  )
}

export default TicketsPage
