import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Tag, Plus, Search, Trash2, Edit, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import serviceCategoryService from '../../services/serviceCategoryService'
import serviceTypeService from '../../services/serviceTypeService'
import LoadingSpinner from '../../components/LoadingSpinner'
import ServiceCategoryModal from '../../components/masterdata/ServiceCategoryModal'
import KPICard from '../../components/dashboard/KPICard'
import toast from 'react-hot-toast'

const ServiceCategoriesPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterServiceType, setFilterServiceType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [sortBy, setSortBy] = useState('display_order')
  const [sortOrder, setSortOrder] = useState('asc')
  const [serviceTypePages, setServiceTypePages] = useState({}) // Track page for each service type
  const queryClient = useQueryClient()

  const limit = 5 // Items per page per service type

  // Fetch service types for filter
  const { data: serviceTypesResponse } = useQuery(
    'service-types-filter',
    () => serviceTypeService.getAll({ page: 1, limit: 100 }),
    { refetchOnWindowFocus: false }
  )

  const serviceTypes = serviceTypesResponse?.data || []

  // Fetch ALL service categories (no pagination, high limit)
  const { data: categoriesResponse, isLoading } = useQuery(
    ['service-categories-all', filterServiceType, filterStatus, searchTerm, sortBy, sortOrder],
    () => serviceCategoryService.getAll({
      service_type_code: filterServiceType !== 'all' ? filterServiceType : undefined,
      active_only: filterStatus === 'active' ? 'true' : filterStatus === 'inactive' ? 'false' : undefined,
      search: searchTerm || undefined,
      page: 1,
      limit: 1000, // Get all data
      sort_by: sortBy,
      sort_order: sortOrder
    }),
    {
      refetchOnWindowFocus: false
    }
  )

  const allCategories = categoriesResponse?.data || []

  // Statistics
  const totalCategories = allCategories.length
  const activeCategories = allCategories.filter(c => c.is_active).length
  const inactiveCategories = allCategories.filter(c => !c.is_active).length
  const totalServiceTypes = [...new Set(allCategories.map(c => c.service_type_code))].length

  // Group by service type for display
  const groupedCategories = allCategories.reduce((acc, cat) => {
    if (!acc[cat.service_type_code]) {
      acc[cat.service_type_code] = {
        type_name: cat.service_type_name,
        categories: []
      }
    }
    acc[cat.service_type_code].categories.push(cat)
    return acc
  }, {})

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => serviceCategoryService.delete(id),
    {
      onSuccess: () => {
        toast.success('Category berhasil dihapus')
        queryClient.invalidateQueries('service-categories')
        queryClient.invalidateQueries('service-categories-all')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal menghapus category')
      }
    }
  )

  const handleCreate = () => {
    setSelectedCategory(null)
    setIsModalOpen(true)
  }

  const handleEdit = (category) => {
    setSelectedCategory(category)
    setIsModalOpen(true)
  }

  const handleDelete = (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus category "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedCategory(null)
  }

  const handleSuccess = () => {
    queryClient.invalidateQueries('service-categories')
    queryClient.invalidateQueries('service-categories-all')
    handleModalClose()
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'serviceType') {
      setFilterServiceType(value)
    } else if (filterType === 'status') {
      setFilterStatus(value)
    }
  }

  const getServiceTypePage = (typeCode) => {
    return serviceTypePages[typeCode] || 1
  }

  const setServiceTypePage = (typeCode, page) => {
    setServiceTypePages(prev => ({
      ...prev,
      [typeCode]: page
    }))
  }

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Service Categories Management</h1>
          <p className="text-gray-600">Kelola kategori layanan berdasarkan service type</p>
        </div>
        <button 
          onClick={handleCreate}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Category
        </button>
      </div>

      {/* Statistics Cards - Responsive */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={Tag}
          title="Total Categories"
          value={totalCategories}
          color="blue"
        />
        <KPICard
          icon={Tag}
          title="Active"
          value={activeCategories}
          color="green"
        />
        <KPICard
          icon={Tag}
          title="Inactive"
          value={inactiveCategories}
          color="red"
        />
        <KPICard
          icon={Tag}
          title="Service Types"
          value={totalServiceTypes}
          color="purple"
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
                placeholder="Cari category..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>

          {/* Service Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Type
            </label>
            <select
              className="form-input"
              value={filterServiceType}
              onChange={(e) => handleFilterChange('serviceType', e.target.value)}
            >
              <option value="all">Semua Service Type</option>
              {serviceTypes.map(type => (
                <option key={type.type_code} value={type.type_code}>
                  {type.type_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="form-input"
              value={filterStatus}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Additional Filter Placeholder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration Range
            </label>
            <select
              className="form-input"
              value="all"
              onChange={(e) => {}}
            >
              <option value="all">Semua Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Service Categories List - Grouped by Service Type */}
      {Object.keys(groupedCategories).length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada category</h3>
          <p className="text-gray-500 mb-4">Mulai dengan menambahkan category pertama</p>
          <button onClick={handleCreate} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Category
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedCategories).map(([typeCode, data]) => {
            const currentPage = getServiceTypePage(typeCode)
            const totalInType = data.categories.length
            const totalPages = Math.ceil(totalInType / limit)
            const startIdx = (currentPage - 1) * limit
            const endIdx = startIdx + limit
            const displayedCategories = data.categories.slice(startIdx, endIdx)

            return (
              <div key={typeCode} className="card">
                {/* Service Type Header */}
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {data.type_name}
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({totalInType} categories)
                    </span>
                  </h3>
                </div>

                {/* Categories Table */}
                <div className="card-body p-0">
                  <div className="overflow-x-auto w-full">
                    <table className="table w-full" style={{ tableLayout: 'fixed', minWidth: '900px' }}>
                      <thead className="table-header">
                        <tr>
                          <th 
                            className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                            onClick={() => handleSort('display_order')}
                            style={{ width: '50px' }}
                          >
                            <div className="flex items-center justify-between">
                              <span>#</span>
                              {getSortIcon('display_order')}
                            </div>
                          </th>
                          <th 
                            className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                            onClick={() => handleSort('category_code')}
                            style={{ width: '150px' }}
                          >
                            <div className="flex items-center justify-between">
                              <span>Code</span>
                              {getSortIcon('category_code')}
                            </div>
                          </th>
                          <th 
                            className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                            onClick={() => handleSort('category_name')}
                            style={{ width: '170px' }}
                          >
                            <div className="flex items-center justify-between">
                              <span>Category Name</span>
                              {getSortIcon('category_name')}
                            </div>
                          </th>
                          <th className="table-header-cell" style={{ width: '200px' }}>Description</th>
                          <th 
                            className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                            onClick={() => handleSort('estimated_duration')}
                            style={{ width: '100px' }}
                          >
                            <div className="flex items-center justify-between">
                              <span>Duration</span>
                              {getSortIcon('estimated_duration')}
                            </div>
                          </th>
                          <th className="table-header-cell" style={{ width: '70px' }}>SLA</th>
                          <th 
                            className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                            onClick={() => handleSort('is_active')}
                            style={{ width: '90px' }}
                          >
                            <div className="flex items-center justify-between">
                              <span>Status</span>
                              {getSortIcon('is_active')}
                            </div>
                          </th>
                          <th className="table-header-cell text-center" style={{ width: '100px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="table-body">
                        {displayedCategories.map((category) => (
                          <tr key={category.id}>
                            <td className="table-cell">
                              <div className="text-sm font-medium text-gray-900">{category.display_order}</div>
                            </td>
                            <td className="table-cell">
                              <div className="text-sm font-mono text-gray-900">{category.category_code}</div>
                            </td>
                            <td className="table-cell">
                              <div className="text-sm font-medium text-gray-900">{category.category_name}</div>
                            </td>
                            <td className="table-cell">
                              <div className="text-sm text-gray-900 truncate" title={category.description} style={{ maxWidth: '200px' }}>
                                {category.description || '-'}
                              </div>
                            </td>
                            <td className="table-cell whitespace-nowrap">
                              <div className="text-sm text-gray-900">{category.estimated_duration} min</div>
                            </td>
                            <td className="table-cell whitespace-nowrap">
                              <div className="text-sm text-gray-900">×{category.sla_multiplier}</div>
                            </td>
                            <td className="table-cell whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {category.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="table-cell text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => handleEdit(category)}
                                  className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                  title="Edit Category"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(category.id, category.category_name)}
                                  className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                  title="Delete Category"
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

                  {/* Pagination per Service Type */}
                  {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setServiceTypePage(typeCode, Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setServiceTypePage(typeCode, Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{startIdx + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(endIdx, totalInType)}</span> of{' '}
                            <span className="font-medium">{totalInType}</span> results
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => setServiceTypePage(typeCode, Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                              <button
                                key={pageNum}
                                onClick={() => setServiceTypePage(typeCode, pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === pageNum
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            ))}
                            <button
                              onClick={() => setServiceTypePage(typeCode, Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Service Category Modal */}
      {isModalOpen && (
        <ServiceCategoryModal
          category={selectedCategory}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}

export default ServiceCategoriesPage
