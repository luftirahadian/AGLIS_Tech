import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { Ticket, Plus, Search, Filter, Eye, Target, CheckCircle, Clock, AlertCircle, Users, PlayCircle, PauseCircle, XCircle, FileCheck, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ticketService } from '../../services/ticketService'
import TicketCreateForm from '../../components/TicketCreateForm'
import SmartAssignmentModal from '../../components/SmartAssignmentModal'
import LoadingSpinner from '../../components/LoadingSpinner'
import CountUp from 'react-countup'

// KPI Card Component - Same style as Analytics Dashboard
const KPICard = ({ icon: Icon, title, value, color = 'blue' }) => {
  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-blue-600 bg-blue-50',
      green: 'bg-green-500 text-green-600 bg-green-50',
      yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-50',
      red: 'bg-red-500 text-red-600 bg-red-50',
      purple: 'bg-purple-500 text-purple-600 bg-purple-50',
      indigo: 'bg-indigo-500 text-indigo-600 bg-indigo-50'
    }
    return colors[color] || colors.blue
  }

  const colorClasses = getColorClasses(color).split(' ')
  const iconBg = colorClasses[0]
  const textColor = colorClasses[1]
  const cardBg = colorClasses[2]

  return (
    <div className={`${cardBg} rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-900">
              <CountUp
                end={value}
                duration={1.5}
                separator=","
                preserveValue
              />
            </span>
          </div>
        </div>
        
        <div className={`${iconBg} p-3 rounded-lg flex-shrink-0`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )
}

const TicketsPage = () => {
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [selectedTicketForAssignment, setSelectedTicketForAssignment] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('DESC')
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
      'downgrade': 'Downgrade',
      'wifi_setup': 'WiFi Setup',
      'dismantle': 'Dismantle',
      'speed_test': 'Speed Test',
      'bandwidth_upgrade': 'Bandwidth Upgrade',
      'redundancy_setup': 'Redundancy Setup',
      'network_config': 'Network Config',
      'security_audit': 'Security Audit'
    }
    return typeNames[type] || type
  }

  // Fetch tickets with pagination and sorting
  const { data: ticketsData, isLoading, refetch } = useQuery(
    ['tickets', filters, currentPage, sortBy, sortOrder],
    () => ticketService.getTickets({
      ...filters,
      page: currentPage,
      limit: 5,
      sort_by: sortBy,
      sort_order: sortOrder
    }),
    { 
      keepPreviousData: false, // Changed to false for immediate sorting feedback
      refetchOnMount: true
    }
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
    setCurrentPage(1)
    refetch()
  }
  
  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle sort order
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      // New column, default to DESC
      setSortBy(column)
      setSortOrder('DESC')
    }
    setCurrentPage(1) // Reset to first page when sorting changes
    
    // Invalidate queries to force refresh
    queryClient.invalidateQueries(['tickets'])
  }
  
  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortOrder === 'ASC' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />
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

      {/* Statistics Cards - All Ticket Status - Analytics Style */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <KPICard icon={Ticket} title="Total" value={stats.total_tickets || 0} color="blue" />
        <KPICard icon={FileCheck} title="Open" value={stats.open_tickets || 0} color="blue" />
        <KPICard icon={Users} title="Assigned" value={stats.assigned_tickets || 0} color="indigo" />
        <KPICard icon={PlayCircle} title="Progress" value={stats.in_progress_tickets || 0} color="yellow" />
        <KPICard icon={PauseCircle} title="On Hold" value={stats.on_hold_tickets || 0} color="purple" />
        <KPICard icon={CheckCircle} title="Completed" value={stats.completed_tickets || 0} color="green" />
        <KPICard icon={XCircle} title="Cancelled" value={stats.cancelled_tickets || 0} color="red" />
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
              <option value="on_hold">On Hold</option>
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
              <option value="downgrade">Downgrade</option>
              <option value="wifi_setup">WiFi Setup</option>
              <option value="dismantle">Dismantle</option>
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
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('ticket_number')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Ticket</span>
                        {getSortIcon('ticket_number')}
                      </div>
                    </th>
                    <th className="table-header-cell">Customer</th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Type</span>
                        {getSortIcon('type')}
                      </div>
                    </th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('priority')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Priority</span>
                        {getSortIcon('priority')}
                      </div>
                    </th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th className="table-header-cell">Technician</th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Created</span>
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th className="table-header-cell text-center">Actions</th>
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
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
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
        
        {/* Pagination */}
        {ticketsData?.data?.tickets?.length > 0 && ticketsData?.data?.pagination && (
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(ticketsData.data.pagination.pages, currentPage + 1))}
                  disabled={currentPage === ticketsData.data.pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * 5) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * 5, ticketsData.data.pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{ticketsData.data.pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: ticketsData.data.pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(ticketsData.data.pagination.pages, currentPage + 1))}
                      disabled={currentPage === ticketsData.data.pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
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
