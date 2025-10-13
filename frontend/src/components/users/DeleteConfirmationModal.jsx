import React, { useState } from 'react'
import { X, AlertTriangle, Trash2, CheckCircle } from 'lucide-react'
import { useMutation } from 'react-query'
import userService from '../../services/userService'
import toast from 'react-hot-toast'

const DeleteConfirmationModal = ({ user, onClose, onSuccess }) => {
  const [confirmText, setConfirmText] = useState('')
  const [isPermanent, setIsPermanent] = useState(false)
  const isConfirmed = confirmText === user.username

  const mutation = useMutation(
    () => userService.delete(user.id),
    {
      onSuccess: () => {
        toast.success(`User "${user.full_name}" berhasil dihapus`)
        onSuccess()
        onClose()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal menghapus user')
      }
    }
  )

  const handleDelete = () => {
    if (!isConfirmed) {
      toast.error('Konfirmasi username tidak sesuai')
      return
    }
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">Confirm Deletion</h2>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={mutation.isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg font-medium text-blue-600">
                  {user.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="font-semibold text-gray-900">{user.full_name}</p>
                <p className="text-sm text-gray-600">@{user.username}</p>
              </div>
            </div>
            <div className="text-sm space-y-1">
              <p className="text-gray-600">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Role:</span> {user.role}
              </p>
              {user.phone && (
                <p className="text-gray-600">
                  <span className="font-medium">Phone:</span> {user.phone}
                </p>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Warning</h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>User akan di-soft delete (data masih bisa di-restore)</li>
                    <li>User tidak bisa login setelah dihapus</li>
                    <li>Data terkait seperti tickets & logs akan tetap ada</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-mono font-bold text-red-600">{user.username}</span> to confirm:
            </label>
            <input
              type="text"
              className={`form-input ${isConfirmed ? 'border-green-500 focus:ring-green-500' : 'border-red-300 focus:ring-red-500'}`}
              placeholder={user.username}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoFocus
              disabled={mutation.isLoading}
            />
            {isConfirmed && (
              <div className="mt-2 flex items-center text-sm text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Username confirmed
              </div>
            )}
          </div>

          {/* Delete Type Option */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPermanent}
                onChange={(e) => setIsPermanent(e.target.checked)}
                className="mr-2"
                disabled={mutation.isLoading}
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Permanent Delete (Hard Delete)
                </span>
                <p className="text-xs text-gray-600">
                  Data akan dihapus permanent dan tidak bisa di-restore. 
                  Hanya untuk kasus khusus!
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={mutation.isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className={`btn-danger ${!isConfirmed ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isConfirmed || mutation.isLoading}
          >
            {mutation.isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </span>
            ) : (
              <span className="flex items-center">
                <Trash2 className="h-4 w-4 mr-2" />
                {isPermanent ? 'Permanent Delete' : 'Delete User'}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmationModal

