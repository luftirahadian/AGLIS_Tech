import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Ticket, Plus, Search, Filter, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ticketService } from '../../services/ticketService'
import TicketCreateForm from '../../components/TicketCreateForm'
import LoadingSpinner from '../../components/LoadingSpinner'

const TicketsPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    priority: ''
  })

  // Fetch tickets
  const { data: ticketsData, isLoading, refetch } = useQuery(
    ['tickets', filters],
    () => ticketService.getTickets(filters),
    { keepPreviousData: true }
  )

  const handleCreateSuccess = () => {
    refetch()
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

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  className="form-input pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="form-label">Type</label>
              <select
                className="form-input"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="installation">Installation</option>
                <option value="repair">Repair</option>
                <option value="maintenance">Maintenance</option>
                <option value="upgrade">Upgrade</option>
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select
                className="form-input"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
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
                        <span className="capitalize">{ticket.type}</span>
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
                          className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
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
      </div>

      {/* Create Ticket Form Modal */}
      <TicketCreateForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}

export default TicketsPage
