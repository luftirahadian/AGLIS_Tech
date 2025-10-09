import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { UserCheck, Plus, Search, Trash2, Edit } from 'lucide-react'
import userService from '../../services/userService'
import LoadingSpinner from '../../components/LoadingSpinner'
import UserModal from '../../components/users/UserModal'
import StatsCard from '../../components/common/StatsCard'
import toast from 'react-hot-toast'

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const queryClient = useQueryClient()

  // Fetch Users
  const { data: usersResponse, isLoading } = useQuery(
    ['users-list'],
    userService.getAll,
    {
      refetchOnWindowFocus: false
    }
  )

  const users = Array.isArray(usersResponse) ? usersResponse : (usersResponse?.data?.users || usersResponse?.users || [])

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => userService.delete(id),
    {
      onSuccess: () => {
        toast.success('User berhasil dihapus')
        queryClient.invalidateQueries(['users-list'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal menghapus user')
      }
    }
  )

  // Filter Users
  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) || 
                         (filterStatus === 'inactive' && !user.is_active)
    return matchesSearch && matchesRole && matchesStatus
  }) || []

  // Statistics
  const totalUsers = users?.length || 0
  const activeUsers = users?.filter(u => u.is_active).length || 0
  const adminUsers = users?.filter(u => u.role === 'admin').length || 0
  const technicianUsers = users?.filter(u => u.role === 'technician').length || 0

  const handleCreate = () => {
    setSelectedUser(null)
    setIsModalOpen(true)
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleDelete = (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus user "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedUser(null)
  }

  const handleSuccess = () => {
    queryClient.invalidateQueries(['users-list'])
    handleModalClose()
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          icon={UserCheck}
          title="Total Users"
          value={totalUsers}
          iconColor="blue"
        />
        <StatsCard
          icon={UserCheck}
          title="Active Users"
          value={activeUsers}
          iconColor="green"
        />
        <StatsCard
          icon={UserCheck}
          title="Admins"
          value={adminUsers}
          iconColor="purple"
        />
        <StatsCard
          icon={UserCheck}
          title="Technicians"
          value={technicianUsers}
          iconColor="orange"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari user..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input-field"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="technician">Technician</option>
            <option value="customer_service">Customer Service</option>
          </select>
          <select
            className="input-field"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada user</h3>
            <p className="text-gray-500 mb-4">Mulai dengan menambahkan user pertama</p>
            <button onClick={handleCreate} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Tambah User
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.full_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-xs text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString('id-ID') : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.full_name)}
                          className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete User"
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
        )}
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <UserModal
          user={selectedUser}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}

export default UsersPage
