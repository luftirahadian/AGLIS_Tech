import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from 'react-query'
import { X } from 'lucide-react'
import inventoryService from '../../services/inventoryService'
import toast from 'react-hot-toast'

const InventoryModal = ({ item, onClose, onSuccess }) => {
  const isEdit = !!item
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: item || {
      item_code: '',
      name: '',
      category: '',
      description: '',
      unit: 'pcs',
      unit_price: '',
      minimum_stock: 10,
      current_stock: 0,
      location: '',
      supplier: '',
      is_active: true
    }
  })

  useEffect(() => {
    if (item) {
      reset(item)
    }
  }, [item, reset])

  const mutation = useMutation(
    (data) => isEdit ? inventoryService.update(item.id, data) : inventoryService.create(data),
    {
      onSuccess: () => {
        toast.success(isEdit ? 'Item berhasil diupdate' : 'Item berhasil ditambahkan')
        onSuccess()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Terjadi kesalahan')
      }
    }
  )

  const onSubmit = (data) => {
    // Convert is_active string to boolean if needed
    const submitData = {
      ...data,
      is_active: data.is_active === 'true' || data.is_active === true,
      unit_price: parseFloat(data.unit_price) || 0,
      minimum_stock: parseInt(data.minimum_stock) || 0,
      current_stock: parseInt(data.current_stock) || 0
    }
    mutation.mutate(submitData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Item' : 'Tambah Item Baru'}
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
                    Kode Item <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="INV-001"
                    {...register('item_code', { 
                      required: 'Kode item wajib diisi',
                      minLength: { value: 3, message: 'Kode minimal 3 karakter' }
                    })}
                  />
                  {errors.item_code && (
                    <p className="mt-1 text-sm text-red-600">{errors.item_code.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Item <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Nama item"
                    {...register('name', { 
                      required: 'Nama item wajib diisi'
                    })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Category and Unit */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Kategori & Satuan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input-field"
                    {...register('category', { required: 'Kategori wajib dipilih' })}
                  >
                    <option value="">Pilih Kategori</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Cable">Cable</option>
                    <option value="Network Equipment">Network Equipment</option>
                    <option value="Tools">Tools</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Consumables">Consumables</option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Satuan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="pcs, meter, box"
                    {...register('unit', { required: 'Satuan wajib diisi' })}
                  />
                  {errors.unit && (
                    <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0"
                    step="0.01"
                    {...register('unit_price')}
                  />
                </div>
              </div>
            </div>

            {/* Stock Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Informasi Stok</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stok Minimal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min="0"
                    {...register('minimum_stock', { 
                      required: 'Stok minimal wajib diisi',
                      min: { value: 0, message: 'Tidak boleh negatif' }
                    })}
                  />
                  {errors.minimum_stock && (
                    <p className="mt-1 text-sm text-red-600">{errors.minimum_stock.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stok Saat Ini
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min="0"
                    {...register('current_stock', { 
                      min: { value: 0, message: 'Tidak boleh negatif' }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Location and Supplier */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Lokasi & Supplier</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lokasi
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Gudang A, Rak 1"
                    {...register('location')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Nama supplier"
                    {...register('supplier')}
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
                placeholder="Deskripsi item"
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
              {isSubmitting ? 'Menyimpan...' : (isEdit ? 'Update Item' : 'Tambah Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InventoryModal

