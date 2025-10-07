import React from 'react'
import { useParams } from 'react-router-dom'
import { Users } from 'lucide-react'

const CustomerDetailPage = () => {
  const { id } = useParams()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
        <p className="text-gray-600">Customer ID: {id}</p>
      </div>

      <div className="card">
        <div className="card-body text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Detail View</h3>
          <p className="text-gray-500">Customer information and service history.</p>
        </div>
      </div>
    </div>
  )
}

export default CustomerDetailPage
