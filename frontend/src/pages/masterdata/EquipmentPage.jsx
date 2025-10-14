import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Package, Plus, Search, Trash2, Edit, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import equipmentService from '../../services/equipmentService'
import LoadingSpinner from '../../components/LoadingSpinner'
import EquipmentModal from '../../components/masterdata/EquipmentModal'
import KPICard from '../../components/dashboard/KPICard'
import toast from 'react-hot-toast'

const EquipmentPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [sortBy, setSortBy] = useState('equipment_name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const queryClient = useQueryClient()

  // Fetch Equipment with pagination
  const { data: equipmentResponse, isLoading } = useQuery(
    ['equipment-list', filterCategory, filterStatus, searchTerm, sortBy, sortOrder, page, limit],
    () => equipmentService.getAll({
      category: filterCategory !== 'all' ? filterCategory : undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined,
      search: searchTerm || undefined,
      page,
      limit,
      sort_by: sortBy,
      sort_order: sortOrder
    }),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true
    }
  )

  // equipmentService.getAll() now returns array directly
  const equipment = equipmentResponse || []
  const pagination = {} // Equipment API returns simple array, no pagination for now

  // Fetch all equipment for stats
  const { data: allEquipmentResponse } = useQuery(
    'all-equipment-stats',
    () => equipmentService.getAll({ page: 1, limit: 1000 }),
    {
      refetchOnWindowFocus: false
    }
  )

  const allEquipment = allEquipmentResponse || []
  const totalEquipment = allEquipment.length
  const activeEquipment = allEquipment.filter(e => e.is_active).length
  const inactiveEquipment = allEquipment.filter(e => !e.is_active).length
  const categories = [...new Set(allEquipment.map(e => e.category).filter(Boolean))]
  const categoriesCount = categories.length

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => equipmentService.delete(id),
    {
      onSuccess: () => {
        toast.success('Equipment berhasil dihapus')
        queryClient.invalidateQueries(['equipment-list'])
        queryClient.invalidateQueries('all-equipment-stats')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal menghapus equipment')
      }
    }
  )

  const handleCreate = () => {
    setSelectedEquipment(null)
    setIsModalOpen(true)
  }

  const handleEdit = (eq) => {
    setSelectedEquipment(eq)
    setIsModalOpen(true)
  }

  const handleDelete = (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus equipment "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedEquipment(null)
  }

  const handleSuccess = () => {
    queryClient.invalidateQueries(['equipment-list'])
    queryClient.invalidateQueries('all-equipment-stats')
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
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setPage(1)
  }

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'category') {
      setFilterCategory(value)
    } else if (filterType === 'status') {
      setFilterStatus(value)
    }
    setPage(1)
  }

  const getCategoryColor = (category) => {
    const colors = {
      devices: 'bg-blue-100 text-blue-800',
      cables: 'bg-green-100 text-green-800',
      accessories: 'bg-yellow-100 text-yellow-800',
      tools: 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Equipment Management</h1>
          <p className="text-gray-600">Kelola data Equipment</p>
        </div>
        <button 
          onClick={handleCreate}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Equipment
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={Package}
          title="Total Equipment"
          value={totalEquipment}
          color="blue"
        />
        <KPICard
          icon={Package}
          title="Active"
          value={activeEquipment}
          color="green"
        />
        <KPICard
          icon={Package}
          title="Inactive"
          value={inactiveEquipment}
          color="red"
        />
        <KPICard
          icon={Package}
          title="Categories"
          value={categoriesCount}
          color="purple"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Cari equipment..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              className="form-input"
              value={filterCategory}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="all">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Type
            </label>
            <select
              className="form-input"
              value="all"
              onChange={(e) => {}}
            >
              <option value="all">Semua Unit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Equipment List */}
      {equipment.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada equipment</h3>
          <p className="text-gray-500 mb-4">Mulai dengan menambahkan equipment pertama</p>
          <button onClick={handleCreate} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Equipment
          </button>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                All Equipment
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({pagination.total || 0} total)
                </span>
              </h2>
            </div>
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="table w-full" style={{ tableLayout: 'fixed', minWidth: '900px' }}>
                  <thead className="table-header">
                    <tr>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                        onClick={() => handleSort('equipment_code')}
                        style={{ width: '140px' }}
                      >
                        <div className="flex items-center justify-between">
                          <span>Kode</span>
                          {getSortIcon('equipment_code')}
                        </div>
                      </th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                        onClick={() => handleSort('equipment_name')}
                        style={{ width: '280px' }}
                      >
                        <div className="flex items-center justify-between">
                          <span>Nama Equipment</span>
                          {getSortIcon('equipment_name')}
                        </div>
                      </th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                        onClick={() => handleSort('category')}
                        style={{ width: '130px' }}
                      >
                        <div className="flex items-center justify-between">
                          <span>Kategori</span>
                          {getSortIcon('category')}
                        </div>
                      </th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                        onClick={() => handleSort('unit')}
                        style={{ width: '80px' }}
                      >
                        <div className="flex items-center justify-between">
                          <span>Unit</span>
                          {getSortIcon('unit')}
                        </div>
                      </th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                        onClick={() => handleSort('is_active')}
                        style={{ width: '100px' }}
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
                    {equipment.map((eq) => (
                      <tr key={eq.id}>
                        <td className="table-cell">
                          <div className="text-sm font-mono text-gray-900 truncate">{eq.equipment_code}</div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm font-medium text-gray-900 truncate">{eq.equipment_name}</div>
                          {eq.description && (
                            <div className="text-xs text-gray-500 truncate" title={eq.description}>
                              {eq.description}
                            </div>
                          )}
                        </td>
                        <td className="table-cell whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(eq.category)}`}>
                            {eq.category || '-'}
                          </span>
                        </td>
                        <td className="table-cell whitespace-nowrap">
                          <div className="text-sm text-gray-900">{eq.unit || 'pcs'}</div>
                        </td>
                        <td className="table-cell whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            eq.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {eq.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="table-cell text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(eq)}
                              className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit Equipment"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(eq.id, eq.equipment_name)}
                              className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete Equipment"
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
            </div>
          </div>

          {/* Pagination */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
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
        </>
      )}

      {/* Equipment Modal */}
      {isModalOpen && (
        <EquipmentModal
          equipment={selectedEquipment}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}

export default EquipmentPage
