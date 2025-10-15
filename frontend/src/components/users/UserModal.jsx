import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from 'react-query'
import { X, User, Mail, Phone, Shield, Lock, UserPlus, Edit3, CheckCircle, Info } from 'lucide-react'
import userService from '../../services/userService'
import permissionService from '../../services/permissionService'
import toast from 'react-hot-toast'

const UserModal = ({ user, onClose, onSuccess }) => {
  const isEdit = !!user
  const [showPermissionPreview, setShowPermissionPreview] = useState(false)
  
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

  // Watch selected role for permission preview
  const selectedRole = watch('role')

  // Fetch permissions for selected role
  const { data: permissionsData } = useQuery(
    ['rolePermissions', selectedRole],
    () => permissionService.getRolePermissions(selectedRole),
    {
      enabled: !!selectedRole && selectedRole !== 'admin' && !isEdit,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  )

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
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-full ${isEdit ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} flex items-center justify-center text-white shadow-lg`}>
              {isEdit ? <Edit3 className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEdit ? 'Edit User' : 'Tambah User Baru'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEdit ? 'Perbarui informasi user' : 'Lengkapi form untuk membuat user baru'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Informasi Dasar
              </h3>
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
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-blue-600" />
                Informasi Kontak
              </h3>
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
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                Role & Akses
              </h3>
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
                <option value="manager">Manager</option>
                <option value="noc">NOC</option>
                <option value="technician">Technician</option>
                <option value="customer_service">Customer Service</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}

              {/* Permission Preview */}
              {!isEdit && selectedRole && (
                <div className="mt-4">
                  {selectedRole === 'admin' ? (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Shield className="h-5 w-5 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-purple-900 mb-1">Admin Access</p>
                          <p className="text-sm text-purple-800">
                            Admin memiliki <strong>akses penuh</strong> ke semua fitur sistem (100% permissions).
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : permissionsData?.data?.permissions ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start flex-1">
                          <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900 mb-1">
                              {selectedRole === 'supervisor' ? 'Supervisor' :
                               selectedRole === 'technician' ? 'Technician' :
                               'Customer Service'} Permissions
                            </p>
                            <p className="text-sm text-blue-800 mb-2">
                              User akan mendapat <strong>{permissionsData.data.permissions.length} permissions</strong>
                            </p>
                            {!showPermissionPreview && (
                              <button
                                type="button"
                                onClick={() => setShowPermissionPreview(true)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                              >
                                Lihat detail permissions →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {showPermissionPreview && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                            {permissionsData.data.permissions.map((perm, index) => (
                              <div key={index} className="flex items-center text-sm text-blue-800">
                                <CheckCircle className="h-3 w-3 text-green-600 mr-2 flex-shrink-0" />
                                <span>{perm.description || perm.name}</span>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPermissionPreview(false)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline mt-2"
                          >
                            ← Sembunyikan detail
                          </button>
                        </div>
                      )}
                    </div>
                  ) : selectedRole && (
                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                      <div className="flex items-center">
                        <Info className="h-5 w-5 text-gray-500 mr-2" />
                        <p className="text-sm text-gray-600">Loading permissions...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Permission Management Link */}
              {!isEdit && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500">
                    💡 Untuk mengatur permissions lebih detail, kunjungi{' '}
                    <a 
                      href="/permissions" 
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800 font-medium underline"
                    >
                      Permission Management
                    </a>
                  </p>
                </div>
              )}
            </div>

            {/* Password (only for new user or if changing) */}
            {!isEdit && (
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-blue-600" />
                  Password
                </h3>
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Lock className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Catatan Password</p>
                    <p className="text-sm text-blue-800">
                      Untuk mengubah password, gunakan fitur "Reset Password" di tabel user atau menu "Change Password" di halaman profil.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Status Akun <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-6">
                <label className="flex items-center cursor-pointer p-3 bg-white border-2 border-gray-300 rounded-lg hover:border-green-400 transition-all">
                  <input
                    type="radio"
                    value="true"
                    {...register('is_active')}
                    className="mr-3 w-4 h-4 text-green-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
                <label className="flex items-center cursor-pointer p-3 bg-white border-2 border-gray-300 rounded-lg hover:border-red-400 transition-all">
                  <input
                    type="radio"
                    value="false"
                    {...register('is_active')}
                    className="mr-3 w-4 h-4 text-red-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Inactive</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t-2 border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
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
              className={`btn-primary ${isEdit ? 'bg-green-600 hover:bg-green-700' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </span>
              ) : (
                <span className="flex items-center">
                  {isEdit ? <Edit3 className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  {isEdit ? 'Update User' : 'Tambah User'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserModal

