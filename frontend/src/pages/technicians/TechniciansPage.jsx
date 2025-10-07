import React from 'react'
import { Wrench, Plus } from 'lucide-react'

const TechniciansPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Technicians</h1>
          <p className="text-gray-600">Manage technician profiles and assignments</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Technician
        </button>
      </div>

      <div className="card">
        <div className="card-body text-center py-12">
          <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Technician Management</h3>
          <p className="text-gray-500">Technician list and management features coming soon.</p>
        </div>
      </div>
    </div>
  )
}

export default TechniciansPage
