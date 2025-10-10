import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Settings, Plus, Search, Trash2, Edit, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import serviceTypeService from '../../services/serviceTypeService'
import LoadingSpinner from '../../components/LoadingSpinner'
import ServiceTypeModal from '../../components/masterdata/ServiceTypeModal'
import KPICard from '../../components/dashboard/KPICard'
import toast from 'react-hot-toast'

const ServiceTypesPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedServiceType, setSelectedServiceType] = useState(null)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('display_order')
  const [sortOrder, setSortOrder] = useState('asc')
  const [limit, setLimit] = useState(10)
  const queryClient = useQueryClient()

  // Fetch service types with pagination and sorting
  const { data: serviceTypesResponse, isLoading } = useQuery(
    ['service-types', page, limit, sortBy, sortOrder, searchTerm, filterStatus],
    () => serviceTypeService.getAll({
      page,
      limit,
      sort_by: sortBy,
      sort_order: sortOrder,
      search: searchTerm || undefined,
      active_only: filterStatus === 'active' ? 'true' : filterStatus === 'inactive' ? 'false' : undefined
    }),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true
    }
  )

  const serviceTypes = serviceTypesResponse?.data || []
  const pagination = serviceTypesResponse?.pagination || {}

  // Statistics - need to fetch all data for stats
  const { data: allTypesResponse } = useQuery(
    'all-service-types-stats',
    () => serviceTypeService.getAll({ page: 1, limit: 1000 }),
    {
      refetchOnWindowFocus: false
    }
  )

  const allTypes = allTypesResponse?.data || []
  const totalTypes = allTypes.length
  const activeTypes = allTypes.filter(t => t.is_active).length
  const inactiveTypes = allTypes.filter(t => !t.is_active).length

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => serviceTypeService.delete(id),
    {
      onSuccess: () => {
        toast.success('Service type berhasil dihapus')
        queryClient.invalidateQueries('service-types')
        queryClient.invalidateQueries('all-service-types-stats')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal menghapus service type')
      }
    }
  )

  const handleCreate = () => {
    setSelectedServiceType(null)
    setIsModalOpen(true)
  }

  const handleEdit = (serviceType) => {
    setSelectedServiceType(serviceType)
    setIsModalOpen(true)
  }

  const handleDelete = (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus service type "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedServiceType(null)
  }

  const handleSuccess = () => {
    queryClient.invalidateQueries('service-types')
    queryClient.invalidateQueries('all-service-types-stats')
    handleModalClose()
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setPage(1)
  }

  const handleFilterChange = (value) => {
    setFilterStatus(value)
    setPage(1)
  }

  if (isLoading && page === 1) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Types Management</h1>
          <p className="text-gray-600">Kelola jenis layanan yang tersedia</p>
        </div>
        <button 
          onClick={handleCreate}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Service Type
        </button>
      </div>

      {/* Statistics Cards - Responsive */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={Settings}
          title="Total Types"
          value={totalTypes}
          color="blue"
        />
        <KPICard
          icon={Settings}
          title="Active"
          value={activeTypes}
          color="green"
        />
        <KPICard
          icon={AlertCircle}
          title="Inactive"
          value={inactiveTypes}
          color="red"
        />
        <KPICard
          icon={Settings}
          title="Avg Duration"
          value={allTypes.length > 0 ? Math.round(allTypes.reduce((sum, t) => sum + t.default_duration, 0) / allTypes.length) : 0}
          color="purple"
          suffix=" min"
        />
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
                placeholder="Cari service type..."
                value={searchTerm}
                onChange={handleSearch}
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
              value={filterStatus}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Duration Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration
            </label>
            <select
              className="form-input"
              value="all"
              onChange={(e) => {}}
            >
              <option value="all">Semua Duration</option>
            </select>
          </div>

          {/* Order Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Order
            </label>
            <select
              className="form-input"
              value="all"
              onChange={(e) => {}}
            >
              <option value="all">Semua Order</option>
            </select>
          </div>
        </div>
      </div>

      {/* Service Types List */}
      {serviceTypes.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada service type</h3>
          <p className="text-gray-500 mb-4">Mulai dengan menambahkan service type pertama</p>
          <button onClick={handleCreate} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Service Type
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              All Service Types
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({pagination.total || 0} total)
              </span>
            </h2>
          </div>
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                      onClick={() => handleSort('display_order')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Order</span>
                        {getSortIcon('display_order')}
                      </div>
                    </th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                      onClick={() => handleSort('type_code')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Type Code</span>
                        {getSortIcon('type_code')}
                      </div>
                    </th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                      onClick={() => handleSort('type_name')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Type Name</span>
                        {getSortIcon('type_name')}
                      </div>
                    </th>
                    <th className="table-header-cell">Description</th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                      onClick={() => handleSort('default_duration')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Duration</span>
                        {getSortIcon('default_duration')}
                      </div>
                    </th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                      onClick={() => handleSort('is_active')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Status</span>
                        {getSortIcon('is_active')}
                      </div>
                    </th>
                    <th className="table-header-cell text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {serviceTypes.map((type) => (
                    <tr key={type.id}>
                      <td className="table-cell">
                        <div className="text-sm font-medium text-gray-900">{type.display_order}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm font-mono text-gray-900">{type.type_code}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm font-medium text-gray-900">{type.type_name}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">{type.description || '-'}</div>
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        <div className="text-sm text-gray-900">{type.default_duration} min</div>
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          type.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {type.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(type)}
                            className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit Service Type"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(type.id, type.type_name)}
                            className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Service Type"
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
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(pagination.pages || 1, page + 1))}
                  disabled={page === (pagination.pages || 1)}
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
                        setPage(1)
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
                    Showing <span className="font-medium">{((page - 1) * limit) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(page * limit, pagination.total || 0)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total || 0}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: Math.min(pagination.pages || 1, 10) }, (_, i) => {
                      const totalPages = pagination.pages || 1;
                      if (totalPages <= 10) return i + 1;
                      if (page <= 5) return i + 1;
                      if (page >= totalPages - 4) return totalPages - 9 + i;
                      return page - 5 + i;
                    }).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(Math.min(pagination.pages || 1, page + 1))}
                      disabled={page === (pagination.pages || 1)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Type Modal */}
      {isModalOpen && (
        <ServiceTypeModal
          serviceType={selectedServiceType}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}

export default ServiceTypesPage
