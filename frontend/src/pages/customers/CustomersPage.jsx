import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { 
  Users, Plus, Search, Filter, Eye, Edit, Trash2, 
  Phone, Mail, MapPin, Package, CreditCard, Activity,
  ChevronLeft, ChevronRight, RefreshCw, XCircle, 
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react'
import { customerService } from '../../services/customerService'
import packageService from '../../services/packageService'
import LoadingSpinner from '../../components/LoadingSpinner'
import KPICard from '../../components/dashboard/KPICard'
import CustomerForm from '../../components/CustomerForm'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const CustomersPage = () => {
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
    inactive_customers: 0,
    suspended_customers: 0,
    paid_customers: 0,
    unpaid_customers: 0,
    pending_customers: 0,
    non_active_customers: 0
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleDeleteCustomer = async (customerId, customerName) => {
    if (window.confirm(`Apakah Anda yakin ingin menonaktifkan customer ${customerName}?`)) {
      try {
        await customerService.deleteCustomer(customerId)
        toast.success('Customer berhasil dinonaktifkan')
        refetchCustomers()
      } catch (error) {
        toast.error('Gagal menonaktifkan customer')
        console.error('Delete customer error:', error)
      }
    }
  }

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer)
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

  const getStatusBadge = (status, type = 'account') => {
    const statusConfig = {
      account: {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-red-100 text-red-800',
        suspended: 'bg-yellow-100 text-yellow-800'
      },
      payment: {
        paid: 'bg-green-100 text-green-800',
        unpaid: 'bg-red-100 text-red-800',
        pending: 'bg-yellow-100 text-yellow-800'
      }
    }

    const config = statusConfig[type] || statusConfig.account
    const className = config[status] || 'bg-gray-100 text-gray-800'

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>
        {status}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Kelola data customer dan informasi layanan</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Customer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={Users}
          title="Total Customer"
          value={stats.total_customers || 0}
          color="blue"
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
          icon={CreditCard}
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
          icon={XCircle}
          title="Non-Active"
          value={stats.non_active_customers || 0}
          color="red"
          onClick={() => {
            // Toggle between showing inactive/suspended and showing all
            const newStatus = filters.account_status === 'inactive' || filters.account_status === 'suspended' 
              ? '' 
              : 'inactive'
            setFilters({ 
              ...filters, 
              account_status: newStatus,
              payment_status: '' // Reset payment status filter
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
              <p className="text-gray-500">Belum ada data customer yang sesuai dengan filter</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
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
                      <th className="table-header-cell text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="table-cell">
                          <div>
                            <div className="font-medium text-gray-900">
                              {customer.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {customer.customer_id}
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center mb-1">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            {customer.phone}
                          </div>
                          {customer.email && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Mail className="h-3 w-3 mr-1 text-gray-400" />
                              {customer.email}
                            </div>
                          )}
                        </td>
                        <td className="table-cell">
                          <div className="font-medium">{customer.package_name}</div>
                          <div className="text-sm text-gray-500">
                            {customer.bandwidth_down} Mbps - {formatCurrency(customer.monthly_price)}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="space-y-1">
                            {getStatusBadge(customer.account_status, 'account')}
                            {getStatusBadge(customer.payment_status, 'payment')}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-center">
                            <div className="font-medium">{customer.total_tickets || 0}</div>
                            <div className="text-xs text-gray-500">total</div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex justify-end space-x-2">
                            <Link
                              to={`/customers/${customer.id}`}
                              className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                              className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                              title="Deactivate Customer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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
    </div>
  )
}

export default CustomersPage