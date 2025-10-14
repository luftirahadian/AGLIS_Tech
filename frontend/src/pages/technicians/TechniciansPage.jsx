// ═══════════════════════════════════════════════════════════════
// 👷 TECHNICIANS PAGE (IMPROVED)
// ═══════════════════════════════════════════════════════════════
// Aligned with new User-Technician sync workflow
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Users, UserPlus, Search, MapPin, Phone, Mail, 
  Star, Clock, Wrench, AlertCircle, CheckCircle, 
  XCircle, Pause, User, Award, Eye, Ban, Play,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
  Power, Info
} from 'lucide-react'
import { technicianService } from '../../services/technicianService'
import LoadingSpinner from '../../components/LoadingSpinner'
import KPICard from '../../components/dashboard/KPICard'
import toast from 'react-hot-toast'

const TechniciansPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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

  // Update availability mutation
  const updateAvailabilityMutation = useMutation(
    ({ id, status }) => technicianService.updateAvailability(id, { availability_status: status }),
    {
      onSuccess: () => {
        toast.success('Status updated successfully')
        refetch()
        queryClient.invalidateQueries('technician-stats')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update status')
      }
    }
  )

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleCreateTechnicianUser = () => {
    // Redirect to Users page with pre-filled role=technician
    navigate('/users?create=true&role=technician')
    toast.info('Create a user account with role "Technician"')
  }

  const handleViewTechnician = (technician) => {
    navigate(`/technicians/${technician.id}`)
  }

  const handleViewUser = (userId) => {
    navigate(`/users?id=${userId}`)
  }

  const handleQuickStatusChange = (technicianId, newStatus) => {
    updateAvailabilityMutation.mutate({ id: technicianId, status: newStatus })
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
      break: { color: 'bg-blue-100 text-blue-800', icon: Pause, label: 'Break' },
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

  const getEmploymentBadge = (status) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Active' },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: Pause, label: 'Inactive' },
      suspended: { color: 'bg-red-100 text-red-800', icon: Ban, label: 'Suspended' },
      terminated: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Terminated' }
    }
    const badge = badges[status] || badges.active
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

  const technicians = techniciansData?.data?.technicians || []
  const pagination = techniciansData?.data?.pagination || {}
  const stats = statsData?.data || {}

  // Listen to socket events for real-time updates
  useEffect(() => {
    const handleTechnicianUpdate = () => {
      queryClient.invalidateQueries(['technicians'])
      queryClient.invalidateQueries('technician-stats')
    }

    window.addEventListener('technician-created', handleTechnicianUpdate)
    window.addEventListener('technician-updated', handleTechnicianUpdate)
    window.addEventListener('technician-status-changed', handleTechnicianUpdate)

    return () => {
      window.removeEventListener('technician-created', handleTechnicianUpdate)
      window.removeEventListener('technician-updated', handleTechnicianUpdate)
      window.removeEventListener('technician-status-changed', handleTechnicianUpdate)
    }
  }, [queryClient])

  if (isLoading && !techniciansData) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Wrench className="h-7 w-7 text-blue-600" />
            <span>Technician Management</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola teknisi lapangan dan monitor performa
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {/* Info Badge */}
          <div className="hidden sm:flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-xs text-blue-900">
              Create technician via Users page with role="Technician"
            </span>
          </div>
          
          {/* Create Button */}
          <button 
            onClick={handleCreateTechnicianUser}
            className="btn-primary flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create Technician User</span>
          </button>
        </div>
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
          onClick={() => {
            handleFilterChange('availability_status', filters.availability_status === 'available' ? '' : 'available')
          }}
        />
        <KPICard
          icon={Clock}
          title="Busy"
          value={stats.busy_technicians || 0}
          color="yellow"
          onClick={() => {
            handleFilterChange('availability_status', filters.availability_status === 'busy' ? '' : 'busy')
          }}
        />
        <KPICard
          icon={XCircle}
          title="Offline"
          value={stats.offline_technicians || 0}
          color="red"
          onClick={() => {
            handleFilterChange('availability_status', filters.availability_status === 'offline' ? '' : 'offline')
          }}
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
              Availability Status
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
              Employment Status
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
              <option value="terminated">Terminated</option>
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
              <option value="Karawang">Karawang</option>
              <option value="Jakarta_Pusat">Jakarta Pusat</option>
              <option value="Jakarta_Selatan">Jakarta Selatan</option>
              <option value="Jakarta_Utara">Jakarta Utara</option>
              <option value="Jakarta_Timur">Jakarta Timur</option>
              <option value="Jakarta_Barat">Jakarta Barat</option>
              <option value="Bogor">Bogor</option>
              <option value="Depok">Depok</option>
              <option value="Tangerang">Tangerang</option>
              <option value="Bekasi">Bekasi</option>
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
        </div>

        {/* Active Filters Badge */}
        {Object.values(filters).some(v => v) && (
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {Object.entries(filters).map(([key, value]) => 
              value ? (
                <span key={key} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center space-x-1">
                  <span>{key}: {value}</span>
                  <button
                    onClick={() => handleFilterChange(key, '')}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              ) : null
            )}
            <button
              onClick={() => {
                setFilters({
                  search: '',
                  employment_status: '',
                  availability_status: '',
                  skill_level: '',
                  work_zone: '',
                  specialization: ''
                })
                setPage(1)
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all
            </button>
          </div>
        )}
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
              <p className="mt-1 text-gray-500 mb-4">
                Create a user account with role "Technician" to get started
              </p>
              <button onClick={handleCreateTechnicianUser} className="btn-primary">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Technician User
              </button>
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
                      <th className="table-header-cell">User Account</th>
                      <th className="table-header-cell">Contact</th>
                      <th className="table-header-cell">Skills & Zone</th>
                      <th className="table-header-cell">Employment</th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('availability_status')}
                      >
                        <div className="flex items-center justify-between">
                          <span>Availability</span>
                          {getSortIcon('availability_status')}
                        </div>
                      </th>
                      <th className="table-header-cell">Performance</th>
                      <th className="table-header-cell text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                {technicians.map((technician) => (
                  <tr key={technician.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
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
                      {technician.username ? (
                        <div>
                          <button
                            onClick={() => handleViewUser(technician.user_id)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            @{technician.username}
                          </button>
                          <div className="text-xs text-gray-500 mt-1">
                            User ID: {technician.user_id}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-red-600">No user account</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center mb-1">
                        <Phone className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-sm">{technician.phone}</span>
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
                      {getEmploymentBadge(technician.employment_status)}
                    </td>
                    <td className="table-cell">
                      <div className="space-y-2">
                        {/* Quick Status Change Dropdown */}
                        <select
                          value={technician.availability_status}
                          onChange={(e) => handleQuickStatusChange(technician.id, e.target.value)}
                          disabled={technician.employment_status !== 'active'}
                          className={`text-xs font-medium rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 ${
                            technician.availability_status === 'available' ? 'bg-green-100 text-green-800' :
                            technician.availability_status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                            technician.availability_status === 'break' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          } ${technician.employment_status !== 'active' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <option value="available">Available</option>
                          <option value="busy">Busy</option>
                          <option value="break">Break</option>
                          <option value="offline">Offline</option>
                        </select>
                        <div className="text-xs text-gray-500">
                          Tickets: {technician.active_tickets || 0}/{technician.max_daily_tickets || 8}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center mb-1">
                        <Star className="h-4 w-4 mr-1 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {technician.avg_customer_rating ? parseFloat(technician.avg_customer_rating).toFixed(1) : 'N/A'}
                        </span>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
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
    </div>
  )
}

export default TechniciansPage
