import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { 
  Users, Plus, Search, Filter, Eye, Edit, Trash2, 
  Phone, Mail, MapPin, Package, CreditCard, Activity,
  ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react'
import { customerService } from '../../services/customerService'
import { packageService } from '../../services/packageService'
import LoadingSpinner from '../../components/LoadingSpinner'
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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)

  // Fetch customers with filters
  const { 
    data: customersData, 
    isLoading: customersLoading, 
    refetch: refetchCustomers,
    error: customersError
  } = useQuery(
    ['customers', filters, pagination], 
    () => customerService.getCustomers({ ...filters, ...pagination }),
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

  const customers = customersData?.data?.customers || []
  const totalPages = customersData?.data?.pagination?.pages || 1
  const totalCustomers = customersData?.data?.pagination?.total || 0

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Customer</p>
                <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.filter(c => c.account_status === 'active').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unpaid</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.filter(c => c.payment_status === 'unpaid').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Packages</p>
                <p className="text-2xl font-bold text-gray-900">
                  {packagesData?.data?.packages?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Cari customer..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 input-field"
                />
              </div>
            </div>

            {/* Service Type Filter */}
            <div>
              <select
                value={filters.service_type}
                onChange={(e) => handleFilterChange('service_type', e.target.value)}
                className="input-field"
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
              <select
                value={filters.account_status}
                onChange={(e) => handleFilterChange('account_status', e.target.value)}
                className="input-field"
              >
                <option value="">Semua Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <select
                value={filters.payment_status}
                onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                className="input-field"
              >
                <option value="">Status Bayar</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Package Filter */}
            <div>
              <select
                value={filters.package_id}
                onChange={(e) => handleFilterChange('package_id', e.target.value)}
                className="input-field"
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
      </div>

      {/* Customer Table */}
      <div className="card">
        <div className="card-body p-0">
          {customersLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
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
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kontak
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paket
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tickets
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {customer.customer_id}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center mb-1">
                              <Phone className="h-3 w-3 mr-1 text-gray-400" />
                              {customer.phone}
                            </div>
                            {customer.email && (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">{customer.package_name}</div>
                            <div className="text-gray-500">
                              {customer.bandwidth_down} Mbps - {formatCurrency(customer.monthly_price)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {getStatusBadge(customer.account_status, 'account')}
                            {getStatusBadge(customer.payment_status, 'payment')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="text-center">
                            <div className="font-medium">{customer.total_tickets || 0}</div>
                            <div className="text-xs text-gray-500">total</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              to={`/customers/${customer.id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleEditCustomer(customer)}
                              className="text-green-600 hover:text-green-900"
                              title="Edit Customer"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                              className="text-red-600 hover:text-red-900"
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
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(pagination.page - 1) * pagination.limit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.limit, totalCustomers)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{totalCustomers}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        
                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === pagination.page
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        })}
                        
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
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