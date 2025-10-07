import React from 'react'
import { useParams } from 'react-router-dom'
import { Ticket } from 'lucide-react'

const TicketDetailPage = () => {
  const { id } = useParams()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ticket Details</h1>
        <p className="text-gray-600">Ticket ID: {id}</p>
      </div>

      {/* Content */}
      <div className="card">
        <div className="card-body text-center py-12">
          <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket Detail View</h3>
          <p className="text-gray-500">
            This page will show detailed ticket information, status updates, and actions.
          </p>
        </div>
      </div>
    </div>
  )
}

export default TicketDetailPage
