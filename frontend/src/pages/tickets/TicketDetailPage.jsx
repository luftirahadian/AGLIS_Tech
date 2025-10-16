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
  Package,
  PlayCircle,
  Ticket
} from 'lucide-react'
import { ticketService } from '../../services/ticketService'
import { useAuth } from '../../contexts/AuthContext'
import StatusUpdateForm from '../../components/StatusUpdateForm'
import BackButton from '../../components/common/BackButton'
import LoadingSpinner from '../../components/LoadingSpinner'
import TechnicianTeamDisplay from '../../components/TechnicianTeamDisplay'
import toast from 'react-hot-toast'

const TicketDetailPage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('details')
  const [preSelectedStatus, setPreSelectedStatus] = useState(null)

  // Fetch ticket details
  const { data: ticketData, isLoading, error } = useQuery(
    ['ticket', id],
    () => ticketService.getTicket(id),
    { enabled: !!id }
  )

  // Fetch current user's technician profile if they're a technician
  const { data: myTechnicianData } = useQuery(
    ['my-technician-profile', user?.id],
    async () => {
      if (user?.role !== 'technician') return null
      const response = await fetch(`/api/technicians?user_id=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      return data?.data?.technicians?.[0] || null
    },
    { 
      enabled: !!user && user.role === 'technician',
      staleTime: 300000 // 5 minutes
    }
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
            <div className="flex items-center gap-2 mb-1">
              <Ticket className="h-5 w-5 text-blue-600" />
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-lg font-mono font-semibold border border-blue-200">
                {ticket.ticket_number}
              </span>
            </div>
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
        {/* Customer Card - Clickable */}
        {ticket.customer_numeric_id && (
          <Link to={`/customers/${ticket.customer_numeric_id}`} className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="card-body">
              <div className="flex items-center">
                <User className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Customer</p>
                  <p className="text-lg font-semibold text-gray-900">{ticket.customer_name}</p>
                  {ticket.customer_code && (
                    <p className="text-xs text-gray-500 font-mono">{ticket.customer_code}</p>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )}

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

        {/* Technician Team Card */}
        {(ticket.team && ticket.team.length > 0) || ticket.assigned_technician_id ? (
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <User className="h-8 w-8 text-purple-600 bg-purple-100 rounded-lg p-2 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {ticket.team && ticket.team.length > 1 ? 'Technician Team' : 'Technician'}
                    </p>
                    {ticket.team && ticket.team.length > 1 && (
                      <p className="text-xs text-gray-500">{ticket.team.length} teknisi assigned</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Import and use TechnicianTeamDisplay component */}
              {ticket.team && ticket.team.length > 0 ? (
                <TechnicianTeamDisplay 
                  team={ticket.team} 
                  leadId={ticket.assigned_technician_id} 
                />
              ) : (
                <Link to={`/technicians/${ticket.assigned_technician_id}`} className="hover:bg-gray-50 p-2 rounded block">
                  <p className="text-lg font-semibold text-gray-900">{ticket.technician_name}</p>
                  <p className="text-xs text-gray-500">{ticket.employee_id}</p>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <User className="h-8 w-8 text-purple-600 bg-purple-100 rounded-lg p-2 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Technician</p>
                  <p className="text-lg font-semibold text-gray-900">Unassigned</p>
                </div>
              </div>
            </div>
          </div>
        )}
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
              {/* Status: OPEN - Can self-assign (technicians only) */}
              {ticket.status === 'open' && user?.role === 'technician' && myTechnicianData && (
                <button
                  onClick={async () => {
                    try {
                      // Use the /assign endpoint with technician_id
                      await ticketService.assignTicket(id, myTechnicianData.id)
                      toast.success('Ticket assigned to you successfully!')
                      queryClient.invalidateQueries(['ticket', id])
                      queryClient.invalidateQueries(['tickets'])
                    } catch (error) {
                      toast.error(error.response?.data?.message || 'Failed to assign ticket')
                    }
                  }}
                  disabled={updateStatusMutation.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <User className="h-4 w-4" />
                  Assign to Me
                </button>
              )}
              
              {/* Status: ASSIGNED - Must start progress first */}
              {ticket.status === 'assigned' && (
                <button
                  onClick={() => {
                    updateStatusMutation.mutate({
                      status: 'in_progress',
                      notes: 'Started working on ticket'
                    })
                  }}
                  disabled={updateStatusMutation.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <PlayCircle className="h-4 w-4" />
                  Start Progress
                </button>
              )}
              
              {/* Status: IN_PROGRESS - Can complete with proper form */}
              {ticket.status === 'in_progress' && (
                <button
                  onClick={() => {
                    // Pre-select "completed" status
                    setPreSelectedStatus('completed')
                    // Switch to Update Status tab to fill completion form
                    setActiveTab('status')
                    // Scroll to top smoothly
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  disabled={updateStatusMutation.isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  Complete Ticket
                </button>
              )}

              {/* Put On Hold - Available for open, assigned, in_progress */}
              {['open', 'assigned', 'in_progress'].includes(ticket.status) && (
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

              {/* Cancel - Available for all except already cancelled */}
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
                    {(ticket.category_name || ticket.category) && ticket.category !== 'Not specified' && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Category</dt>
                        <dd className="text-sm text-gray-900">{ticket.category_name || ticket.category}</dd>
                      </div>
                    )}
                    {ticket.scheduled_date && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Scheduled Date</dt>
                        <dd className="text-sm text-gray-900">{formatDateTime(ticket.scheduled_date)}</dd>
                      </div>
                    )}
                    {ticket.estimated_duration && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Estimated Duration</dt>
                        <dd className="text-sm text-gray-900">{ticket.estimated_duration} minutes</dd>
                      </div>
                    )}
                    {ticket.started_at && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Started At</dt>
                        <dd className="text-sm text-gray-900">{formatDateTime(ticket.started_at)}</dd>
                      </div>
                    )}
                    {ticket.completed_at && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Completed At</dt>
                        <dd className="text-sm text-gray-900">{formatDateTime(ticket.completed_at)}</dd>
                      </div>
                    )}
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
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
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
                      {/* 1. Lokasi ODP */}
                      {ticket.completion_data.odp_location && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600">Lokasi ODP</dt>
                          <dd className="text-sm text-gray-900">{ticket.completion_data.odp_location}</dd>
                        </div>
                      )}
                      
                      {/* 2. Jarak ODP */}
                      {ticket.completion_data.odp_distance && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600">Jarak ODP</dt>
                          <dd className="text-sm text-gray-900">{ticket.completion_data.odp_distance} meter</dd>
                        </div>
                      )}
                      
                      {/* 3. Redaman Terakhir */}
                      {ticket.completion_data.final_attenuation && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600">Redaman Terakhir</dt>
                          <dd className="text-sm text-gray-900">{ticket.completion_data.final_attenuation} dB</dd>
                        </div>
                      )}
                      
                      {/* 4. Nama WiFi */}
                      {ticket.completion_data.wifi_name && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600">Nama WiFi</dt>
                          <dd className="text-sm text-gray-900">{ticket.completion_data.wifi_name}</dd>
                        </div>
                      )}
                      
                      {/* 5. Password WiFi */}
                      {ticket.completion_data.wifi_password && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600">Password WiFi</dt>
                          <dd className="text-sm text-gray-900 font-mono">{ticket.completion_data.wifi_password}</dd>
                        </div>
                      )}
                      
                      {/* 6. Tanggal Aktif (Installation) - Moved here before photos */}
                      {ticket.completion_data.activation_date && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600">Tanggal Aktif</dt>
                          <dd className="text-sm text-gray-900">{formatDateTime(ticket.completion_data.activation_date)}</dd>
                        </div>
                      )}
                      
                      {/* Repair Date (for maintenance/repair) */}
                      {ticket.completion_data.repair_date && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600">Tanggal Perbaikan</dt>
                          <dd className="text-sm text-gray-900">{formatDateTime(ticket.completion_data.repair_date)}</dd>
                        </div>
                      )}
                      
                      {/* New Category (for upgrades) */}
                      {ticket.completion_data.new_category && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600">New Category</dt>
                          <dd className="text-sm text-gray-900">{ticket.completion_data.new_category}</dd>
                        </div>
                      )}
                    </dl>
                    
                    {/* Photos - Side by side in 3 columns */}
                    {(ticket.completion_data.otdr_photo || ticket.completion_data.attenuation_photo || ticket.completion_data.modem_sn_photo) && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Foto Dokumentasi</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {ticket.completion_data.otdr_photo && (
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-2">Foto OTDR</p>
                              <a 
                                href={`${(import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '')}${ticket.completion_data.otdr_photo.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block border border-gray-300 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
                              >
                                <img 
                                  src={`${(import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '')}${ticket.completion_data.otdr_photo.url}`}
                                  alt="OTDR Photo"
                                  className="w-full h-32 object-cover"
                                  onError={(e) => console.error('Failed to load OTDR photo:', ticket.completion_data.otdr_photo.url)}
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
                                href={`${(import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '')}${ticket.completion_data.attenuation_photo.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block border border-gray-300 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
                              >
                                <img 
                                  src={`${(import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '')}${ticket.completion_data.attenuation_photo.url}`}
                                  alt="Attenuation Photo"
                                  className="w-full h-32 object-cover"
                                  onError={(e) => console.error('Failed to load Attenuation photo:', ticket.completion_data.attenuation_photo.url)}
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
                                href={`${(import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '')}${ticket.completion_data.modem_sn_photo.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block border border-gray-300 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
                              >
                                <img 
                                  src={`${(import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '')}${ticket.completion_data.modem_sn_photo.url}`}
                                  alt="Modem SN Photo"
                                  className="w-full h-32 object-cover"
                                  onError={(e) => console.error('Failed to load Modem SN photo:', ticket.completion_data.modem_sn_photo.url)}
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
              preSelectedStatus={preSelectedStatus}
              onStatusPreSelected={() => setPreSelectedStatus(null)}
            />
          )}

          {activeTab === 'history' && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Status History</h3>
                  <span className="text-sm text-gray-500">
                    {ticket.status_history?.length || 0} changes
                  </span>
                </div>
              </div>
              <div className="card-body">
                {ticket.status_history && ticket.status_history.length > 0 ? (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    
                    <div className="space-y-6">
                      {ticket.status_history.map((history, index) => {
                        const statusIcons = {
                          'open': { icon: FileText, color: 'blue', bg: 'bg-blue-100', border: 'border-blue-200' },
                          'assigned': { icon: User, color: 'indigo', bg: 'bg-indigo-100', border: 'border-indigo-200' },
                          'in_progress': { icon: PlayCircle, color: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-200' },
                          'on_hold': { icon: Clock, color: 'purple', bg: 'bg-purple-100', border: 'border-purple-200' },
                          'completed': { icon: CheckCircle, color: 'green', bg: 'bg-green-100', border: 'border-green-200' },
                          'cancelled': { icon: XCircle, color: 'red', bg: 'bg-red-100', border: 'border-red-200' }
                        }
                        const statusConfig = statusIcons[history.new_status] || statusIcons['open']
                        const StatusIcon = statusConfig.icon
                        
                        // Calculate time since this change
                        const nextHistory = ticket.status_history[index + 1]
                        const timeSince = nextHistory 
                          ? calculateDuration(history.created_at, nextHistory.created_at)
                          : null
                        
                        return (
                          <div key={history.id} className="relative flex items-start space-x-4">
                            {/* Timeline dot */}
                            <div className="relative flex-shrink-0 z-10">
                              <div className={`h-10 w-10 ${statusConfig.bg} rounded-full flex items-center justify-center border-2 ${statusConfig.border} shadow-sm`}>
                                <StatusIcon className={`h-5 w-5 text-${statusConfig.color}-600`} />
                              </div>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {history.old_status && (
                                    <>
                                      <span className="text-xs text-gray-500 capitalize">{history.old_status.replace('_', ' ')}</span>
                                      <span className="text-gray-400">→</span>
                                    </>
                                  )}
                                  {getStatusBadge(history.new_status)}
                                  {timeSince && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                      Duration: {timeSince}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400">
                                  #{index + 1}
                                </span>
                              </div>
                              
                              {/* Metadata */}
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                <div className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  <span className="font-medium">{history.changed_by_name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>{formatDateTime(history.created_at)}</span>
                                </div>
                              </div>
                              
                              {/* Technician Assignment */}
                              {history.technician_name && (
                                <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                                  <User className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm text-blue-900">
                                    <span className="font-medium">Assigned to:</span> {history.technician_name}
                                    <span className="text-xs text-blue-600 ml-1">({history.technician_employee_id})</span>
                                  </span>
                                </div>
                              )}
                              
                              {/* Notes */}
                              {history.notes && (
                                <div className="mt-2 p-3 bg-gray-50 rounded border-l-2 border-gray-300">
                                  <div className="flex items-start gap-2">
                                    <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                      {history.notes}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No status history available</p>
                    <p className="text-sm text-gray-400 mt-1">Status changes will appear here</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
                    <span className="text-sm font-medium">
                      <span className="text-blue-600">↑ {ticket.bandwidth_up || ticket.bandwidth_down}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-green-600">↓ {ticket.bandwidth_down}</span>
                      <span className="text-gray-900 ml-1">Mbps</span>
                    </span>
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
