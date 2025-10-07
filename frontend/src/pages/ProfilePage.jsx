import React from 'react'
import { User, Settings } from 'lucide-react'

const ProfilePage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="card">
        <div className="card-body text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Management</h3>
          <p className="text-gray-500">Profile settings and preferences coming soon.</p>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
