import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { X, Save, User, Phone, Mail, MapPin, Package, CreditCard, Settings, AlertCircle } from 'lucide-react'
import { customerService } from '../services/customerService'
import { packageService } from '../services/packageService'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'

const CustomerForm = ({ customer = null, isOpen, onClose, onSuccess }) => {
  const isEdit = !!customer
  
  const [formData, setFormData] = useState({
    // Basic Info
    customer_id: '',
    name: '',
    ktp: '',
    phone: '',
    phone_alt: '',
    email: '',
    address: '',
    latitude: '',
    longitude: '',
    odp: '',
    
    // PIC Info
    pic_name: '',
    pic_position: '',
    pic_phone: '',
    
    // Business Info
    business_type: 'residential',
    operating_hours: '',
    
    // Service Info
    customer_type: 'regular',
    payment_type: 'postpaid',
    service_type: 'broadband',
    package_id: '',
    subscription_start_date: new Date().toISOString().split('T')[0],
    billing_cycle: 'monthly',
    
    // Technical Info
    ip_address: '',
    ip_type: 'dynamic',
    
    // Notes
    notes: ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  // Fetch packages for dropdown
  const { data: packagesData, isLoading: packagesLoading } = useQuery(
    'packages-list',
    () => packageService.getPackages({ is_active: 'true' }),
    {
      enabled: isOpen,
      staleTime: 300000
    }
  )

  // Initialize form data when customer prop changes
  useEffect(() => {
    if (customer) {
      setFormData({
        customer_id: customer.customer_id || '',
        name: customer.name || '',
        ktp: customer.ktp || '',
        phone: customer.phone || '',
        phone_alt: customer.phone_alt || '',
        email: customer.email || '',
        address: customer.address || '',
        latitude: customer.latitude || '',
        longitude: customer.longitude || '',
        odp: customer.odp || '',
        pic_name: customer.pic_name || '',
        pic_position: customer.pic_position || '',
        pic_phone: customer.pic_phone || '',
        business_type: customer.business_type || 'residential',
        operating_hours: customer.operating_hours || '',
        customer_type: customer.customer_type || 'regular',
        payment_type: customer.payment_type || 'postpaid',
        service_type: customer.service_type || 'broadband',
        package_id: customer.package_id || '',
        subscription_start_date: customer.subscription_start_date ? 
          new Date(customer.subscription_start_date).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0],
        billing_cycle: customer.billing_cycle || 'monthly',
        ip_address: customer.ip_address || '',
        ip_type: customer.ip_type || 'dynamic',
        notes: customer.notes || ''
      })
    } else {
      // Reset form for new customer
      setFormData({
        customer_id: '',
        name: '',
        ktp: '',
        phone: '',
        phone_alt: '',
        email: '',
        address: '',
        latitude: '',
        longitude: '',
        odp: '',
        pic_name: '',
        pic_position: '',
        pic_phone: '',
        business_type: 'residential',
        operating_hours: '',
        customer_type: 'regular',
        payment_type: 'postpaid',
        service_type: 'broadband',
        package_id: '',
        subscription_start_date: new Date().toISOString().split('T')[0],
        billing_cycle: 'monthly',
        ip_address: '',
        ip_type: 'dynamic',
        notes: ''
      })
    }
    setErrors({})
  }, [customer, isOpen])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Required fields
    if (!formData.customer_id.trim()) newErrors.customer_id = 'Customer ID is required'
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.package_id) newErrors.package_id = 'Package is required'

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    // KTP validation (16 digits)
    if (formData.ktp && !/^\d{16}$/.test(formData.ktp)) {
      newErrors.ktp = 'KTP must be 16 digits'
    }

    // Phone validation
    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format'
    }

    // Coordinates validation
    if (formData.latitude && (isNaN(formData.latitude) || Math.abs(formData.latitude) > 90)) {
      newErrors.latitude = 'Invalid latitude (-90 to 90)'
    }
    if (formData.longitude && (isNaN(formData.longitude) || Math.abs(formData.longitude) > 180)) {
      newErrors.longitude = 'Invalid longitude (-180 to 180)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Convert string numbers to actual numbers for coordinates
      const submitData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        package_id: parseInt(formData.package_id)
      }

      let result
      if (isEdit) {
        result = await customerService.updateCustomer(customer.id, submitData)
        toast.success('Customer updated successfully')
      } else {
        result = await customerService.createCustomer(submitData)
        toast.success('Customer created successfully')
      }

      onSuccess?.(result.data)
      onClose()
    } catch (error) {
      console.error('Submit error:', error)
      const errorMessage = error.response?.data?.message || 'Failed to save customer'
      toast.error(errorMessage)
      
      // Handle validation errors from server
      if (error.response?.data?.errors) {
        const serverErrors = {}
        error.response.data.errors.forEach(err => {
          serverErrors[err.path || err.param] = err.msg
        })
        setErrors(serverErrors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'contact', label: 'Contact & Location', icon: MapPin },
    { id: 'service', label: 'Service & Package', icon: Package },
    { id: 'technical', label: 'Technical', icon: Settings }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-0 border w-full max-w-4xl shadow-lg rounded-lg bg-white mb-8">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {isEdit ? 'Edit Customer' : 'Create New Customer'}
            </h3>
            <p className="text-sm text-gray-500">
              {isEdit ? 'Update customer information' : 'Fill in the customer details below'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                  {/* Show error indicator if tab has errors */}
                  {((tab.id === 'basic' && (errors.customer_id || errors.name || errors.ktp)) ||
                    (tab.id === 'contact' && (errors.phone || errors.email || errors.address || errors.latitude || errors.longitude)) ||
                    (tab.id === 'service' && errors.package_id) ||
                    (tab.id === 'technical' && (errors.ip_address))) && (
                    <AlertCircle className="h-3 w-3 ml-1 text-red-500" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer ID *
                  </label>
                  <input
                    type="text"
                    value={formData.customer_id}
                    onChange={(e) => handleInputChange('customer_id', e.target.value)}
                    className={`input-field ${errors.customer_id ? 'border-red-500' : ''}`}
                    placeholder="e.g., CUST001"
                    disabled={isEdit} // Don't allow editing customer ID
                  />
                  {errors.customer_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    KTP Number
                  </label>
                  <input
                    type="text"
                    value={formData.ktp}
                    onChange={(e) => handleInputChange('ktp', e.target.value)}
                    className={`input-field ${errors.ktp ? 'border-red-500' : ''}`}
                    placeholder="16 digit KTP number"
                    maxLength={16}
                  />
                  {errors.ktp && (
                    <p className="mt-1 text-sm text-red-600">{errors.ktp}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type
                  </label>
                  <select
                    value={formData.business_type}
                    onChange={(e) => handleInputChange('business_type', e.target.value)}
                    className="input-field"
                  >
                    <option value="residential">Residential</option>
                    <option value="office">Office</option>
                    <option value="shop">Shop</option>
                    <option value="factory">Factory</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={formData.operating_hours}
                  onChange={(e) => handleInputChange('operating_hours', e.target.value)}
                  className="input-field"
                  placeholder="e.g., 08:00-17:00 or 24/7"
                />
              </div>

              {/* PIC Information */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Person in Charge (PIC)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PIC Name
                    </label>
                    <input
                      type="text"
                      value={formData.pic_name}
                      onChange={(e) => handleInputChange('pic_name', e.target.value)}
                      className="input-field"
                      placeholder="Contact person name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PIC Position
                    </label>
                    <input
                      type="text"
                      value={formData.pic_position}
                      onChange={(e) => handleInputChange('pic_position', e.target.value)}
                      className="input-field"
                      placeholder="e.g., Manager, Owner"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PIC Phone
                    </label>
                    <input
                      type="text"
                      value={formData.pic_phone}
                      onChange={(e) => handleInputChange('pic_phone', e.target.value)}
                      className="input-field"
                      placeholder="PIC phone number"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact & Location Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Phone *
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="Primary phone number"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alternative Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone_alt}
                    onChange={(e) => handleInputChange('phone_alt', e.target.value)}
                    className="input-field"
                    placeholder="Alternative phone number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="Email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`input-field ${errors.address ? 'border-red-500' : ''}`}
                  rows={3}
                  placeholder="Complete address including RT/RW, Kelurahan, Kecamatan, City, Postal Code"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    className={`input-field ${errors.latitude ? 'border-red-500' : ''}`}
                    placeholder="e.g., -6.200000"
                  />
                  {errors.latitude && (
                    <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    className={`input-field ${errors.longitude ? 'border-red-500' : ''}`}
                    placeholder="e.g., 106.816666"
                  />
                  {errors.longitude && (
                    <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ODP
                  </label>
                  <input
                    type="text"
                    value={formData.odp}
                    onChange={(e) => handleInputChange('odp', e.target.value)}
                    className="input-field"
                    placeholder="e.g., ODP-JKT-001-A12"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Service & Package Tab */}
          {activeTab === 'service' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Type
                  </label>
                  <select
                    value={formData.customer_type}
                    onChange={(e) => handleInputChange('customer_type', e.target.value)}
                    className="input-field"
                  >
                    <option value="regular">Regular</option>
                    <option value="non-regular">Non-Regular</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Type
                  </label>
                  <select
                    value={formData.payment_type}
                    onChange={(e) => handleInputChange('payment_type', e.target.value)}
                    className="input-field"
                  >
                    <option value="postpaid">Postpaid</option>
                    <option value="prepaid">Prepaid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type
                  </label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => handleInputChange('service_type', e.target.value)}
                    className="input-field"
                  >
                    <option value="broadband">Broadband</option>
                    <option value="dedicated">Dedicated</option>
                    <option value="corporate">Corporate</option>
                    <option value="mitra">Mitra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internet Package *
                  </label>
                  {packagesLoading ? (
                    <div className="input-field flex items-center justify-center">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : (
                    <select
                      value={formData.package_id}
                      onChange={(e) => handleInputChange('package_id', e.target.value)}
                      className={`input-field ${errors.package_id ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select Package</option>
                      {packagesData?.data?.packages?.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.package_name} - {pkg.bandwidth_down} Mbps - {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0
                          }).format(pkg.monthly_price)}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.package_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.package_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subscription Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.subscription_start_date}
                    onChange={(e) => handleInputChange('subscription_start_date', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Cycle
                  </label>
                  <select
                    value={formData.billing_cycle}
                    onChange={(e) => handleInputChange('billing_cycle', e.target.value)}
                    className="input-field"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Technical Tab */}
          {activeTab === 'technical' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={formData.ip_address}
                    onChange={(e) => handleInputChange('ip_address', e.target.value)}
                    className="input-field"
                    placeholder="e.g., 192.168.1.100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IP Type
                  </label>
                  <select
                    value={formData.ip_type}
                    onChange={(e) => handleInputChange('ip_type', e.target.value)}
                    className="input-field"
                  >
                    <option value="dynamic">Dynamic</option>
                    <option value="static">Static</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="input-field"
                  rows={4}
                  placeholder="Additional notes about the customer..."
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEdit ? 'Update Customer' : 'Create Customer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CustomerForm

