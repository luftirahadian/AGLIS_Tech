import React from 'react'
import { Ticket, Plus } from 'lucide-react'

const TicketsPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600">Manage service requests and work orders</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </button>
      </div>

      {/* Content */}
      <div className="card">
        <div className="card-body text-center py-12">
          <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tickets Management</h3>
          <p className="text-gray-500">
            This page will show all tickets with filtering, sorting, and management capabilities.
          </p>
        </div>
      </div>
    </div>
  )
}

export default TicketsPage
