import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { MapPin, Plus, Search, Trash2, Edit, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import odpService from '../../services/odpService'
import LoadingSpinner from '../../components/LoadingSpinner'
import ODPModal from '../../components/masterdata/ODPModal'
import KPICard from '../../components/dashboard/KPICard'
import toast from 'react-hot-toast'

const ODPPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterArea, setFilterArea] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedODP, setSelectedODP] = useState(null)
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const queryClient = useQueryClient()

  // Fetch ODPs with pagination
  const { data: odpsResponse, isLoading } = useQuery(
    ['odps', filterStatus, filterArea, searchTerm, sortBy, sortOrder, page, limit],
    () => odpService.getAll({
      status: filterStatus !== 'all' ? filterStatus : undefined,
      area: filterArea !== 'all' ? filterArea : undefined,
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

  const odps = odpsResponse?.data || []
  const pagination = odpsResponse?.pagination || {}

  // Fetch all ODPs for stats
  const { data: allODPsResponse } = useQuery(
    'all-odps-stats',
    () => odpService.getAll({ page: 1, limit: 1000 }),
    {
      refetchOnWindowFocus: false
    }
  )

  const allODPs = allODPsResponse?.data || []
  const totalODPs = allODPs.length
  const activeODPs = allODPs.filter(o => o.status === 'active').length
  const fullODPs = allODPs.filter(o => o.status === 'full').length
  const maintenanceODPs = allODPs.filter(o => o.status === 'maintenance').length
  const areas = [...new Set(allODPs.map(o => o.area).filter(Boolean))]

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => odpService.delete(id),
    {
      onSuccess: () => {
        toast.success('ODP berhasil dihapus')
        queryClient.invalidateQueries('odps')
        queryClient.invalidateQueries('all-odps-stats')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal menghapus ODP')
      }
    }
  )

  const handleCreate = () => {
    setSelectedODP(null)
    setIsModalOpen(true)
  }

  const handleEdit = (odp) => {
    setSelectedODP(odp)
    setIsModalOpen(true)
  }

  const handleDelete = (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus ODP "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedODP(null)
  }

  const handleSuccess = () => {
    queryClient.invalidateQueries('odps')
    queryClient.invalidateQueries('all-odps-stats')
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
    if (filterType === 'status') {
      setFilterStatus(value)
    } else if (filterType === 'area') {
      setFilterArea(value)
    }
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
          <h1 className="text-2xl font-bold text-gray-900">ODP Management</h1>
          <p className="text-gray-600">Kelola data Optical Distribution Point</p>
        </div>
        <button 
          onClick={handleCreate}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah ODP
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={MapPin}
          title="Total ODP"
          value={totalODPs}
          color="blue"
        />
        <KPICard
          icon={MapPin}
          title="Active"
          value={activeODPs}
          color="green"
        />
        <KPICard
          icon={MapPin}
          title="Full"
          value={fullODPs}
          color="red"
        />
        <KPICard
          icon={MapPin}
          title="Maintenance"
          value={maintenanceODPs}
          color="yellow"
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
                placeholder="Cari ODP..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area
            </label>
            <select
              className="form-input"
              value={filterArea}
              onChange={(e) => handleFilterChange('area', e.target.value)}
            >
              <option value="all">Semua Area</option>
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
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
              <option value="full">Full</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity
            </label>
            <select
              className="form-input"
              value="all"
              onChange={(e) => {}}
            >
              <option value="all">Semua Kapasitas</option>
            </select>
          </div>
        </div>
      </div>

      {/* ODP List */}
      {odps.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada ODP</h3>
          <p className="text-gray-500 mb-4">Mulai dengan menambahkan ODP pertama</p>
          <button onClick={handleCreate} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Tambah ODP
          </button>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                All ODPs
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
                        onClick={() => handleSort('name')}
                        style={{ width: '140px' }}
                      >
                        <div className="flex items-center justify-between">
                          <span>Nama ODP</span>
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                        onClick={() => handleSort('location')}
                        style={{ width: '230px' }}
                      >
                        <div className="flex items-center justify-between">
                          <span>Lokasi</span>
                          {getSortIcon('location')}
                        </div>
                      </th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                        onClick={() => handleSort('area')}
                        style={{ width: '130px' }}
                      >
                        <div className="flex items-center justify-between">
                          <span>Area</span>
                          {getSortIcon('area')}
                        </div>
                      </th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                        onClick={() => handleSort('used_ports')}
                        style={{ width: '120px' }}
                      >
                        <div className="flex items-center justify-between">
                          <span>Kapasitas</span>
                          {getSortIcon('used_ports')}
                        </div>
                      </th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                        onClick={() => handleSort('status')}
                        style={{ width: '90px' }}
                      >
                        <div className="flex items-center justify-between">
                          <span>Status</span>
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th className="table-header-cell text-center" style={{ width: '110px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {odps.map((odp) => (
                      <tr key={odp.id}>
                        <td className="table-cell">
                          <div className="text-sm font-medium text-gray-900">{odp.name}</div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900 truncate" title={odp.location}>{odp.location}</div>
                          {odp.latitude && odp.longitude && (
                            <div className="text-xs text-gray-500 font-mono truncate">
                              {parseFloat(odp.latitude).toFixed(6)}, {parseFloat(odp.longitude).toFixed(6)}
                            </div>
                          )}
                        </td>
                        <td className="table-cell whitespace-nowrap">
                          <div className="text-sm text-gray-900">{odp.area || '-'}</div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900 mb-1">
                            {odp.used_ports || 0} / {odp.total_ports || 0} ports
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                ((odp.used_ports / odp.total_ports) * 100) >= 90 ? 'bg-red-600' :
                                ((odp.used_ports / odp.total_ports) * 100) >= 70 ? 'bg-yellow-600' :
                                'bg-green-600'
                              }`}
                              style={{ width: `${(odp.used_ports / odp.total_ports) * 100}%` }}
                            />
                          </div>
                        </td>
                        <td className="table-cell whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            odp.status === 'active' ? 'bg-green-100 text-green-800' :
                            odp.status === 'full' ? 'bg-red-100 text-red-800' :
                            odp.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {odp.status?.charAt(0).toUpperCase() + odp.status?.slice(1)}
                          </span>
                        </td>
                        <td className="table-cell text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(odp)}
                              className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit ODP"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(odp.id, odp.name)}
                              className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete ODP"
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

      {/* ODP Modal */}
      {isModalOpen && (
        <ODPModal
          odp={selectedODP}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}

export default ODPPage
