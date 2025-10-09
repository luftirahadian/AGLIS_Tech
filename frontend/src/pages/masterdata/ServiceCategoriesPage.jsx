import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Tag, Plus, Search, Trash2, Edit } from 'lucide-react'
import serviceCategoryService from '../../services/serviceCategoryService'
import serviceTypeService from '../../services/serviceTypeService'
import LoadingSpinner from '../../components/LoadingSpinner'
import ServiceCategoryModal from '../../components/masterdata/ServiceCategoryModal'
import StatsCard from '../../components/common/StatsCard'
import toast from 'react-hot-toast'

const ServiceCategoriesPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterServiceType, setFilterServiceType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const queryClient = useQueryClient()

  // Fetch service types for filter
  const { data: serviceTypes } = useQuery(
    'service-types',
    () => serviceTypeService.getAll(true),
    { refetchOnWindowFocus: false }
  )

  // Fetch service categories
  const { data: categories, isLoading } = useQuery(
    ['service-categories', filterServiceType],
    () => serviceCategoryService.getAll(filterServiceType === 'all' ? null : filterServiceType),
    {
      refetchOnWindowFocus: false
    }
  )

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => serviceCategoryService.delete(id),
    {
      onSuccess: () => {
        toast.success('Category berhasil dihapus')
        queryClient.invalidateQueries('service-categories')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal menghapus category')
      }
    }
  )

  // Filter categories
  const filteredCategories = categories?.filter(cat => {
    const matchesSearch = cat.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cat.category_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && cat.is_active) ||
                         (filterStatus === 'inactive' && !cat.is_active)
    return matchesSearch && matchesStatus
  }) || []

  // Statistics
  const totalCategories = categories?.length || 0
  const activeCategories = categories?.filter(c => c.is_active).length || 0
  const inactiveCategories = categories?.filter(c => !c.is_active).length || 0

  // Group by service type for display
  const groupedCategories = filteredCategories.reduce((acc, cat) => {
    if (!acc[cat.service_type_code]) {
      acc[cat.service_type_code] = {
        type_name: cat.service_type_name,
        categories: []
      }
    }
    acc[cat.service_type_code].categories.push(cat)
    return acc
  }, {})

  const handleCreate = () => {
    setSelectedCategory(null)
    setIsModalOpen(true)
  }

  const handleEdit = (category) => {
    setSelectedCategory(category)
    setIsModalOpen(true)
  }

  const handleDelete = (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus category "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedCategory(null)
  }

  const handleSuccess = () => {
    queryClient.invalidateQueries('service-categories')
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
          <h1 className="text-2xl font-bold text-gray-900">Service Categories Management</h1>
          <p className="text-gray-600">Kelola kategori layanan berdasarkan service type</p>
        </div>
        <button 
          onClick={handleCreate}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Category
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          icon={Tag}
          title="Total Categories"
          value={totalCategories}
          iconColor="blue"
        />
        <StatsCard
          icon={Tag}
          title="Active"
          value={activeCategories}
          iconColor="green"
        />
        <StatsCard
          icon={Tag}
          title="Inactive"
          value={inactiveCategories}
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
              placeholder="Cari category..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input-field"
            value={filterServiceType}
            onChange={(e) => setFilterServiceType(e.target.value)}
          >
            <option value="all">Semua Service Type</option>
            {serviceTypes?.map(type => (
              <option key={type.type_code} value={type.type_code}>
                {type.type_name}
              </option>
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

      {/* Service Categories List - Grouped by Service Type */}
      {Object.keys(groupedCategories).length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada category</h3>
          <p className="text-gray-500 mb-4">Mulai dengan menambahkan category pertama</p>
          <button onClick={handleCreate} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Category
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedCategories).map(([typeCode, data]) => (
            <div key={typeCode} className="bg-white shadow rounded-lg overflow-hidden">
              {/* Service Type Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{data.type_name}</h3>
              </div>

              {/* Categories Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SLA
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
                    {data.categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{category.display_order}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">{category.category_code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{category.category_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{category.description || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{category.estimated_duration} min</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">×{category.sla_multiplier}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(category)}
                              className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit Category"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id, category.category_name)}
                              className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete Category"
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
          ))}
        </div>
      )}

      {/* Service Category Modal */}
      {isModalOpen && (
        <ServiceCategoryModal
          category={selectedCategory}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}

export default ServiceCategoriesPage

