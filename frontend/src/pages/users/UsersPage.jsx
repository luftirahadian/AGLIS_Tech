import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { UserCheck, Plus, Search, Trash2, Edit, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ShieldAlert, Key } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import userService from '../../services/userService'
import LoadingSpinner from '../../components/LoadingSpinner'
import UserModal from '../../components/users/UserModal'
import ResetPasswordModal from '../../components/users/ResetPasswordModal'
import DeleteConfirmationModal from '../../components/users/DeleteConfirmationModal'
import KPICard from '../../components/dashboard/KPICard'
import toast from 'react-hot-toast'

const UsersPage = () => {
  const { user: currentUser, isAdmin, isSupervisor } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterLastLogin, setFilterLastLogin] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
  const [userToResetPassword, setUserToResetPassword] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const queryClient = useQueryClient()

  // Fetch Users with pagination
  const { data: usersResponse, isLoading } = useQuery(
    ['users-list', filterRole, filterStatus, filterLastLogin, searchTerm, sortBy, sortOrder, page, limit],
    () => userService.getAll({
      role: filterRole !== 'all' ? filterRole : undefined,
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

  const users = Array.isArray(usersResponse?.data) ? usersResponse.data : []
  const pagination = usersResponse?.pagination || {}

  // Client-side filter for last login (since backend doesn't support this yet)
  const filteredUsers = users.filter(user => {
    if (filterLastLogin === 'all') return true
    
    const lastLogin = user.last_login ? new Date(user.last_login) : null
    const now = new Date()
    const daysDiff = lastLogin ? Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24)) : null
    
    switch(filterLastLogin) {
      case 'today':
        return daysDiff === 0
      case 'week':
        return daysDiff !== null && daysDiff <= 7
      case 'month':
        return daysDiff !== null && daysDiff <= 30
      case 'never':
        return lastLogin === null
      default:
        return true
    }
  })

  // Fetch all users for stats
  const { data: allUsersResponse } = useQuery(
    'all-users-stats',
    () => userService.getAll({ page: 1, limit: 1000 }),
    {
      refetchOnWindowFocus: false
    }
  )

  const allUsers = Array.isArray(allUsersResponse?.data) ? allUsersResponse.data : []
  const totalUsers = allUsers.length
  const activeUsers = allUsers.filter(u => u.is_active).length
  const adminUsers = allUsers.filter(u => u.role === 'admin').length
  const technicianUsers = allUsers.filter(u => u.role === 'technician').length

  const handleCreate = () => {
    setSelectedUser(null)
    setIsModalOpen(true)
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleResetPassword = (user) => {
    setUserToResetPassword(user)
    setIsResetPasswordModalOpen(true)
  }

  const handleResetPasswordClose = () => {
    setIsResetPasswordModalOpen(false)
    setUserToResetPassword(null)
  }

  const handleResetPasswordSuccess = () => {
    queryClient.invalidateQueries(['users-list'])
    // Don't close modal yet, let user see the generated password
  }

  const handleDelete = (user) => {
    setUserToDelete(user)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteClose = () => {
    setIsDeleteModalOpen(false)
    setUserToDelete(null)
  }

  const handleDeleteSuccess = () => {
    queryClient.invalidateQueries(['users-list'])
    queryClient.invalidateQueries('all-users-stats')
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedUser(null)
  }

  const handleSuccess = () => {
    queryClient.invalidateQueries(['users-list'])
    queryClient.invalidateQueries('all-users-stats')
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
    if (filterType === 'role') {
      setFilterRole(value)
    } else if (filterType === 'status') {
      setFilterStatus(value)
    } else if (filterType === 'lastLogin') {
      setFilterLastLogin(value)
    }
    setPage(1)
  }

  const handleLimitChange = (newLimit) => {
    setLimit(parseInt(newLimit))
    setPage(1)
  }

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800',
      supervisor: 'bg-blue-100 text-blue-800',
      technician: 'bg-green-100 text-green-800',
      customer_service: 'bg-yellow-100 text-yellow-800'
    }
    const labels = {
      admin: 'Admin',
      supervisor: 'Supervisor',
      technician: 'Technician',
      customer_service: 'Customer Service'
    }
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badges[role] || 'bg-gray-100 text-gray-800'}`}>
        {labels[role] || role}
      </span>
    )
  }

  // RBAC: Only Admin & Supervisor can access this page
  if (!isAdmin && !isSupervisor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <ShieldAlert className="h-24 w-24 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">You don't have permission to access User Management.</p>
        <p className="text-sm text-gray-500">Required role: Admin or Supervisor</p>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Kelola pengguna sistem dan akses</p>
        </div>
        <button 
          onClick={handleCreate}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah User
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={UserCheck}
          title="Total Users"
          value={totalUsers}
          color="blue"
        />
        <KPICard
          icon={UserCheck}
          title="Active Users"
          value={activeUsers}
          color="green"
        />
        <KPICard
          icon={UserCheck}
          title="Admins"
          value={adminUsers}
          color="purple"
        />
        <KPICard
          icon={UserCheck}
          title="Technicians"
          value={technicianUsers}
          color="orange"
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
                placeholder="Cari user..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              className="form-input"
              value={filterRole}
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <option value="all">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="technician">Technician</option>
              <option value="customer_service">Customer Service</option>
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
              Last Login
            </label>
            <select
              className="form-input"
              value={filterLastLogin}
              onChange={(e) => handleFilterChange('lastLogin', e.target.value)}
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="week">7 Hari Terakhir</option>
              <option value="month">30 Hari Terakhir</option>
              <option value="never">Belum Pernah</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      {users.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada user</h3>
          <p className="text-gray-500 mb-4">Mulai dengan menambahkan user pertama</p>
          <button onClick={handleCreate} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Tambah User
          </button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada hasil</h3>
          <p className="text-gray-500 mb-4">Coba ubah filter atau search keyword</p>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                All Users
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
                        onClick={() => handleSort('full_name')}
                        style={{ width: '200px' }}
                      >
                        <div className="flex items-center justify-between">
                          <span>User</span>
                          {getSortIcon('full_name')}
                        </div>
                      </th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                        onClick={() => handleSort('email')}
                        style={{ width: '180px' }}
                      >
                        <div className="flex items-center justify-between">
                          <span>Email</span>
                          {getSortIcon('email')}
                        </div>
                      </th>
                      <th className="table-header-cell" style={{ width: '120px' }}>Phone</th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                        onClick={() => handleSort('role')}
                        style={{ width: '130px' }}
                      >
                        <div className="flex items-center justify-between">
                          <span>Role</span>
                          {getSortIcon('role')}
                        </div>
                      </th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                        onClick={() => handleSort('last_login')}
                        style={{ width: '100px' }}
                      >
                        <div className="flex items-center justify-between">
                          <span>Last Login</span>
                          {getSortIcon('last_login')}
                        </div>
                      </th>
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
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="table-cell">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {user.full_name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 truncate" style={{ maxWidth: '130px' }}>
                                {user.full_name}
                              </div>
                              <div className="text-xs text-gray-500 truncate" style={{ maxWidth: '130px' }}>
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900 truncate" title={user.email}>{user.email}</div>
                        </td>
                        <td className="table-cell whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.phone || '-'}</div>
                        </td>
                        <td className="table-cell whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="table-cell whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {user.last_login ? new Date(user.last_login).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : 'Never'}
                          </div>
                        </td>
                        <td className="table-cell whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="table-cell text-center">
                          <div className="flex justify-center space-x-1">
                            {/* Edit: Admin & Supervisor can edit */}
                            {(isAdmin || isSupervisor) && (
                              <button
                                onClick={() => handleEdit(user)}
                                className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                title="Edit User"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {/* Reset Password: Only Admin */}
                            {isAdmin && user.id !== currentUser?.id && (
                              <button
                                onClick={() => handleResetPassword(user)}
                                className="inline-flex items-center justify-center w-8 h-8 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-md transition-colors"
                                title="Reset Password"
                              >
                                <Key className="h-4 w-4" />
                              </button>
                            )}
                            {/* Delete: Only Admin can delete */}
                            {isAdmin && user.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDelete(user)}
                                className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            {/* Prevent self-actions */}
                            {user.id === currentUser?.id && (
                              <span className="text-xs text-gray-400 px-2" title="Cannot modify yourself">
                                -
                              </span>
                            )}
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
                      onChange={(e) => handleLimitChange(e.target.value)}
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

      {/* User Modal */}
      {isModalOpen && (
        <UserModal
          user={selectedUser}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}

      {/* Reset Password Modal */}
      {isResetPasswordModalOpen && userToResetPassword && (
        <ResetPasswordModal
          user={userToResetPassword}
          onClose={handleResetPasswordClose}
          onSuccess={handleResetPasswordSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && userToDelete && (
        <DeleteConfirmationModal
          user={userToDelete}
          onClose={handleDeleteClose}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  )
}

export default UsersPage
