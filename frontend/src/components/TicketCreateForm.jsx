import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from 'react-query'
import { X, Upload, AlertCircle } from 'lucide-react'
import { customerService } from '../services/customerService'
import { ticketService } from '../services/ticketService'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'

const TicketCreateForm = ({ isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    defaultValues: {
      type: 'installation',
      priority: 'normal'
    }
  })

  // Get customers for dropdown
  const { data: customersData, isLoading: customersLoading } = useQuery(
    'customers',
    () => customerService.getCustomers({ limit: 100 }),
    { enabled: isOpen }
  )

  const selectedType = watch('type')

  const ticketTypes = [
    { value: 'installation', label: 'Installation', description: 'New service installation' },
    { value: 'repair', label: 'Repair', description: 'Fix existing service issues' },
    { value: 'maintenance', label: 'Maintenance', description: 'Scheduled maintenance' },
    { value: 'upgrade', label: 'Upgrade', description: 'Service upgrade or enhancement' }
  ]

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    { value: 'normal', label: 'Normal', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { value: 'high', label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { value: 'critical', label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-100' }
  ]

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const result = await ticketService.createTicket(data)
      toast.success('Ticket created successfully!')
      reset()
      onSuccess?.(result.data.ticket)
      onClose()
    } catch (error) {
      console.error('Create ticket error:', error)
      toast.error(error.response?.data?.message || 'Failed to create ticket')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Ticket</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="form-label">Customer *</label>
            <select
              className={`form-input ${errors.customer_id ? 'border-red-500' : ''}`}
              {...register('customer_id', { required: 'Customer is required' })}
              disabled={customersLoading}
            >
              <option value="">Select a customer...</option>
              {customersData?.data?.customers?.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customer_code} - {customer.full_name}
                </option>
              ))}
            </select>
            {errors.customer_id && (
              <p className="form-error">{errors.customer_id.message}</p>
            )}
            {customersLoading && (
              <p className="text-sm text-gray-500 mt-1">Loading customers...</p>
            )}
          </div>

          {/* Ticket Type */}
          <div>
            <label className="form-label">Service Type *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ticketTypes.map((type) => (
                <label
                  key={type.value}
                  className={`
                    relative flex cursor-pointer rounded-lg border p-4 focus:outline-none
                    ${selectedType === type.value 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    type="radio"
                    value={type.value}
                    className="sr-only"
                    {...register('type', { required: 'Service type is required' })}
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{type.label}</div>
                        <div className="text-gray-500">{type.description}</div>
                      </div>
                    </div>
                  </div>
                  {selectedType === type.value && (
                    <div className="flex-shrink-0 text-blue-600">
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              ))}
            </div>
            {errors.type && (
              <p className="form-error">{errors.type.message}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="form-label">Priority *</label>
            <div className="flex flex-wrap gap-2">
              {priorities.map((priority) => (
                <label
                  key={priority.value}
                  className={`
                    flex items-center px-3 py-2 rounded-lg border cursor-pointer transition-colors
                    ${watch('priority') === priority.value
                      ? `border-current ${priority.color} ${priority.bgColor}`
                      : 'border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    type="radio"
                    value={priority.value}
                    className="sr-only"
                    {...register('priority', { required: 'Priority is required' })}
                  />
                  <span className={`text-sm font-medium ${
                    watch('priority') === priority.value ? priority.color : 'text-gray-700'
                  }`}>
                    {priority.label}
                  </span>
                </label>
              ))}
            </div>
            {errors.priority && (
              <p className="form-error">{errors.priority.message}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="form-label">Title *</label>
            <input
              type="text"
              className={`form-input ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Brief description of the service request"
              {...register('title', { 
                required: 'Title is required',
                minLength: { value: 5, message: 'Title must be at least 5 characters' }
              })}
            />
            {errors.title && (
              <p className="form-error">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Description *</label>
            <textarea
              rows={4}
              className={`form-input ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Detailed description of the work to be performed..."
              {...register('description', { 
                required: 'Description is required',
                minLength: { value: 10, message: 'Description must be at least 10 characters' }
              })}
            />
            {errors.description && (
              <p className="form-error">{errors.description.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="form-label">Category</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Fiber Installation, WiFi Setup, Network Troubleshooting"
              {...register('category')}
            />
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="form-label">Scheduled Date</label>
            <input
              type="datetime-local"
              className="form-input"
              {...register('scheduled_date')}
            />
            <p className="text-sm text-gray-500 mt-1">
              Leave empty for immediate assignment
            </p>
          </div>

          {/* Estimated Duration */}
          <div>
            <label className="form-label">Estimated Duration (minutes)</label>
            <input
              type="number"
              min="15"
              step="15"
              className="form-input"
              placeholder="e.g., 120 for 2 hours"
              {...register('estimated_duration', {
                min: { value: 15, message: 'Minimum duration is 15 minutes' }
              })}
            />
            {errors.estimated_duration && (
              <p className="form-error">{errors.estimated_duration.message}</p>
            )}
          </div>

          {/* Equipment Needed */}
          <div>
            <label className="form-label">Equipment Needed</label>
            <textarea
              rows={2}
              className="form-input"
              placeholder="List required equipment, tools, or materials..."
              {...register('equipment_needed')}
            />
          </div>

          {/* SLA Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">SLA Information</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Service Level Agreement will be automatically set based on priority:
                  Critical (2h), High (4h), Normal (24h), Low (48h)
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || customersLoading}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create Ticket'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TicketCreateForm
