import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from 'react-query'
import { X, Upload, AlertCircle, MapPin, Phone, Mail, Package, User } from 'lucide-react'
import { customerService } from '../services/customerService'
import { ticketService } from '../services/ticketService'
import serviceTypeService from '../services/serviceTypeService'
import serviceCategoryService from '../services/serviceCategoryService'
import equipmentService from '../services/equipmentService'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'

const TicketCreateForm = ({ isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [availableCategories, setAvailableCategories] = useState([])
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    defaultValues: {
      type: '',
      category: '',
      priority: 'normal'
    }
  })

  // Get customers for dropdown
  const { data: customersData, isLoading: customersLoading } = useQuery(
    'customers',
    () => customerService.getCustomers({ limit: 100 }),
    { enabled: isOpen }
  )

  // Get service types from master data
  const { data: serviceTypes, isLoading: serviceTypesLoading } = useQuery(
    'service-types-active',
    () => serviceTypeService.getAll(true),
    { enabled: isOpen }
  )

  // Get all service categories
  const { data: serviceCategories } = useQuery(
    'service-categories-active',
    () => serviceCategoryService.getAll(null, true),
    { enabled: isOpen }
  )

  // Get equipment list from master data
  const { data: equipmentList } = useQuery(
    ['equipment-list'],
    equipmentService.getAll,
    { enabled: isOpen }
  )

  const selectedType = watch('type')
  const selectedCategory = watch('category')
  const selectedCustomerId = watch('customer_id')

  // Auto-fill customer data when customer is selected
  useEffect(() => {
    if (selectedCustomerId && customersData?.data?.customers) {
      const customer = customersData.data.customers.find(c => c.id == selectedCustomerId)
      if (customer) {
        setSelectedCustomer(customer)
      }
    } else {
      setSelectedCustomer(null)
    }
  }, [selectedCustomerId, customersData, setValue])

  // Update available categories when service type changes (CASCADE)
  useEffect(() => {
    if (selectedType && serviceCategories) {
      const filtered = serviceCategories.filter(cat => cat.service_type_code === selectedType)
      setAvailableCategories(filtered)
      
      // Reset category selection when service type changes
      setValue('category', '')
      
      // Auto-select first category if only one available
      if (filtered.length === 1) {
        setValue('category', filtered[0].category_code)
      }
    } else {
      setAvailableCategories([])
      setValue('category', '')
    }
  }, [selectedType, serviceCategories, setValue])

  // Auto-fill estimated duration from selected category
  useEffect(() => {
    if (selectedCategory && availableCategories.length > 0) {
      const category = availableCategories.find(cat => cat.category_code === selectedCategory)
      if (category && category.estimated_duration) {
        setValue('estimated_duration', category.estimated_duration)
      }
    } else if (selectedType && serviceTypes) {
      // Fallback to service type default duration
      const serviceType = serviceTypes.find(st => st.type_code === selectedType)
      if (serviceType && serviceType.default_duration) {
        setValue('estimated_duration', serviceType.default_duration)
      }
    }
  }, [selectedCategory, availableCategories, selectedType, serviceTypes, setValue])

  // Auto-fill Title when Customer, Service Type, and Category are selected
  useEffect(() => {
    if (selectedCustomer && selectedType) {
      const serviceType = serviceTypes?.find(st => st.type_code === selectedType)
      const category = availableCategories.find(cat => cat.category_code === selectedCategory)
      
      let title = ''
      if (category) {
        title = `${category.category_name} - ${selectedCustomer.name}`
      } else if (serviceType) {
        title = `${serviceType.type_name} - ${selectedCustomer.name}`
      }
      
      if (title) {
        setValue('title', title)
      }
    }
  }, [selectedCustomer, selectedType, selectedCategory, serviceTypes, availableCategories, setValue])

  // Auto-fill Description based on Service Type (formatted & detailed)
  useEffect(() => {
    if (selectedCustomer && selectedType) {
      const serviceType = serviceTypes?.find(st => st.type_code === selectedType)
      const category = availableCategories.find(cat => cat.category_code === selectedCategory)
      
      // Format customer package info
      const packageInfo = customersData?.data?.customers?.find(c => c.id == selectedCustomerId)
      const packageName = packageInfo?.package_name || 'Tidak diketahui'
      
      // Build description with proper formatting
      let description = `INFORMASI PELANGGAN\n`
      description += `Nama: ${selectedCustomer.name}\n`
      description += `Alamat: ${selectedCustomer.address || 'Belum ditentukan'}\n`
      description += `Telepon: ${selectedCustomer.phone || '-'}\n`
      description += `Paket: ${packageName}\n`
      description += `Tipe Layanan: ${selectedCustomer.service_type || 'broadband'}\n\n`
      
      description += `JENIS PEKERJAAN\n`
      description += `Service Type: ${serviceType?.type_name || selectedType}\n`
      if (category) {
        description += `Category: ${category.category_name}\n`
      }
      description += `\n`
      
      // Add work description based on type
      description += `DESKRIPSI PEKERJAAN\n`
      const workDescriptions = {
        'installation': 'Survey lokasi, instalasi perangkat, konfigurasi koneksi, testing kualitas sinyal.',
        'repair': 'Pengecekan perangkat, kabel, kualitas sinyal, troubleshooting masalah koneksi.',
        'maintenance': 'Pengecekan kondisi perangkat, pembersihan, update firmware, optimisasi konfigurasi.',
        'upgrade': 'Penggantian atau konfigurasi ulang perangkat untuk paket lebih tinggi. Upgrade speed atau bandwidth sesuai permintaan.',
        'downgrade': 'Penyesuaian konfigurasi perangkat untuk paket lebih rendah. Downgrade speed atau bandwidth sesuai permintaan.',
        'wifi_setup': 'Setup WiFi router, konfigurasi SSID dan password, optimisasi channel, testing coverage.',
        'dismantle': 'Pelepasan perangkat, pencabutan kabel, pengembalian equipment ke warehouse.'
      }
      
      description += workDescriptions[selectedType] || 'Pekerjaan sesuai dengan service type yang dipilih.'
      
      setValue('description', description)
    }
  }, [selectedCustomer, selectedType, selectedCategory, serviceTypes, availableCategories, selectedCustomerId, customersData, setValue])

  // Note: Estimated duration is auto-filled from service type master data
  // See lines 96-110 for the logic that pulls duration from:
  // 1. Service Category (if selected) - category.estimated_duration
  // 2. Service Type (fallback) - serviceType.default_duration

  // Auto-fill Scheduled Date dengan waktu saat ini
  useEffect(() => {
    if (isOpen) {
      // Set to current datetime in local format (YYYY-MM-DDTHH:mm)
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      
      const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`
      setValue('scheduled_date', datetimeLocal)
    }
  }, [isOpen, setValue])

  const getSuggestedEquipment = () => {
    if (!selectedCustomer || !selectedType || !equipmentList) return []
    
    // Filter equipment based on service type and customer service type
    // Define equipment categories for each service type
    const categoryMap = {
      installation: {
        broadband: ['devices', 'cables', 'accessories', 'tools'],
        dedicated: ['devices', 'cables', 'accessories'],
        corporate: ['devices', 'accessories'],
        mitra: ['devices', 'accessories']
      },
      repair: {
        all: ['tools']
      },
      maintenance: {
        all: ['tools', 'accessories']
      },
      upgrade: {
        all: ['devices']
      },
      wifi_setup: {
        all: ['devices', 'accessories']
      },
      dismantle: {
        all: ['tools']
      },
      downgrade: {
        all: ['devices']
      }
    }
    
    // Get relevant categories for this service type
    const relevantCategories = categoryMap[selectedType]?.[selectedCustomer.service_type] || 
                               categoryMap[selectedType]?.all ||
                               ['devices', 'tools']
    
    // Filter active equipment from relevant categories
    const suggestedEquipment = equipmentList
      ?.filter(eq => eq.is_active && relevantCategories.includes(eq.category))
      ?.map(eq => eq.equipment_name) || []
    
    return suggestedEquipment.slice(0, 10) // Limit to 10 suggestions
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

          {/* Service Type */}
          <div>
            <label className="form-label">Service Type *</label>
            <select
              className="form-input"
              {...register('type', { required: 'Service type wajib dipilih' })}
            >
              <option value="">Pilih Service Type...</option>
              {serviceTypes?.map((type) => (
                <option key={type.type_code} value={type.type_code}>
                  {type.type_name} - {type.description}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="form-error">{errors.type.message}</p>
            )}
          </div>

          {/* Service Category (Cascade) */}
          {selectedType && (
            <div>
              <label className="form-label">
                Service Category {availableCategories.length > 0 && '*'}
              </label>
              {availableCategories.length > 0 ? (
                <>
                  <select
                    className="form-input"
                    {...register('category', { 
                      required: availableCategories.length > 0 ? 'Category wajib dipilih' : false 
                    })}
                  >
                    <option value="">Pilih Category...</option>
                    {availableCategories.map((cat) => (
                      <option key={cat.category_code} value={cat.category_code}>
                        {cat.category_name} - {cat.description}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="form-error">{errors.category.message}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 italic mt-1">
                  Tidak ada kategori tersedia untuk service type ini
                </p>
              )}
            </div>
          )}

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
