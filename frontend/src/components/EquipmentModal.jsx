import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { X, Wifi, Router, Cable, AlertCircle, Package } from 'lucide-react'
import equipmentService from '../services/equipmentService'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'

const EquipmentModal = ({ isOpen, onClose, customer, onSuccess }) => {
  const [formData, setFormData] = useState({
    equipment_type: '',
    equipment_master_id: '',
    brand: '',
    model: '',
    serial_number: '',
    mac_address: '',
    installation_date: new Date().toISOString().split('T')[0],
    warranty_expiry: '',
    status: 'active',
    notes: ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('devices')

  // Fetch equipment master data
  const { data: equipmentMaster, isLoading: isLoadingEquipment } = useQuery(
    'equipment-master',
    async () => {
      const result = await equipmentService.getAll()
      console.log('🔍 Equipment Master Data Loaded:', {
        type: Array.isArray(result) ? 'Array' : typeof result,
        length: result?.length || 0,
        sample: result?.[0]
      })
      return result
    },
    { enabled: isOpen }
  )

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        equipment_type: '',
        equipment_master_id: '',
        brand: '',
        model: '',
        serial_number: '',
        mac_address: '',
        installation_date: new Date().toISOString().split('T')[0],
        warranty_expiry: '',
        status: 'active',
        notes: ''
      })
      setErrors({})
      setSelectedCategory('devices')
    }
  }, [isOpen])

  // Auto-fill brand & model when equipment master selected
  useEffect(() => {
    if (formData.equipment_master_id && equipmentMaster && equipmentMaster.length > 0) {
      const selectedEquipment = equipmentMaster.find(
        eq => eq.id === parseInt(formData.equipment_master_id)
      )
      
      if (selectedEquipment) {
        // Extract brand and model from equipment name
        const nameParts = selectedEquipment.equipment_name.split(' ')
        const brand = nameParts[0] || ''
        const model = nameParts.slice(1).join(' ') || selectedEquipment.equipment_name
        
        setFormData(prev => ({
          ...prev,
          equipment_type: selectedEquipment.equipment_name,
          brand: brand,
          model: model
        }))
      }
    }
  }, [formData.equipment_master_id, equipmentMaster])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.equipment_type.trim()) {
      newErrors.equipment_type = 'Equipment type wajib diisi'
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand wajib diisi'
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model wajib diisi'
    }

    // Validate MAC address format (optional but if provided must be valid)
    if (formData.mac_address.trim()) {
      const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
      if (!macRegex.test(formData.mac_address)) {
        newErrors.mac_address = 'Format MAC address tidak valid (contoh: AA:BB:CC:DD:EE:FF)'
      }
    }

    // Validate warranty expiry is after installation date
    if (formData.warranty_expiry && formData.installation_date) {
      if (new Date(formData.warranty_expiry) < new Date(formData.installation_date)) {
        newErrors.warranty_expiry = 'Warranty expiry harus setelah installation date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('❌ Mohon lengkapi form dengan benar')
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare payload - remove empty strings
      const payload = {}
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && key !== 'equipment_master_id') {
          payload[key] = formData[key]
        }
      })

      await onSuccess(payload)
      toast.success('✅ Equipment berhasil ditambahkan')
      onClose()
    } catch (error) {
      toast.error('❌ Gagal menambahkan equipment')
      console.error('Add equipment error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const categories = [
    { value: 'devices', label: 'Devices', icon: Router, description: 'ONT, Modem, Router, Access Point' },
    { value: 'cables', label: 'Cables', icon: Cable, description: 'Fiber Optic, UTP, Drop Cable' },
    { value: 'accessories', label: 'Accessories', icon: Package, description: 'Adapter, Splitter, Connector' },
    { value: 'tools', label: 'Tools', icon: Wifi, description: 'Installation & Maintenance Tools' }
  ]

  // equipmentService.getAll() now returns array directly
  const filteredEquipment = (equipmentMaster || []).filter(
    eq => eq.category === selectedCategory && eq.is_active
  )
  
  // Debug logging
  console.log('🔍 Equipment Modal Debug:', {
    selectedCategory,
    totalEquipment: equipmentMaster?.length || 0,
    filteredCount: filteredEquipment.length,
    equipmentMasterType: Array.isArray(equipmentMaster) ? 'Array' : typeof equipmentMaster,
    sampleFiltered: filteredEquipment[0]
  })

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Add Equipment</h3>
            <p className="text-sm text-gray-500 mt-1">
              Tambah equipment untuk {customer.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoadingEquipment ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="form-label">Equipment Category *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map((cat) => {
                    const Icon = cat.icon
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.value)
                          setFormData(prev => ({ ...prev, equipment_master_id: '' }))
                        }}
                        className={`p-4 border-2 rounded-lg text-center transition-all ${
                          selectedCategory === cat.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <Icon className={`h-6 w-6 mx-auto mb-2 ${
                          selectedCategory === cat.value ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div className={`text-sm font-medium ${
                          selectedCategory === cat.value ? 'text-blue-900' : 'text-gray-700'
                        }`}>
                          {cat.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {cat.description}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Equipment Master Selection */}
              <div>
                <label className="form-label">
                  Select Equipment (Optional)
                  {filteredEquipment.length > 0 && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({filteredEquipment.length} items tersedia)
                    </span>
                  )}
                </label>
                <select
                  name="equipment_master_id"
                  value={formData.equipment_master_id}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">
                    {filteredEquipment.length > 0 
                      ? '-- Pilih dari Master Data atau isi manual --'
                      : '-- Tidak ada equipment di kategori ini --'}
                  </option>
                  {filteredEquipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.equipment_name} {eq.unit && `(${eq.unit})`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredEquipment.length > 0 ? (
                    <>💡 Pilih dari master data untuk auto-fill atau isi form secara manual</>
                  ) : (
                    <>⚠️ Tidak ada equipment di kategori "{selectedCategory}". Silakan isi form secara manual.</>
                  )}
                </p>
              </div>

              {/* Manual Entry Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Equipment Type */}
                <div className="md:col-span-2">
                  <label className="form-label">Equipment Type / Name *</label>
                  <input
                    type="text"
                    name="equipment_type"
                    value={formData.equipment_type}
                    onChange={handleChange}
                    placeholder="e.g., ONT Huawei HG8245H, Router TP-Link"
                    className={`form-input ${errors.equipment_type ? 'border-red-500' : ''}`}
                  />
                  {errors.equipment_type && (
                    <p className="form-error">{errors.equipment_type}</p>
                  )}
                </div>

                {/* Brand */}
                <div>
                  <label className="form-label">Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="e.g., Huawei, TP-Link, ZTE"
                    className={`form-input ${errors.brand ? 'border-red-500' : ''}`}
                  />
                  {errors.brand && (
                    <p className="form-error">{errors.brand}</p>
                  )}
                </div>

                {/* Model */}
                <div>
                  <label className="form-label">Model *</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="e.g., HG8245H, Archer C6"
                    className={`form-input ${errors.model ? 'border-red-500' : ''}`}
                  />
                  {errors.model && (
                    <p className="form-error">{errors.model}</p>
                  )}
                </div>

                {/* Serial Number */}
                <div>
                  <label className="form-label">Serial Number</label>
                  <input
                    type="text"
                    name="serial_number"
                    value={formData.serial_number}
                    onChange={handleChange}
                    placeholder="e.g., SN123456789"
                    className="form-input"
                  />
                </div>

                {/* MAC Address */}
                <div>
                  <label className="form-label">MAC Address</label>
                  <input
                    type="text"
                    name="mac_address"
                    value={formData.mac_address}
                    onChange={handleChange}
                    placeholder="AA:BB:CC:DD:EE:FF"
                    className={`form-input ${errors.mac_address ? 'border-red-500' : ''}`}
                  />
                  {errors.mac_address && (
                    <p className="form-error">{errors.mac_address}</p>
                  )}
                </div>

                {/* Installation Date */}
                <div>
                  <label className="form-label">Installation Date *</label>
                  <input
                    type="date"
                    name="installation_date"
                    value={formData.installation_date}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="form-input"
                  />
                </div>

                {/* Warranty Expiry */}
                <div>
                  <label className="form-label">Warranty Expiry</label>
                  <input
                    type="date"
                    name="warranty_expiry"
                    value={formData.warranty_expiry}
                    onChange={handleChange}
                    min={formData.installation_date}
                    className={`form-input ${errors.warranty_expiry ? 'border-red-500' : ''}`}
                  />
                  {errors.warranty_expiry && (
                    <p className="form-error">{errors.warranty_expiry}</p>
                  )}
                </div>

                {/* Status */}
                <div className="md:col-span-2">
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="faulty">Faulty</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="form-label">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Additional notes about this equipment..."
                    className="form-input"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">💡 Tips:</p>
                    <ul className="space-y-1 text-blue-800">
                      <li>• Pilih dari master data untuk auto-fill brand & model</li>
                      <li>• Serial number & MAC address opsional tapi recommended</li>
                      <li>• Warranty expiry membantu tracking garansi equipment</li>
                      <li>• Equipment akan muncul di customer equipment list</li>
                    </ul>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingEquipment}
            className="btn-primary"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner className="inline w-4 h-4 mr-2" />
                Adding...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Add Equipment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EquipmentModal

