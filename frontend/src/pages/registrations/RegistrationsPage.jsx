import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  UserPlus, Search, Filter, Eye, CheckCircle, XCircle, Clock,
  Calendar, Phone, Mail, MapPin, Package, Shield, FileCheck,
  UserCheck, ClipboardCheck, Home, ChevronRight, BarChart3,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, Download, Loader2
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import registrationService from '../../services/registrationService'
import LoadingSpinner from '../../components/LoadingSpinner'
import KPICard from '../../components/dashboard/KPICard'
import { exportToExcel, formatCurrency as formatCurrencyExport, formatDate, formatDateOnly } from '../../utils/exportToExcel'

const RegistrationsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
    if (window.confirm(`Buat customer dan ticket instalasi untuk ${registration.full_name}?`)) {
      createCustomerMutation.mutate(registration.id)
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

  const stats = statsData || {}
  const totalRegistrations = registrationsData?.data?.pagination?.total || 0

  // Listen to socket events for real-time updates
  useEffect(() => {
    const handleRegistrationUpdate = () => {
      queryClient.invalidateQueries(['registrations'])
      queryClient.invalidateQueries('registration-stats')
      console.log('🔄 Registration list & stats refreshed')
    }

    window.addEventListener('registration-created', handleRegistrationUpdate)
    window.addEventListener('registration-updated', handleRegistrationUpdate)

    return () => {
      window.removeEventListener('registration-created', handleRegistrationUpdate)
      window.removeEventListener('registration-updated', handleRegistrationUpdate)
    }
  }, [queryClient])

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
                  </tr>
                </thead>
                <tbody className="table-body">
                  {registrationsData?.data?.registrations.map((reg) => (
                    <tr 
                      key={reg.id}
                      onClick={() => navigate(`/registrations/${reg.id}`)}
                      className="cursor-pointer hover:bg-blue-50 hover:shadow-md hover:border-l-4 hover:border-l-green-500 transition-all duration-200"
                      title="Klik untuk lihat detail registrasi"
                    >
                      <td className="table-cell">
                        <div className="font-medium text-blue-600">{reg.registration_number}</div>
                        <div className="text-sm text-gray-500">{new Date(reg.created_at).toLocaleDateString('id-ID')}</div>
                      </td>
                      <td className="table-cell">
                        <div className="font-medium text-gray-900">{reg.full_name}</div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {reg.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-3 w-3 mr-1" />
                          {reg.email}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="font-medium">{reg.package_name}</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(reg.monthly_price)}/bln
                        </div>
                      </td>
                      <td className="table-cell">
                        {getStatusBadge(reg.status)}
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">
                          {new Date(reg.created_at).toLocaleDateString('id-ID')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(reg.created_at).toLocaleTimeString('id-ID')}
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
    </div>
  )
}

export default RegistrationsPage

