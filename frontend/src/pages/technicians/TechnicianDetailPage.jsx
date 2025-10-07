import React from 'react'
import { useParams } from 'react-router-dom'
import { Wrench } from 'lucide-react'

const TechnicianDetailPage = () => {
  const { id } = useParams()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Technician Details</h1>
        <p className="text-gray-600">Technician ID: {id}</p>
      </div>

      <div className="card">
        <div className="card-body text-center py-12">
          <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Technician Detail View</h3>
          <p className="text-gray-500">Technician profile and performance metrics.</p>
        </div>
      </div>
    </div>
  )
}

export default TechnicianDetailPage
