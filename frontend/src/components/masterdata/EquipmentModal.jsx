import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from 'react-query'
import { X } from 'lucide-react'
import equipmentService from '../../services/equipmentService'
import toast from 'react-hot-toast'

const EquipmentModal = ({ equipment, onClose, onSuccess }) => {
  const isEdit = !!equipment
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: equipment || {
      equipment_code: '',
      equipment_name: '',
      category: '',
      description: '',
      unit: 'pcs',
      is_active: true
    }
  })

  useEffect(() => {
    if (equipment) {
      reset(equipment)
    }
  }, [equipment, reset])

  const mutation = useMutation(
    (data) => isEdit ? equipmentService.update(equipment.id, data) : equipmentService.create(data),
    {
      onSuccess: () => {
        toast.success(isEdit ? 'Equipment berhasil diupdate' : 'Equipment berhasil ditambahkan')
        onSuccess()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Terjadi kesalahan')
      }
    }
  )

  const onSubmit = (data) => {
    // Convert is_active string to boolean
    const submitData = {
      ...data,
      is_active: data.is_active === 'true' || data.is_active === true
    }
    mutation.mutate(submitData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Equipment' : 'Tambah Equipment Baru'}
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
                    Kode Equipment <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="EQ-001"
                    {...register('equipment_code', { 
                      required: 'Kode equipment wajib diisi',
                      minLength: { value: 3, message: 'Kode minimal 3 karakter' }
                    })}
                  />
                  {errors.equipment_code && (
                    <p className="mt-1 text-sm text-red-600">{errors.equipment_code.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Equipment <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Optical Fiber Cable"
                    {...register('equipment_name', { 
                      required: 'Nama equipment wajib diisi'
                    })}
                  />
                  {errors.equipment_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.equipment_name.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Detail Produk</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input-field"
                    {...register('category', { required: 'Kategori wajib dipilih' })}
                  >
                    <option value="">Pilih Kategori</option>
                    <option value="devices">Devices</option>
                    <option value="cables">Cables</option>
                    <option value="connectors">Connectors</option>
                    <option value="tools">Tools</option>
                    <option value="accessories">Accessories</option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="pcs, meter, roll"
                    {...register('unit')}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                className="input-field"
                rows="2"
                placeholder="Deskripsi singkat equipment"
                {...register('description')}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="true"
                    {...register('is_active')}
                    className="mr-2"
                  />
                  Active
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="false"
                    {...register('is_active')}
                    className="mr-2"
                  />
                  Inactive
                </label>
              </div>
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
              {isSubmitting ? 'Menyimpan...' : (isEdit ? 'Update Equipment' : 'Tambah Equipment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EquipmentModal

