import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Clock, CheckCircle, XCircle, Pause, Play, Upload, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'
import { useQuery } from 'react-query'
import { technicianService } from '../services/technicianService'

const StatusUpdateForm = ({ ticket, onUpdate, isLoading }) => {
  const { user } = useAuth()
  const [selectedStatus, setSelectedStatus] = useState(ticket.status)
  const [selectedTechnician, setSelectedTechnician] = useState(ticket.assigned_technician_id || '')
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm()
  
  // Watch file inputs to show feedback
  const otdrPhoto = watch('otdr_photo')
  const attenuationPhoto = watch('attenuation_photo')
  const modemSnPhoto = watch('modem_sn_photo')

  // Debug file selection
  useEffect(() => {
    if (otdrPhoto?.[0]) {
      console.log('✅ OTDR Photo selected:', otdrPhoto[0].name, otdrPhoto[0].size, 'bytes');
    }
  }, [otdrPhoto])

  useEffect(() => {
    if (attenuationPhoto?.[0]) {
      console.log('✅ Attenuation Photo selected:', attenuationPhoto[0].name, attenuationPhoto[0].size, 'bytes');
    }
  }, [attenuationPhoto])

  useEffect(() => {
    if (modemSnPhoto?.[0]) {
      console.log('✅ Modem SN Photo selected:', modemSnPhoto[0].name, modemSnPhoto[0].size, 'bytes');
    }
  }, [modemSnPhoto])

  // Auto-fill dates when status changes to 'completed'
  useEffect(() => {
    if (selectedStatus === 'completed') {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      
      const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`
      
      // Auto-fill activation_date for installation
      if (ticket.type === 'installation') {
        setValue('activation_date', datetimeLocal)
      }
      
      // Auto-fill repair_date for repair & maintenance
      if (ticket.type === 'repair' || ticket.type === 'maintenance') {
        setValue('repair_date', datetimeLocal)
      }
    }
  }, [selectedStatus, ticket.type, setValue])

  // Fetch available technicians ketika status berubah ke 'assigned'
  // Fetch technicians kapan pun status 'assigned' dipilih (untuk assign & re-assign)
  const { data: techniciansData, isLoading: techniciansLoading } = useQuery(
    'available-technicians',
    () => technicianService.getAvailableTechnicians(),
    { enabled: selectedStatus === 'assigned' }
  )

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
    const isAssigned = !!ticket.assigned_technician_id

    // Workflow rules:
    // 1. 'open' can only transition to 'assigned' or 'cancelled'
    // 2. 'assigned' can transition to 'in_progress', 'on_hold', 'cancelled'
    // 3. 'in_progress' can transition to 'completed', 'on_hold', 'cancelled'
    // 4. 'on_hold' can transition back to 'in_progress'
    // 5. 'completed' and 'cancelled' are terminal states
    // 6. TIDAK BOLEH kembali ke 'open' setelah status berubah

    const workflowTransitions = {
      'open': ['assigned', 'cancelled'],
      'assigned': ['in_progress', 'on_hold', 'cancelled'],
      'in_progress': ['completed', 'on_hold', 'cancelled'],
      'on_hold': ['in_progress', 'cancelled'],
      'completed': [], // terminal
      'cancelled': []  // terminal
    }

    // Get allowed transitions for current status
    let allowedStatuses = workflowTransitions[currentStatus] || []

    // Additional rules:
    // - 'completed' hanya bisa dipilih jika sudah 'in_progress'
    if (currentStatus !== 'in_progress' && currentStatus !== 'on_hold') {
      allowedStatuses = allowedStatuses.filter(s => s !== 'completed')
    }

    // - 'assigned' memerlukan teknisi assigned (akan handle di form validation)
    
    // Admin and supervisor have more flexibility but still follow workflow
    if (userRole === 'admin' || userRole === 'supervisor') {
      // Admin bisa skip ke status manapun kecuali kembali ke 'open'
      return statusOptions.filter(status => {
        // Current status always shown (disabled)
        if (status.value === currentStatus) return true
        
        // Completed states can't be changed
        if (currentStatus === 'completed' || currentStatus === 'cancelled') return false
        
        // Can't go back to 'open'
        if (status.value === 'open') return false
        
        // Allow workflow transitions
        return allowedStatuses.includes(status.value)
      })
    }

    // Technician can only update their assigned tickets
    if (userRole === 'technician') {
      return statusOptions.filter(status => 
        status.value === currentStatus || allowedStatuses.includes(status.value)
      )
    }

    // Customer service follows strict workflow
    if (userRole === 'customer_service') {
      return statusOptions.filter(status => 
        status.value === currentStatus || allowedStatuses.includes(status.value)
      )
    }

    return statusOptions.filter(status => 
      status.value === currentStatus || allowedStatuses.includes(status.value)
    )
  }

  const availableStatuses = getAvailableStatuses()

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const onSubmit = async (data) => {
    console.log('=== FORM SUBMIT STARTED ===');
    console.log('Form data:', data);
    console.log('Selected status:', selectedStatus);
    
    // Validation: jika pilih 'assigned' dari status 'open', harus pilih teknisi
    if (selectedStatus === 'assigned' && ticket.status === 'open' && !selectedTechnician) {
      alert('Please select a technician when assigning the ticket for the first time')
      return
    }

    // Auto-generate notes jika kosong berdasarkan status
    const autoGenerateNotes = () => {
      if (data.notes && data.notes.trim()) return data.notes
      
      const statusMessages = {
        'open': 'Ticket dibuka dan menunggu assignment teknisi.',
        'assigned': `Ticket telah di-assign ke teknisi${selectedTechnician ? ' yang dipilih' : ''} untuk dikerjakan.`,
        'in_progress': 'Pekerjaan dimulai. Teknisi sedang mengerjakan ticket ini.',
        'completed': 'Pekerjaan selesai dikerjakan dengan baik. Ticket ditutup.',
        'cancelled': 'Ticket dibatalkan karena alasan tertentu.',
        'on_hold': 'Pekerjaan ditunda sementara. Menunggu informasi atau material tambahan.'
      }
      
      return statusMessages[selectedStatus] || `Status diubah menjadi ${selectedStatus}`
    }

    const updateData = {
      status: selectedStatus,
      notes: autoGenerateNotes(),
      work_notes: data.work_notes || undefined,
      resolution_notes: data.resolution_notes || undefined,
      customer_rating: data.customer_rating || undefined,
      customer_feedback: data.customer_feedback || undefined
    }

    // Kirim assigned_technician_id jika:
    // 1. Status berubah ke 'assigned' dari 'open' (assign pertama kali)
    // 2. Atau ada technician yang dipilih di form (re-assign)
    if (selectedStatus === 'assigned' && selectedTechnician) {
      updateData.assigned_technician_id = parseInt(selectedTechnician, 10)
      console.log('=== FRONTEND: Sending technician assignment ===');
      console.log('Selected Technician:', selectedTechnician);
      console.log('Parsed Technician ID:', updateData.assigned_technician_id);
      console.log('Ticket Current Status:', ticket.status);
      console.log('New Status:', selectedStatus);
    }

    console.log('=== FRONTEND: Final Update Data ===');
    console.log(JSON.stringify(updateData, null, 2));

    // Completion fields berdasarkan service type - hanya kirim jika status 'completed'
    if (selectedStatus === 'completed') {
      // Convert files to base64 if they exist
      const otdr_photo_base64 = data.otdr_photo?.[0] ? await fileToBase64(data.otdr_photo[0]) : null
      const attenuation_photo_base64 = data.attenuation_photo?.[0] ? await fileToBase64(data.attenuation_photo[0]) : null
      const modem_sn_photo_base64 = data.modem_sn_photo?.[0] ? await fileToBase64(data.modem_sn_photo[0]) : null
      
      updateData.completion_data = {
        odp_location: data.odp_location,
        odp_distance: data.odp_distance,
        otdr_photo: otdr_photo_base64 ? {
          filename: data.otdr_photo[0].name,
          data: otdr_photo_base64
        } : null,
        final_attenuation: data.final_attenuation,
        attenuation_photo: attenuation_photo_base64 ? {
          filename: data.attenuation_photo[0].name,
          data: attenuation_photo_base64
        } : null,
        wifi_name: data.wifi_name,
        wifi_password: data.wifi_password,
        activation_date: data.activation_date,
        modem_sn_photo: modem_sn_photo_base64 ? {
          filename: data.modem_sn_photo[0].name,
          data: modem_sn_photo_base64
        } : null,
        repair_date: data.repair_date,
        new_category: data.new_category
      }
      
      // Log file info for debugging
      console.log('=== FILE UPLOADS ===');
      if (data.otdr_photo?.[0]) console.log('OTDR Photo:', data.otdr_photo[0].name, data.otdr_photo[0].size, 'bytes');
      if (data.attenuation_photo?.[0]) console.log('Attenuation Photo:', data.attenuation_photo[0].name, data.attenuation_photo[0].size, 'bytes');
      if (data.modem_sn_photo?.[0]) console.log('Modem SN Photo:', data.modem_sn_photo[0].name, data.modem_sn_photo[0].size, 'bytes');
    }

    await onUpdate(updateData)
    reset()
  }

  const canUpdateStatus = availableStatuses.length > 1

  // Check if ticket is already completed
  if (ticket.status === 'completed') {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
        </div>
        <div className="card-body">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Ticket Completed</h4>
            <p className="text-gray-600">
              This ticket has been marked as completed and cannot be modified.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Completed on: {new Date(ticket.completed_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    )
  }

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

          {/* Technician Selection (when status is 'assigned') */}
          {selectedStatus === 'assigned' && (
            <div>
              <label className="form-label">
                {ticket.status === 'open' ? 'Assign to Technician *' : 'Re-assign to Technician (optional)'}
              </label>
              <select
                className={`form-input ${ticket.status === 'open' && !selectedTechnician ? 'border-red-500' : ''}`}
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                disabled={techniciansLoading}
              >
                <option value="">
                  {ticket.assigned_technician_id ? 'Keep current technician' : 'Select a technician...'}
                </option>
                {techniciansData?.data?.technicians?.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.full_name || tech.user_full_name} ({tech.employee_id || tech.employee_code}) - {tech.skill_level}
                  </option>
                ))}
              </select>
              {ticket.status === 'open' && !selectedTechnician && (
                <p className="form-error">Technician selection is required for first assignment</p>
              )}
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

          {/* Completion Fields - Conditional based on Service Type */}
          {selectedStatus === 'completed' && (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900">Completion Details</h4>
              
              {/* Installation Fields */}
              {ticket.type === 'installation' && (
                <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Installation Completion Fields</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Lokasi ODP *</label>
                      <input
                        type="text"
                        className={`form-input ${errors.odp_location ? 'border-red-500' : ''}`}
                        {...register('odp_location', { required: 'Lokasi ODP is required' })}
                      />
                      {errors.odp_location && <p className="form-error">{errors.odp_location.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Jarak ODP (meter) *</label>
                      <input
                        type="number"
                        className={`form-input ${errors.odp_distance ? 'border-red-500' : ''}`}
                        {...register('odp_distance', { required: 'Jarak ODP is required' })}
                      />
                      {errors.odp_distance && <p className="form-error">{errors.odp_distance.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Foto OTDR *</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-md"
                        {...register('otdr_photo', { required: 'Foto OTDR is required' })}
                      />
                      {otdrPhoto?.[0] && (
                        <p className="text-xs text-green-600 font-medium">
                          ✓ Selected: {otdrPhoto[0].name} ({(otdrPhoto[0].size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                      {errors.otdr_photo && <p className="form-error">{errors.otdr_photo.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Redaman Terakhir (dB) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className={`form-input ${errors.final_attenuation ? 'border-red-500' : ''}`}
                        {...register('final_attenuation', { required: 'Redaman Terakhir is required' })}
                      />
                      {errors.final_attenuation && <p className="form-error">{errors.final_attenuation.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Foto Redaman Terakhir *</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-md"
                        {...register('attenuation_photo', { required: 'Foto Redaman is required' })}
                      />
                      {attenuationPhoto?.[0] && (
                        <p className="text-xs text-green-600 font-medium">
                          ✓ Selected: {attenuationPhoto[0].name} ({(attenuationPhoto[0].size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                      {errors.attenuation_photo && <p className="form-error">{errors.attenuation_photo.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Nama WiFi *</label>
                      <input
                        type="text"
                        className={`form-input ${errors.wifi_name ? 'border-red-500' : ''}`}
                        {...register('wifi_name', { required: 'Nama WiFi is required' })}
                      />
                      {errors.wifi_name && <p className="form-error">{errors.wifi_name.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Password WiFi *</label>
                      <input
                        type="text"
                        className={`form-input ${errors.wifi_password ? 'border-red-500' : ''}`}
                        {...register('wifi_password', { required: 'Password WiFi is required' })}
                      />
                      {errors.wifi_password && <p className="form-error">{errors.wifi_password.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Tanggal Aktif *</label>
                      <input
                        type="datetime-local"
                        className={`form-input ${errors.activation_date ? 'border-red-500' : ''}`}
                        {...register('activation_date', { required: 'Tanggal Aktif is required' })}
                      />
                      {errors.activation_date && <p className="form-error">{errors.activation_date.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Foto SN Modem *</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-md"
                        {...register('modem_sn_photo', { required: 'Foto SN Modem is required' })}
                      />
                      {modemSnPhoto?.[0] && (
                        <p className="text-xs text-green-600 font-medium">
                          ✓ Selected: {modemSnPhoto[0].name} ({(modemSnPhoto[0].size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                      {errors.modem_sn_photo && <p className="form-error">{errors.modem_sn_photo.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Repair & Maintenance Fields */}
              {(ticket.type === 'repair' || ticket.type === 'maintenance') && (
                <div className="space-y-4 bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-orange-900">
                    {ticket.type === 'repair' ? 'Repair' : 'Maintenance'} Completion Fields
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Lokasi ODP *</label>
                      <input
                        type="text"
                        className={`form-input ${errors.odp_location ? 'border-red-500' : ''}`}
                        {...register('odp_location', { required: 'Lokasi ODP is required' })}
                      />
                      {errors.odp_location && <p className="form-error">{errors.odp_location.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Redaman Terakhir (dB) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className={`form-input ${errors.final_attenuation ? 'border-red-500' : ''}`}
                        {...register('final_attenuation', { required: 'Redaman Terakhir is required' })}
                      />
                      {errors.final_attenuation && <p className="form-error">{errors.final_attenuation.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Foto Redaman Terakhir (Optional)</label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-md"
                          {...register('attenuation_photo')}
                        />
                        {attenuationPhoto?.[0] && (
                          <p className="text-xs text-green-600 font-medium">
                            ✓ Selected: {attenuationPhoto[0].name} ({(attenuationPhoto[0].size / 1024).toFixed(1)} KB)
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Nama WiFi</label>
                      <input
                        type="text"
                        className="form-input"
                        {...register('wifi_name')}
                      />
                    </div>

                    <div>
                      <label className="form-label">Password WiFi</label>
                      <input
                        type="text"
                        className="form-input"
                        {...register('wifi_password')}
                      />
                    </div>

                    <div>
                      <label className="form-label">Tanggal Perbaikan *</label>
                      <input
                        type="datetime-local"
                        className={`form-input ${errors.repair_date ? 'border-red-500' : ''}`}
                        {...register('repair_date', { required: 'Tanggal Perbaikan is required' })}
                      />
                      {errors.repair_date && <p className="form-error">{errors.repair_date.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Upgrade Fields */}
              {ticket.type === 'upgrade' && (
                <div className="space-y-4 bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-900">Upgrade Completion Fields</p>
                  
                  <div>
                    <label className="form-label">New Category *</label>
                    <input
                      type="text"
                      className={`form-input ${errors.new_category ? 'border-red-500' : ''}`}
                      placeholder="e.g., 100 Mbps -> 200 Mbps"
                      {...register('new_category', { required: 'New Category is required' })}
                    />
                    {errors.new_category && <p className="form-error">{errors.new_category.message}</p>}
                  </div>
                </div>
              )}

              {/* WiFi Setup Fields */}
              {ticket.type === 'wifi_setup' && (
                <div className="space-y-4 bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-purple-900">WiFi Setup Completion Fields</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Nama WiFi *</label>
                      <input
                        type="text"
                        className={`form-input ${errors.wifi_name ? 'border-red-500' : ''}`}
                        {...register('wifi_name', { required: 'Nama WiFi is required' })}
                      />
                      {errors.wifi_name && <p className="form-error">{errors.wifi_name.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Password WiFi *</label>
                      <input
                        type="text"
                        className={`form-input ${errors.wifi_password ? 'border-red-500' : ''}`}
                        {...register('wifi_password', { required: 'Password WiFi is required' })}
                      />
                      {errors.wifi_password && <p className="form-error">{errors.wifi_password.message}</p>}
                    </div>
                  </div>
                </div>
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
