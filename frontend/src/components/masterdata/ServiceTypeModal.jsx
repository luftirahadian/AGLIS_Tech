import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from 'react-query'
import { X } from 'lucide-react'
import serviceTypeService from '../../services/serviceTypeService'
import toast from 'react-hot-toast'

const ServiceTypeModal = ({ serviceType, onClose, onSuccess }) => {
  const isEdit = !!serviceType
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: serviceType || {
      type_code: '',
      type_name: '',
      description: '',
      icon: '',
      default_duration: 120,
      is_active: true,
      display_order: 0
    }
  })

  useEffect(() => {
    if (serviceType) {
      reset(serviceType)
    }
  }, [serviceType, reset])

  const mutation = useMutation(
    (data) => isEdit ? serviceTypeService.update(serviceType.id, data) : serviceTypeService.create(data),
    {
      onSuccess: () => {
        toast.success(isEdit ? 'Service type berhasil diupdate' : 'Service type berhasil ditambahkan')
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
            {isEdit ? 'Edit Service Type' : 'Tambah Service Type Baru'}
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
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Informasi Dasar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., installation, repair"
                    {...register('type_code', { 
                      required: 'Type code wajib diisi',
                      pattern: {
                        value: /^[a-z_]+$/,
                        message: 'Gunakan lowercase dan underscore'
                      }
                    })}
                    disabled={isEdit}
                  />
                  {errors.type_code && (
                    <p className="mt-1 text-sm text-red-600">{errors.type_code.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Installation, Repair"
                    {...register('type_name', { 
                      required: 'Type name wajib diisi',
                      minLength: { value: 3, message: 'Minimal 3 karakter' }
                    })}
                  />
                  {errors.type_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.type_name.message}</p>
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
                placeholder="Deskripsi service type"
                {...register('description')}
              />
            </div>

            {/* Configuration */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Konfigurasi</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., wrench, tool"
                    {...register('icon')}
                  />
                  <p className="mt-1 text-xs text-gray-500">Lucide icon name</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min="1"
                    {...register('default_duration', { 
                      required: 'Duration wajib diisi',
                      min: { value: 1, message: 'Minimal 1 menit' },
                      valueAsNumber: true
                    })}
                  />
                  {errors.default_duration && (
                    <p className="mt-1 text-sm text-red-600">{errors.default_duration.message}</p>
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

            {/* Status */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  {...register('is_active')}
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">Service type aktif dan dapat digunakan</p>
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
              {isSubmitting ? 'Menyimpan...' : (isEdit ? 'Update Service Type' : 'Tambah Service Type')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ServiceTypeModal

