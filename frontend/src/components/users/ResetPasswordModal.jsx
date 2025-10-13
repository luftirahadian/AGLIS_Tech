import React, { useState } from 'react'
import { X, Key, Copy, Check } from 'lucide-react'
import { useMutation } from 'react-query'
import userService from '../../services/userService'
import toast from 'react-hot-toast'

const ResetPasswordModal = ({ user, onClose, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const mutation = useMutation(
    () => userService.resetPassword(user.id, newPassword),
    {
      onSuccess: (response) => {
        setGeneratedPassword(response.data.temporary_password)
        toast.success('Password berhasil direset!')
        onSuccess()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal reset password')
      }
    }
  )

  const generateRandomPassword = () => {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setNewPassword(password)
    setShowPassword(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    mutation.mutate()
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword)
    setCopied(true)
    toast.success('Password copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Key className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Reset Password</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {!generatedPassword ? (
          /* Reset Password Form */
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>User:</strong> {user.full_name} ({user.username})
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Email:</strong> {user.email}
                </p>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Generate Random Password
                </button>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Show password</span>
                </label>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Warning:</strong> User akan menggunakan password ini untuk login.
                Pastikan Anda menyimpan dan mengirimkan password ini ke user dengan aman.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={mutation.isLoading}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={mutation.isLoading}
              >
                {mutation.isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        ) : (
          /* Success Message with Password */
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Password Berhasil Direset!
              </h3>
              <p className="text-sm text-gray-600">
                Berikut adalah password sementara untuk user <strong>{user.username}</strong>
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  className="form-input font-mono"
                  value={generatedPassword}
                  readOnly
                />
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                📝 <strong>Important:</strong> Pastikan Anda menyalin dan menyimpan password ini.
                Kirimkan ke user melalui channel yang aman (email, WhatsApp, dll).
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full btn-primary"
            >
              Selesai
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordModal

