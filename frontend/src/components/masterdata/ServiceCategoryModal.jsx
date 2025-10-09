import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from 'react-query'
import { X } from 'lucide-react'
import serviceCategoryService from '../../services/serviceCategoryService'
import serviceTypeService from '../../services/serviceTypeService'
import toast from 'react-hot-toast'

const ServiceCategoryModal = ({ category, onClose, onSuccess }) => {
  const isEdit = !!category
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: category || {
      service_type_code: '',
      category_code: '',
      category_name: '',
      description: '',
      estimated_duration: 120,
      sla_multiplier: 1.0,
      requires_checklist: false,
      is_active: true,
      display_order: 0
    }
  })

  // Fetch service types for dropdown
  const { data: serviceTypes } = useQuery(
    'service-types',
    () => serviceTypeService.getAll(true),
    { refetchOnWindowFocus: false }
  )

  useEffect(() => {
    if (category) {
      reset(category)
    }
  }, [category, reset])

  const mutation = useMutation(
    (data) => isEdit ? serviceCategoryService.update(category.id, data) : serviceCategoryService.create(data),
    {
      onSuccess: () => {
        toast.success(isEdit ? 'Category berhasil diupdate' : 'Category berhasil ditambahkan')
        onSuccess()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Terjadi kesalahan')
      }
    }
  )

  const onSubmit = (data) => {
    mutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Service Category' : 'Tambah Service Category Baru'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-6">
            {/* Service Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type <span className="text-red-500">*</span>
              </label>
              <select
                className="input-field"
                {...register('service_type_code', { required: 'Service type wajib dipilih' })}
                disabled={isEdit}
              >
                <option value="">Pilih Service Type...</option>
                {serviceTypes?.map(type => (
                  <option key={type.type_code} value={type.type_code}>
                    {type.type_name}
                  </option>
                ))}
              </select>
              {errors.service_type_code && (
                <p className="mt-1 text-sm text-red-600">{errors.service_type_code.message}</p>
              )}
            </div>

            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Informasi Dasar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., fiber_installation"
                    {...register('category_code', { 
                      required: 'Category code wajib diisi',
                      pattern: {
                        value: /^[a-z_]+$/,
                        message: 'Gunakan lowercase dan underscore'
                      }
                    })}
                    disabled={isEdit}
                  />
                  {errors.category_code && (
                    <p className="mt-1 text-sm text-red-600">{errors.category_code.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Fiber Installation"
                    {...register('category_name', { 
                      required: 'Category name wajib diisi',
                      minLength: { value: 3, message: 'Minimal 3 karakter' }
                    })}
                  />
                  {errors.category_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.category_name.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="Deskripsi category"
                {...register('description')}
              />
            </div>

            {/* Configuration */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Konfigurasi</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min="1"
                    {...register('estimated_duration', { 
                      required: 'Duration wajib diisi',
                      min: { value: 1, message: 'Minimal 1 menit' },
                      valueAsNumber: true
                    })}
                  />
                  {errors.estimated_duration && (
                    <p className="mt-1 text-sm text-red-600">{errors.estimated_duration.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SLA Multiplier
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    step="0.1"
                    min="0.1"
                    max="10"
                    {...register('sla_multiplier', { 
                      min: { value: 0.1, message: 'Minimal 0.1' },
                      max: { value: 10, message: 'Maksimal 10' },
                      valueAsNumber: true
                    })}
                  />
                  <p className="mt-1 text-xs text-gray-500">Default: 1.0</p>
                  {errors.sla_multiplier && (
                    <p className="mt-1 text-sm text-red-600">{errors.sla_multiplier.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min="0"
                    {...register('display_order', { 
                      min: { value: 0, message: 'Minimal 0' },
                      valueAsNumber: true
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Status & Options */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  {...register('is_active')}
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
              <p className="text-xs text-gray-500 ml-6">Category aktif dan dapat digunakan</p>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  {...register('requires_checklist')}
                />
                <span className="text-sm font-medium text-gray-700">Requires Checklist</span>
              </label>
              <p className="text-xs text-gray-500 ml-6">Category memerlukan checklist khusus</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : (isEdit ? 'Update Category' : 'Tambah Category')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ServiceCategoryModal

