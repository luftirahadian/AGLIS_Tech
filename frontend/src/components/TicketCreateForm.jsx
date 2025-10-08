import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from 'react-query'
import { X, Upload, AlertCircle, MapPin, Phone, Mail, Package, User } from 'lucide-react'
import { customerService } from '../services/customerService'
import { ticketService } from '../services/ticketService'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'

const TicketCreateForm = ({ isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
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
  const selectedCustomerId = watch('customer_id')

  // Auto-fill customer data when customer is selected
  useEffect(() => {
    if (selectedCustomerId && customersData?.data?.customers) {
      const customer = customersData.data.customers.find(c => c.id == selectedCustomerId)
      if (customer) {
        setSelectedCustomer(customer)
        // Auto-fill some fields based on customer data
        setValue('category', `${customer.service_type} - ${customer.package_name}`)
      }
    } else {
      setSelectedCustomer(null)
    }
  }, [selectedCustomerId, customersData, setValue])

  const getTicketTypes = () => {
    const baseTypes = [
      { value: 'installation', label: 'Installation', description: 'New service installation' },
      { value: 'repair', label: 'Repair', description: 'Fix existing service issues' },
      { value: 'maintenance', label: 'Maintenance', description: 'Scheduled maintenance' },
      { value: 'upgrade', label: 'Upgrade', description: 'Service upgrade or enhancement' }
    ]
    
    // Add service-specific types based on selected customer
    if (selectedCustomer) {
      switch (selectedCustomer.service_type) {
        case 'broadband':
          baseTypes.push(
            { value: 'wifi_setup', label: 'WiFi Setup', description: 'Configure wireless network' },
            { value: 'speed_test', label: 'Speed Test', description: 'Verify connection speed' }
          )
          break
        case 'dedicated':
          baseTypes.push(
            { value: 'bandwidth_upgrade', label: 'Bandwidth Upgrade', description: 'Increase dedicated bandwidth' },
            { value: 'redundancy_setup', label: 'Redundancy Setup', description: 'Setup backup connection' }
          )
          break
        case 'corporate':
          baseTypes.push(
            { value: 'network_config', label: 'Network Config', description: 'Configure corporate network' },
            { value: 'security_audit', label: 'Security Audit', description: 'Network security review' }
          )
          break
      }
    }
    
    return baseTypes
  }

  const getSuggestedEquipment = () => {
    if (!selectedCustomer || !selectedType) return []
    
    const equipmentMap = {
      installation: {
        broadband: ['Modem WiFi', 'Kabel UTP Cat6', 'Connector RJ45', 'Cable Tester', 'Crimping Tool'],
        dedicated: ['Router Enterprise', 'Fiber Optic Cable', 'SFP Module', 'Patch Panel', 'Network Switch'],
        corporate: ['Firewall', 'Managed Switch', 'Access Point', 'UPS', 'Rack Cabinet'],
        mitra: ['High-Performance Router', 'Load Balancer', 'Bandwidth Manager', 'Monitoring Tools']
      },
      repair: {
        broadband: ['Replacement Modem', 'Spare Cables', 'Signal Meter', 'Multimeter'],
        dedicated: ['Backup Router', 'Fiber Tester', 'Optical Power Meter', 'Cleaning Kit'],
        corporate: ['Diagnostic Tools', 'Replacement Components', 'Network Analyzer'],
        mitra: ['Backup Equipment', 'Performance Monitor', 'Troubleshooting Kit']
      },
      maintenance: {
        broadband: ['Cleaning Supplies', 'Cable Organizer', 'Signal Booster'],
        dedicated: ['Fiber Cleaning Kit', 'Performance Monitor', 'Backup Media'],
        corporate: ['System Update Tools', 'Security Scanner', 'Backup Solutions'],
        mitra: ['Maintenance Kit', 'Performance Optimizer', 'System Monitor']
      },
      upgrade: {
        broadband: ['Higher Speed Modem', 'Enhanced WiFi Router', 'Signal Amplifier'],
        dedicated: ['Higher Capacity Router', 'Additional Bandwidth', 'Redundancy Equipment'],
        corporate: ['Enterprise Equipment', 'Security Upgrades', 'Performance Enhancers'],
        mitra: ['Advanced Routing', 'Traffic Management', 'Quality Assurance Tools']
      },
      wifi_setup: ['WiFi Router', 'Range Extender', 'WiFi Analyzer', 'Security Configuration'],
      speed_test: ['Speed Test Device', 'Network Analyzer', 'Performance Monitor'],
      bandwidth_upgrade: ['Higher Capacity Equipment', 'Configuration Tools'],
      network_config: ['Configuration Tools', 'Network Documentation', 'Security Setup'],
      security_audit: ['Security Scanner', 'Vulnerability Assessment', 'Audit Tools']
    }
    
    return equipmentMap[selectedType]?.[selectedCustomer.service_type] || equipmentMap[selectedType] || []
  }

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
                  {customer.customer_id} - {customer.name} ({customer.service_type})
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

          {/* Selected Customer Information */}
          {selectedCustomer && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Customer Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                  {selectedCustomer.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                  )}
                  <div className="flex items-start text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                    <span className="text-xs">{selectedCustomer.address}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Package className="h-4 w-4 mr-2" />
                    <span>{selectedCustomer.package_name}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Service: {selectedCustomer.service_type}
                  </div>
                  <div className="text-xs text-gray-500">
                    Status: <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedCustomer.account_status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedCustomer.account_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ticket Type */}
          <div>
            <label className="form-label">Service Type *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getTicketTypes().map((type) => (
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
              rows={3}
              className="form-input"
              placeholder="List required equipment, tools, or materials..."
              {...register('equipment_needed')}
            />
            {selectedCustomer && selectedType && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-2">Suggested equipment for {selectedType}:</p>
                <div className="flex flex-wrap gap-1">
                  {getSuggestedEquipment().map((equipment, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                      onClick={() => {
                        const currentValue = watch('equipment_needed') || ''
                        const newValue = currentValue ? `${currentValue}, ${equipment}` : equipment
                        setValue('equipment_needed', newValue)
                      }}
                    >
                      + {equipment}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location & SLA Information */}
          <div className="space-y-4">
            {/* Location Info */}
            {selectedCustomer && selectedCustomer.latitude && selectedCustomer.longitude && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Location Information</h4>
                    <p className="text-sm text-green-700 mt-1">
                      GPS Coordinates: {selectedCustomer.latitude}, {selectedCustomer.longitude}
                    </p>
                    {selectedCustomer.odp && (
                      <p className="text-sm text-green-700">
                        ODP: {selectedCustomer.odp}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                  {selectedCustomer && (
                    <p className="text-sm text-blue-700 mt-1">
                      Customer Package SLA: {selectedCustomer.sla_level || 'Standard'}
                    </p>
                  )}
                </div>
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
