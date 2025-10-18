import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Clock, CheckCircle, XCircle, Pause, Play, Upload, Image as ImageIcon, Users, UserPlus, Trash2, Star } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'
import { useQuery } from 'react-query'
import { technicianService } from '../services/technicianService'
import odpService from '../services/odpService'
import packageService from '../services/packageService'

const StatusUpdateForm = ({ ticket, onUpdate, isLoading, preSelectedStatus, onStatusPreSelected }) => {
  const { user } = useAuth()
  const [selectedStatus, setSelectedStatus] = useState(ticket.status)
  const [selectedTechnician, setSelectedTechnician] = useState(ticket.assigned_technician_id || '')
  
  // Multiple technician assignment states
  const [assignmentMode, setAssignmentMode] = useState('single') // 'single' or 'multiple'
  const [teamMembers, setTeamMembers] = useState([]) // Array of {technician_id, role, full_name, employee_id}
  const [showAddTechnicianDropdown, setShowAddTechnicianDropdown] = useState(false)
  
  // Auto-select status if pre-selected from Quick Actions
  useEffect(() => {
    if (preSelectedStatus) {
      setSelectedStatus(preSelectedStatus)
      // Call callback to clear pre-selected status
      if (onStatusPreSelected) {
        onStatusPreSelected()
      }
    }
  }, [preSelectedStatus, onStatusPreSelected])
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm()
  
  // Fetch ODP list for dropdown
  const { data: odpList, isLoading: odpLoading, error: odpError } = useQuery(
    'odp-active',
    () => odpService.getAll(),
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchOnMount: false, // Don't refetch if data exists
      select: (response) => {
        // Extract array from response.data
        const odpArray = Array.isArray(response?.data) ? response.data : []
        
        // Filter only active ODPs
        const activeOdps = odpArray.filter(odp => odp.status === 'active')
        
        return activeOdps
      }
    }
  )
  
  // Fetch packages for upgrade/downgrade
  const { data: packagesList, isLoading: packagesLoading, error: packagesError } = useQuery(
    'packages-active',
    () => packageService.getAll(),
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchOnMount: false, // Don't refetch if data exists
      enabled: ticket.type === 'upgrade' || ticket.type === 'downgrade',
      select: (data) => {
        // packageService.getAll() returns array directly
        // Backend already filters by is_active = true, so no need to filter again
        const packages = Array.isArray(data) ? data : []
        return packages
      }
    }
  )
  
  // State for image previews (managed directly in onChange handlers)
  const [otdrPreview, setOtdrPreview] = useState(null)
  const [attenuationPreview, setAttenuationPreview] = useState(null)
  const [modemSnPreview, setModemSnPreview] = useState(null)
  
  // Store file objects for display info (filename, size)
  const [otdrFile, setOtdrFile] = useState(null)
  const [attenuationFile, setAttenuationFile] = useState(null)
  const [modemSnFile, setModemSnFile] = useState(null)

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
    
    // Manual validation for file uploads (when status = completed & type = installation)
    if (selectedStatus === 'completed' && ticket.type === 'installation') {
      console.log('🔍 [VALIDATION] Checking required files...');
      console.log('🔍 [VALIDATION] otdrFile:', otdrFile);
      console.log('🔍 [VALIDATION] attenuationFile:', attenuationFile);
      console.log('🔍 [VALIDATION] modemSnFile:', modemSnFile);
      console.log('🔍 [VALIDATION] data.otdr_photo:', data.otdr_photo);
      console.log('🔍 [VALIDATION] data.attenuation_photo:', data.attenuation_photo);
      console.log('🔍 [VALIDATION] data.modem_sn_photo:', data.modem_sn_photo);
      
      if (!otdrFile) {
        console.log('❌ [VALIDATION] OTDR file missing!');
        alert('Foto OTDR is required');
        return;
      }
      if (!attenuationFile) {
        console.log('❌ [VALIDATION] Attenuation file missing!');
        alert('Foto Redaman Terakhir is required');
        return;
      }
      if (!modemSnFile) {
        console.log('❌ [VALIDATION] Modem SN file missing!');
        alert('Foto SN Modem is required');
        return;
      }
      console.log('✅ All required files validated:', {
        otdr: otdrFile.name,
        attenuation: attenuationFile.name,
        modemSn: modemSnFile.name
      });
    }
    
    // Validation: jika pilih 'assigned' dari status 'open', harus pilih teknisi
    if (selectedStatus === 'assigned' && ticket.status === 'open') {
      if (assignmentMode === 'single' && !selectedTechnician) {
        alert('Please select a technician when assigning the ticket for the first time')
        return
      }
      if (assignmentMode === 'multiple') {
        if (teamMembers.length === 0) {
          alert('Please add at least 1 technician to the team')
          return
        }
        if (!teamMembers.find(m => m.role === 'lead')) {
          alert('Please designate one technician as Lead')
          return
        }
      }
    }

    // PHASE 1: Conditional Smart Notes - Contextual & Informative
    const autoGenerateNotes = () => {
      console.log('📝 [AUTO-NOTES] Starting auto-generation...');
      console.log('📝 [AUTO-NOTES] Custom notes provided?', !!data.notes?.trim());
      if (data.notes && data.notes.trim()) {
        console.log('📝 [AUTO-NOTES] Using custom notes');
        return data.notes
      }
      
      // Extract contextual data
      const customerName = ticket.customer_name || 'Customer'
      const customerId = ticket.customer_code || ticket.customer_id || ''
      const ticketType = ticket.type || 'general'
      const ticketTypeName = ticket.type_name || ticket.type || 'Ticket'
      const ticketId = ticket.ticket_number || ticket.id
      const oldStatus = ticket.status
      const newStatus = selectedStatus
      
      console.log('📝 [AUTO-NOTES] Context:', {
        customerName,
        ticketType,
        oldStatus,
        newStatus,
        ticketId
      })
      
      const customerAddress = ticket.customer_address || ''
      const packageName = ticket.package_name || ''
      const bandwidth = ticket.bandwidth_down || ticket.bandwidth_up || ''
      
      // Get technician info
      let technicianName = ''
      let technicianId = ''
      
      // First try to get from selected technician (for new assignments)
      if (selectedTechnician && techniciansData?.data?.technicians) {
        console.log('📝 [AUTO-NOTES] Looking up technician, selectedTechnician:', selectedTechnician);
        console.log('📝 [AUTO-NOTES] Available technicians:', techniciansData.data.technicians.length);
        const tech = techniciansData.data.technicians.find(t => t.id === parseInt(selectedTechnician))
        if (tech) {
          technicianName = tech.full_name
          technicianId = tech.employee_id
          console.log('📝 [AUTO-NOTES] Found technician:', technicianName);
        } else {
          console.log('📝 [AUTO-NOTES] Technician not found in list');
        }
      }
      
      // Fallback to current ticket technician (for status updates)
      if (!technicianName && ticket.technician_name) {
        technicianName = ticket.technician_name
        technicianId = ticket.technician_employee_id || ''
        console.log('📝 [AUTO-NOTES] Using ticket technician:', technicianName);
      }
      
      // Helper: Format date time
      const formatDateTime = (date) => {
        const d = new Date(date)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        const hours = String(d.getHours()).padStart(2, '0')
        const minutes = String(d.getMinutes()).padStart(2, '0')
        return `${day}/${month}/${year} ${hours}:${minutes}`
      }
      
      // Helper: Calculate target completion
      const calculateTargetCompletion = (estimatedMinutes) => {
        const now = new Date()
        const target = new Date(now.getTime() + estimatedMinutes * 60000)
        return formatDateTime(target)
      }
      
      // Helper: Get equipment list by ticket type
      const getEquipmentList = (type) => {
        const equipment = {
          installation: 'Dropcore fiber 50m, ONU/ONT, Patchcord LC-SC 3m, Rosette, Cable ties, Weatherproofing kit',
          maintenance: 'OTDR, Power meter, Spare connectors, Cleaning kit, Patchcords',
          upgrade: 'ONU (jika diperlukan), Configuration tools',
          downgrade: 'Configuration tools, Billing system access',
          relocation: 'Dropcore fiber, Patchcords, Cable management tools',
          troubleshooting: 'OTDR, Power meter, Signal tester, Spare parts'
        }
        return equipment[type] || 'Standard technician toolkit'
      }
      
      // Helper: Get estimated duration by ticket type
      const getEstimatedDuration = (type) => {
        const durations = {
          installation: 120,
          maintenance: 90,
          upgrade: 45,
          downgrade: 30,
          relocation: 180,
          troubleshooting: 60
        }
        return durations[type] || 60
      }
      
      // Helper: Format SLA date
      const formatSLA = () => {
        if (ticket.sla_due_date) {
          const sla = new Date(ticket.sla_due_date)
          const now = new Date()
          const diffHours = Math.floor((sla - now) / (1000 * 60 * 60))
          const diffDays = Math.floor(diffHours / 24)
          
          if (diffDays > 1) {
            return `${formatDateTime(sla)} (${diffDays} hari lagi)`
          } else if (diffHours > 0) {
            return `${formatDateTime(sla)} (${diffHours} jam lagi)`
          } else {
            return `${formatDateTime(sla)} (⚠️ URGENT)`
          }
        }
        return 'Not set'
      }
      
      // Conditional logic per ticket type and status
      const ticketTypeKey = ticketType.toLowerCase()
      
      // ASSIGNED Status
      if (newStatus === 'assigned') {
        console.log('📝 [AUTO-NOTES] Generating ASSIGNED notes, technicianName:', technicianName);
        if (oldStatus === 'open' && technicianName) {
          const notes = `📋 TICKET ASSIGNMENT\n\nTiket ${ticketTypeName} (${ticketId}) berhasil di-assign.\n\nTeknisi: ${technicianName}${technicianId ? ` (${technicianId})` : ''}\nCustomer: ${customerName}${customerId ? ` (${customerId})` : ''}${customerAddress ? `\nLokasi: ${customerAddress}` : ''}${packageName ? `\nPackage: ${packageName}` : ''}\n\nStatus berubah: "${oldStatus}" → "Assigned"\n\nTeknisi akan segera menghubungi customer untuk koordinasi jadwal pekerjaan. Estimasi penyelesaian: ${getEstimatedDuration(ticketTypeKey)} menit setelah mulai dikerjakan.`
          console.log('📝 [AUTO-NOTES] Generated:', notes.substring(0, 100) + '...');
          return notes
        } else if (technicianName) {
          return `🔄 RE-ASSIGNMENT\n\nTiket ${ticketTypeName} (${ticketId}) di-assign ulang.\n\nTeknisi Baru: ${technicianName}${technicianId ? ` (${technicianId})` : ''}\nCustomer: ${customerName}${customerId ? ` (${customerId})` : ''}\n\nStatus: "${oldStatus}" → "Assigned"\n\nProses penanganan akan dilanjutkan oleh teknisi yang baru. Koordinasi dengan customer akan segera dilakukan.`
        }
      }
      
      // IN_PROGRESS Status - Conditional by ticket type
      if (newStatus === 'in_progress') {
        console.log('📝 [AUTO-NOTES] Generating IN_PROGRESS notes, ticketType:', ticketTypeKey);
        const currentTime = formatDateTime(new Date())
        const estimatedDuration = getEstimatedDuration(ticketTypeKey)
        const targetTime = calculateTargetCompletion(estimatedDuration)
        const equipment = getEquipmentList(ticketTypeKey)
        
        if (ticketTypeKey === 'installation') {
          return `🔧 INSTALLATION DIMULAI\n\nTeknisi: ${technicianName}${technicianId ? ` (${technicianId})` : ''}\nCustomer: ${customerName}${customerId ? ` (${customerId})` : ''}${customerAddress ? `\nLokasi: ${customerAddress}` : ''}${packageName && bandwidth ? `\nPackage: ${packageName} (${bandwidth} Mbps)` : packageName ? `\nPackage: ${packageName}` : ''}\n\nEquipment: ${equipment}\n\nTimeline:\n- Mulai: ${currentTime}\n- Target selesai: ${targetTime} (estimasi ${estimatedDuration} menit)\n- SLA Deadline: ${formatSLA()}\n\nStatus: "${oldStatus}" → "In Progress"\n\nPekerjaan pemasangan fiber optic sedang berlangsung. Teknisi sedang melakukan routing kabel dan instalasi perangkat dengan monitoring signal quality.`
        }
        
        if (ticketTypeKey === 'maintenance') {
          return `🔧 MAINTENANCE DIMULAI\n\nTeknisi: ${technicianName}${technicianId ? ` (${technicianId})` : ''}\nCustomer: ${customerName}${customerId ? ` (${customerId})` : ''}${customerAddress ? `\nLokasi: ${customerAddress}` : ''}\nIssue: ${ticket.category_name || 'Maintenance diperlukan'}\n\nDiagnostic Tools: ${equipment}\n\nTimeline:\n- Mulai: ${currentTime}\n- Target resolusi: ${targetTime} (estimasi ${estimatedDuration} menit)\n- SLA Deadline: ${formatSLA()}\n\nStatus: "${oldStatus}" → "In Progress"\n\nTeknisi sedang melakukan troubleshooting dan diagnosis untuk identifikasi akar masalah. Signal testing dan measurement sedang berlangsung.`
        }
        
        if (ticketTypeKey === 'upgrade') {
          return `📈 UPGRADE SERVICE DIMULAI\n\nTeknisi: ${technicianName}${technicianId ? ` (${technicianId})` : ''}\nCustomer: ${customerName}${customerId ? ` (${customerId})` : ''}${packageName ? `\nNew Package: ${packageName}` : ''}\n\nConfiguration Tools: ${equipment}\n\nTimeline:\n- Mulai: ${currentTime}\n- Target selesai: ${targetTime} (estimasi ${estimatedDuration} menit)\n- SLA Deadline: ${formatSLA()}\n\nStatus: "${oldStatus}" → "In Progress"\n\nTeknisi sedang melakukan rekonfigurasi bandwidth dan update service plan. Perubahan konfigurasi di ONU dan core network sedang berlangsung.`
        }
        
        if (ticketTypeKey === 'downgrade') {
          return `📉 DOWNGRADE SERVICE DIMULAI\n\nTeknisi: ${technicianName}${technicianId ? ` (${technicianId})` : ''}\nCustomer: ${customerName}${customerId ? ` (${customerId})` : ''}${packageName ? `\nNew Package: ${packageName}` : ''}\n\nTimeline:\n- Mulai: ${currentTime}\n- Target selesai: ${targetTime} (estimasi ${estimatedDuration} menit)\n\nStatus: "${oldStatus}" → "In Progress"\n\nTeknisi sedang melakukan adjustment bandwidth sesuai package baru. Konfigurasi service plan sedang diupdate di system.`
        }
        
        // Default for other types
        return `🔧 PEKERJAAN DIMULAI\n\nTeknisi: ${technicianName}${technicianId ? ` (${technicianId})` : ''}\nCustomer: ${customerName}${customerId ? ` (${customerId})` : ''}${customerAddress ? `\nLokasi: ${customerAddress}` : ''}\nTipe: ${ticketTypeName}\n\nEquipment: ${equipment}\n\nTimeline:\n- Mulai: ${currentTime}\n- Target selesai: ${targetTime} (estimasi ${estimatedDuration} menit)\n- SLA Deadline: ${formatSLA()}\n\nStatus: "${oldStatus}" → "In Progress"\n\nPekerjaan ${ticketTypeName} sedang berlangsung. Teknisi sedang aktif di lokasi customer.`
      }
      
      // COMPLETED Status - Conditional by ticket type
      if (newStatus === 'completed') {
        const completionTime = formatDateTime(new Date())
        
        if (ticketTypeKey === 'installation') {
          return `✅ INSTALLATION SELESAI\n\nTeknisi: ${technicianName}${technicianId ? ` (${technicianId})` : ''}\nCustomer: ${customerName}${customerId ? ` (${customerId})` : ''}\nCompletion: ${completionTime}\n\nInstallation Summary:\n✓ Fiber optic installed & terminated\n✓ ONU configured & activated${packageName ? `\n✓ Service: ${packageName}` : ''}\n✓ Signal testing completed\n✓ Speed test passed\n✓ Customer demo & acceptance completed\n\nStatus: "${oldStatus}" → "Completed"\n\nInstalasi telah selesai dengan sukses. Layanan internet sudah aktif dan customer telah menerima demo penggunaan. Ticket ditutup.`
        }
        
        if (ticketTypeKey === 'maintenance') {
          return `✅ MAINTENANCE SELESAI\n\nTeknisi: ${technicianName}${technicianId ? ` (${technicianId})` : ''}\nCustomer: ${customerName}${customerId ? ` (${customerId})` : ''}\nCompletion: ${completionTime}\n\nResolution Summary:\n✓ Problem identified & resolved\n✓ Signal strength restored to normal\n✓ Service testing completed\n✓ Connectivity stable\n✓ Customer confirmation received\n\nStatus: "${oldStatus}" → "Completed"\n\nMasalah berhasil diselesaikan. Service kembali normal dan customer confirm satisfied. Ticket ditutup.`
        }
        
        if (ticketTypeKey === 'upgrade') {
          return `✅ UPGRADE SELESAI\n\nTeknisi: ${technicianName}${technicianId ? ` (${technicianId})` : ''}\nCustomer: ${customerName}${customerId ? ` (${customerId})` : ''}\nCompletion: ${completionTime}\n\nUpgrade Summary:\n✓ Bandwidth reconfigured${packageName ? `\n✓ New package: ${packageName}` : ''}\n✓ Speed test passed\n✓ Billing system synced\n✓ Customer notified\n\nStatus: "${oldStatus}" → "Completed"\n\nUpgrade service berhasil diselesaikan. Package baru sudah aktif dan speed sesuai target. Ticket ditutup.`
        }
        
        return `✅ PEKERJAAN SELESAI\n\nTeknisi: ${technicianName}${technicianId ? ` (${technicianId})` : ''}\nCustomer: ${customerName}${customerId ? ` (${customerId})` : ''}\nTipe: ${ticketTypeName}\nCompletion: ${completionTime}\n\nStatus: "${oldStatus}" → "Completed"\n\n${ticketTypeName} untuk ${customerName} telah selesai dikerjakan dengan baik. Semua pekerjaan telah diselesaikan sesuai SLA. Ticket ditutup.`
      }
      
      // ON_HOLD Status
      if (newStatus === 'on_hold') {
        return `⏸️ PEKERJAAN DITUNDA\n\nTeknisi: ${technicianName}${technicianId ? ` (${technicianId})` : ''}\nCustomer: ${customerName}${customerId ? ` (${customerId})` : ''}\nTipe: ${ticketTypeName}\n\nStatus: "${oldStatus}" → "On Hold"\n\nPekerjaan ${ticketTypeName} ditunda sementara. Menunggu:\n- Informasi tambahan dari customer, atau\n- Material/equipment yang diperlukan, atau\n- Konfirmasi dari dispatcher/management\n\nPekerjaan akan dilanjutkan setelah requirement terpenuhi. Ticket tetap di-monitor.`
      }
      
      // CANCELLED Status
      if (newStatus === 'cancelled') {
        return `❌ TICKET DIBATALKAN\n\nTiket: ${ticketTypeName} (${ticketId})\nCustomer: ${customerName}${customerId ? ` (${customerId})` : ''}\nCancelled: ${formatDateTime(new Date())}\n\nStatus: "${oldStatus}" → "Cancelled"\n\nTiket dibatalkan karena:\n- Request dari customer, atau\n- Tidak feasible secara teknis, atau\n- Duplicate ticket, atau\n- Alasan lainnya\n\nMohon hubungi dispatcher untuk informasi lebih lanjut jika diperlukan.`
      }
      
      // OPEN Status
      if (newStatus === 'open') {
        return `📋 TICKET DIBUKA KEMBALI\n\nTiket: ${ticketTypeName} (${ticketId})\nCustomer: ${customerName}${customerId ? ` (${customerId})` : ''}${customerAddress ? `\nLokasi: ${customerAddress}` : ''}\n\nStatus: "${oldStatus}" → "Open"\n\nTiket dibuka kembali dan menunggu assignment ke teknisi. Perlu tindak lanjut segera.\nSLA Deadline: ${formatSLA()}`
      }
      
      // Fallback for any other status
      return `📝 STATUS UPDATE\n\nTiket: ${ticketTypeName} (${ticketId})\nCustomer: ${customerName}${customerId ? ` (${customerId})` : ''}\n\nStatus berubah: "${oldStatus}" → "${newStatus}"\n\n${technicianName ? `Teknisi: ${technicianName}${technicianId ? ` (${technicianId})` : ''}\n` : ''}Update pada: ${formatDateTime(new Date())}`
    }

    // Auto-generate resolution notes untuk completed status
    const autoGenerateResolutionNotes = () => {
      // If user provided custom notes, use those
      if (data.resolution_notes && data.resolution_notes.trim()) return data.resolution_notes
      
      // Only auto-generate for completed status
      if (selectedStatus !== 'completed') return undefined
      
      const ticketType = (ticket.type || 'general').toLowerCase()
      const customerName = ticket.customer_name || 'Customer'
      const packageName = ticket.package_name || ''
      const bandwidth = ticket.bandwidth_down || ticket.bandwidth_up || ''
      const technicianName = ticket.technician_name || 'Technician'
      
      // Generate resolution based on ticket type
      switch(ticketType) {
        case 'installation':
          return `Installation untuk ${customerName} telah selesai dengan sukses. Fiber optic telah terpasang dengan baik dan signal quality dalam kondisi optimal. ONU telah dikonfigurasi${packageName ? ` untuk package ${packageName}` : ''}${bandwidth ? ` dengan bandwidth ${bandwidth} Mbps` : ''}. Speed test menunjukkan hasil sesuai spesifikasi. Customer telah menerima perangkat dalam kondisi baik, menerima demo penggunaan layanan, dan menandatangani berita acara serah terima. Layanan internet sudah aktif dan berjalan normal. Tidak ada issue yang ditemukan. Ticket ditutup dengan status completed.`
        
        case 'maintenance':
        case 'troubleshooting':
          return `Issue pada layanan ${customerName} berhasil diselesaikan. Root cause telah diidentifikasi dan diperbaiki. Signal strength telah kembali normal dan koneksi stabil. Testing dilakukan untuk memastikan tidak ada packet loss atau latency berlebih. Service telah berjalan dengan baik dan customer confirm bahwa masalah sudah teratasi. Pekerjaan maintenance selesai tanpa kendala. Ticket ditutup dengan status resolved.`
        
        case 'upgrade':
          return `Upgrade package untuk ${customerName} berhasil diselesaikan.${packageName ? ` New package ${packageName}` : ' Package baru'}${bandwidth ? ` dengan bandwidth ${bandwidth} Mbps` : ''} telah aktif dan berjalan normal. Rekonfigurasi bandwidth dilakukan di ONU dan core network. Speed test menunjukkan hasil sesuai dengan package baru. Billing system telah disinkronisasi dengan perubahan package. Customer telah diberitahu tentang perubahan layanan dan menerima konfirmasi aktivasi. Ticket ditutup dengan status completed.`
        
        case 'downgrade':
          return `Downgrade package untuk ${customerName} berhasil diproses.${packageName ? ` New package ${packageName}` : ' Package baru'}${bandwidth ? ` dengan bandwidth ${bandwidth} Mbps` : ''} telah aktif. Adjustment bandwidth dilakukan sesuai permintaan customer. Service plan telah diupdate di system dan billing. Layanan berjalan normal dengan konfigurasi baru. Customer confirm perubahan package sesuai dengan yang diinginkan. Ticket ditutup dengan status completed.`
        
        case 'relocation':
          return `Relokasi layanan untuk ${customerName} telah selesai. Perangkat telah dipindahkan ke lokasi baru dengan sukses. Fiber optic di-routing ulang dan koneksi telah di-establish dengan baik. Signal quality optimal di lokasi baru. Testing dilakukan dan semua berjalan normal. Customer confirm layanan sudah aktif di lokasi baru dan berfungsi dengan baik. Ticket ditutup dengan status completed.`
        
        default:
          return `Ticket ${ticket.type_name || ticketType} untuk ${customerName} telah diselesaikan dengan baik. Semua pekerjaan yang diperlukan telah dikerjakan sesuai SLA. Testing telah dilakukan dan hasilnya memuaskan. Customer confirm satisfied dengan hasil pekerjaan. Tidak ada outstanding issue. Ticket ditutup dengan status completed.`
      }
    }

    const updateData = {
      status: selectedStatus,
      notes: autoGenerateNotes(),
      work_notes: data.work_notes || undefined,
      resolution_notes: autoGenerateResolutionNotes(),
      customer_rating: data.customer_rating || undefined,
      customer_feedback: data.customer_feedback || undefined
    }

    // Kirim assigned_technician_id atau team assignment jika:
    // 1. Status berubah ke 'assigned' dari 'open' (assign pertama kali)
    // 2. Atau ada technician yang dipilih di form (re-assign)
    if (selectedStatus === 'assigned') {
      if (assignmentMode === 'single' && selectedTechnician) {
        // Single technician assignment
        updateData.assigned_technician_id = parseInt(selectedTechnician, 10)
        console.log('=== FRONTEND: Sending SINGLE technician assignment ===');
        console.log('Selected Technician:', selectedTechnician);
        console.log('Parsed Technician ID:', updateData.assigned_technician_id);
      } else if (assignmentMode === 'multiple' && teamMembers.length > 0) {
        // Multiple technicians (team) assignment
        updateData.team_assignment = teamMembers.map(member => ({
          technician_id: member.technician_id,
          role: member.role,
          notes: null
        }))
        // Set lead as main assigned_technician_id
        const lead = teamMembers.find(m => m.role === 'lead')
        if (lead) {
          updateData.assigned_technician_id = lead.technician_id
        }
        console.log('=== FRONTEND: Sending TEAM assignment ===');
        console.log('Team Members:', teamMembers.length);
        console.log('Team Data:', updateData.team_assignment);
        console.log('Lead Technician ID:', updateData.assigned_technician_id);
      }
      console.log('Ticket Current Status:', ticket.status);
      console.log('New Status:', selectedStatus);
    }

    console.log('=== FRONTEND: Final Update Data ===');
    console.log(JSON.stringify(updateData, null, 2));

    // Completion fields berdasarkan service type - hanya kirim jika status 'completed'
    if (selectedStatus === 'completed') {
      // Convert files to base64 - use stored file objects instead of data.field
      console.log('🔄 [SUBMIT] Converting files to base64...');
      const otdr_photo_base64 = otdrFile ? await fileToBase64(otdrFile) : null
      const attenuation_photo_base64 = attenuationFile ? await fileToBase64(attenuationFile) : null
      const modem_sn_photo_base64 = modemSnFile ? await fileToBase64(modemSnFile) : null
      
      console.log('🔄 [SUBMIT] Files converted:', {
        otdr: otdr_photo_base64 ? 'OK' : 'None',
        attenuation: attenuation_photo_base64 ? 'OK' : 'None',
        modemSn: modem_sn_photo_base64 ? 'OK' : 'None'
      });
      
      // Find selected ODP ID
      const selectedOdpData = odpList?.find(odp => odp.name === data.odp_location)
      
      updateData.completion_data = {
        odp_location: data.odp_location,
        odp_id: selectedOdpData?.id || null,
        odp_distance: data.odp_distance,
        otdr_photo: otdr_photo_base64 ? {
          filename: otdrFile.name,
          data: otdr_photo_base64
        } : null,
        final_attenuation: data.final_attenuation,
        attenuation_photo: attenuation_photo_base64 ? {
          filename: attenuationFile.name,
          data: attenuation_photo_base64
        } : null,
        wifi_name: data.wifi_name,
        wifi_password: data.wifi_password,
        activation_date: data.activation_date,
        modem_sn_photo: modem_sn_photo_base64 ? {
          filename: modemSnFile.name,
          data: modem_sn_photo_base64
        } : null,
        repair_date: data.repair_date,
        new_category: data.new_category,
        // Upgrade/Downgrade fields
        new_package: data.new_package,
        upgrade_notes: data.upgrade_notes,
        downgrade_notes: data.downgrade_notes
      }
      
      // Log file info for debugging
      console.log('=== FILE UPLOADS ===');
      if (otdrFile) console.log('OTDR Photo:', otdrFile.name, otdrFile.size, 'bytes');
      if (attenuationFile) console.log('Attenuation Photo:', attenuationFile.name, attenuationFile.size, 'bytes');
      if (modemSnFile) console.log('Modem SN Photo:', modemSnFile.name, modemSnFile.size, 'bytes');
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
              placeholder="Optional: Add custom notes (leave empty to auto-generate detailed message)..."
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
            <div className="space-y-4">
              <div>
                <label className="form-label mb-3">
                  {ticket.status === 'open' ? 'Assign to Technician(s) *' : 'Re-assign Technician(s) (optional)'}
                </label>
                
                {/* Assignment Mode Toggle */}
                <div className="flex items-center gap-6 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Assignment Mode:</span>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-blue-600"
                      checked={assignmentMode === 'single'}
                      onChange={() => {
                        setAssignmentMode('single')
                        setTeamMembers([])
                      }}
                    />
                    <span className="ml-2 text-sm text-gray-700">Single Technician</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-blue-600"
                      checked={assignmentMode === 'multiple'}
                      onChange={() => {
                        setAssignmentMode('multiple')
                        setSelectedTechnician('')
                      }}
                    />
                    <span className="ml-2 text-sm text-gray-700 flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Multiple Technicians (Team)
                    </span>
                  </label>
                </div>

                {/* SINGLE TECHNICIAN MODE */}
                {assignmentMode === 'single' && (
                  <div>
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

                {/* MULTIPLE TECHNICIANS MODE */}
                {assignmentMode === 'multiple' && (
                  <div className="space-y-3">
                    {/* Team Members Table */}
                    {teamMembers.length > 0 && (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Technician
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {teamMembers.map((member, index) => (
                              <tr key={member.technician_id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    {member.role === 'lead' && (
                                      <Star className="h-4 w-4 text-yellow-500 mr-2" />
                                    )}
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {member.full_name}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {member.employee_id}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <select
                                    className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={member.role}
                                    onChange={(e) => {
                                      const newRole = e.target.value
                                      setTeamMembers(prev => {
                                        // If changing to lead, demote other leads to member
                                        if (newRole === 'lead') {
                                          return prev.map((m, i) => ({
                                            ...m,
                                            role: i === index ? 'lead' : (m.role === 'lead' ? 'member' : m.role)
                                          }))
                                        }
                                        // Just update this member's role
                                        return prev.map((m, i) => 
                                          i === index ? { ...m, role: newRole } : m
                                        )
                                      })
                                    }}
                                  >
                                    <option value="lead">Lead</option>
                                    <option value="member">Member</option>
                                    <option value="support">Support</option>
                                  </select>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {member.phone || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTeamMembers(prev => prev.filter((_, i) => i !== index))
                                    }}
                                    className="inline-flex items-center px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Add Technician Dropdown */}
                    {showAddTechnicianDropdown ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="form-input flex-1"
                          onChange={(e) => {
                            const techId = parseInt(e.target.value)
                            if (!techId) return
                            
                            const tech = techniciansData?.data?.technicians?.find(t => t.id === techId)
                            if (!tech) return
                            
                            // Check if already added
                            if (teamMembers.find(m => m.technician_id === techId)) {
                              alert('Technician already added to team')
                              return
                            }
                            
                            // Determine role: first member is lead, others are members
                            const role = teamMembers.length === 0 ? 'lead' : 'member'
                            
                            setTeamMembers(prev => [...prev, {
                              technician_id: techId,
                              full_name: tech.full_name || tech.user_full_name,
                              employee_id: tech.employee_id || tech.employee_code,
                              phone: tech.phone || '',
                              role: role
                            }])
                            
                            setShowAddTechnicianDropdown(false)
                          }}
                          autoFocus
                        >
                          <option value="">Select technician to add...</option>
                          {techniciansData?.data?.technicians
                            ?.filter(tech => !teamMembers.find(m => m.technician_id === tech.id))
                            ?.map((tech) => (
                              <option key={tech.id} value={tech.id}>
                                {tech.full_name || tech.user_full_name} ({tech.employee_id || tech.employee_code}) - {tech.skill_level}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowAddTechnicianDropdown(false)}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddTechnicianDropdown(true)}
                        disabled={techniciansLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add Technician to Team
                      </button>
                    )}

                    {/* Validation Messages */}
                    {teamMembers.length === 0 && ticket.status === 'open' && (
                      <p className="text-sm text-red-600">At least 1 technician is required</p>
                    )}
                    {teamMembers.length > 0 && !teamMembers.find(m => m.role === 'lead') && (
                      <p className="text-sm text-yellow-600">⚠️ Please designate one technician as Lead</p>
                    )}

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-700">
                        <strong>💡 Team Assignment Tips:</strong>
                      </p>
                      <ul className="text-sm text-blue-600 mt-2 space-y-1 ml-4 list-disc">
                        <li>Add 2+ technicians to form a team</li>
                        <li>One technician must be designated as <strong>Lead</strong> (coordinator)</li>
                        <li>Lead is responsible for coordination and progress updates</li>
                        <li>All team members will receive WhatsApp notifications</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resolution Notes (for completed status) */}
          {selectedStatus === 'completed' && (
            <div>
              <label className="form-label">Resolution Notes</label>
              <textarea
                rows={3}
                className="form-input"
                placeholder="Optional: Add custom resolution notes (leave empty to auto-generate summary)..."
                {...register('resolution_notes')}
              />
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
                    {/* 1. Lokasi ODP */}
                    <div>
                      <label className="form-label">Lokasi ODP *</label>
                      <select
                        className={`form-input ${errors.odp_location ? 'border-red-500' : ''}`}
                        {...register('odp_location', { required: 'Lokasi ODP is required' })}
                        disabled={odpLoading}
                      >
                        <option value="">
                          {odpLoading ? 'Loading ODP data...' : odpError ? 'Error loading ODP' : !odpList || odpList.length === 0 ? 'No active ODP available' : 'Pilih ODP...'}
                        </option>
                        {odpList?.map((odp) => (
                          <option key={odp.id} value={odp.name}>
                            {odp.name} - {odp.location}
                          </option>
                        ))}
                      </select>
                      {odpLoading && <p className="text-xs text-blue-600 mt-1">⏳ Loading ODP list...</p>}
                      {odpError && <p className="text-xs text-red-600 mt-1">⚠️ Error: {odpError.message || 'Failed to load ODP data'}</p>}
                      {!odpLoading && !odpError && odpList?.length === 0 && (
                        <p className="text-xs text-orange-600 mt-1">⚠️ No active ODP found. Please add ODP in Master Data first.</p>
                      )}
                      {errors.odp_location && <p className="form-error">{errors.odp_location.message}</p>}
                    </div>

                    {/* 2. Jarak ODP */}
                    <div>
                      <label className="form-label">Jarak ODP (meter) *</label>
                      <input
                        type="number"
                        className={`form-input ${errors.odp_distance ? 'border-red-500' : ''}`}
                        {...register('odp_distance', { required: 'Jarak ODP is required' })}
                      />
                      {errors.odp_distance && <p className="form-error">{errors.odp_distance.message}</p>}
                    </div>

                    {/* 3. Redaman Terakhir */}
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

                    {/* 4. Nama WiFi */}
                    <div>
                      <label className="form-label">Nama WiFi *</label>
                      <input
                        type="text"
                        className={`form-input ${errors.wifi_name ? 'border-red-500' : ''}`}
                        {...register('wifi_name', { required: 'Nama WiFi is required' })}
                      />
                      {errors.wifi_name && <p className="form-error">{errors.wifi_name.message}</p>}
                    </div>

                    {/* 5. Password WiFi */}
                    <div>
                      <label className="form-label">Password WiFi *</label>
                      <input
                        type="text"
                        className={`form-input ${errors.wifi_password ? 'border-red-500' : ''}`}
                        {...register('wifi_password', { required: 'Password WiFi is required' })}
                      />
                      {errors.wifi_password && <p className="form-error">{errors.wifi_password.message}</p>}
                    </div>

                    {/* 6. Tanggal Aktif */}
                    <div>
                      <label className="form-label">Tanggal Aktif *</label>
                      <input
                        type="datetime-local"
                        className={`form-input ${errors.activation_date ? 'border-red-500' : ''}`}
                        {...register('activation_date', { required: 'Tanggal Aktif is required' })}
                      />
                      {errors.activation_date && <p className="form-error">{errors.activation_date.message}</p>}
                    </div>

                    {/* 7. Foto OTDR */}
                    <div className="md:col-span-2">
                      <label className="form-label">Foto OTDR *</label>
                      <input
                        type="file"
                        id="otdr-photo-input"
                        accept="image/*"
                        className="hidden"
                        ref={register('otdr_photo').ref}
                        name="otdr_photo"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          console.log('📁 OTDR Photo selected:', file?.name);
                          if (file) {
                            // Store file object for display
                            setOtdrFile(file);
                            // Generate preview directly
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              console.log('✅ OTDR Preview generated');
                              setOtdrPreview(reader.result);
                            };
                            reader.readAsDataURL(file);
                            // Set value for form submission
                            setValue('otdr_photo', e.target.files);
                          }
                        }}
                      />
                      
                      {/* Upload Button or Preview */}
                      {!otdrPreview ? (
                        <button
                          type="button"
                          onClick={() => {
                            console.log('🎯 Triggering OTDR file picker...');
                            document.getElementById('otdr-photo-input').click();
                          }}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition-all ${
                            errors.otdr_photo
                              ? 'border-red-500 bg-red-50 hover:bg-red-100'
                              : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-500'
                          }`}
                        >
                          <Upload className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">
                            Klik untuk pilih Foto OTDR
                          </span>
                        </button>
                      ) : (
                        <div className="border-2 border-green-500 bg-green-50 rounded-lg overflow-hidden">
                          <div className="relative">
                            <img 
                              src={otdrPreview} 
                              alt="OTDR Preview" 
                              className="w-full h-48 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => window.open(otdrPreview, '_blank')}
                              className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                              title="Preview full size"
                            >
                              <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
                          <div className="p-3 bg-white border-t-2 border-green-500">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm font-semibold text-green-700 truncate" title={otdrFile?.name}>
                                  {otdrFile?.name}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setValue('otdr_photo', null);
                                  setOtdrPreview(null);
                                  setOtdrFile(null);
                                }}
                                className="ml-2 text-red-600 hover:text-red-700 flex-shrink-0"
                                title="Remove file"
                              >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                            <p className="text-xs text-gray-600">
                              Size: {(otdrFile?.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 8. Foto Redaman Terakhir */}
                    <div className="md:col-span-2">
                      <label className="form-label">Foto Redaman Terakhir *</label>
                      <input
                        type="file"
                        id="attenuation-photo-input"
                        accept="image/*"
                        className="hidden"
                        ref={register('attenuation_photo').ref}
                        name="attenuation_photo"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          console.log('📁 Attenuation Photo selected:', file?.name);
                          if (file) {
                            setAttenuationFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              console.log('✅ Attenuation Preview generated');
                              setAttenuationPreview(reader.result);
                            };
                            reader.readAsDataURL(file);
                            setValue('attenuation_photo', e.target.files);
                          }
                        }}
                      />
                      
                      {/* Upload Button or Preview */}
                      {!attenuationPreview ? (
                        <button
                          type="button"
                          onClick={() => {
                            console.log('🎯 Triggering Attenuation file picker...');
                            document.getElementById('attenuation-photo-input').click();
                          }}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition-all ${
                            errors.attenuation_photo
                              ? 'border-red-500 bg-red-50 hover:bg-red-100'
                              : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-500'
                          }`}
                        >
                          <Upload className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">
                            Klik untuk pilih Foto Redaman
                          </span>
                        </button>
                      ) : (
                        <div className="border-2 border-green-500 bg-green-50 rounded-lg overflow-hidden">
                          <div className="relative">
                            <img 
                              src={attenuationPreview} 
                              alt="Attenuation Preview" 
                              className="w-full h-48 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => window.open(attenuationPreview, '_blank')}
                              className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                              title="Preview full size"
                            >
                              <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
                          <div className="p-3 bg-white border-t-2 border-green-500">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm font-semibold text-green-700 truncate" title={attenuationFile?.name}>
                                  {attenuationFile?.name}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setValue('attenuation_photo', null);
                                  setAttenuationPreview(null);
                                  setAttenuationFile(null);
                                }}
                                className="ml-2 text-red-600 hover:text-red-700 flex-shrink-0"
                                title="Remove file"
                              >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                            <p className="text-xs text-gray-600">
                              Size: {(attenuationFile?.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 9. Foto SN Modem */}
                    <div className="md:col-span-2">
                      <label className="form-label">Foto SN Modem *</label>
                      <input
                        type="file"
                        id="modem-sn-photo-input"
                        accept="image/*"
                        className="hidden"
                        ref={register('modem_sn_photo').ref}
                        name="modem_sn_photo"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          console.log('📁 Modem SN Photo selected:', file?.name);
                          if (file) {
                            setModemSnFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              console.log('✅ Modem SN Preview generated');
                              setModemSnPreview(reader.result);
                            };
                            reader.readAsDataURL(file);
                            setValue('modem_sn_photo', e.target.files);
                          }
                        }}
                      />
                      
                      {/* Upload Button or Preview */}
                      {!modemSnPreview ? (
                        <button
                          type="button"
                          onClick={() => {
                            console.log('🎯 Triggering Modem SN file picker...');
                            document.getElementById('modem-sn-photo-input').click();
                          }}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition-all ${
                            errors.modem_sn_photo
                              ? 'border-red-500 bg-red-50 hover:bg-red-100'
                              : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-500'
                          }`}
                        >
                          <Upload className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">
                            Klik untuk pilih Foto SN Modem
                          </span>
                        </button>
                      ) : (
                        <div className="border-2 border-green-500 bg-green-50 rounded-lg overflow-hidden">
                          <div className="relative">
                            <img 
                              src={modemSnPreview} 
                              alt="Modem SN Preview" 
                              className="w-full h-48 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => window.open(modemSnPreview, '_blank')}
                              className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                              title="Preview full size"
                            >
                              <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
                          <div className="p-3 bg-white border-t-2 border-green-500">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm font-semibold text-green-700 truncate" title={modemSnFile?.name}>
                                  {modemSnFile?.name}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setValue('modem_sn_photo', null);
                                  setModemSnPreview(null);
                                  setModemSnFile(null);
                                }}
                                className="ml-2 text-red-600 hover:text-red-700 flex-shrink-0"
                                title="Remove file"
                              >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                            <p className="text-xs text-gray-600">
                              Size: {(modemSnFile?.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      )}
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
                      <select
                        className={`form-input ${errors.odp_location ? 'border-red-500' : ''}`}
                        {...register('odp_location', { required: 'Lokasi ODP is required' })}
                        disabled={odpLoading}
                      >
                        <option value="">
                          {odpLoading ? 'Loading ODP data...' : odpError ? 'Error loading ODP' : !odpList || odpList.length === 0 ? 'No active ODP available' : 'Pilih ODP...'}
                        </option>
                        {odpList?.map((odp) => (
                          <option key={odp.id} value={odp.name}>
                            {odp.name} - {odp.location}
                          </option>
                        ))}
                      </select>
                      {odpLoading && <p className="text-xs text-blue-600 mt-1">⏳ Loading ODP list...</p>}
                      {odpError && <p className="text-xs text-red-600 mt-1">⚠️ Error: {odpError.message || 'Failed to load ODP data'}</p>}
                      {!odpLoading && !odpError && odpList?.length === 0 && (
                        <p className="text-xs text-orange-600 mt-1">⚠️ No active ODP found. Please add ODP in Master Data first.</p>
                      )}
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
                        <input
                          type="file"
                        id="maintenance-attenuation-photo-input"
                          accept="image/*"
                        className="hidden"
                        ref={register('attenuation_photo').ref}
                        name="attenuation_photo"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          console.log('📁 Maintenance Attenuation Photo selected:', file?.name);
                          if (file) {
                            setAttenuationFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              console.log('✅ Maintenance Attenuation Preview generated');
                              setAttenuationPreview(reader.result);
                            };
                            reader.readAsDataURL(file);
                            setValue('attenuation_photo', e.target.files);
                          }
                        }}
                      />
                      
                      {/* Upload Button or Preview */}
                      {!attenuationPreview ? (
                        <button
                          type="button"
                          onClick={() => {
                            console.log('🎯 Triggering Maintenance Attenuation file picker...');
                            document.getElementById('maintenance-attenuation-photo-input').click();
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition-all border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-orange-500"
                        >
                          <Upload className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">
                            Klik untuk pilih Foto Redaman (Optional)
                          </span>
                        </button>
                      ) : (
                        <div className="border-2 border-green-500 bg-green-50 rounded-lg overflow-hidden">
                          <div className="relative">
                            <img 
                              src={attenuationPreview} 
                              alt="Attenuation Preview" 
                              className="w-full h-48 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => window.open(attenuationPreview, '_blank')}
                              className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                              title="Preview full size"
                            >
                              <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
                          <div className="p-3 bg-white border-t-2 border-green-500">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm font-semibold text-green-700 truncate" title={attenuationFile?.name}>
                                  {attenuationFile?.name}
                                </p>
                      </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setValue('attenuation_photo', null);
                                  setAttenuationPreview(null);
                                  setAttenuationFile(null);
                                }}
                                className="ml-2 text-red-600 hover:text-red-700 flex-shrink-0"
                                title="Remove file"
                              >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                            <p className="text-xs text-gray-600">
                              Size: {(attenuationFile?.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      )}
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Paket Baru *</label>
                      <select
                        className={`form-input ${errors.new_package ? 'border-red-500' : ''}`}
                        {...register('new_package', { required: 'Paket baru is required' })}
                        disabled={packagesLoading}
                      >
                        <option value="">
                          {packagesLoading ? 'Loading packages...' : 'Pilih Paket Baru...'}
                        </option>
                        {packagesList?.map((pkg) => (
                          <option key={pkg.id} value={pkg.name || pkg.package_name}>
                            {pkg.name || pkg.package_name} - {pkg.speed_mbps || pkg.speed} Mbps - Rp {(pkg.price || pkg.monthly_price)?.toLocaleString('id-ID')}
                          </option>
                        ))}
                      </select>
                      {packagesError && <p className="form-error">Error loading packages: {packagesError.message}</p>}
                      {!packagesLoading && packagesList && packagesList.length === 0 && (
                        <p className="text-xs text-amber-600">No active packages available</p>
                      )}
                      {errors.new_package && <p className="form-error">{errors.new_package.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Catatan Upgrade</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., Dari 100 Mbps ke 200 Mbps"
                        {...register('upgrade_notes')}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Downgrade Fields */}
              {ticket.type === 'downgrade' && (
                <div className="space-y-4 bg-amber-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-amber-900">Downgrade Completion Fields</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Paket Baru *</label>
                      <select
                        className={`form-input ${errors.new_package ? 'border-red-500' : ''}`}
                        {...register('new_package', { required: 'Paket baru is required' })}
                        disabled={packagesLoading}
                      >
                        <option value="">
                          {packagesLoading ? 'Loading packages...' : 'Pilih Paket Baru...'}
                        </option>
                        {packagesList?.map((pkg) => (
                          <option key={pkg.id} value={pkg.name || pkg.package_name}>
                            {pkg.name || pkg.package_name} - {pkg.speed_mbps || pkg.speed} Mbps - Rp {(pkg.price || pkg.monthly_price)?.toLocaleString('id-ID')}
                          </option>
                        ))}
                      </select>
                      {packagesError && <p className="form-error">Error loading packages: {packagesError.message}</p>}
                      {!packagesLoading && packagesList && packagesList.length === 0 && (
                        <p className="text-xs text-amber-600">No active packages available</p>
                      )}
                      {errors.new_package && <p className="form-error">{errors.new_package.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Catatan Downgrade</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., Dari 200 Mbps ke 100 Mbps"
                        {...register('downgrade_notes')}
                      />
                    </div>
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
