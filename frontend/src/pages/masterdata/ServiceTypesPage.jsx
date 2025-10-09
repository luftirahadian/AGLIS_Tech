import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Settings, Plus, Search, Trash2, Edit, AlertCircle } from 'lucide-react'
import serviceTypeService from '../../services/serviceTypeService'
import LoadingSpinner from '../../components/LoadingSpinner'
import ServiceTypeModal from '../../components/masterdata/ServiceTypeModal'
import StatsCard from '../../components/common/StatsCard'
import toast from 'react-hot-toast'

const ServiceTypesPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedServiceType, setSelectedServiceType] = useState(null)
  const queryClient = useQueryClient()

  // Fetch service types
  const { data: serviceTypes, isLoading } = useQuery(
    'service-types',
    () => serviceTypeService.getAll(),
    {
      refetchOnWindowFocus: false
    }
  )

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => serviceTypeService.delete(id),
    {
      onSuccess: () => {
        toast.success('Service type berhasil dihapus')
        queryClient.invalidateQueries('service-types')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal menghapus service type')
      }
    }
  )

  // Filter service types
  const filteredServiceTypes = serviceTypes?.filter(type => {
    const matchesSearch = type.type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         type.type_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         type.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && type.is_active) ||
                         (filterStatus === 'inactive' && !type.is_active)
    return matchesSearch && matchesStatus
  }) || []

  // Statistics
  const totalTypes = serviceTypes?.length || 0
  const activeTypes = serviceTypes?.filter(t => t.is_active).length || 0
  const inactiveTypes = serviceTypes?.filter(t => !t.is_active).length || 0

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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          icon={Settings}
          title="Total Types"
          value={totalTypes}
          iconColor="blue"
        />
        <StatsCard
          icon={Settings}
          title="Active"
          value={activeTypes}
          iconColor="green"
        />
        <StatsCard
          icon={AlertCircle}
          title="Inactive"
          value={inactiveTypes}
          iconColor="red"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari service type..."
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
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Service Types List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredServiceTypes.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada service type</h3>
            <p className="text-gray-500 mb-4">Mulai dengan menambahkan service type pertama</p>
            <button onClick={handleCreate} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Service Type
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
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
                {filteredServiceTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{type.display_order}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">{type.type_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{type.type_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{type.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{type.default_duration} min</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        type.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {type.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
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
        )}
      </div>

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

