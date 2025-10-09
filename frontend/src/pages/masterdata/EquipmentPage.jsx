import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Package, Plus, Search, Trash2, Edit } from 'lucide-react'
import equipmentService from '../../services/equipmentService'
import LoadingSpinner from '../../components/LoadingSpinner'
import EquipmentModal from '../../components/masterdata/EquipmentModal'
import StatsCard from '../../components/common/StatsCard'
import toast from 'react-hot-toast'

const EquipmentPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const queryClient = useQueryClient()

  // Fetch Equipment
  const { data: equipmentResponse, isLoading, error } = useQuery(
    ['equipment-list'],
    equipmentService.getAll,
    {
      refetchOnWindowFocus: false,
      onError: (err) => {
        console.error('Equipment query error:', err);
      }
    }
  )

  const equipment = Array.isArray(equipmentResponse) ? equipmentResponse : (equipmentResponse?.data || [])

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => equipmentService.delete(id),
    {
      onSuccess: () => {
        toast.success('Equipment berhasil dihapus')
        queryClient.invalidateQueries(['equipment-list'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal menghapus equipment')
      }
    }
  )

  // Filter Equipment
  const filteredEquipment = equipment?.filter(eq => {
    const matchesSearch = eq.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.equipment_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || eq.category === filterCategory
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' && eq.is_active) || (filterStatus === 'inactive' && !eq.is_active)
    return matchesSearch && matchesCategory && matchesStatus
  }) || []

  // Statistics
  const totalEquipment = equipment.length
  const activeEquipment = equipment.filter(e => e.is_active).length
  const inactiveEquipment = equipment.filter(e => !e.is_active).length
  
  // Categories
  const categories = [...new Set(equipment.map(e => e.category).filter(Boolean))]

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          icon={Package}
          title="Total Equipment"
          value={totalEquipment}
          iconColor="blue"
        />
        <StatsCard
          icon={Package}
          title="Active"
          value={activeEquipment}
          iconColor="green"
        />
        <StatsCard
          icon={Package}
          title="Inactive"
          value={inactiveEquipment}
          iconColor="red"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari equipment..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input-field"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">Semua Kategori</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
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

      {/* Equipment List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredEquipment.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada equipment</h3>
            <p className="text-gray-500 mb-4">Mulai dengan menambahkan equipment pertama</p>
            <button onClick={handleCreate} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Equipment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
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
                {filteredEquipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{eq.equipment_code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{eq.equipment_name}</div>
                      {eq.description && (
                        <div className="text-xs text-gray-500">{eq.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{eq.category || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{eq.unit || 'pcs'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        eq.is_active ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {eq.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
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
        )}
      </div>

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

