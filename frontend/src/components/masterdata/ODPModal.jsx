import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from 'react-query'
import { X } from 'lucide-react'
import odpService from '../../services/odpService'
import toast from 'react-hot-toast'

const ODPModal = ({ odp, onClose, onSuccess }) => {
  const isEdit = !!odp
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: odp || {
      name: '',
      location: '',
      area: '',
      latitude: '',
      longitude: '',
      total_ports: 8,
      used_ports: 0,
      status: 'active',
      notes: ''
    }
  })

  useEffect(() => {
    if (odp) {
      reset(odp)
    }
  }, [odp, reset])

  const mutation = useMutation(
    (data) => isEdit ? odpService.update(odp.id, data) : odpService.create(data),
    {
      onSuccess: () => {
        toast.success(isEdit ? 'ODP berhasil diupdate' : 'ODP berhasil ditambahkan')
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
            {isEdit ? 'Edit ODP' : 'Tambah ODP Baru'}
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
                    Nama ODP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    {...register('name', { 
                      required: 'Nama ODP wajib diisi',
                      minLength: { value: 3, message: 'Nama minimal 3 karakter' }
                    })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Contoh: Area A, Zona 1"
                    {...register('area')}
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Informasi Lokasi</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lokasi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="input-field"
                    rows="2"
                    placeholder="Alamat lengkap lokasi ODP"
                    {...register('location', { required: 'Lokasi wajib diisi' })}
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="-6.200000"
                      {...register('latitude', {
                        pattern: {
                          value: /^-?\d+\.?\d*$/,
                          message: 'Format latitude tidak valid'
                        }
                      })}
                    />
                    {errors.latitude && (
                      <p className="mt-1 text-sm text-red-600">{errors.latitude.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="106.816666"
                      {...register('longitude', {
                        pattern: {
                          value: /^-?\d+\.?\d*$/,
                          message: 'Format longitude tidak valid'
                        }
                      })}
                    />
                    {errors.longitude && (
                      <p className="mt-1 text-sm text-red-600">{errors.longitude.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Capacity Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Informasi Kapasitas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Ports <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min="1"
                    {...register('total_ports', { 
                      required: 'Total ports wajib diisi',
                      min: { value: 1, message: 'Minimal 1 port' },
                      valueAsNumber: true
                    })}
                  />
                  {errors.total_ports && (
                    <p className="mt-1 text-sm text-red-600">{errors.total_ports.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Used Ports
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min="0"
                    {...register('used_ports', { 
                      min: { value: 0, message: 'Tidak boleh negatif' },
                      valueAsNumber: true
                    })}
                  />
                  {errors.used_ports && (
                    <p className="mt-1 text-sm text-red-600">{errors.used_ports.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                className="input-field"
                {...register('status', { required: 'Status wajib dipilih' })}
              >
                <option value="active">Active</option>
                <option value="full">Full</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan
              </label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="Catatan tambahan tentang ODP ini"
                {...register('notes')}
              />
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
              {isSubmitting ? 'Menyimpan...' : (isEdit ? 'Update ODP' : 'Tambah ODP')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ODPModal

