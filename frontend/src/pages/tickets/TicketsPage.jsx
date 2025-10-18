import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { Ticket, Plus, Search, Filter, Eye, Target, CheckCircle, Clock, AlertCircle, Users, PlayCircle, PauseCircle, XCircle, FileCheck, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Download, Loader2, Copy, Check, User, UserPlus, PhoneCall, Mail as MailIcon, ShieldAlert, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ticketService } from '../../services/ticketService'
import bulkOperationsService from '../../services/bulkOperationsService'
import TicketCreateForm from '../../components/TicketCreateForm'
import SmartAssignmentModal from '../../components/SmartAssignmentModal'
import TeamAssignmentModal from '../../components/TeamAssignmentModal.jsx'
import BulkProgressModal from '../../components/BulkProgressModal'
import BulkResultsModal from '../../components/BulkResultsModal'
import LoadingSpinner from '../../components/LoadingSpinner'
import KPICard from '../../components/dashboard/KPICard'
import { exportToExcel, formatCurrency, formatDate } from '../../utils/exportToExcel'
import { useAuth } from '../../contexts/AuthContext'

const TicketsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user: currentUser, isAdmin, isSupervisor, isTechnician, isCustomerService } = useAuth()
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showTeamAssignmentModal, setShowTeamAssignmentModal] = useState(false)
  const [selectedTicketForAssignment, setSelectedTicketForAssignment] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('DESC')
  const [isExporting, setIsExporting] = useState(false)
  const [technicianView, setTechnicianView] = useState('my-tickets') // 'my-tickets' or 'available'
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    priority: ''
  })
  
  // Bulk selection states
  const [selectedTickets, setSelectedTickets] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  
  // Bulk operation modals
  const [showBulkProgress, setShowBulkProgress] = useState(false)
  const [showBulkResults, setShowBulkResults] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    currentItem: null
  })
  const [bulkResults, setBulkResults] = useState(null)
  const [bulkOperation, setBulkOperation] = useState('')
  
  // Copy to clipboard state
  const [copiedField, setCopiedField] = useState(null)

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
    ['tickets', filters, currentPage, limit, sortBy, sortOrder],
    () => ticketService.getTickets({
      ...filters,
      page: currentPage,
      limit,
      sort_by: sortBy,
      sort_order: sortOrder
    }),
    { 
      keepPreviousData: false, // Changed to false for immediate sorting feedback
      refetchOnMount: true
    }
  )

  // Extract tickets array from data
  const tickets = ticketsData?.data?.tickets || []
  const totalTickets = ticketsData?.data?.total || 0

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

  const handleTeamAssignTicket = (ticket) => {
    setSelectedTicketForAssignment(ticket)
    setShowTeamAssignmentModal(true)
  }

  // Export tickets to Excel
  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      // Fetch all tickets with current filters (no pagination limit)
      const response = await ticketService.getTickets({
        ...filters,
        page: 1,
        limit: 10000, // Get all data
        sort_by: sortBy,
        sort_order: sortOrder
      })

      const allTickets = response.data.tickets || []
      
      if (allTickets.length === 0) {
        toast.error('Tidak ada data untuk di-export')
        return
      }

      // Format data for Excel
      const exportData = allTickets.map((ticket, index) => ({
        'No': index + 1,
        'Ticket Number': ticket.ticket_number,
        'Tanggal Dibuat': formatDate(ticket.created_at),
        'Type': formatTypeName(ticket.type),
        'Status': ticket.status?.toUpperCase() || '-',
        'Priority': ticket.priority?.toUpperCase() || '-',
        'Customer': ticket.customer_name || '-',
        'Customer Code': ticket.customer_code || '-',
        'Teknisi': ticket.technician_name || 'Unassigned',
        'Judul': ticket.title,
        'Category': ticket.category || '-',
        'SLA Due Date': formatDate(ticket.sla_due_date),
        'Completed Date': ticket.completed_at ? formatDate(ticket.completed_at) : '-',
        'Scheduled Date': ticket.scheduled_date ? formatDate(ticket.scheduled_date) : '-',
        'Estimated Duration (min)': ticket.estimated_duration || '-'
      }))

      // Export to Excel
      const result = exportToExcel(exportData, 'Tickets_Export', 'Tickets Data')
      
      toast.success(`✅ ${result.rows} tickets berhasil di-export!`)
      
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Gagal export data. Silakan coba lagi.')
    } finally {
      setIsExporting(false)
    }
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

  // ==================== BULK SELECTION HANDLERS ====================
  
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTickets(tickets.map(t => t.id))
      setSelectAll(true)
    } else {
      setSelectedTickets([])
      setSelectAll(false)
    }
  }

  const handleSelectTicket = (ticketId) => {
    if (selectedTickets.includes(ticketId)) {
      setSelectedTickets(selectedTickets.filter(id => id !== ticketId))
      setSelectAll(false)
    } else {
      const newSelected = [...selectedTickets, ticketId]
      setSelectedTickets(newSelected)
      if (newSelected.length === tickets.length) {
        setSelectAll(true)
      }
    }
  }

  // ==================== BULK ACTION HANDLERS (NEW - Using Bulk APIs) ====================

  const handleBulkClose = async () => {
    if (selectedTickets.length === 0) {
      toast.error('Pilih ticket terlebih dahulu')
      return
    }

    if (!window.confirm(`Close ${selectedTickets.length} ticket yang dipilih?`)) {
      return
    }

    setBulkOperation('Bulk Close Tickets')
    setBulkProgress({
      total: selectedTickets.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      currentItem: 'Starting...'
    })
    setShowBulkProgress(true)

    try {
      const result = await bulkOperationsService.bulkUpdateTicketStatus(
        selectedTickets,
        { status: 'completed' }
      )

      console.log('🔍 Bulk API Result:', result)

      setBulkProgress({
        total: result?.total || 0,
        processed: result?.total || 0,
        succeeded: result?.succeeded || 0,
        failed: result?.failed || 0,
        currentItem: null
      })

      setTimeout(() => {
        setShowBulkProgress(false)
        setBulkResults(result)
        setShowBulkResults(true)
        refetch()
        setSelectedTickets([])
        setSelectAll(false)

        if (result.failed === 0) {
          toast.success(`✅ ${result.succeeded} ticket berhasil di-close`)
        } else {
          toast.success(`⚠️ ${result.succeeded} berhasil, ${result.failed} gagal`, {
            icon: '⚠️',
            duration: 5000
          })
        }
      }, 1000)

    } catch (error) {
      console.error('Bulk close error:', error)
      setShowBulkProgress(false)
      toast.error(error.response?.data?.message || 'Gagal close ticket')
    }
  }

  const handleBulkAssign = async (technicianId) => {
    if (selectedTickets.length === 0) {
      toast.error('Pilih ticket terlebih dahulu')
      return
    }

    if (!technicianId) {
      toast.error('Pilih teknisi terlebih dahulu')
      return
    }

    if (!window.confirm(`Assign ${selectedTickets.length} ticket ke teknisi yang dipilih?`)) {
      return
    }

    setBulkOperation('Bulk Assign Tickets')
    setBulkProgress({
      total: selectedTickets.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      currentItem: 'Starting...'
    })
    setShowBulkProgress(true)

    try {
      const result = await bulkOperationsService.bulkAssignTickets(
        selectedTickets,
        { technician_id: technicianId }
      )

      setBulkProgress({
        total: result.total,
        processed: result.total,
        succeeded: result.succeeded,
        failed: result.failed,
        currentItem: null
      })

      setTimeout(() => {
        setShowBulkProgress(false)
        setBulkResults(result)
        setShowBulkResults(true)
        refetch()
        setSelectedTickets([])
        setSelectAll(false)

        if (result.failed === 0) {
          toast.success(`✅ ${result.succeeded} ticket berhasil di-assign`)
        } else {
          toast.success(`⚠️ ${result.succeeded} berhasil, ${result.failed} gagal`, {
            icon: '⚠️',
            duration: 5000
          })
        }
      }, 1000)

    } catch (error) {
      console.error('Bulk assign error:', error)
      setShowBulkProgress(false)
      toast.error(error.response?.data?.message || 'Gagal assign ticket')
    }
  }

  const handleBulkUpdatePriority = async (priority) => {
    if (selectedTickets.length === 0) {
      toast.error('Pilih ticket terlebih dahulu')
      return
    }

    if (!priority) {
      toast.error('Pilih priority terlebih dahulu')
      return
    }

    if (!window.confirm(`Update priority ${selectedTickets.length} ticket ke "${priority}"?`)) {
      return
    }

    setBulkOperation('Bulk Update Priority')
    setBulkProgress({
      total: selectedTickets.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      currentItem: 'Starting...'
    })
    setShowBulkProgress(true)

    try {
      const result = await bulkOperationsService.bulkUpdateTicketPriority(
        selectedTickets,
        { priority }
      )

      setBulkProgress({
        total: result.total,
        processed: result.total,
        succeeded: result.succeeded,
        failed: result.failed,
        currentItem: null
      })

      setTimeout(() => {
        setShowBulkProgress(false)
        setBulkResults(result)
        setShowBulkResults(true)
        refetch()
        setSelectedTickets([])
        setSelectAll(false)

        if (result.failed === 0) {
          toast.success(`✅ ${result.succeeded} ticket priority updated`)
        } else {
          toast.success(`⚠️ ${result.succeeded} berhasil, ${result.failed} gagal`, {
            icon: '⚠️',
            duration: 5000
          })
        }
      }, 1000)

    } catch (error) {
      console.error('Bulk update priority error:', error)
      setShowBulkProgress(false)
      toast.error(error.response?.data?.message || 'Gagal update priority')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTickets.length === 0) {
      toast.error('Pilih ticket terlebih dahulu')
      return
    }

    if (!window.confirm(`⚠️ PERINGATAN: Hapus ${selectedTickets.length} ticket yang dipilih?`)) {
      return
    }

    // Note: Bulk delete is not implemented in backend yet
    // Using sequential delete for now
    try {
      let successCount = 0
      let errorCount = 0

      for (const ticketId of selectedTickets) {
        try {
          await ticketService.deleteTicket(ticketId)
          successCount++
        } catch (error) {
          errorCount++
          console.error(`Failed to delete ticket ${ticketId}:`, error)
        }
      }

      if (successCount > 0) {
        toast.success(`✅ ${successCount} ticket berhasil dihapus${errorCount > 0 ? `, ${errorCount} gagal` : ''}`)
        refetch()
        setSelectedTickets([])
        setSelectAll(false)
      } else {
        toast.error('Gagal hapus ticket')
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      toast.error('Terjadi kesalahan saat hapus ticket')
    }
  }

  // Retry failed items
  const handleRetryFailed = async (failedIds) => {
    setSelectedTickets(failedIds)
  }

  // ==================== COPY TO CLIPBOARD HANDLER ====================

  const handleCopyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName)
      toast.success(`${fieldName} berhasil di-copy!`)
      setTimeout(() => setCopiedField(null), 2000)
    }).catch(err => {
      toast.error('Gagal copy ke clipboard')
      console.error('Copy error:', err)
    })
  }

  // ==================== QUICK ACTION HANDLERS ====================

  const handleQuickAssign = (e, ticket) => {
    e.stopPropagation() // Prevent row click
    setSelectedTicketForAssignment(ticket)
    setShowAssignmentModal(true)
  }

  const handleQuickTeamAssign = (e, ticket) => {
    e.stopPropagation() // Prevent row click
    setSelectedTicketForAssignment(ticket)
    setShowTeamAssignmentModal(true)
  }

  const handleQuickComplete = async (e, ticket) => {
    e.stopPropagation() // Prevent row click
    
    if (!window.confirm(`Mark ticket ${ticket.ticket_number} as completed?`)) return

    try {
      await ticketService.updateTicket(ticket.id, { status: 'completed' })
      toast.success(`Ticket ${ticket.ticket_number} marked as completed`)
      refetch()
    } catch (error) {
      toast.error('Failed to complete ticket')
      console.error('Quick complete error:', error)
    }
  }

  const handleQuickCall = (e, phone) => {
    e.stopPropagation() // Prevent row click
    window.location.href = `tel:${phone}`
  }

  const handleQuickEmail = (e, email) => {
    e.stopPropagation() // Prevent row click
    window.location.href = `mailto:${email}`
  }

  // ==================== RBAC CHECK ====================
  
  // All authenticated users can access Tickets page
  const hasAccess = isAdmin || isSupervisor || isTechnician || isCustomerService
  const canCreate = isAdmin || isSupervisor || isCustomerService
  const canDelete = isAdmin
  const canAssign = isAdmin || isSupervisor

  const stats = statsData?.data || {}

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <ShieldAlert className="h-24 w-24 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">You don't have permission to access Tickets.</p>
        <p className="text-sm text-gray-500">This page is for staff only.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600">Manage service requests and work orders</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            disabled={isExporting || isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </>
            )}
          </button>
          {canCreate && (
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Toolbar - Shows when items are selected */}
      {selectedTickets.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedTickets.length} ticket dipilih
              </span>
              <button
                onClick={() => {
                  setSelectedTickets([])
                  setSelectAll(false)
                }}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Batal Pilihan
              </button>
            </div>
            <div className="flex gap-2">
              {canAssign && (
                <button
                  onClick={() => {
                    if (selectedTickets.length === 1) {
                      const ticket = tickets.find(t => t.id === selectedTickets[0])
                      handleQuickAssign({ stopPropagation: () => {} }, ticket)
                    } else {
                      toast.info('Bulk assign coming soon!')
                    }
                  }}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm inline-flex items-center"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Assign
                </button>
              )}
              <button
                onClick={handleBulkClose}
                className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm inline-flex items-center"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Close
              </button>
              {canDelete && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm inline-flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Technician View Toggle */}
      {isTechnician && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">View Mode:</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTechnicianView('my-tickets')
                  setFilters({ ...filters, status: '' })
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  technicianView === 'my-tickets'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                📋 My Tickets
              </button>
              <button
                onClick={() => {
                  setTechnicianView('available')
                  setFilters({ ...filters, status: 'open' })
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  technicianView === 'available'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                🆓 Available Tickets
              </button>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            {technicianView === 'my-tickets' 
              ? '📌 Showing tickets assigned to you' 
              : '🎯 Showing unassigned tickets you can claim'}
          </div>
        </div>
      )}

      {/* Statistics Cards - Grouped by Status Type */}
      <div className="space-y-6">
        {/* Row 1: Overview + Active Tickets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            icon={Ticket} 
            title="Total Tickets" 
            value={stats.total_tickets || 0} 
            color="blue"
            onClick={() => {
              setFilters({ search: '', status: '', type: '', priority: '' })
              setCurrentPage(1)
            }}
          />
          <KPICard 
            icon={FileCheck} 
            title="Open" 
            value={stats.open_tickets || 0} 
            color="indigo"
            onClick={() => {
              setFilters({ ...filters, status: filters.status === 'open' ? '' : 'open' })
              setCurrentPage(1)
            }}
          />
          <KPICard 
            icon={Users} 
            title="Assigned" 
            value={stats.assigned_tickets || 0} 
            color="purple"
            onClick={() => {
              setFilters({ ...filters, status: filters.status === 'assigned' ? '' : 'assigned' })
              setCurrentPage(1)
            }}
          />
          <KPICard 
            icon={PlayCircle} 
            title="In Progress" 
            value={stats.in_progress_tickets || 0} 
            color="yellow"
            onClick={() => {
              setFilters({ ...filters, status: filters.status === 'in_progress' ? '' : 'in_progress' })
              setCurrentPage(1)
            }}
          />
        </div>
        
        {/* Row 2: Completed Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <KPICard 
            icon={CheckCircle} 
            title="Completed" 
            value={stats.completed_tickets || 0} 
            color="green"
            onClick={() => {
              setFilters({ ...filters, status: filters.status === 'completed' ? '' : 'completed' })
              setCurrentPage(1)
            }}
          />
          <KPICard 
            icon={XCircle} 
            title="Cancelled" 
            value={stats.cancelled_tickets || 0} 
            color="red"
            onClick={() => {
              setFilters({ ...filters, status: filters.status === 'cancelled' ? '' : 'cancelled' })
              setCurrentPage(1)
            }}
          />
        </div>
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
              <table className="table w-full" style={{ tableLayout: 'fixed', minWidth: '1200px' }}>
                <thead className="table-header">
                  <tr>
                    {/* Bulk Selection Checkbox */}
                    <th className="table-header-cell" style={{ width: '50px' }}>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        title="Pilih Semua"
                      />
                    </th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('ticket_number')}
                      style={{ width: '200px' }}
                    >
                      <div className="flex items-center justify-between">
                        <span>Ticket</span>
                        {getSortIcon('ticket_number')}
                      </div>
                    </th>
                    <th className="table-header-cell" style={{ width: '160px' }}>Customer</th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('type')}
                      style={{ width: '110px' }}
                    >
                      <div className="flex items-center justify-between">
                        <span>Type</span>
                        {getSortIcon('type')}
                      </div>
                    </th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('priority')}
                      style={{ width: '90px' }}
                    >
                      <div className="flex items-center justify-between">
                        <span>Priority</span>
                        {getSortIcon('priority')}
                      </div>
                    </th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('status')}
                      style={{ width: '110px' }}
                    >
                      <div className="flex items-center justify-between">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th className="table-header-cell" style={{ width: '140px' }}>Technician</th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('created_at')}
                      style={{ width: '110px' }}
                    >
                      <div className="flex items-center justify-between">
                        <span>Created</span>
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th className="table-header-cell" style={{ width: '120px' }}>Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {ticketsData.data.tickets.map((ticket) => (
                    <tr 
                      key={ticket.id}
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="group cursor-pointer hover:bg-blue-50 hover:shadow-md hover:border-l-4 hover:border-l-blue-500 transition-all duration-200"
                      title="Klik untuk lihat detail ticket"
                    >
                      {/* Bulk Selection Checkbox */}
                      <td 
                        className="table-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTickets.includes(ticket.id)}
                          onChange={() => handleSelectTicket(ticket.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Ticket Number & Title with Copy */}
                      <td className="table-cell">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-1">
                            <span>{ticket.ticket_number}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopyToClipboard(ticket.ticket_number, 'Ticket Number')
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded transition-opacity"
                              title="Copy Ticket Number"
                            >
                              {copiedField === 'Ticket Number' ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3 text-gray-500" />
                              )}
                            </button>
                          </div>
                          <div className="text-sm text-gray-500 truncate" title={ticket.title}>
                            {ticket.title}
                          </div>
                        </div>
                      </td>

                      {/* Customer with Copy */}
                      <td className="table-cell">
                        <div>
                          <div className="font-medium text-gray-900 truncate" title={ticket.customer_name}>
                            {ticket.customer_name}
                          </div>
                          <div className="text-sm text-gray-500 truncate flex items-center gap-1">
                            <span>{ticket.customer_phone}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopyToClipboard(ticket.customer_phone, 'Phone')
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded transition-opacity"
                              title="Copy Phone"
                            >
                              {copiedField === 'Phone' ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell whitespace-nowrap" style={{ width: '110px' }}>
                        <span className="capitalize">{formatTypeName(ticket.type)}</span>
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        {getPriorityBadge(ticket.priority)}
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        {getStatusBadge(ticket.status)}
                      </td>
                      <td className="table-cell">
                        {ticket.technician_name ? (
                          <div>
                            <div className="font-medium text-gray-900 truncate" title={ticket.technician_name}>
                              {ticket.technician_name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {ticket.employee_id}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="table-cell whitespace-nowrap" style={{ width: '110px' }}>
                        <div className="text-sm text-gray-900">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(ticket.created_at).toLocaleTimeString()}
                        </div>
                      </td>

                      {/* Quick Actions (appear on hover) */}
                      <td 
                        className="table-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Quick Call */}
                          {ticket.customer_phone && (
                            <button
                              onClick={(e) => handleQuickCall(e, ticket.customer_phone)}
                              className="p-1.5 hover:bg-green-100 rounded transition-colors"
                              title="Call Customer"
                            >
                              <PhoneCall className="h-4 w-4 text-green-600" />
                            </button>
                          )}

                          {/* Quick Assign - Admin/Supervisor */}
                          {canAssign && ticket.status !== 'completed' && ticket.status !== 'cancelled' && (
                            <>
                              <button
                                onClick={(e) => handleQuickAssign(e, ticket)}
                                className="p-1.5 hover:bg-purple-100 rounded transition-colors"
                                title="Assign Single Technician"
                              >
                                <UserPlus className="h-4 w-4 text-purple-600" />
                              </button>
                              <button
                                onClick={(e) => handleQuickTeamAssign(e, ticket)}
                                className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                                title="Assign Team (Multiple Technicians)"
                              >
                                <Users className="h-4 w-4 text-blue-600" />
                              </button>
                            </>
                          )}

                          {/* Assign to Me - Technician Only */}
                          {isTechnician && ticket.status === 'open' && !ticket.assigned_technician_id && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                try {
                                  // Get my technician profile
                                  const techResponse = await fetch(`/api/technicians?user_id=${currentUser.id}`, {
                                    headers: {
                                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                                    }
                                  })
                                  const techData = await techResponse.json()
                                  const myTechProfile = techData?.data?.technicians?.[0]
                                  
                                  if (!myTechProfile) {
                                    toast.error('Technician profile not found')
                                    return
                                  }

                                  // Assign ticket to me
                                  await ticketService.assignTicket(ticket.id, myTechProfile.id)
                                  toast.success('Ticket assigned to you!')
                                  refetch()
                                } catch (error) {
                                  toast.error(error.response?.data?.message || 'Failed to assign ticket')
                                }
                              }}
                              className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                              title="Assign to Me"
                            >
                              <User className="h-4 w-4 text-blue-600" />
                            </button>
                          )}

                          {/* Quick Complete */}
                          {ticket.status !== 'completed' && ticket.status !== 'cancelled' && (
                            <button
                              onClick={(e) => handleQuickComplete(e, ticket)}
                              className="p-1.5 hover:bg-green-100 rounded transition-colors"
                              title="Mark as Completed"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
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
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">Show</label>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(parseInt(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="form-input py-1 px-2 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <span className="text-sm text-gray-700">rows</span>
                  </div>
                  <div className="border-l border-gray-300 h-6"></div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * limit) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * limit, ticketsData.data.pagination.total)}
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
                    {Array.from({ length: Math.min(ticketsData.data.pagination.pages, 10) }, (_, i) => {
                      const totalPages = ticketsData.data.pagination.pages;
                      if (totalPages <= 10) return i + 1;
                      if (currentPage <= 5) return i + 1;
                      if (currentPage >= totalPages - 4) return totalPages - 9 + i;
                      return currentPage - 5 + i;
                    }).map((page) => (
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

      {/* Team Assignment Modal (Multi-Technician) */}
      <TeamAssignmentModal
        isOpen={showTeamAssignmentModal}
        onClose={() => {
          setShowTeamAssignmentModal(false);
          setSelectedTicketForAssignment(null);
        }}
        ticket={selectedTicketForAssignment}
      />

      {/* Bulk Progress Modal */}
      <BulkProgressModal
        isOpen={showBulkProgress}
        total={bulkProgress.total}
        processed={bulkProgress.processed}
        succeeded={bulkProgress.succeeded}
        failed={bulkProgress.failed}
        currentItem={bulkProgress.currentItem}
        operation={bulkOperation}
        onCancel={() => setShowBulkProgress(false)}
      />

      {/* Bulk Results Modal */}
      <BulkResultsModal
        isOpen={showBulkResults}
        results={bulkResults}
        operation={bulkOperation}
        onClose={() => {
          setShowBulkResults(false)
          setBulkResults(null)
        }}
        onRetryFailed={handleRetryFailed}
      />
    </div>
  )
}

export default TicketsPage
