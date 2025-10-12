import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Upload,
  Download,
  Package
} from 'lucide-react'
import { ticketService } from '../../services/ticketService'
import { useAuth } from '../../contexts/AuthContext'
import StatusUpdateForm from '../../components/StatusUpdateForm'
import BackButton from '../../components/common/BackButton'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const TicketDetailPage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('details')

  // Fetch ticket details
  const { data: ticketData, isLoading, error } = useQuery(
    ['ticket', id],
    () => ticketService.getTicket(id),
    { enabled: !!id }
  )

  // Update ticket status mutation
  const updateStatusMutation = useMutation(
    (updateData) => ticketService.updateTicketStatus(id, updateData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['ticket', id])
        queryClient.invalidateQueries(['tickets'])
        toast.success('Ticket status updated successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update ticket status')
      }
    }
  )

  const ticket = ticketData?.data?.ticket

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { class: 'badge-info', label: 'Open', icon: Clock },
      assigned: { class: 'badge-warning', label: 'Assigned', icon: User },
      in_progress: { class: 'badge-warning', label: 'In Progress', icon: Clock },
      completed: { class: 'badge-success', label: 'Completed', icon: CheckCircle },
      cancelled: { class: 'badge-gray', label: 'Cancelled', icon: AlertCircle },
      on_hold: { class: 'badge-gray', label: 'On Hold', icon: Clock }
    }
    const config = statusConfig[status] || statusConfig.open
    const Icon = config.icon
    return (
      <span className={`badge ${config.class} inline-flex items-center`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    )
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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return null
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffMs = end - start
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHours}h ${diffMinutes}m`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <BackButton to="/tickets" label="Back to Tickets" />
        </div>
        <div className="card">
          <div className="card-body text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket Not Found</h3>
            <p className="text-gray-500">
              The ticket you're looking for doesn't exist or you don't have permission to view it.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'status', label: 'Update Status', icon: Clock },
    { id: 'history', label: 'History', icon: Calendar }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BackButton to="/tickets" label="Back to Tickets" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ticket.ticket_number}</h1>
            <p className="text-gray-600">{ticket.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(ticket.status)}
          {getPriorityBadge(ticket.priority)}
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Customer</p>
                <p className="text-lg font-semibold text-gray-900">{ticket.customer_name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600 bg-green-100 rounded-lg p-2 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Created</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600 bg-orange-100 rounded-lg p-2 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">SLA Due</p>
                <p className="text-lg font-semibold text-gray-900">
                  {ticket.sla_due_date ? new Date(ticket.sla_due_date).toLocaleDateString() : 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <User className="h-8 w-8 text-purple-600 bg-purple-100 rounded-lg p-2 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Technician</p>
                <p className="text-lg font-semibold text-gray-900">
                  {ticket.technician_name || 'Unassigned'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {!['completed', 'cancelled'].includes(ticket.status) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
            </div>
            <div className="flex items-center gap-3">
              {ticket.status === 'open' && user && (
                <button
                  onClick={() => {
                    updateStatusMutation.mutate({
                      status: 'assigned',
                      technician_id: user.id,
                      notes: 'Self-assigned via quick action'
                    })
                  }}
                  disabled={updateStatusMutation.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <User className="h-4 w-4" />
                  Assign to Me
                </button>
              )}
              
              {['assigned', 'in_progress'].includes(ticket.status) && (
                <button
                  onClick={() => {
                    updateStatusMutation.mutate({
                      status: 'completed',
                      notes: 'Completed via quick action'
                    })
                  }}
                  disabled={updateStatusMutation.isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  Complete Ticket
                </button>
              )}

              {!['on_hold', 'cancelled'].includes(ticket.status) && (
                <button
                  onClick={() => {
                    updateStatusMutation.mutate({
                      status: 'on_hold',
                      notes: 'Put on hold via quick action'
                    })
                  }}
                  disabled={updateStatusMutation.isLoading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400 text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <Clock className="h-4 w-4" />
                  Put On Hold
                </button>
              )}

              {ticket.status !== 'cancelled' && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel this ticket?')) {
                      updateStatusMutation.mutate({
                        status: 'cancelled',
                        notes: 'Cancelled via quick action'
                      })
                    }
                  }}
                  disabled={updateStatusMutation.isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Ticket Information */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Ticket Information</h3>
                </div>
                <div className="card-body">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Type</dt>
                      <dd className="text-sm text-gray-900">{ticket.service_type_name || ticket.type}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Category</dt>
                      <dd className="text-sm text-gray-900">{ticket.category_name || ticket.category || 'Not specified'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Scheduled Date</dt>
                      <dd className="text-sm text-gray-900">{formatDateTime(ticket.scheduled_date)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Estimated Duration</dt>
                      <dd className="text-sm text-gray-900">
                        {ticket.estimated_duration ? `${ticket.estimated_duration} minutes` : 'Not specified'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Started At</dt>
                      <dd className="text-sm text-gray-900">{formatDateTime(ticket.started_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Completed At</dt>
                      <dd className="text-sm text-gray-900">{formatDateTime(ticket.completed_at)}</dd>
                    </div>
                    {ticket.started_at && ticket.completed_at && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Actual Duration</dt>
                        <dd className="text-sm text-gray-900">
                          {calculateDuration(ticket.started_at, ticket.completed_at)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* Description */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                </div>
                <div className="card-body">
                  <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </div>

              {/* Work Notes */}
              {ticket.work_notes && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-gray-900">Work Notes</h3>
                  </div>
                  <div className="card-body">
                    <p className="text-gray-700 whitespace-pre-wrap">{ticket.work_notes}</p>
                  </div>
                </div>
              )}

              {/* Resolution */}
              {ticket.resolution_notes && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-gray-900">Resolution</h3>
                  </div>
                  <div className="card-body">
                    <p className="text-gray-700 whitespace-pre-wrap">{ticket.resolution_notes}</p>
                    {ticket.customer_rating && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Customer Rating:</span>
                          <div className="flex items-center">
                            {'⭐'.repeat(ticket.customer_rating)}
                            <span className="ml-2 text-sm text-gray-500">
                              ({ticket.customer_rating}/5)
                            </span>
                          </div>
                        </div>
                        {ticket.customer_feedback && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">Feedback:</p>
                            <p className="text-sm text-gray-900 italic">"{ticket.customer_feedback}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Completion Data */}
              {ticket.completion_data && ticket.status === 'completed' && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-gray-900">Completion Details</h3>
                  </div>
                  <div className="card-body">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ticket.completion_data.odp_location && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600">Lokasi ODP</dt>
                          <dd className="text-sm text-gray-900">{ticket.completion_data.odp_location}</dd>
                        </div>
                      )}
                      
                      {ticket.completion_data.odp_distance && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600">Jarak ODP</dt>
                          <dd className="text-sm text-gray-900">{ticket.completion_data.odp_distance} meter</dd>
                        </div>
                      )}
                      
                      {ticket.completion_data.final_attenuation && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600">Redaman Terakhir</dt>
                          <dd className="text-sm text-gray-900">{ticket.completion_data.final_attenuation} dB</dd>
                        </div>
                      )}
                      
                      {ticket.completion_data.wifi_name && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600">Nama WiFi</dt>
                          <dd className="text-sm text-gray-900">{ticket.completion_data.wifi_name}</dd>
                        </div>
                      )}
                      
                      {ticket.completion_data.wifi_password && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600">Password WiFi</dt>
                          <dd className="text-sm text-gray-900 font-mono">{ticket.completion_data.wifi_password}</dd>
                        </div>
                      )}
                      
                      {ticket.completion_data.activation_date && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600">Tanggal Aktif</dt>
                          <dd className="text-sm text-gray-900">{formatDateTime(ticket.completion_data.activation_date)}</dd>
                        </div>
                      )}
                      
                      {ticket.completion_data.repair_date && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600">Tanggal Perbaikan</dt>
                          <dd className="text-sm text-gray-900">{formatDateTime(ticket.completion_data.repair_date)}</dd>
                        </div>
                      )}
                      
                      {ticket.completion_data.new_category && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600">New Category</dt>
                          <dd className="text-sm text-gray-900">{ticket.completion_data.new_category}</dd>
                        </div>
                      )}
                    </dl>
                    
                    {/* Photos */}
                    {(ticket.completion_data.otdr_photo || ticket.completion_data.attenuation_photo || ticket.completion_data.modem_sn_photo) && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Foto Dokumentasi</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {ticket.completion_data.otdr_photo && (
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-2">Foto OTDR</p>
                              <a 
                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${ticket.completion_data.otdr_photo.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block border border-gray-300 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
                              >
                                <img 
                                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${ticket.completion_data.otdr_photo.url}`}
                                  alt="OTDR Photo"
                                  className="w-full h-32 object-cover"
                                />
                                <div className="p-2 bg-gray-50">
                                  <p className="text-xs text-gray-600 truncate">{ticket.completion_data.otdr_photo.filename}</p>
                                </div>
                              </a>
                            </div>
                          )}
                          
                          {ticket.completion_data.attenuation_photo && (
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-2">Foto Redaman</p>
                              <a 
                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${ticket.completion_data.attenuation_photo.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block border border-gray-300 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
                              >
                                <img 
                                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${ticket.completion_data.attenuation_photo.url}`}
                                  alt="Attenuation Photo"
                                  className="w-full h-32 object-cover"
                                />
                                <div className="p-2 bg-gray-50">
                                  <p className="text-xs text-gray-600 truncate">{ticket.completion_data.attenuation_photo.filename}</p>
                                </div>
                              </a>
                            </div>
                          )}
                          
                          {ticket.completion_data.modem_sn_photo && (
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-2">Foto SN Modem</p>
                              <a 
                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${ticket.completion_data.modem_sn_photo.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block border border-gray-300 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
                              >
                                <img 
                                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${ticket.completion_data.modem_sn_photo.url}`}
                                  alt="Modem SN Photo"
                                  className="w-full h-32 object-cover"
                                />
                                <div className="p-2 bg-gray-50">
                                  <p className="text-xs text-gray-600 truncate">{ticket.completion_data.modem_sn_photo.filename}</p>
                                </div>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'status' && (
            <StatusUpdateForm
              ticket={ticket}
              onUpdate={updateStatusMutation.mutate}
              isLoading={updateStatusMutation.isLoading}
            />
          )}

          {activeTab === 'history' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Status History</h3>
              </div>
              <div className="card-body">
                {ticket.status_history && ticket.status_history.length > 0 ? (
                  <div className="space-y-4">
                    {ticket.status_history.map((history, index) => (
                      <div key={history.id} className="flex items-start space-x-3 border-l-2 border-blue-200 pl-4 py-2">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              Status changed to: {getStatusBadge(history.new_status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            by {history.changed_by_name} • {formatDateTime(history.created_at)}
                          </p>
                          {history.technician_name && (
                            <p className="text-sm text-blue-600 mt-1">
                              🔧 Assigned to: {history.technician_name} ({history.technician_employee_id})
                            </p>
                          )}
                          {history.notes && (
                            <p className="text-sm text-gray-700 mt-1 italic bg-gray-50 p-2 rounded">
                              {history.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No status history available</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{ticket.customer_name}</p>
                  <p className="text-sm text-gray-500">{ticket.customer_code}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-900">{ticket.customer_phone}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900">{ticket.customer_address}</p>
                  <p className="text-sm text-gray-500">{ticket.service_area}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Package Information */}
          {ticket.package_name && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Package Information</h3>
              </div>
              <div className="card-body space-y-3">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ticket.package_name}</p>
                    <p className="text-sm text-gray-500">{ticket.service_type}</p>
                  </div>
                </div>
                
                {ticket.bandwidth_down && (
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Bandwidth</span>
                    <span className="text-sm font-medium text-gray-900">{ticket.bandwidth_down} Mbps</span>
                  </div>
                )}
                
                {ticket.monthly_price && (
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Monthly Price</span>
                    <span className="text-sm font-medium text-gray-900">
                      Rp {parseInt(ticket.monthly_price).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technician Information */}
          {ticket.technician_name && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Assigned Technician</h3>
              </div>
              <div className="card-body space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ticket.technician_name}</p>
                    <p className="text-sm text-gray-500">{ticket.employee_id}</p>
                  </div>
                </div>
                
                {ticket.technician_phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-900">{ticket.technician_phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Equipment Needed */}
          {ticket.equipment_needed && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Equipment Needed</h3>
              </div>
              <div className="card-body">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.equipment_needed}</p>
              </div>
            </div>
          )}

          {/* Attachments */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
            </div>
            <div className="card-body">
              {ticket.attachments && ticket.attachments.length > 0 ? (
                <div className="space-y-2">
                  {ticket.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{attachment.original_filename}</span>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No attachments</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketDetailPage
