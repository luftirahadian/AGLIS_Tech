import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Package, Plus, Search, Trash2, Edit, AlertTriangle } from 'lucide-react'
import inventoryService from '../../services/inventoryService'
import LoadingSpinner from '../../components/LoadingSpinner'
import InventoryModal from '../../components/inventory/InventoryModal'
import KPICard from '../../components/dashboard/KPICard'
import toast from 'react-hot-toast'

const InventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const queryClient = useQueryClient()

  // Fetch Inventory Items
  const { data: itemsResponse, isLoading } = useQuery(
    ['inventory-items'],
    inventoryService.getAll,
    {
      refetchOnWindowFocus: false
    }
  )

  const items = Array.isArray(itemsResponse) ? itemsResponse : (itemsResponse?.data?.items || itemsResponse?.items || [])

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => inventoryService.delete(id),
    {
      onSuccess: () => {
        toast.success('Item berhasil dihapus')
        queryClient.invalidateQueries(['inventory-items'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal menghapus item')
      }
    }
  )

  // Filter Items
  const filteredItems = items?.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.item_code?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'low' && item.current_stock <= item.minimum_stock) ||
                         (filterStatus === 'available' && item.current_stock > item.minimum_stock)
    return matchesSearch && matchesCategory && matchesStatus
  }) || []

  // Statistics
  const totalItems = items?.length || 0
  const activeItems = items?.filter(i => i.is_active).length || 0
  const lowStockItems = items?.filter(i => i.current_stock <= i.minimum_stock).length || 0
  const totalValue = items?.reduce((sum, i) => sum + (i.current_stock * (i.unit_price || 0)), 0) || 0
  
  // Categories
  const categories = [...new Set(items?.map(i => i.category).filter(Boolean) || [])]

  const handleCreate = () => {
    setSelectedItem(null)
    setIsModalOpen(true)
  }

  const handleEdit = (item) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleDelete = (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus item "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  const handleSuccess = () => {
    queryClient.invalidateQueries(['inventory-items'])
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
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Kelola stok barang dan peralatan</p>
        </div>
        <button 
          onClick={handleCreate}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Item
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          icon={Package}
          title="Total Items"
          value={totalItems}
          color="blue"
        />
        <KPICard
          icon={Package}
          title="Active Items"
          value={activeItems}
          color="green"
        />
        <KPICard
          icon={AlertTriangle}
          title="Low Stock"
          value={lowStockItems}
          color="red"
        />
        <KPICard
          icon={Package}
          title="Total Value"
          value={`Rp ${totalValue.toLocaleString('id-ID')}`}
          color="purple"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari item..."
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
            <option value="available">Available</option>
            <option value="low">Low Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada item</h3>
            <p className="text-gray-500 mb-4">Mulai dengan menambahkan item pertama</p>
            <button onClick={handleCreate} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Item
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
                    Nama Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
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
                {filteredItems.map((item) => {
                  const isLowStock = item.current_stock <= item.minimum_stock
                  
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.item_code}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500">{item.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.category || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.current_stock} {item.unit}
                          {isLowStock && (
                            <span className="ml-2 text-xs text-red-600">
                              (Min: {item.minimum_stock})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.unit_price ? `Rp ${parseInt(item.unit_price).toLocaleString('id-ID')}` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.location || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isLowStock ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Available
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit Item"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inventory Modal */}
      {isModalOpen && (
        <InventoryModal
          item={selectedItem}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}

export default InventoryPage
