import React, { useState } from 'react'
import { useQuery, useMutation } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Users, Plus, Search, Filter, MapPin, Phone, Mail, 
  Star, Clock, Wrench, AlertCircle, CheckCircle, 
  XCircle, Pause, User, Award, Calendar, Eye, Trash2,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight
} from 'lucide-react'
import { technicianService } from '../../services/technicianService'
import LoadingSpinner from '../../components/LoadingSpinner'
import TechnicianForm from '../../components/TechnicianForm'
import KPICard from '../../components/dashboard/KPICard'
import toast from 'react-hot-toast'

const TechniciansPage = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    search: '',
    employment_status: '',
    availability_status: '',
    skill_level: '',
    work_zone: '',
    specialization: ''
  })
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('DESC')
  const [showForm, setShowForm] = useState(false)
  const [selectedTechnician, setSelectedTechnician] = useState(null)
  const [formMode, setFormMode] = useState('create')
  const [limit, setLimit] = useState(10)

  // Fetch technicians
  const { data: techniciansData, isLoading, refetch } = useQuery(
    ['technicians', filters, page, limit, sortBy, sortOrder],
    () => technicianService.getTechnicians({ 
      ...filters, 
      page, 
      limit,
      sort_by: sortBy,
      sort_order: sortOrder
    }),
    { keepPreviousData: true }
  )

  // Fetch technician statistics
  const { data: statsData } = useQuery(
    'technician-stats',
    () => technicianService.getTechnicianStats()
  )

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => technicianService.deleteTechnician(id),
    {
      onSuccess: () => {
        toast.success('Technician deleted successfully')
        refetch()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete technician')
      }
    }
  )

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleCreateTechnician = () => {
    setSelectedTechnician(null)
    setFormMode('create')
    setShowForm(true)
  }

  const handleEditTechnician = (technician) => {
    setSelectedTechnician(technician)
    setFormMode('edit')
    setShowForm(true)
  }

  const handleDeleteTechnician = (id, name) => {
    if (window.confirm(`Are you sure you want to delete technician "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleFormSuccess = () => {
    refetch()
    setShowForm(false)
    setSelectedTechnician(null)
  }

  const handleViewTechnician = (technician) => {
    navigate(`/technicians/${technician.id}`)
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortBy(column)
      setSortOrder('DESC')
    }
    setPage(1)
  }

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortOrder === 'ASC' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />
  }

  const getAvailabilityBadge = (status) => {
    const badges = {
      available: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Available' },
      busy: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Busy' },
      break: { color: 'bg-blue-100 text-blue-800', icon: Pause, label: 'On Break' },
      offline: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Offline' }
    }
    const badge = badges[status] || badges.offline
    const Icon = badge.icon
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    )
  }

  const getSkillLevelBadge = (level) => {
    const badges = {
      junior: { color: 'bg-blue-100 text-blue-800', label: 'Junior' },
      senior: { color: 'bg-purple-100 text-purple-800', label: 'Senior' },
      expert: { color: 'bg-orange-100 text-orange-800', label: 'Expert' },
      specialist: { color: 'bg-red-100 text-red-800', label: 'Specialist' }
    }
    const badge = badges[level] || badges.junior
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Award className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    )
  }

  if (isLoading && !techniciansData) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const technicians = techniciansData?.data?.technicians || []
  const pagination = techniciansData?.data?.pagination || {}
  const stats = statsData?.data || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Technician Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola teknisi lapangan dan monitor performa
          </p>
        </div>
        <button 
          onClick={handleCreateTechnician}
          className="mt-4 sm:mt-0 btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Teknisi
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={Users}
          title="Total Teknisi"
          value={stats.total_technicians || 0}
          color="blue"
        />
        <KPICard
          icon={CheckCircle}
          title="Available"
          value={stats.available_technicians || 0}
          color="green"
        />
        <KPICard
          icon={Clock}
          title="Busy"
          value={stats.busy_technicians || 0}
          color="yellow"
        />
        <KPICard
          icon={Star}
          title="Avg Rating"
          value={stats.avg_customer_rating ? parseFloat(stats.avg_customer_rating).toFixed(1) : '0.0'}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Cari teknisi..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="form-input"
              value={filters.availability_status}
              onChange={(e) => handleFilterChange('availability_status', e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="break">On Break</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skill Level
            </label>
            <select
              className="form-input"
              value={filters.skill_level}
              onChange={(e) => handleFilterChange('skill_level', e.target.value)}
            >
              <option value="">Semua Level</option>
              <option value="junior">Junior</option>
              <option value="senior">Senior</option>
              <option value="expert">Expert</option>
              <option value="specialist">Specialist</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Zone
            </label>
            <select
              className="form-input"
              value={filters.work_zone}
              onChange={(e) => handleFilterChange('work_zone', e.target.value)}
            >
              <option value="">Semua Zone</option>
              <option value="Jakarta_Pusat">Jakarta Pusat</option>
              <option value="Jakarta_Selatan">Jakarta Selatan</option>
              <option value="Jakarta_Utara">Jakarta Utara</option>
              <option value="Jakarta_Timur">Jakarta Timur</option>
              <option value="Jakarta_Barat">Jakarta Barat</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialization
            </label>
            <select
              className="form-input"
              value={filters.specialization}
              onChange={(e) => handleFilterChange('specialization', e.target.value)}
            >
              <option value="">Semua Spesialisasi</option>
              <option value="fiber_optic">Fiber Optic</option>
              <option value="wireless">Wireless</option>
              <option value="networking">Networking</option>
              <option value="installation">Installation</option>
              <option value="troubleshooting">Troubleshooting</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employment
            </label>
            <select
              className="form-input"
              value={filters.employment_status}
              onChange={(e) => handleFilterChange('employment_status', e.target.value)}
            >
              <option value="">Semua</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Technicians Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">
            All Technicians
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({pagination.total || 0} total)
            </span>
          </h2>
        </div>
        <div className="card-body p-0">
          {technicians.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No technicians found</h3>
              <p className="mt-1 text-gray-500">
                Get started by adding your first technician.
              </p>
              <div className="mt-6">
                <button onClick={handleCreateTechnician} className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Technician
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('full_name')}
                      >
                        <div className="flex items-center justify-between">
                          <span>Technician</span>
                          {getSortIcon('full_name')}
                        </div>
                      </th>
                      <th className="table-header-cell">Contact</th>
                      <th className="table-header-cell">Skills & Zone</th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('availability_status')}
                      >
                        <div className="flex items-center justify-between">
                          <span>Status</span>
                          {getSortIcon('availability_status')}
                        </div>
                      </th>
                      <th className="table-header-cell">Performance</th>
                      <th className="table-header-cell text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                {technicians.map((technician) => (
                  <tr key={technician.id}>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {technician.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {technician.employee_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center mb-1">
                        <Phone className="h-3 w-3 mr-1 text-gray-400" />
                        {technician.phone}
                      </div>
                      {technician.email && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-3 w-3 mr-1 text-gray-400" />
                          {technician.email}
                        </div>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="space-y-2">
                        {getSkillLevelBadge(technician.skill_level)}
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {technician.work_zone?.replace('_', ' ')}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="space-y-2">
                        {getAvailabilityBadge(technician.availability_status)}
                        <div className="text-xs text-gray-500">
                          Active Tickets: {technician.active_tickets || 0}/{technician.max_daily_tickets || 8}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center mb-1">
                        <Star className="h-4 w-4 mr-1 text-yellow-400" />
                        {technician.avg_customer_rating ? parseFloat(technician.avg_customer_rating).toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Completed: {technician.total_tickets_completed || 0}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex justify-center space-x-2">
                        <button 
                          onClick={() => handleViewTechnician(technician)}
                          className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTechnician(technician.id, technician.full_name)}
                          className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Technician"
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
          {pagination && (
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                    disabled={page === pagination.pages}
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
                        {Math.min(page * limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
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
                      {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => {
                        if (pagination.pages <= 10) return i + 1;
                        if (page <= 5) return i + 1;
                        if (page >= pagination.pages - 4) return pagination.pages - 9 + i;
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
                        onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                        disabled={page === pagination.pages}
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
          </>
          )}
        </div>
      </div>

      {/* Technician Form Modal */}
      <TechnicianForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        technician={selectedTechnician}
        onSuccess={handleFormSuccess}
        mode={formMode}
      />
    </div>
  )
}

export default TechniciansPage