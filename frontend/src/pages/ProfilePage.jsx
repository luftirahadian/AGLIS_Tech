import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { User, Mail, Phone, Shield, Lock, Eye, EyeOff, Save, KeyRound } from 'lucide-react'
import { authService } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const { user: currentUser, setUser } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Fetch profile data
  const { data: profileData, isLoading } = useQuery('profile', authService.getProfile, {
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to load profile')
    }
  })

  // Profile form
  const { register: registerProfile, handleSubmit: handleSubmitProfile, formState: { errors: profileErrors }, reset: resetProfile } = useForm({
    defaultValues: {
      full_name: '',
      email: '',
      phone: ''
    }
  })

  // Password form
  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: passwordErrors }, reset: resetPassword, watch } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  // Update form when profile data loads
  useEffect(() => {
    if (profileData?.data?.user) {
      const user = profileData.data.user
      resetProfile({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || ''
      })
    }
  }, [profileData, resetProfile])

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (data) => authService.updateProfile(data),
    {
      onSuccess: (response) => {
        toast.success('Profile updated successfully!')
        queryClient.invalidateQueries('profile')
        // Update user in context
        if (response.data?.user) {
          setUser({ ...currentUser, ...response.data.user })
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile')
      }
    }
  )

  // Change password mutation
  const changePasswordMutation = useMutation(
    (data) => authService.changePassword(data),
    {
      onSuccess: () => {
        toast.success('Password changed successfully!')
        resetPassword()
        setShowCurrentPassword(false)
        setShowNewPassword(false)
        setShowConfirmPassword(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to change password')
      }
    }
  )

  const onSubmitProfile = (data) => {
    updateProfileMutation.mutate(data)
  }

  const onSubmitPassword = (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New password and confirmation do not match')
      return
    }

    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  const user = profileData?.data?.user

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-6">
            <h2 className="text-2xl font-bold text-gray-900">{user?.full_name}</h2>
            <p className="text-gray-600">@{user?.username}</p>
            <div className="mt-2">
              <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full border ${
                user?.role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                user?.role === 'supervisor' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                user?.role === 'technician' ? 'bg-green-100 text-green-800 border-green-200' :
                'bg-yellow-100 text-yellow-800 border-yellow-200'
              }`}>
                {user?.role === 'admin' ? 'Admin' :
                 user?.role === 'supervisor' ? 'Supervisor' :
                 user?.role === 'technician' ? 'Technician' :
                 'Customer Service'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Edit Profile
            </div>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'password'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <KeyRound className="h-5 w-5 mr-2" />
              Change Password
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="max-w-3xl">
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              <p className="text-sm text-gray-600 mt-1">Update your personal details and contact information</p>
            </div>

            <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="p-6 space-y-6">
              {/* Full Name */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    Full Name <span className="text-red-500 ml-1">*</span>
                  </div>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter your full name"
                  {...registerProfile('full_name', { 
                    required: 'Full name is required'
                  })}
                />
                {profileErrors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{profileErrors.full_name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    Email Address <span className="text-red-500 ml-1">*</span>
                  </div>
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="email@example.com"
                  {...registerProfile('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email format'
                    }
                  })}
                />
                {profileErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    Phone Number
                  </div>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="08123456789"
                  {...registerProfile('phone')}
                />
              </div>

              {/* Username (Read-only) */}
              <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-blue-600" />
                    Username (Cannot be changed)
                  </div>
                </label>
                <input
                  type="text"
                  className="input-field bg-gray-100 cursor-not-allowed"
                  value={user?.username || ''}
                  disabled
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isLoading}
                  className="btn-primary"
                >
                  {updateProfileMutation.isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-blue-600" />
                Change Password
              </h3>
              <p className="text-sm text-gray-600 mt-1">Update your password to keep your account secure</p>
            </div>

            <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="p-6 space-y-6">
              {/* Current Password */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="Enter current password"
                    {...registerPassword('currentPassword', { 
                      required: 'Current password is required'
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              {/* New Password */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="Enter new password (min 6 characters)"
                    {...registerPassword('newPassword', { 
                      required: 'New password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="Re-enter new password"
                    {...registerPassword('confirmPassword', { 
                      required: 'Please confirm your password',
                      validate: value => value === watch('newPassword') || 'Passwords do not match'
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Lock className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Password Security Tips:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Use at least 6 characters</li>
                      <li>Include uppercase and lowercase letters</li>
                      <li>Add numbers and special characters</li>
                      <li>Don't reuse old passwords</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={changePasswordMutation.isLoading}
                  className="btn-primary bg-green-600 hover:bg-green-700"
                >
                  {changePasswordMutation.isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Changing Password...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <KeyRound className="h-4 w-4 mr-2" />
                      Change Password
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfilePage
