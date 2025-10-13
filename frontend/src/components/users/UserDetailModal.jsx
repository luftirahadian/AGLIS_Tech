import React from 'react'
import { X, User, Mail, Phone, Shield, Calendar, Clock, CheckCircle, XCircle, MailCheck } from 'lucide-react'

const UserDetailModal = ({ user, onClose }) => {
  if (!user) return null

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      supervisor: 'bg-blue-100 text-blue-800 border-blue-200',
      technician: 'bg-green-100 text-green-800 border-green-200',
      customer_service: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
    const labels = {
      admin: 'Admin',
      supervisor: 'Supervisor',
      technician: 'Technician',
      customer_service: 'Customer Service'
    }
    return (
      <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full border ${colors[role] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {labels[role] || role}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
              <p className="text-sm text-gray-600">@{user.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status & Role */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              {getRoleBadge(user.role)}
              {user.is_active ? (
                <span className="px-3 py-1 inline-flex items-center text-sm font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Active
                </span>
              ) : (
                <span className="px-3 py-1 inline-flex items-center text-sm font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                  <XCircle className="h-4 w-4 mr-1" />
                  Inactive
                </span>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 font-medium">Email</p>
                      {user.email_verified ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          <MailCheck className="h-3 w-3 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                          <Mail className="h-3 w-3 mr-1" />
                          Not Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 font-medium break-all mt-1">{user.email}</p>
                    {user.email_verified_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Verified: {formatDate(user.email_verified_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Phone</p>
                    <p className="text-sm text-gray-900 font-medium">{user.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Created At</p>
                    <p className="text-sm text-gray-900 font-medium">{formatDate(user.created_at)}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Last Login</p>
                    <p className="text-sm text-gray-900 font-medium">{formatDate(user.last_login)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info (if technician) */}
          {user.role === 'technician' && user.employee_id && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Technician Details</h3>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Employee ID</p>
                    <p className="text-sm text-gray-900 font-medium">{user.employee_id}</p>
                  </div>
                  {user.availability_status && (
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Availability</p>
                      <p className="text-sm text-gray-900 font-medium capitalize">{user.availability_status}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* User ID for reference */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              User ID: <span className="font-mono font-medium text-gray-700">{user.id}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserDetailModal

