import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  UserPlus, Search, Filter, Eye, CheckCircle, XCircle, Clock,
  Calendar, Phone, Mail, MapPin, Package, Shield, FileCheck,
  UserCheck, ClipboardCheck, Home, ChevronRight, BarChart3,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, Download, Loader2,
  Copy, Check, PhoneCall, Mail as MailIcon, ShieldAlert, Trash2
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import registrationService from '../../services/registrationService'
import bulkOperationsService from '../../services/bulkOperationsService'
import LoadingSpinner from '../../components/LoadingSpinner'
import KPICard from '../../components/dashboard/KPICard'
import ConfirmationModal from '../../components/ConfirmationModal'
import BulkProgressModal from '../../components/BulkProgressModal'
import BulkResultsModal from '../../components/BulkResultsModal'
import socketService from '../../services/socketService'
import { exportToExcel, formatCurrency as formatCurrencyExport, formatDate, formatDateOnly } from '../../utils/exportToExcel'
import { useAuth } from '../../contexts/AuthContext'

const RegistrationsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user: currentUser, isAdmin, isSupervisor, isCustomerService } = useAuth()
  
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [actionType, setActionType] = useState(null) // verify, approve, reject, survey_scheduled
  const [actionNotes, setActionNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [surveyDate, setSurveyDate] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('DESC')
  const [isExporting, setIsExporting] = useState(false)
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateFilter: '' // 'today' or ''
  })

  // Bulk selection states
  const [selectedRegistrations, setSelectedRegistrations] = useState([])
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

  // Create customer confirmation modal
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false)
  const [customerToCreate, setCustomerToCreate] = useState(null)
  
  // Quick action modals
  const [showQuickVerifyModal, setShowQuickVerifyModal] = useState(false)
  const [showQuickRejectModal, setShowQuickRejectModal] = useState(false)
  const [showQuickApproveModal, setShowQuickApproveModal] = useState(false)
  const [showQuickScheduleSurveyModal, setShowQuickScheduleSurveyModal] = useState(false)
  const [quickActionTarget, setQuickActionTarget] = useState(null)
  const [quickRejectReason, setQuickRejectReason] = useState('')
  const [quickSurveyDate, setQuickSurveyDate] = useState(new Date().toISOString().split('T')[0])

  // Format currency helper
  const formatCurrency = (amount) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Fetch registrations
  const { data: registrationsData, isLoading } = useQuery(
    ['registrations', filters, currentPage, limit, sortBy, sortOrder],
    () => registrationService.getAll({
      ...filters,
      page: currentPage,
      limit,
      sort_by: sortBy,
      sort_order: sortOrder
    }),
    {
      keepPreviousData: true
    }
  )

  // Fetch statistics
  const { data: statsData } = useQuery(
    'registration-stats',
    () => registrationService.getStats(),
    {
      select: (response) => response.data
    }
  )

  // Update status mutation
  const updateStatusMutation = useMutation(
    ({ id, data }) => registrationService.updateStatus(id, data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['registrations'])
        queryClient.invalidateQueries('registration-stats')
        
        // Reset form fields
        setActionType(null)
        setActionNotes('')
        setRejectionReason('')
        setSurveyDate('')
        
        // Refresh selected registration data
        if (response?.data?.registration) {
          setSelectedRegistration(response.data.registration)
        }
        
        toast.success('Status berhasil diupdate')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal update status')
      }
    }
  )

  // Create customer mutation
  const createCustomerMutation = useMutation(
    (id) => registrationService.createCustomer(id),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['registrations'])
        queryClient.invalidateQueries('registration-stats')
        toast.success('Customer dan ticket instalasi berhasil dibuat!')
        setShowDetailModal(false)
        setSelectedRegistration(null)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal membuat customer')
      }
    }
  )

  const handleSubmitAction = () => {
    if (!selectedRegistration) return

    let data = {
      status: actionType,
      notes: actionNotes
    }

    if (actionType === 'rejected') {
      if (!rejectionReason.trim()) {
        toast.error('Alasan penolakan wajib diisi')
        return
      }
      data.rejection_reason = rejectionReason
    }

    if (actionType === 'survey_scheduled') {
      if (!surveyDate) {
        toast.error('Tanggal survey wajib diisi')
        return
      }
      data.survey_scheduled_date = surveyDate
    }

    if (actionType === 'survey_completed') {
      if (!actionNotes.trim()) {
        toast.error('Hasil survey wajib diisi')
        return
      }
      data.notes = actionNotes // Survey results stored in notes
    }

    updateStatusMutation.mutate({ id: selectedRegistration.id, data })
  }

  const handleCreateCustomer = (registration) => {
    setCustomerToCreate(registration)
    setShowCreateCustomerModal(true)
  }

  const confirmCreateCustomer = () => {
    if (customerToCreate) {
      createCustomerMutation.mutate(customerToCreate.id)
      setShowCreateCustomerModal(false)
      setCustomerToCreate(null)
    }
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortBy(column)
      setSortOrder('DESC')
    }
    setCurrentPage(1)
  }

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortOrder === 'ASC' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending_verification: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      verified: { label: 'Verified', color: 'bg-blue-100 text-blue-800' },
      survey_scheduled: { label: 'Survey Scheduled', color: 'bg-indigo-100 text-indigo-800' },
      survey_completed: { label: 'Survey Done', color: 'bg-purple-100 text-purple-800' },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
      customer_created: { label: 'Customer Created', color: 'bg-emerald-100 text-emerald-800' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' }
    }
    const badge = badges[status] || badges.pending_verification
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>{badge.label}</span>
  }

  // Export registrations to Excel
  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      // Fetch all registrations with current filters (no pagination limit)
      const response = await registrationService.getAll({
        ...filters,
        page: 1,
        limit: 10000, // Get all data
        sort_by: sortBy,
        sort_order: sortOrder
      })

      const allRegistrations = response.data?.registrations || []
      
      if (allRegistrations.length === 0) {
        toast.error('Tidak ada data untuk di-export')
        return
      }

      // Get status label for display
      const getStatusLabel = (status) => {
        const labels = {
          pending_verification: 'Pending',
          verified: 'Verified',
          survey_scheduled: 'Survey Scheduled',
          survey_completed: 'Survey Done',
          approved: 'Approved',
          customer_created: 'Customer Created',
          rejected: 'Rejected',
          cancelled: 'Cancelled'
        }
        return labels[status] || status
      }

      // Format data for Excel
      const exportData = allRegistrations.map((reg, index) => ({
        'No': index + 1,
        'Registration Number': reg.registration_number,
        'Tanggal Daftar': formatDate(reg.created_at),
        'Nama Lengkap': reg.full_name,
        'Email': reg.email || '-',
        'WhatsApp': reg.phone || '-',
        'Alamat Lengkap': reg.address || '-',
        'Kota': reg.city || '-',
        'Package': reg.package_name || '-',
        'Harga Bulanan': formatCurrencyExport(reg.monthly_price),
        'Status': getStatusLabel(reg.status),
        'Verified Date': reg.verified_at ? formatDate(reg.verified_at) : '-',
        'Survey Scheduled': reg.survey_scheduled_date ? formatDate(reg.survey_scheduled_date) : '-',
        'Approved Date': reg.approved_at ? formatDate(reg.approved_at) : '-',
        'Rejection Reason': reg.rejection_reason || '-',
        'Preferred Install Date': reg.preferred_installation_date ? formatDateOnly(reg.preferred_installation_date) : '-'
      }))

      // Export to Excel
      const result = exportToExcel(exportData, 'Registrations_Export', 'Registrations Data')
      
      toast.success(`✅ ${result.rows} registrations berhasil di-export!`)
      
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Gagal export data. Silakan coba lagi.')
    } finally {
      setIsExporting(false)
    }
  }

  // ==================== BULK SELECTION HANDLERS ====================
  
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRegistrations(registrations.map(r => r.id))
      setSelectAll(true)
    } else {
      setSelectedRegistrations([])
      setSelectAll(false)
    }
  }

  const handleSelectRegistration = (regId) => {
    if (selectedRegistrations.includes(regId)) {
      setSelectedRegistrations(selectedRegistrations.filter(id => id !== regId))
      setSelectAll(false)
    } else {
      const newSelected = [...selectedRegistrations, regId]
      setSelectedRegistrations(newSelected)
      if (newSelected.length === registrations.length) {
        setSelectAll(true)
      }
    }
  }

  // ==================== BULK ACTION HANDLERS (NEW - Using Bulk APIs) ====================

  const handleBulkVerify = async () => {
    if (selectedRegistrations.length === 0) {
      toast.error('Pilih registration terlebih dahulu')
      return
    }

    if (!window.confirm(`Verify ${selectedRegistrations.length} registration yang dipilih?`)) {
      return
    }

    // Show progress modal
    setBulkOperation('Bulk Verify Registrations')
    setBulkProgress({
      total: selectedRegistrations.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      currentItem: 'Starting...'
    })
    setShowBulkProgress(true)

    try {
      // Call bulk API
      const result = await bulkOperationsService.bulkVerifyRegistrations(
        selectedRegistrations,
        { notes: 'Bulk verified' }
      )

      // Update final progress
      setBulkProgress({
        total: result.total,
        processed: result.total,
        succeeded: result.succeeded,
        failed: result.failed,
        currentItem: null
      })

      // Close progress modal
      setTimeout(() => {
        setShowBulkProgress(false)
        
        // Show results modal
        setBulkResults(result)
        setShowBulkResults(true)

        // Refresh data
        queryClient.invalidateQueries(['registrations'])
        queryClient.invalidateQueries('registration-stats')

        // Clear selection
        setSelectedRegistrations([])
        setSelectAll(false)

        // Show success toast
        if (result.failed === 0) {
          toast.success(`✅ ${result.succeeded} registration berhasil di-verify`)
        } else {
          toast.success(`⚠️ ${result.succeeded} berhasil, ${result.failed} gagal`, {
            icon: '⚠️',
            duration: 5000
          })
        }
      }, 1000)

    } catch (error) {
      console.error('Bulk verify error:', error)
      setShowBulkProgress(false)
      toast.error(error.response?.data?.message || 'Gagal verify registration')
    }
  }

  const handleBulkReject = async () => {
    if (selectedRegistrations.length === 0) {
      toast.error('Pilih registration terlebih dahulu')
      return
    }

    const reason = window.prompt('Alasan reject (akan diterapkan ke semua):')
    if (!reason) return

    if (!window.confirm(`⚠️ Reject ${selectedRegistrations.length} registration?`)) {
      return
    }

    // Show progress modal
    setBulkOperation('Bulk Reject Registrations')
    setBulkProgress({
      total: selectedRegistrations.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      currentItem: 'Starting...'
    })
    setShowBulkProgress(true)

    try {
      // Call bulk API
      const result = await bulkOperationsService.bulkRejectRegistrations(
        selectedRegistrations,
        { 
          rejection_reason: reason,
          notes: 'Bulk rejected'
        }
      )

      // Update final progress
      setBulkProgress({
        total: result.total,
        processed: result.total,
        succeeded: result.succeeded,
        failed: result.failed,
        currentItem: null
      })

      // Close progress modal
      setTimeout(() => {
        setShowBulkProgress(false)
        
        // Show results modal
        setBulkResults(result)
        setShowBulkResults(true)

        // Refresh data
        queryClient.invalidateQueries(['registrations'])
        queryClient.invalidateQueries('registration-stats')

        // Clear selection
        setSelectedRegistrations([])
        setSelectAll(false)

        // Show success toast
        if (result.failed === 0) {
          toast.success(`✅ ${result.succeeded} registration berhasil di-reject`)
        } else {
          toast.success(`⚠️ ${result.succeeded} berhasil, ${result.failed} gagal`, {
            icon: '⚠️',
            duration: 5000
          })
        }
      }, 1000)

    } catch (error) {
      console.error('Bulk reject error:', error)
      setShowBulkProgress(false)
      toast.error(error.response?.data?.message || 'Gagal reject registration')
    }
  }

  // Retry failed items
  const handleRetryFailed = async (failedIds) => {
    setSelectedRegistrations(failedIds)
    // Will trigger the same operation again with failed IDs
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

  const handleQuickVerify = (e, registration) => {
    e.stopPropagation()
    setQuickActionTarget(registration)
    setShowQuickVerifyModal(true)
  }

  const confirmQuickVerify = async () => {
    if (!quickActionTarget) return

    try {
      await registrationService.updateStatus(quickActionTarget.id, 'verified', { notes: 'Quick verified' })
      toast.success(`Registration ${quickActionTarget.registration_number} verified`)
      queryClient.invalidateQueries(['registrations'])
      queryClient.invalidateQueries('registration-stats')
      setShowQuickVerifyModal(false)
      setQuickActionTarget(null)
    } catch (error) {
      toast.error('Failed to verify registration')
      console.error('Quick verify error:', error)
    }
  }

  const handleQuickReject = (e, registration) => {
    e.stopPropagation()
    setQuickActionTarget(registration)
    setQuickRejectReason('')
    setShowQuickRejectModal(true)
  }

  const confirmQuickReject = async () => {
    if (!quickActionTarget) return
    if (!quickRejectReason.trim()) {
      toast.error('Alasan reject wajib diisi')
      return
    }

    try {
      await registrationService.updateStatus(quickActionTarget.id, 'rejected', { 
        rejection_reason: quickRejectReason,
        notes: 'Quick rejected'
      })
      toast.success(`Registration ${quickActionTarget.registration_number} rejected`)
      queryClient.invalidateQueries(['registrations'])
      queryClient.invalidateQueries('registration-stats')
      setShowQuickRejectModal(false)
      setQuickActionTarget(null)
      setQuickRejectReason('')
    } catch (error) {
      toast.error('Failed to reject registration')
      console.error('Quick reject error:', error)
    }
  }

  const handleQuickCall = (e, phone) => {
    e.stopPropagation()
    window.location.href = `tel:${phone}`
  }

  const handleQuickEmail = (e, email) => {
    e.stopPropagation()
    window.location.href = `mailto:${email}`
  }

  const handleQuickCreateCustomer = (e, registration) => {
    e.stopPropagation()
    setCustomerToCreate(registration)
    setShowCreateCustomerModal(true)
  }

  const handleQuickApprove = (e, registration) => {
    e.stopPropagation()
    setQuickActionTarget(registration)
    setShowQuickApproveModal(true)
  }

  const confirmQuickApprove = async () => {
    if (!quickActionTarget) return

    try {
      await registrationService.updateStatus(quickActionTarget.id, 'approved', { notes: 'Quick approved' })
      toast.success(`Registration ${quickActionTarget.registration_number} approved`)
      queryClient.invalidateQueries(['registrations'])
      queryClient.invalidateQueries('registration-stats')
      setShowQuickApproveModal(false)
      setQuickActionTarget(null)
    } catch (error) {
      toast.error('Failed to approve registration')
      console.error('Quick approve error:', error)
    }
  }

  const handleQuickScheduleSurvey = (e, registration) => {
    e.stopPropagation()
    setQuickActionTarget(registration)
    setQuickSurveyDate(new Date().toISOString().split('T')[0])
    setShowQuickScheduleSurveyModal(true)
  }

  const confirmQuickScheduleSurvey = async () => {
    if (!quickActionTarget) return
    if (!quickSurveyDate) {
      toast.error('Tanggal survey wajib diisi')
      return
    }

    try {
      await registrationService.updateStatus(quickActionTarget.id, 'survey_scheduled', { 
        survey_date: quickSurveyDate,
        notes: 'Survey scheduled via quick action'
      })
      toast.success(`Survey scheduled for ${quickActionTarget.registration_number}`)
      queryClient.invalidateQueries(['registrations'])
      queryClient.invalidateQueries('registration-stats')
      setShowQuickScheduleSurveyModal(false)
      setQuickActionTarget(null)
    } catch (error) {
      toast.error('Failed to schedule survey')
      console.error('Quick schedule survey error:', error)
    }
  }

  // ==================== RBAC CHECK ====================
  
  const hasAccess = isAdmin || isSupervisor || isCustomerService
  const canVerify = isAdmin || isSupervisor || isCustomerService
  const canApprove = isAdmin || isSupervisor
  const canReject = isAdmin || isSupervisor

  const stats = statsData || {}
  const totalRegistrations = registrationsData?.data?.pagination?.total || 0
  const registrations = registrationsData?.data?.registrations || []

  // Listen to socket events for real-time updates
  useEffect(() => {
    const handleRegistrationUpdate = (data) => {
      console.log('🔄 [RegistrationsPage] Registration update received:', data)
      queryClient.invalidateQueries(['registrations'])
      queryClient.invalidateQueries('registration-stats')
      toast.success('Data registrasi telah diperbarui!')
    }

    const handleNewRegistration = (data) => {
      console.log('✨ [RegistrationsPage] New registration event received:', data)
      console.log('📋 [RegistrationsPage] Registration details:', {
        registration_number: data.registration?.registration_number,
        full_name: data.registration?.full_name,
        phone: data.registration?.phone
      })
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries(['registrations'])
      queryClient.invalidateQueries('registration-stats')
      
      console.log('🔄 [RegistrationsPage] Queries invalidated, data will refetch')
      
      // Show toast notification
      toast.success(`🎉 Pendaftaran baru dari ${data.registration?.full_name || 'customer'}!`, {
        duration: 5000,
        icon: '🎉',
        style: {
          background: '#10B981',
          color: '#fff',
          fontWeight: 'bold'
        }
      })
      
      console.log('🎊 [RegistrationsPage] Toast notification shown')
    }

    const handleCustomerCreated = (data) => {
      console.log('👤 [RegistrationsPage] Customer created:', data)
      queryClient.invalidateQueries(['registrations'])
      queryClient.invalidateQueries('registration-stats')
    }

    // Wait for socket to be connected before registering listeners
    const setupListeners = () => {
      if (!socketService.isConnected) {
        console.log('⏳ [RegistrationsPage] Socket not connected yet, waiting...')
        setTimeout(setupListeners, 500) // Retry after 500ms
        return
      }

      console.log('🔌 [RegistrationsPage] Socket connected, registering listeners...')
      
      // Register Socket.IO listeners
      socketService.on('new_registration', handleNewRegistration)
      socketService.on('registration-updated', handleRegistrationUpdate)
      socketService.on('registration_updated', handleRegistrationUpdate)
      socketService.on('customer-created', handleCustomerCreated)
      socketService.on('registration_status_changed', handleRegistrationUpdate)

      console.log('📡 [RegistrationsPage] Socket.IO listeners registered for registrations')
    }

    setupListeners()

    return () => {
      // Cleanup listeners
      socketService.off('new_registration', handleNewRegistration)
      socketService.off('registration-updated', handleRegistrationUpdate)
      socketService.off('registration_updated', handleRegistrationUpdate)
      socketService.off('customer-created', handleCustomerCreated)
      socketService.off('registration_status_changed', handleRegistrationUpdate)
      console.log('📡 [RegistrationsPage] Socket.IO listeners cleaned up')
    }
  }, [queryClient])

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <ShieldAlert className="h-24 w-24 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">You don't have permission to access Registrations.</p>
        <p className="text-sm text-gray-500">Required role: Admin, Supervisor, or Customer Service</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pendaftaran Customer</h1>
          <p className="text-gray-600">Kelola pendaftaran customer baru dari public form</p>
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
          <Link
            to="/registration-analytics"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <BarChart3 className="-ml-1 mr-2 h-5 w-5" />
            Analytics
          </Link>
          <a
            href="/register"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Form Pendaftaran
          </a>
        </div>
      </div>

      {/* Bulk Action Toolbar - Shows when items are selected */}
      {selectedRegistrations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedRegistrations.length} registration dipilih
              </span>
              <button
                onClick={() => {
                  setSelectedRegistrations([])
                  setSelectAll(false)
                }}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Batal Pilihan
              </button>
            </div>
            <div className="flex gap-2">
              {canVerify && (
                <button
                  onClick={handleBulkVerify}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm inline-flex items-center"
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Verify
                </button>
              )}
              {canReject && (
                <button
                  onClick={handleBulkReject}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm inline-flex items-center"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards - Row 1: Workflow Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          icon={FileCheck} 
          title="Total Pendaftaran" 
          value={stats.total_registrations || 0} 
          color="blue" 
        />
        <KPICard 
          icon={Clock} 
          title="Need Review" 
          value={(parseInt(stats.pending_verification) || 0) + (parseInt(stats.verified) || 0)} 
          color="yellow"
          onClick={() => {
            // Toggle between showing Need Review statuses or all
            const isFiltered = filters.status === 'pending_verification' || filters.status === 'verified'
            setFilters({ 
              ...filters, 
              status: isFiltered ? '' : 'pending_verification',
              dateFilter: ''
            })
            setCurrentPage(1)
          }}
        />
        <KPICard 
          icon={Calendar} 
          title="Survey" 
          value={(parseInt(stats.survey_scheduled) || 0) + (parseInt(stats.survey_completed) || 0)} 
          color="indigo"
          onClick={() => {
            const isFiltered = filters.status === 'survey_scheduled' || filters.status === 'survey_completed'
            setFilters({ 
              ...filters, 
              status: isFiltered ? '' : 'survey_scheduled',
              dateFilter: ''
            })
            setCurrentPage(1)
          }}
        />
        <KPICard 
          icon={CheckCircle} 
          title="Approved" 
          value={stats.approved || 0} 
          color="green"
          onClick={() => {
            setFilters({ 
              ...filters, 
              status: filters.status === 'approved' ? '' : 'approved',
              dateFilter: ''
            })
            setCurrentPage(1)
          }}
        />
      </div>

      {/* Statistics Cards - Row 2: Outcomes & Daily Metric */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard 
          icon={Home} 
          title="Customer Created" 
          value={stats.customer_created || 0} 
          color="emerald"
          onClick={() => {
            setFilters({ 
              ...filters, 
              status: filters.status === 'customer_created' ? '' : 'customer_created',
              dateFilter: ''
            })
            setCurrentPage(1)
          }}
        />
        <KPICard 
          icon={XCircle} 
          title="Rejected" 
          value={stats.rejected || 0} 
          color="red"
          onClick={() => {
            setFilters({ 
              ...filters, 
              status: filters.status === 'rejected' ? '' : 'rejected',
              dateFilter: ''
            })
            setCurrentPage(1)
          }}
        />
        <KPICard 
          icon={Calendar} 
          title="Today's New" 
          value={stats.today_registrations || 0} 
          color="orange"
          onClick={() => {
            setFilters({ 
              ...filters, 
              status: '',
              dateFilter: filters.dateFilter === 'today' ? '' : 'today'
            })
            setCurrentPage(1)
          }}
        />
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama, email, nomor..."
                className="form-input pl-10"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="form-input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Semua Status</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="verified">Verified</option>
              <option value="survey_scheduled">Survey Scheduled</option>
              <option value="survey_completed">Survey Completed</option>
              <option value="approved">Approved</option>
              <option value="customer_created">Customer Created</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">
            All Registrations
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({totalRegistrations} total)
            </span>
          </h2>
        </div>
        <div className="card-body p-0">
          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner className="mx-auto" />
            </div>
          ) : registrationsData?.data?.registrations.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada pendaftaran</h3>
              <p className="text-gray-500 mb-4">
                Pendaftaran akan muncul setelah customer mengisi form pendaftaran
              </p>
              <a 
                href="/register"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Buka Form Pendaftaran
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    {/* Bulk Selection Checkbox */}
                    <th className="table-header-cell w-12">
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
                      onClick={() => handleSort('registration_number')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Nomor Registrasi</span>
                        {getSortIcon('registration_number')}
                      </div>
                    </th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('full_name')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Customer</span>
                        {getSortIcon('full_name')}
                      </div>
                    </th>
                    <th className="table-header-cell">Paket</th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Tanggal</span>
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th className="table-header-cell">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {registrationsData?.data?.registrations.map((reg) => (
                    <tr 
                      key={reg.id}
                      onClick={() => navigate(`/registrations/${reg.id}`)}
                      className="group cursor-pointer hover:bg-blue-50 hover:shadow-md hover:border-l-4 hover:border-l-green-500 transition-all duration-200"
                      title="Klik untuk lihat detail registrasi"
                    >
                      {/* Bulk Selection Checkbox */}
                      <td 
                        className="table-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRegistrations.includes(reg.id)}
                          onChange={() => handleSelectRegistration(reg.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Registration Number with Copy */}
                      <td className="table-cell">
                        <div className="font-medium text-blue-600 flex items-center gap-1">
                          <span>{reg.registration_number}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyToClipboard(reg.registration_number, 'Registration Number')
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded transition-opacity"
                            title="Copy Registration Number"
                          >
                            {copiedField === 'Registration Number' ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-gray-500" />
                            )}
                          </button>
                        </div>
                        <div className="text-sm text-gray-500">{new Date(reg.created_at).toLocaleDateString('id-ID')}</div>
                      </td>

                      {/* Customer with Copy */}
                      <td className="table-cell">
                        <div className="font-medium text-gray-900">{reg.full_name}</div>
                        <div className="flex items-center text-sm text-gray-500 mt-1 gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{reg.phone}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyToClipboard(reg.phone, 'Phone')
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
                        <div className="flex items-center text-sm text-gray-500 gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{reg.email}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyToClipboard(reg.email, 'Email')
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded transition-opacity"
                            title="Copy Email"
                          >
                            {copiedField === 'Email' ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Package */}
                      <td className="table-cell">
                        <div className="font-medium">{reg.package_name}</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(reg.monthly_price)}/bln
                        </div>
                      </td>

                      {/* Status */}
                      <td className="table-cell">
                        {getStatusBadge(reg.status)}
                      </td>

                      {/* Date */}
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">
                          {new Date(reg.created_at).toLocaleDateString('id-ID')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(reg.created_at).toLocaleTimeString('id-ID')}
                        </div>
                      </td>

                      {/* Quick Actions (appear on hover) */}
                      <td 
                        className="table-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Quick Call */}
                          {reg.phone && (
                            <button
                              onClick={(e) => handleQuickCall(e, reg.phone)}
                              className="p-1.5 hover:bg-green-100 rounded transition-colors"
                              title="Call Customer"
                            >
                              <PhoneCall className="h-4 w-4 text-green-600" />
                            </button>
                          )}

                          {/* Quick Email */}
                          {reg.email && (
                            <button
                              onClick={(e) => handleQuickEmail(e, reg.email)}
                              className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                              title="Email Customer"
                            >
                              <MailIcon className="h-4 w-4 text-blue-600" />
                            </button>
                          )}

                          {/* Quick Verify (only for pending) */}
                          {canVerify && reg.status === 'pending_verification' && (
                            <button
                              onClick={(e) => handleQuickVerify(e, reg)}
                              className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                              title="Quick Verify"
                            >
                              <UserCheck className="h-4 w-4 text-blue-600" />
                            </button>
                          )}

                          {/* Quick Reject (only for non-final statuses) */}
                          {canReject && !['customer_created', 'rejected', 'cancelled'].includes(reg.status) && (
                            <button
                              onClick={(e) => handleQuickReject(e, reg)}
                              className="p-1.5 hover:bg-red-100 rounded transition-colors"
                              title="Quick Reject"
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </button>
                          )}

                          {/* Quick Approve (only for verified) */}
                          {reg.status === 'verified' && (
                            <button
                              onClick={(e) => handleQuickApprove(e, reg)}
                              className="p-1.5 hover:bg-green-100 rounded transition-colors"
                              title="Quick Approve"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </button>
                          )}

                          {/* Quick Schedule Survey (only for verified) */}
                          {reg.status === 'verified' && (
                            <button
                              onClick={(e) => handleQuickScheduleSurvey(e, reg)}
                              className="p-1.5 hover:bg-orange-100 rounded transition-colors"
                              title="Quick Schedule Survey"
                            >
                              <Calendar className="h-4 w-4 text-orange-600" />
                            </button>
                          )}

                          {/* Quick Create Customer (only for approved) */}
                          {reg.status === 'approved' && !reg.customer_id && (
                            <button
                              onClick={(e) => handleQuickCreateCustomer(e, reg)}
                              className="p-1.5 hover:bg-purple-100 rounded transition-colors"
                              title="Quick Create Customer"
                            >
                              <Home className="h-4 w-4 text-purple-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {registrationsData?.data?.registrations?.length > 0 && registrationsData?.data?.pagination && (
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
                    onClick={() => setCurrentPage(Math.min(registrationsData.data.pagination.pages, currentPage + 1))}
                    disabled={currentPage === registrationsData.data.pagination.pages}
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
                      Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * limit, registrationsData.data.pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{registrationsData.data.pagination.total}</span> results
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
                      {Array.from({ length: Math.min(registrationsData.data.pagination.pages, 10) }, (_, i) => {
                        const totalPages = registrationsData.data.pagination.pages;
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
                        onClick={() => setCurrentPage(Math.min(registrationsData.data.pagination.pages, currentPage + 1))}
                        disabled={currentPage === registrationsData.data.pagination.pages}
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

        {/* Detail Modal */}
        {showDetailModal && selectedRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-8 py-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Detail Pendaftaran</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {getStatusBadge(selectedRegistration.status)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Nomor Registrasi</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      {selectedRegistration.registration_number}
                    </p>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Pribadi</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nama Lengkap</p>
                      <p className="font-medium text-gray-900">{selectedRegistration.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{selectedRegistration.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">WhatsApp</p>
                      <p className="font-medium text-green-600 flex items-center">
                        {selectedRegistration.phone}
                        <Shield className="h-4 w-4 ml-1" title="Verified" />
                      </p>
                    </div>
                    {selectedRegistration.id_card_number && (
                      <div>
                        <p className="text-sm text-gray-600">Nomor KTP</p>
                        <p className="font-medium text-gray-900">{selectedRegistration.id_card_number}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Alamat</h3>
                  <p className="text-gray-900">{selectedRegistration.address}</p>
                  {(selectedRegistration.rt || selectedRegistration.rw) && (
                    <p className="text-gray-600 text-sm mt-1">
                      RT {selectedRegistration.rt || '-'} / RW {selectedRegistration.rw || '-'}
                    </p>
                  )}
                  <p className="text-gray-600 text-sm mt-1">
                    {selectedRegistration.kelurahan}, {selectedRegistration.kecamatan}, {selectedRegistration.city} {selectedRegistration.postal_code}
                  </p>
                  {selectedRegistration.address_notes && (
                    <p className="text-gray-600 text-sm mt-2 italic">
                      Catatan: {selectedRegistration.address_notes}
                    </p>
                  )}
                </div>

                {/* Package Info */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Paket</h3>
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <p className="text-xl font-bold text-gray-900">{selectedRegistration.package_name}</p>
                    <p className="text-lg text-gray-600 mt-1">{selectedRegistration.bandwidth_down} Mbps</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      Rp {selectedRegistration.monthly_price?.toLocaleString('id-ID')}/bulan
                    </p>
                  </div>
                </div>

                {/* Actions Section */}
                {!['rejected'].includes(selectedRegistration.status) && selectedRegistration.status !== 'customer_created' && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {selectedRegistration.status === 'approved' && !selectedRegistration.customer_id 
                        ? 'Create Customer' 
                        : 'Available Actions'
                      }
                    </h3>

                    {/* PENDING VERIFICATION: Verify or Reject */}
                    {selectedRegistration.status === 'pending_verification' && (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-green-50 transition-colors"
                            style={{ borderColor: actionType === 'verified' ? '#10b981' : '#e5e7eb' }}
                          >
                            <input
                              type="radio"
                              name="action"
                              value="verified"
                              checked={actionType === 'verified'}
                              onChange={(e) => setActionType(e.target.value)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500"
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">✅ Verify - Verifikasi Data</p>
                              <p className="text-sm text-gray-600">Data sudah diperiksa dan valid</p>
                            </div>
                          </label>

                          <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
                            style={{ borderColor: actionType === 'rejected' ? '#ef4444' : '#e5e7eb' }}
                          >
                            <input
                              type="radio"
                              name="action"
                              value="rejected"
                              checked={actionType === 'rejected'}
                              onChange={(e) => setActionType(e.target.value)}
                              className="h-4 w-4 text-red-600 focus:ring-red-500"
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">❌ Reject - Tolak Pendaftaran</p>
                              <p className="text-sm text-gray-600">Data tidak valid atau tidak memenuhi syarat</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* VERIFIED: Approve, Schedule Survey, or Reject */}
                    {selectedRegistration.status === 'verified' && (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-green-50 transition-colors"
                            style={{ borderColor: actionType === 'approved' ? '#10b981' : '#e5e7eb' }}
                          >
                            <input
                              type="radio"
                              name="action"
                              value="approved"
                              checked={actionType === 'approved'}
                              onChange={(e) => setActionType(e.target.value)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500"
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">✅ Approve - Setujui Langsung</p>
                              <p className="text-sm text-gray-600">Skip survey, langsung create customer (Fast Track)</p>
                            </div>
                          </label>

                          <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-indigo-50 transition-colors"
                            style={{ borderColor: actionType === 'survey_scheduled' ? '#6366f1' : '#e5e7eb' }}
                          >
                            <input
                              type="radio"
                              name="action"
                              value="survey_scheduled"
                              checked={actionType === 'survey_scheduled'}
                              onChange={(e) => setActionType(e.target.value)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">📅 Schedule Survey</p>
                              <p className="text-sm text-gray-600">Jadwalkan survey lokasi terlebih dahulu</p>
                            </div>
                          </label>

                          <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
                            style={{ borderColor: actionType === 'rejected' ? '#ef4444' : '#e5e7eb' }}
                          >
                            <input
                              type="radio"
                              name="action"
                              value="rejected"
                              checked={actionType === 'rejected'}
                              onChange={(e) => setActionType(e.target.value)}
                              className="h-4 w-4 text-red-600 focus:ring-red-500"
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">❌ Reject - Tolak Pendaftaran</p>
                              <p className="text-sm text-gray-600">Data tidak memenuhi syarat</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* SURVEY SCHEDULED: Survey Completed or Reject */}
                    {selectedRegistration.status === 'survey_scheduled' && (
                      <div className="space-y-4">
                        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4 mb-4">
                          <p className="text-sm font-medium text-indigo-900">📅 Survey Scheduled</p>
                          <p className="text-sm text-indigo-700 mt-1">
                            Survey telah dijadwalkan. Setelah survey dilakukan, update status di bawah ini.
                          </p>
                        </div>
                        <div className="space-y-3">
                          <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-green-50 transition-colors"
                            style={{ borderColor: actionType === 'survey_completed' ? '#10b981' : '#e5e7eb' }}
                          >
                            <input
                              type="radio"
                              name="action"
                              value="survey_completed"
                              checked={actionType === 'survey_completed'}
                              onChange={(e) => setActionType(e.target.value)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500"
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">✅ Survey Completed</p>
                              <p className="text-sm text-gray-600">Survey sudah selesai, lokasi feasible untuk instalasi</p>
                            </div>
                          </label>

                          <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
                            style={{ borderColor: actionType === 'rejected' ? '#ef4444' : '#e5e7eb' }}
                          >
                            <input
                              type="radio"
                              name="action"
                              value="rejected"
                              checked={actionType === 'rejected'}
                              onChange={(e) => setActionType(e.target.value)}
                              className="h-4 w-4 text-red-600 focus:ring-red-500"
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">❌ Reject - Tidak Feasible</p>
                              <p className="text-sm text-gray-600">Lokasi tidak memungkinkan untuk instalasi</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* SURVEY COMPLETED: Approve or Reject */}
                    {selectedRegistration.status === 'survey_completed' && (
                      <div className="space-y-4">
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                          <p className="text-sm font-medium text-green-900">✅ Survey Completed</p>
                          <p className="text-sm text-green-700 mt-1">Survey sudah selesai. Pilih tindakan selanjutnya di bawah ini.</p>
                        </div>
                        <div className="space-y-3">
                          <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-green-50 transition-colors"
                            style={{ borderColor: actionType === 'approved' ? '#10b981' : '#e5e7eb' }}
                          >
                            <input
                              type="radio"
                              name="action"
                              value="approved"
                              checked={actionType === 'approved'}
                              onChange={(e) => setActionType(e.target.value)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500"
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">✅ Approve - Setujui Pendaftaran</p>
                              <p className="text-sm text-gray-600">Lokasi feasible, siap untuk create customer</p>
                            </div>
                          </label>

                          <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
                            style={{ borderColor: actionType === 'rejected' ? '#ef4444' : '#e5e7eb' }}
                          >
                            <input
                              type="radio"
                              name="action"
                              value="rejected"
                              checked={actionType === 'rejected'}
                              onChange={(e) => setActionType(e.target.value)}
                              className="h-4 w-4 text-red-600 focus:ring-red-500"
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">❌ Reject - Tidak Feasible</p>
                              <p className="text-sm text-gray-600">Hasil survey menunjukkan lokasi tidak layak</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* APPROVED: Create Customer */}
                    {selectedRegistration.status === 'approved' && !selectedRegistration.customer_id && (
                      <div className="space-y-4">
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-purple-900">🎉 Registration Approved!</p>
                          <p className="text-sm text-purple-700 mt-1">
                            Pendaftaran sudah disetujui. Klik tombol di bawah untuk membuat data customer dan ticket instalasi.
                          </p>
                        </div>
                        <button
                          onClick={() => handleCreateCustomer(selectedRegistration)}
                          disabled={createCustomerMutation.isLoading}
                          className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors inline-flex items-center justify-center"
                        >
                          {createCustomerMutation.isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <HomeIcon className="h-5 w-5 mr-2" />
                              Buat Customer & Ticket Instalasi
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Conditional Form Fields */}
                    {actionType && selectedRegistration.status !== 'approved' && (
                      <div className="mt-6 space-y-4">
                        {/* Survey Date - Only for survey_scheduled */}
                        {actionType === 'survey_scheduled' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tanggal Survey <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="datetime-local"
                              value={surveyDate}
                              onChange={(e) => setSurveyDate(e.target.value)}
                              className="form-input"
                              min={new Date().toISOString().slice(0, 16)}
                            />
                          </div>
                        )}

                        {/* Survey Results - Only for survey_completed */}
                        {actionType === 'survey_completed' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Hasil Survey <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              rows={4}
                              value={actionNotes}
                              onChange={(e) => setActionNotes(e.target.value)}
                              className="form-input"
                              placeholder="Contoh: Survey completed successfully. ODP distance: 50m. Cable needed: 60m. No obstacles found. Location is feasible for installation."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              💡 Tips: Sebutkan jarak ODP, panjang kabel needed, hambatan (jika ada), dan kesimpulan kelayakan instalasi.
                            </p>
                          </div>
                        )}

                        {/* Rejection Reason - Only for rejected */}
                        {actionType === 'rejected' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Alasan Penolakan <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              rows={3}
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="form-input"
                              placeholder="Jelaskan alasan penolakan secara detail..."
                            />
                          </div>
                        )}

                        {/* Notes - For all actions except survey_completed (uses actionNotes for results) */}
                        {actionType !== 'survey_completed' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Catatan (Opsional)
                            </label>
                            <textarea
                              rows={2}
                              value={actionNotes}
                              onChange={(e) => setActionNotes(e.target.value)}
                              className="form-input"
                              placeholder="Tambahkan catatan tambahan..."
                            />
                          </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex gap-3 justify-end pt-4">
                          <button
                            onClick={() => {
                              setActionType(null)
                              setActionNotes('')
                              setRejectionReason('')
                              setSurveyDate('')
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleSubmitAction}
                            disabled={updateStatusMutation.isLoading}
                            className={`
                              px-6 py-2 rounded-lg text-white transition-colors inline-flex items-center
                              ${actionType === 'rejected' 
                                ? 'bg-red-600 hover:bg-red-700' 
                                : actionType === 'survey_scheduled'
                                ? 'bg-indigo-600 hover:bg-indigo-700'
                                : 'bg-green-600 hover:bg-green-700'
                              }
                              disabled:bg-gray-400 disabled:cursor-not-allowed
                            `}
                          >
                            {updateStatusMutation.isLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Konfirmasi
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Create Customer Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCreateCustomerModal}
        onClose={() => {
          setShowCreateCustomerModal(false)
          setCustomerToCreate(null)
        }}
        onConfirm={confirmCreateCustomer}
        title="🏠 Buat Customer & Ticket Instalasi"
        message={customerToCreate ? `Apakah Anda yakin ingin membuat customer dan ticket instalasi untuk "${customerToCreate.full_name}"?` : ''}
        confirmText="Ya, Buat Customer"
        cancelText="Batal"
        type="success"
        isLoading={createCustomerMutation.isLoading}
      >
        {customerToCreate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Nama:</span>
                <span className="font-medium text-gray-900">{customerToCreate.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">No. HP:</span>
                <span className="font-medium text-gray-900">{customerToCreate.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paket:</span>
                <span className="font-medium text-gray-900">{customerToCreate.service_package || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Alamat:</span>
                <span className="font-medium text-gray-900 text-right ml-2">{customerToCreate.installation_address?.substring(0, 40)}...</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-gray-600">
                ✅ Customer baru akan dibuat<br/>
                🎫 Ticket instalasi akan otomatis dibuatkan<br/>
                📧 Notifikasi akan dikirim
              </p>
            </div>
          </div>
        )}
      </ConfirmationModal>

      {/* Quick Verify Modal */}
      <ConfirmationModal
        isOpen={showQuickVerifyModal}
        onClose={() => {
          setShowQuickVerifyModal(false)
          setQuickActionTarget(null)
        }}
        onConfirm={confirmQuickVerify}
        title="✅ Verifikasi Data"
        message={quickActionTarget ? `Verifikasi data pendaftaran dari "${quickActionTarget.full_name}"?` : ''}
        confirmText="Ya, Verifikasi"
        cancelText="Batal"
        type="info"
      >
        {quickActionTarget && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <p className="text-sm text-gray-700">
              ✅ Status akan berubah menjadi <span className="font-semibold text-blue-900">"Verified"</span><br/>
              📋 Data sudah diperiksa dan valid
            </p>
          </div>
        )}
      </ConfirmationModal>

      {/* Quick Approve Modal */}
      <ConfirmationModal
        isOpen={showQuickApproveModal}
        onClose={() => {
          setShowQuickApproveModal(false)
          setQuickActionTarget(null)
        }}
        onConfirm={confirmQuickApprove}
        title="✅ Approve Registrasi"
        message={quickActionTarget ? `Setujui pendaftaran dari "${quickActionTarget.full_name}"?` : ''}
        confirmText="Ya, Approve"
        cancelText="Batal"
        type="success"
      >
        {quickActionTarget && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
            <p className="text-sm text-gray-700">
              ✅ Status akan berubah menjadi <span className="font-semibold text-green-900">"Approved"</span><br/>
              🎉 Pendaftaran disetujui
            </p>
          </div>
        )}
      </ConfirmationModal>

      {/* Quick Schedule Survey Modal */}
      <ConfirmationModal
        isOpen={showQuickScheduleSurveyModal}
        onClose={() => {
          setShowQuickScheduleSurveyModal(false)
          setQuickActionTarget(null)
        }}
        onConfirm={confirmQuickScheduleSurvey}
        title="📅 Jadwalkan Survey"
        message={quickActionTarget ? `Jadwalkan survey untuk "${quickActionTarget.full_name}"` : ''}
        confirmText="Ya, Jadwalkan"
        cancelText="Batal"
        type="warning"
      >
        {quickActionTarget && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Survey *
            </label>
            <input
              type="date"
              value={quickSurveyDate}
              onChange={(e) => setQuickSurveyDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        )}
      </ConfirmationModal>

      {/* Quick Reject Modal */}
      <ConfirmationModal
        isOpen={showQuickRejectModal}
        onClose={() => {
          setShowQuickRejectModal(false)
          setQuickActionTarget(null)
          setQuickRejectReason('')
        }}
        onConfirm={confirmQuickReject}
        title="❌ Reject Registrasi"
        message={quickActionTarget ? `Tolak pendaftaran dari "${quickActionTarget.full_name}"?` : ''}
        confirmText="Ya, Reject"
        cancelText="Batal"
        type="danger"
      >
        {quickActionTarget && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alasan Reject *
            </label>
            <textarea
              value={quickRejectReason}
              onChange={(e) => setQuickRejectReason(e.target.value)}
              rows={3}
              placeholder="Tuliskan alasan reject..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            />
          </div>
        )}
      </ConfirmationModal>

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

export default RegistrationsPage

