import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { 
  Users, Plus, Search, Filter, 
  Phone, Mail, MapPin, Package, CreditCard, Activity,
  ChevronLeft, ChevronRight, RefreshCw, XCircle, 
  ArrowUpDown, ArrowUp, ArrowDown, UserPlus, Clock, AlertCircle, CheckCircle, Download, Loader2,
  Copy, Check, ShieldOff, ShieldCheck, Trash2, X, PhoneCall, MailIcon, ShieldAlert
} from 'lucide-react'
import { customerService } from '../../services/customerService'
import bulkOperationsService from '../../services/bulkOperationsService'
import packageService from '../../services/packageService'
import LoadingSpinner from '../../components/LoadingSpinner'
import KPICard from '../../components/dashboard/KPICard'
import CustomerForm from '../../components/CustomerForm'
import ConfirmationModal from '../../components/ConfirmationModal'
import BulkProgressModal from '../../components/BulkProgressModal'
import BulkResultsModal from '../../components/BulkResultsModal'
import ExportModal from '../../components/ExportModal'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { exportToExcel, formatCurrency, formatDate, formatDateOnly } from '../../utils/exportToExcel'
import { useAuth } from '../../contexts/AuthContext'

const CustomersPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user: currentUser, isAdmin, isSupervisor } = useAuth()
  
  const [filters, setFilters] = useState({
    search: '',
    customer_type: '',
    service_type: '',
    account_status: '',
    payment_status: '',
    package_id: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10
  })
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('DESC')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  
  // Bulk selection states
  const [selectedCustomers, setSelectedCustomers] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  
  // Copy to clipboard state
  const [copiedField, setCopiedField] = useState(null)
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState(null)
  
  // Bulk action modal states
  const [showBulkSuspendModal, setShowBulkSuspendModal] = useState(false)
  const [showBulkActivateModal, setShowBulkActivateModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  
  // Bulk operation modals (NEW)
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
  
  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false)

  // Available columns for export
  const exportColumns = [
    { key: 'no', label: 'No', defaultSelected: true },
    { key: 'customer_id', label: 'Customer ID', defaultSelected: true },
    { key: 'name', label: 'Nama', defaultSelected: true },
    { key: 'phone', label: 'Telepon', defaultSelected: true },
    { key: 'email', label: 'Email', defaultSelected: true },
    { key: 'address', label: 'Alamat', defaultSelected: true },
    { key: 'city', label: 'Kota', defaultSelected: false },
    { key: 'province', label: 'Provinsi', defaultSelected: false },
    { key: 'package_name', label: 'Paket', defaultSelected: true },
    { key: 'monthly_price', label: 'Harga Bulanan', defaultSelected: true },
    { key: 'customer_type', label: 'Tipe Customer', defaultSelected: false },
    { key: 'service_type', label: 'Tipe Layanan', defaultSelected: false },
    { key: 'account_status', label: 'Status Akun', defaultSelected: true },
    { key: 'payment_status', label: 'Status Pembayaran', defaultSelected: true },
    { key: 'outstanding_balance', label: 'Outstanding', defaultSelected: true },
    { key: 'due_date', label: 'Jatuh Tempo', defaultSelected: false },
    { key: 'last_payment_date', label: 'Pembayaran Terakhir', defaultSelected: false },
    { key: 'total_tickets', label: 'Total Tickets', defaultSelected: false },
    { key: 'registration_date', label: 'Tanggal Registrasi', defaultSelected: true },
    { key: 'ip_address', label: 'IP Address', defaultSelected: false },
    { key: 'notes', label: 'Catatan', defaultSelected: false }
  ]

  // Fetch customers with filters
  const { 
    data: customersData, 
    isLoading: customersLoading, 
    refetch: refetchCustomers,
    error: customersError
  } = useQuery(
    ['customers', filters, pagination, sortBy, sortOrder], 
    () => customerService.getCustomers({ 
      ...filters, 
      ...pagination,
      sort_by: sortBy,
      sort_order: sortOrder
    }),
    {
      keepPreviousData: true,
      staleTime: 30000
    }
  )

  // Fetch packages for filter dropdown
  const { data: packagesData } = useQuery(
    'packages-list',
    () => packageService.getPackages({ is_active: 'true' }),
    {
      staleTime: 300000 // 5 minutes
    }
  )

  // Fetch customer statistics
  const { data: statsData } = useQuery(
    'customer-stats',
    () => customerService.getCustomerStats(),
    {
      refetchOnWindowFocus: true,
      refetchOnMount: 'always'
    }
  )

  const customers = customersData?.data?.customers || []
  const totalPages = customersData?.data?.pagination?.pages || 1
  const totalCustomers = customersData?.data?.pagination?.total || 0
  const stats = statsData?.data || {
    total_customers: 0,
    active_customers: 0,
    pending_installation_customers: 0,
    inactive_customers: 0,
    suspended_customers: 0,
    paid_customers: 0,
    unpaid_customers: 0,
    pending_customers: 0,
    non_active_customers: 0
  }

  // Listen to socket events for real-time updates
  useEffect(() => {
    const handleCustomerUpdate = () => {
      queryClient.invalidateQueries(['customers'])
      queryClient.invalidateQueries('customer-stats')
      console.log('🔄 Customer list & stats refreshed')
    }

    window.addEventListener('customer-created', handleCustomerUpdate)
    window.addEventListener('customer-updated', handleCustomerUpdate)

    return () => {
      window.removeEventListener('customer-created', handleCustomerUpdate)
      window.removeEventListener('customer-updated', handleCustomerUpdate)
    }
  }, [queryClient])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleDeleteCustomer = (customerId, customerName) => {
    setCustomerToDelete({ id: customerId, name: customerName })
    setShowDeleteModal(true)
  }

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return
    
    try {
      await customerService.deleteCustomer(customerToDelete.id)
      toast.success('Customer berhasil dinonaktifkan')
      refetchCustomers()
      queryClient.invalidateQueries('customer-stats')
    } catch (error) {
      toast.error('Gagal menonaktifkan customer')
      console.error('Delete customer error:', error)
    } finally {
      setShowDeleteModal(false)
      setCustomerToDelete(null)
    }
  }

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer)
  }

  // Enhanced export handler with custom options
  const handleEnhancedExport = async (exportOptions) => {
    try {
      let customersToExport = []

      // Determine which customers to export
      if (exportOptions.type === 'all') {
        // Fetch ALL customers (no filters, no pagination)
        const response = await customerService.getCustomers({
          page: 1,
          limit: 100000
        })
        customersToExport = response.data?.customers || []
      } else if (exportOptions.type === 'filtered') {
        // Fetch filtered customers
        const response = await customerService.getCustomers({
          ...filters,
          page: 1,
          limit: 100000,
          sort_by: sortBy,
          sort_order: sortOrder
        })
        customersToExport = response.data?.customers || []
      } else if (exportOptions.type === 'selected') {
        // Export only selected customers
        customersToExport = customers.filter(c => selectedCustomers.includes(c.id))
      }

      if (customersToExport.length === 0) {
        toast.error('Tidak ada data untuk di-export')
        return
      }

      // Build export data based on selected columns
      const exportData = customersToExport.map((customer, index) => {
        const row = {}
        
        exportOptions.columns.forEach(columnKey => {
          switch (columnKey) {
            case 'no':
              row['No'] = index + 1
              break
            case 'customer_id':
              row['Customer ID'] = customer.customer_id || '-'
              break
            case 'name':
              row['Nama'] = customer.name || '-'
              break
            case 'phone':
              row['Telepon'] = customer.phone || '-'
              break
            case 'email':
              row['Email'] = customer.email || '-'
              break
            case 'address':
              row['Alamat'] = customer.address || '-'
              break
            case 'city':
              row['Kota'] = customer.city || '-'
              break
            case 'province':
              row['Provinsi'] = customer.province || '-'
              break
            case 'package_name':
              row['Paket'] = customer.package_name || '-'
              break
            case 'monthly_price':
              row['Harga Bulanan'] = formatCurrency(customer.monthly_price || 0)
              break
            case 'customer_type':
              row['Tipe Customer'] = customer.customer_type || '-'
              break
            case 'service_type':
              row['Tipe Layanan'] = customer.service_type || '-'
              break
            case 'account_status':
              row['Status Akun'] = customer.account_status?.toUpperCase() || '-'
              break
            case 'payment_status':
              row['Status Pembayaran'] = customer.payment_status?.toUpperCase() || '-'
              break
            case 'outstanding_balance':
              row['Outstanding'] = formatCurrency(customer.outstanding_balance || 0)
              break
            case 'due_date':
              row['Jatuh Tempo'] = customer.due_date ? formatDateOnly(customer.due_date) : '-'
              break
            case 'last_payment_date':
              row['Pembayaran Terakhir'] = customer.last_payment_date ? formatDateOnly(customer.last_payment_date) : '-'
              break
            case 'total_tickets':
              row['Total Tickets'] = customer.total_tickets || 0
              break
            case 'registration_date':
              row['Tanggal Registrasi'] = customer.registration_date ? formatDateOnly(customer.registration_date) : '-'
              break
            case 'ip_address':
              row['IP Address'] = customer.ip_address || '-'
              break
            case 'notes':
              row['Catatan'] = customer.notes || '-'
              break
            default:
              break
          }
        })
        
        return row
      })

      // Export to Excel (or CSV in future)
      const filename = `Customers_${exportOptions.type}_${new Date().toISOString().split('T')[0]}`
      exportToExcel(exportData, filename)
      
      toast.success(`✅ ${customersToExport.length} customers exported successfully!`)
    } catch (error) {
      console.error('Enhanced export error:', error)
      toast.error('❌ Gagal export data')
    }
  }

  // Legacy export function (untuk backward compatibility)
  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      // Fetch all customers with current filters (no pagination limit)
      const response = await customerService.getCustomers({
        ...filters,
        page: 1,
        limit: 10000, // Get all data
        sort_by: sortBy,
        sort_order: sortOrder
      })

      const allCustomers = response.data?.customers || []
      
      if (allCustomers.length === 0) {
        toast.error('Tidak ada data untuk di-export')
        return
      }

      // Format data for Excel
      const exportData = allCustomers.map((customer, index) => ({
        'No': index + 1,
        'Customer Code': customer.customer_id || '-',
        'Nama': customer.name,
        'Email': customer.email || '-',
        'Telepon': customer.phone || '-',
        'Alamat': customer.address || '-',
        'Kota': customer.city || '-',
        'Provinsi': customer.province || '-',
        'Package': customer.package_name || '-',
        'Harga Bulanan': formatCurrency(customer.monthly_price),
        'Customer Type': customer.customer_type || '-',
        'Service Type': customer.service_type || '-',
        'Account Status': customer.account_status?.toUpperCase() || '-',
        'Payment Status': customer.payment_status?.toUpperCase() || '-',
        'Username': customer.username || '-',
        'Tanggal Registrasi': formatDate(customer.created_at),
        'Tanggal Aktif': customer.activation_date ? formatDateOnly(customer.activation_date) : '-'
      }))

      // Export to Excel
      const result = exportToExcel(exportData, 'Customers_Export', 'Customers Data')
      
      toast.success(`✅ ${result.rows} customers berhasil di-export!`)
      
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Gagal export data. Silakan coba lagi.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleFormSuccess = () => {
    refetchCustomers()
    setShowCreateModal(false)
    setEditingCustomer(null)
  }

  const handleCloseForm = () => {
    setShowCreateModal(false)
    setEditingCustomer(null)
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
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page when sorting changes
  }

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortOrder === 'ASC' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />
  }

  // Format status text untuk display yang lebih baik
  const formatStatusText = (status) => {
    if (!status) return '-'
    // Convert snake_case to Title Case
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getStatusBadge = (status, type = 'account') => {
    const statusConfig = {
      account: {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-red-100 text-red-800',
        suspended: 'bg-yellow-100 text-yellow-800',
        pending_installation: 'bg-blue-100 text-blue-800',
        pending_activation: 'bg-purple-100 text-purple-800'
      },
      payment: {
        paid: 'bg-green-100 text-green-800',
        unpaid: 'bg-red-100 text-red-800',
        pending: 'bg-yellow-100 text-yellow-800',
        overdue: 'bg-orange-100 text-orange-800'
      }
    }

    const config = statusConfig[type] || statusConfig.account
    const className = config[status] || 'bg-gray-100 text-gray-800'

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>
        {formatStatusText(status)}
      </span>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // ==================== BULK SELECTION HANDLERS ====================
  
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCustomers(customers.map(c => c.id))
      setSelectAll(true)
    } else {
      setSelectedCustomers([])
      setSelectAll(false)
    }
  }

  const handleSelectCustomer = (customerId) => {
    if (selectedCustomers.includes(customerId)) {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId))
      setSelectAll(false)
    } else {
      const newSelected = [...selectedCustomers, customerId]
      setSelectedCustomers(newSelected)
      if (newSelected.length === customers.length) {
        setSelectAll(true)
      }
    }
  }

  // ==================== BULK ACTION HANDLERS ====================

  const handleBulkSuspend = () => {
    if (selectedCustomers.length === 0) {
      toast.error('Pilih customer terlebih dahulu')
      return
    }
    setShowBulkSuspendModal(true)
  }

  const confirmBulkSuspend = async () => {

    try {
      let successCount = 0
      let errorCount = 0

      for (const customerId of selectedCustomers) {
        try {
          await customerService.updateCustomer(customerId, { account_status: 'suspended' })
          successCount++
        } catch (error) {
          errorCount++
          console.error(`Failed to suspend customer ${customerId}:`, error)
        }
      }

      if (successCount > 0) {
        toast.success(`✅ ${successCount} customer berhasil di-suspend${errorCount > 0 ? `, ${errorCount} gagal` : ''}`)
        refetchCustomers()
        queryClient.invalidateQueries('customer-stats')
        setSelectedCustomers([])
        setSelectAll(false)
      } else {
        toast.error('Gagal suspend customer')
      }
    } catch (error) {
      console.error('Bulk suspend error:', error)
      toast.error('Terjadi kesalahan saat suspend customer')
    } finally {
      setShowBulkSuspendModal(false)
    }
  }

  const handleBulkActivate = () => {
    if (selectedCustomers.length === 0) {
      toast.error('Pilih customer terlebih dahulu')
      return
    }
    setShowBulkActivateModal(true)
  }

  const confirmBulkActivate = async () => {

    try {
      let successCount = 0
      let errorCount = 0

      for (const customerId of selectedCustomers) {
        try {
          await customerService.updateCustomer(customerId, { account_status: 'active' })
          successCount++
        } catch (error) {
          errorCount++
          console.error(`Failed to activate customer ${customerId}:`, error)
        }
      }

      if (successCount > 0) {
        toast.success(`✅ ${successCount} customer berhasil diaktifkan${errorCount > 0 ? `, ${errorCount} gagal` : ''}`)
        refetchCustomers()
        queryClient.invalidateQueries('customer-stats')
        setSelectedCustomers([])
        setSelectAll(false)
      } else {
        toast.error('Gagal aktifkan customer')
      }
    } catch (error) {
      console.error('Bulk activate error:', error)
      toast.error('Terjadi kesalahan saat aktifkan customer')
    } finally {
      setShowBulkActivateModal(false)
    }
  }

  const handleBulkDelete = () => {
    if (selectedCustomers.length === 0) {
      toast.error('Pilih customer terlebih dahulu')
      return
    }
    setShowBulkDeleteModal(true)
  }

  const confirmBulkDelete = async () => {

    try {
      let successCount = 0
      let errorCount = 0

      for (const customerId of selectedCustomers) {
        try {
          await customerService.deleteCustomer(customerId)
          successCount++
        } catch (error) {
          errorCount++
          console.error(`Failed to delete customer ${customerId}:`, error)
        }
      }

      if (successCount > 0) {
        toast.success(`✅ ${successCount} customer berhasil dihapus${errorCount > 0 ? `, ${errorCount} gagal` : ''}`)
        refetchCustomers()
        queryClient.invalidateQueries('customer-stats')
        setSelectedCustomers([])
        setSelectAll(false)
      } else {
        toast.error('Gagal hapus customer')
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      toast.error('Terjadi kesalahan saat hapus customer')
    } finally {
      setShowBulkDeleteModal(false)
    }
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

  const handleQuickSuspend = async (e, customer) => {
    e.stopPropagation() // Prevent row click
    
    if (!window.confirm(`Suspend customer ${customer.name}?`)) return

    try {
      await customerService.updateCustomer(customer.id, { account_status: 'suspended' })
      toast.success(`Customer ${customer.name} berhasil di-suspend`)
      refetchCustomers()
    } catch (error) {
      toast.error('Gagal suspend customer')
      console.error('Quick suspend error:', error)
    }
  }

  const handleQuickActivate = async (e, customer) => {
    e.stopPropagation() // Prevent row click
    
    try {
      await customerService.updateCustomer(customer.id, { account_status: 'active' })
      toast.success(`Customer ${customer.name} berhasil diaktifkan`)
      refetchCustomers()
    } catch (error) {
      toast.error('Gagal aktifkan customer')
      console.error('Quick activate error:', error)
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
  
  // Check if user has access (Admin or Supervisor only)
  const hasAccess = isAdmin || isSupervisor

  if (customersError) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Activity className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Customers</h3>
          <p className="text-gray-500 mb-4">Gagal memuat data customer</p>
          <button 
            onClick={() => refetchCustomers()}
            className="btn-primary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  // ==================== RBAC: CHECK ACCESS ====================
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <ShieldAlert className="h-24 w-24 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">You don't have permission to access Customer Management.</p>
        <p className="text-sm text-gray-500">Required role: Admin or Supervisor</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Kelola data customer dan informasi layanan</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowExportModal(true)}
            disabled={customersLoading}
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
          {isAdmin && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Customer
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Toolbar - Shows when items are selected */}
      {selectedCustomers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedCustomers.length} customer dipilih
              </span>
              <button
                onClick={() => {
                  setSelectedCustomers([])
                  setSelectAll(false)
                }}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Batal Pilihan
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkActivate}
                className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm inline-flex items-center"
              >
                <ShieldCheck className="h-4 w-4 mr-1" />
                Aktifkan
              </button>
              <button
                onClick={handleBulkSuspend}
                className="px-3 py-1.5 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm inline-flex items-center"
              >
                <ShieldOff className="h-4 w-4 mr-1" />
                Suspend
              </button>
              {isAdmin && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm inline-flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards - Row 1: Account Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={Users}
          title="Total Customer"
          value={stats.total_customers || 0}
          color="blue"
          onClick={() => {
            // Reset all filters to show all customers
            setFilters({
              search: '',
              customer_type: '',
              service_type: '',
              account_status: '',
              payment_status: '',
              package_id: ''
            })
            setPagination({ ...pagination, page: 1 })
          }}
        />
        <KPICard
          icon={Activity}
          title="Active"
          value={stats.active_customers || 0}
          color="green"
          onClick={() => {
            setFilters({ 
              ...filters, 
              account_status: filters.account_status === 'active' ? '' : 'active',
              payment_status: '' // Reset payment status filter
            })
            setPagination({ ...pagination, page: 1 })
          }}
        />
        <KPICard
          icon={Clock}
          title="Pending Installation"
          value={stats.pending_installation_customers || 0}
          color="orange"
          onClick={() => {
            setFilters({ 
              ...filters, 
              account_status: filters.account_status === 'pending_installation' ? '' : 'pending_installation',
              payment_status: '' // Reset payment status filter
            })
            setPagination({ ...pagination, page: 1 })
          }}
        />
        <KPICard
          icon={AlertCircle}
          title="Suspended"
          value={stats.suspended_customers || 0}
          color="red"
          onClick={() => {
            setFilters({ 
              ...filters, 
              account_status: filters.account_status === 'suspended' ? '' : 'suspended',
              payment_status: '' // Reset payment status filter
            })
            setPagination({ ...pagination, page: 1 })
          }}
        />
      </div>

      {/* Stats Cards - Row 2: Payment Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard
          icon={XCircle}
          title="Unpaid"
          value={stats.unpaid_customers || 0}
          color="yellow"
          onClick={() => {
            setFilters({ 
              ...filters, 
              payment_status: filters.payment_status === 'unpaid' ? '' : 'unpaid',
              account_status: '' // Reset account status filter
            })
            setPagination({ ...pagination, page: 1 })
          }}
        />
        <KPICard
          icon={CheckCircle}
          title="Paid"
          value={stats.paid_customers || 0}
          color="green"
          onClick={() => {
            setFilters({ 
              ...filters, 
              payment_status: filters.payment_status === 'paid' ? '' : 'paid',
              account_status: '' // Reset account status filter
            })
            setPagination({ ...pagination, page: 1 })
          }}
        />
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                placeholder="Cari customer..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {/* Service Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Layanan
            </label>
            <select
              className="form-input"
              value={filters.service_type}
              onChange={(e) => handleFilterChange('service_type', e.target.value)}
            >
              <option value="">Semua Layanan</option>
              <option value="broadband">Broadband</option>
              <option value="dedicated">Dedicated</option>
              <option value="corporate">Corporate</option>
              <option value="mitra">Mitra</option>
            </select>
          </div>

          {/* Account Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Akun
            </label>
            <select
              className="form-input"
              value={filters.account_status}
              onChange={(e) => handleFilterChange('account_status', e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Bayar
            </label>
            <select
              className="form-input"
              value={filters.payment_status}
              onChange={(e) => handleFilterChange('payment_status', e.target.value)}
            >
              <option value="">Status Bayar</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Package Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paket
            </label>
            <select
              className="form-input"
              value={filters.package_id}
              onChange={(e) => handleFilterChange('package_id', e.target.value)}
            >
              <option value="">Semua Paket</option>
              {packagesData?.data?.packages?.map(pkg => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.package_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">
            All Customers
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({totalCustomers} total)
            </span>
          </h2>
        </div>
        <div className="card-body p-0">
          {customersLoading ? (
            <div className="py-12">
              <LoadingSpinner className="mx-auto" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada customer</h3>
              <p className="text-gray-500 mb-4">
                Belum ada data customer. Customer akan dibuat dari pendaftaran yang disetujui.
              </p>
              <button 
                onClick={() => navigate('/registrations')}
                className="btn-primary inline-flex items-center"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Lihat Pendaftaran
              </button>
            </div>
          ) : (
            <>
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
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center justify-between">
                          <span>Customer</span>
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th className="table-header-cell">Kontak</th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('package_name')}
                      >
                        <div className="flex items-center justify-between">
                          <span>Paket</span>
                          {getSortIcon('package_name')}
                        </div>
                      </th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('account_status')}
                      >
                        <div className="flex items-center justify-between">
                          <span>Status</span>
                          {getSortIcon('account_status')}
                        </div>
                      </th>
                      <th className="table-header-cell">Tickets</th>
                      <th className="table-header-cell">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {customers.map((customer) => (
                      <tr 
                        key={customer.id}
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        className="group cursor-pointer hover:bg-blue-50 hover:shadow-md hover:border-l-4 hover:border-l-blue-500 transition-all duration-200"
                        title="Klik untuk lihat detail customer"
                      >
                        {/* Bulk Selection Checkbox */}
                        <td 
                          className="table-cell"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCustomers.includes(customer.id)}
                            onChange={() => handleSelectCustomer(customer.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>

                        {/* Customer Name & ID with Copy */}
                        <td className="table-cell">
                          <div>
                            <div className="font-medium text-gray-900">
                              {customer.name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <span>ID: {customer.customer_id}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopyToClipboard(customer.customer_id, 'Customer ID')
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded transition-opacity"
                                title="Copy Customer ID"
                              >
                                {copiedField === 'Customer ID' ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3 text-gray-500" />
                                )}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Contact with Copy Buttons */}
                        <td className="table-cell">
                          <div className="flex items-center mb-1 gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{customer.phone}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopyToClipboard(customer.phone, 'Phone')
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
                          {customer.email && (
                            <div className="flex items-center text-sm text-gray-500 gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="truncate max-w-[150px]">{customer.email}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopyToClipboard(customer.email, 'Email')
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
                          )}
                        </td>

                        {/* Package */}
                        <td className="table-cell">
                          <div className="font-medium">{customer.package_name}</div>
                          <div className="text-sm text-gray-500">
                            {customer.bandwidth_down} Mbps - {formatCurrency(customer.monthly_price)}
                          </div>
                        </td>

                        {/* Status Badges */}
                        <td className="table-cell">
                          <div className="space-y-1">
                            {getStatusBadge(customer.account_status, 'account')}
                            {getStatusBadge(customer.payment_status, 'payment')}
                          </div>
                        </td>

                        {/* Tickets Count */}
                        <td className="table-cell">
                          <div className="text-center">
                            <div className="font-medium">{customer.total_tickets || 0}</div>
                            <div className="text-xs text-gray-500">total</div>
                          </div>
                        </td>

                        {/* Quick Actions (appear on hover) */}
                        <td 
                          className="table-cell"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Quick Call */}
                            <button
                              onClick={(e) => handleQuickCall(e, customer.phone)}
                              className="p-1.5 hover:bg-green-100 rounded transition-colors"
                              title="Call Customer"
                            >
                              <PhoneCall className="h-4 w-4 text-green-600" />
                            </button>

                            {/* Quick Email */}
                            {customer.email && (
                              <button
                                onClick={(e) => handleQuickEmail(e, customer.email)}
                                className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                                title="Email Customer"
                              >
                                <MailIcon className="h-4 w-4 text-blue-600" />
                              </button>
                            )}

                            {/* Quick Suspend/Activate */}
                            {customer.account_status === 'active' ? (
                              <button
                                onClick={(e) => handleQuickSuspend(e, customer)}
                                className="p-1.5 hover:bg-yellow-100 rounded transition-colors"
                                title="Suspend Customer"
                              >
                                <ShieldOff className="h-4 w-4 text-yellow-600" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleQuickActivate(e, customer)}
                                className="p-1.5 hover:bg-green-100 rounded transition-colors"
                                title="Activate Customer"
                              >
                                <ShieldCheck className="h-4 w-4 text-green-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === totalPages}
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
                          value={pagination.limit}
                          onChange={(e) => setPagination({ page: 1, limit: parseInt(e.target.value) })}
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
                        Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.limit, totalCustomers)}
                        </span>{' '}
                        of <span className="font-medium">{totalCustomers}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                          if (totalPages <= 10) return i + 1;
                          if (pagination.page <= 5) return i + 1;
                          if (pagination.page >= totalPages - 4) return totalPages - 9 + i;
                          return pagination.page - 5 + i;
                        }).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pagination.page === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Customer Form Modal */}
      <CustomerForm
        customer={editingCustomer}
        isOpen={showCreateModal || !!editingCustomer}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setCustomerToDelete(null)
        }}
        onConfirm={confirmDeleteCustomer}
        title="⚠️ Nonaktifkan Customer"
        message={customerToDelete ? `Nonaktifkan customer "${customerToDelete.name}"?` : ''}
        confirmText="Ya, Nonaktifkan"
        cancelText="Batal"
        type="danger"
      >
        {customerToDelete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
            <p className="text-sm text-gray-700">
              ⚠️ Customer akan dinonaktifkan dari sistem<br/>
              📊 Data historis tetap tersimpan<br/>
              🔄 Customer dapat diaktifkan kembali nanti
            </p>
          </div>
        )}
      </ConfirmationModal>

      {/* Bulk Suspend Modal */}
      <ConfirmationModal
        isOpen={showBulkSuspendModal}
        onClose={() => setShowBulkSuspendModal(false)}
        onConfirm={confirmBulkSuspend}
        title="⚠️ Suspend Multiple Customers"
        message={`Suspend ${selectedCustomers.length} customer yang dipilih?`}
        confirmText="Ya, Suspend"
        cancelText="Batal"
        type="warning"
      >
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
          <p className="text-sm text-gray-700">
            ⚠️ {selectedCustomers.length} customer akan di-suspend<br/>
            🚫 Customer tidak bisa menggunakan layanan<br/>
            🔄 Status dapat diubah kembali nanti
          </p>
        </div>
      </ConfirmationModal>

      {/* Bulk Activate Modal */}
      <ConfirmationModal
        isOpen={showBulkActivateModal}
        onClose={() => setShowBulkActivateModal(false)}
        onConfirm={confirmBulkActivate}
        title="✅ Activate Multiple Customers"
        message={`Aktifkan ${selectedCustomers.length} customer yang dipilih?`}
        confirmText="Ya, Aktifkan"
        cancelText="Batal"
        type="success"
      >
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
          <p className="text-sm text-gray-700">
            ✅ {selectedCustomers.length} customer akan diaktifkan<br/>
            📡 Customer dapat menggunakan layanan kembali<br/>
            🎯 Status akun menjadi "Active"
          </p>
        </div>
      </ConfirmationModal>

      {/* Bulk Delete Modal */}
      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={confirmBulkDelete}
        title="🗑️ Hapus Multiple Customers"
        message={`Hapus ${selectedCustomers.length} customer yang dipilih?`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
          <p className="text-sm text-gray-700">
            ⚠️ <strong>PERINGATAN:</strong> {selectedCustomers.length} customer akan dihapus!<br/>
            🚫 Customer akan dinonaktifkan dan tidak bisa login<br/>
            📊 Data historis tetap tersimpan untuk audit<br/>
            ⚠️ Aksi ini membutuhkan konfirmasi admin
          </p>
        </div>
      </ConfirmationModal>

      {/* Enhanced Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleEnhancedExport}
        totalCount={stats.total_customers || 0}
        filteredCount={totalCustomers}
        selectedCount={selectedCustomers.length}
        availableColumns={exportColumns}
      />
    </div>
  )
}

export default CustomersPage