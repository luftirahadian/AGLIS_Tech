import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from 'react-query'
import { X } from 'lucide-react'
import userService from '../../services/userService'
import toast from 'react-hot-toast'

const UserModal = ({ user, onClose, onSuccess }) => {
  const isEdit = !!user
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm({
    defaultValues: user || {
      username: '',
      email: '',
      full_name: '',
      phone: '',
      role: 'customer_service',
      password: '',
      confirm_password: '',
      is_active: true
    }
  })

  useEffect(() => {
    if (user) {
      reset(user)
    }
  }, [user, reset])

  const mutation = useMutation(
    (data) => isEdit ? userService.update(user.id, data) : userService.create(data),
    {
      onSuccess: () => {
        toast.success(isEdit ? 'User berhasil diupdate' : 'User berhasil ditambahkan')
        onSuccess()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Terjadi kesalahan')
      }
    }
  )

  const onSubmit = (data) => {
    // Validate password match for new user
    if (!isEdit && data.password !== data.confirm_password) {
      toast.error('Password tidak cocok')
      return
    }

    const submitData = {
      ...data,
      is_active: data.is_active === 'true' || data.is_active === true
    }
    
    // Remove confirm_password before submit
    delete submitData.confirm_password
    
    // Remove password if empty (for edit mode)
    if (isEdit && !submitData.password) {
      delete submitData.password
    }

    mutation.mutate(submitData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit User' : 'Tambah User Baru'}
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
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="username"
                    disabled={isEdit}
                    {...register('username', { 
                      required: 'Username wajib diisi',
                      minLength: { value: 3, message: 'Username minimal 3 karakter' },
                      pattern: {
                        value: /^[a-zA-Z0-9_]+$/,
                        message: 'Username hanya boleh huruf, angka, dan underscore'
                      }
                    })}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Nama lengkap"
                    {...register('full_name', { 
                      required: 'Nama lengkap wajib diisi'
                    })}
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Informasi Kontak</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="email@example.com"
                    {...register('email', { 
                      required: 'Email wajib diisi',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Format email tidak valid'
                      }
                    })}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="08123456789"
                    {...register('phone')}
                  />
                </div>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                className="input-field"
                {...register('role', { required: 'Role wajib dipilih' })}
              >
                <option value="">Pilih Role</option>
                <option value="admin">Admin</option>
                <option value="supervisor">Supervisor</option>
                <option value="technician">Technician</option>
                <option value="customer_service">Customer Service</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Password (only for new user or if changing) */}
            {!isEdit && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Password"
                      {...register('password', { 
                        required: !isEdit ? 'Password wajib diisi' : false,
                        minLength: { value: 6, message: 'Password minimal 6 karakter' }
                      })}
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Confirm password"
                      {...register('confirm_password', { 
                        required: !isEdit ? 'Konfirmasi password wajib diisi' : false
                      })}
                    />
                    {errors.confirm_password && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isEdit && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> Untuk mengubah password, gunakan fitur "Change Password" di halaman profil user.
                </p>
              </div>
            )}

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
              {isSubmitting ? 'Menyimpan...' : (isEdit ? 'Update User' : 'Tambah User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserModal

