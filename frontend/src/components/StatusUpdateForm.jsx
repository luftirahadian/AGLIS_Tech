import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Clock, CheckCircle, XCircle, Pause, Play } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

const StatusUpdateForm = ({ ticket, onUpdate, isLoading }) => {
  const { user } = useAuth()
  const [selectedStatus, setSelectedStatus] = useState(ticket.status)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm()

  const statusOptions = [
    { 
      value: 'open', 
      label: 'Open', 
      icon: Clock, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Ticket is open and waiting for assignment'
    },
    { 
      value: 'assigned', 
      label: 'Assigned', 
      icon: Play, 
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Ticket has been assigned to a technician'
    },
    { 
      value: 'in_progress', 
      label: 'In Progress', 
      icon: Play, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Work is currently being performed'
    },
    { 
      value: 'completed', 
      label: 'Completed', 
      icon: CheckCircle, 
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Work has been completed successfully'
    },
    { 
      value: 'on_hold', 
      label: 'On Hold', 
      icon: Pause, 
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      description: 'Work is temporarily paused'
    },
    { 
      value: 'cancelled', 
      label: 'Cancelled', 
      icon: XCircle, 
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: 'Ticket has been cancelled'
    }
  ]

  // Filter available status transitions based on current status and user role
  const getAvailableStatuses = () => {
    const currentStatus = ticket.status
    const userRole = user?.role

    // Admin and supervisor can change to any status
    if (userRole === 'admin' || userRole === 'supervisor') {
      return statusOptions
    }

    // Technician can only update their assigned tickets
    if (userRole === 'technician') {
      const allowedTransitions = {
        'assigned': ['in_progress', 'on_hold'],
        'in_progress': ['completed', 'on_hold'],
        'on_hold': ['in_progress', 'completed']
      }
      
      const allowed = allowedTransitions[currentStatus] || []
      return statusOptions.filter(status => 
        status.value === currentStatus || allowed.includes(status.value)
      )
    }

    // Customer service can only update to basic statuses
    if (userRole === 'customer_service') {
      return statusOptions.filter(status => 
        ['open', 'assigned', 'on_hold', 'cancelled'].includes(status.value)
      )
    }

    return statusOptions.filter(status => status.value === currentStatus)
  }

  const availableStatuses = getAvailableStatuses()

  const onSubmit = async (data) => {
    const updateData = {
      status: selectedStatus,
      notes: data.notes,
      work_notes: data.work_notes,
      resolution_notes: data.resolution_notes,
      customer_rating: data.customer_rating,
      customer_feedback: data.customer_feedback
    }

    await onUpdate(updateData)
    reset()
  }

  const canUpdateStatus = availableStatuses.length > 1

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Status Selection */}
          {canUpdateStatus && (
            <div>
              <label className="form-label">New Status</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableStatuses.map((status) => {
                  const Icon = status.icon
                  const isSelected = selectedStatus === status.value
                  const isCurrent = ticket.status === status.value
                  
                  return (
                    <label
                      key={status.value}
                      className={`
                        relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors
                        ${isSelected 
                          ? `border-current ${status.color} ${status.bgColor}` 
                          : isCurrent
                          ? 'border-gray-400 bg-gray-50'
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                        }
                        ${isCurrent ? 'opacity-75' : ''}
                      `}
                    >
                      <input
                        type="radio"
                        value={status.value}
                        checked={selectedStatus === status.value}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="sr-only"
                        disabled={isCurrent}
                      />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Icon className={`h-5 w-5 mr-3 ${
                            isSelected ? status.color : 'text-gray-400'
                          }`} />
                          <div className="text-sm">
                            <div className={`font-medium ${
                              isSelected ? status.color : 'text-gray-900'
                            }`}>
                              {status.label}
                              {isCurrent && <span className="ml-2 text-xs">(Current)</span>}
                            </div>
                            <div className="text-gray-500">{status.description}</div>
                          </div>
                        </div>
                      </div>
                      {isSelected && !isCurrent && (
                        <div className={`flex-shrink-0 ${status.color}`}>
                          <CheckCircle className="h-5 w-5" />
                        </div>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Status Update Notes */}
          <div>
            <label className="form-label">Status Update Notes</label>
            <textarea
              rows={3}
              className="form-input"
              placeholder="Add notes about this status change..."
              {...register('notes')}
            />
          </div>

          {/* Work Notes (for technicians) */}
          {(user?.role === 'technician' || user?.role === 'admin') && (
            <div>
              <label className="form-label">Work Notes</label>
              <textarea
                rows={3}
                className="form-input"
                placeholder="Technical details about work performed..."
                {...register('work_notes')}
              />
            </div>
          )}

          {/* Resolution Notes (for completed status) */}
          {selectedStatus === 'completed' && (
            <div>
              <label className="form-label">Resolution Notes *</label>
              <textarea
                rows={3}
                className={`form-input ${errors.resolution_notes ? 'border-red-500' : ''}`}
                placeholder="Describe how the issue was resolved..."
                {...register('resolution_notes', {
                  required: selectedStatus === 'completed' ? 'Resolution notes are required when completing a ticket' : false
                })}
              />
              {errors.resolution_notes && (
                <p className="form-error">{errors.resolution_notes.message}</p>
              )}
            </div>
          )}

          {/* Customer Feedback (for completed status) */}
          {selectedStatus === 'completed' && user?.role !== 'technician' && (
            <div className="space-y-4">
              <div>
                <label className="form-label">Customer Rating</label>
                <select className="form-input" {...register('customer_rating')}>
                  <option value="">No rating</option>
                  <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                  <option value="4">⭐⭐⭐⭐ Good</option>
                  <option value="3">⭐⭐⭐ Average</option>
                  <option value="2">⭐⭐ Poor</option>
                  <option value="1">⭐ Very Poor</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Customer Feedback</label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="Customer comments about the service..."
                  {...register('customer_feedback')}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isLoading || (!canUpdateStatus && selectedStatus === ticket.status)}
              className="btn-primary"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StatusUpdateForm
