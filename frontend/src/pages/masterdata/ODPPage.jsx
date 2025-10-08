import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { MapPin, Plus, Search, Trash2, Edit } from 'lucide-react'
import odpService from '../../services/odpService'
import LoadingSpinner from '../../components/LoadingSpinner'
import ODPModal from '../../components/masterdata/ODPModal'
import StatsCard from '../../components/common/StatsCard'
import toast from 'react-hot-toast'

const ODPPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedODP, setSelectedODP] = useState(null)
  const queryClient = useQueryClient()

  // Fetch ODPs
  const { data: odpsResponse, isLoading } = useQuery(
    'odps',
    odpService.getAll,
    {
      refetchOnWindowFocus: false
    }
  )

  const odps = Array.isArray(odpsResponse) ? odpsResponse : (odpsResponse?.data || [])

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => odpService.delete(id),
    {
      onSuccess: () => {
        toast.success('ODP berhasil dihapus')
        queryClient.invalidateQueries('odps')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal menghapus ODP')
      }
    }
  )

  // Filter ODPs
  const filteredODPs = odps?.filter(odp => {
    const matchesSearch = odp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         odp.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         odp.area?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || odp.status === filterStatus
    return matchesSearch && matchesStatus
  }) || []

  // Statistics
  const totalODPs = odps.length
  const activeODPs = odps.filter(o => o.status === 'active').length
  const fullODPs = odps.filter(o => o.status === 'full').length
  const maintenanceODPs = odps.filter(o => o.status === 'maintenance').length

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
    handleModalClose()
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={MapPin}
          title="Total ODP"
          value={totalODPs}
          iconColor="blue"
        />
        <StatsCard
          icon={MapPin}
          title="Active"
          value={activeODPs}
          iconColor="green"
        />
        <StatsCard
          icon={MapPin}
          title="Full"
          value={fullODPs}
          iconColor="red"
        />
        <StatsCard
          icon={MapPin}
          title="Maintenance"
          value={maintenanceODPs}
          iconColor="yellow"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari ODP..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input-field"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="active">Active</option>
            <option value="full">Full</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* ODP List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredODPs.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada ODP</h3>
            <p className="text-gray-500 mb-4">Mulai dengan menambahkan ODP pertama</p>
            <button onClick={handleCreate} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Tambah ODP
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama ODP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lokasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kapasitas
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
                {filteredODPs.map((odp) => (
                  <tr key={odp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{odp.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{odp.location}</div>
                      {odp.latitude && odp.longitude && (
                        <div className="text-xs text-gray-500">
                          {odp.latitude}, {odp.longitude}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{odp.area || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {odp.used_ports || 0} / {odp.total_ports || 0} ports
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            ((odp.used_ports / odp.total_ports) * 100) >= 90 ? 'bg-red-600' :
                            ((odp.used_ports / odp.total_ports) * 100) >= 70 ? 'bg-yellow-600' :
                            'bg-green-600'
                          }`}
                          style={{ width: `${(odp.used_ports / odp.total_ports) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        odp.status === 'active' ? 'bg-green-100 text-green-800' :
                        odp.status === 'full' ? 'bg-red-100 text-red-800' :
                        odp.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {odp.status?.charAt(0).toUpperCase() + odp.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
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
        )}
      </div>

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

