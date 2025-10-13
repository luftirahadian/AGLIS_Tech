import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  User, Phone, Mail, MapPin, Package, Calendar,
  CheckCircle, XCircle, Clock, AlertCircle, FileText,
  Home, UserCheck, ClipboardCheck, Settings, DollarSign,
  PhoneCall, Mail as MailIcon
} from 'lucide-react'
import registrationService from '../../services/registrationService'
import packageService from '../../services/packageService'
import LoadingSpinner from '../../components/LoadingSpinner'
import BackButton from '../../components/common/BackButton'
import ConfirmationModal from '../../components/ConfirmationModal'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const RegistrationDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Determine default tab based on status
  const [activeTab, setActiveTab] = useState('details')
  
  // State untuk form actions
  const [actionType, setActionType] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [surveyDate, setSurveyDate] = useState('')
  const [surveyResults, setSurveyResults] = useState('')
  const [actionNotes, setActionNotes] = useState('')

  // Create customer confirmation modal
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false)

  // Fetch registration detail
  const { data: registrationData, isLoading, error } = useQuery(
    ['registration', id],
    () => registrationService.getById(id),
    {
      enabled: !!id,
      staleTime: 30000
    }
  )

  // Fetch packages
  const { data: packagesData } = useQuery(
    'packages',
    packageService.getAll,
    { refetchOnWindowFocus: false }
  )

  const registration = registrationData?.data
  const selectedPackage = packagesData?.data?.find(pkg => pkg.id === registration?.package_id)

  // ==================== RBAC CHECK ====================
  const isAdmin = user?.role === 'admin'
  const isSupervisor = user?.role === 'supervisor'
  const isCustomerService = user?.role === 'customer_service'
  const canVerify = isAdmin || isSupervisor || isCustomerService
  const canReject = isAdmin || isSupervisor || isCustomerService
  const canApprove = isAdmin || isSupervisor || isCustomerService
  const canCreateCustomer = isAdmin || isSupervisor || isCustomerService

  // Auto-switch to Actions tab for verified/survey registrations only (NOT for pending)
  useEffect(() => {
    if (registration && ['verified', 'survey_scheduled', 'survey_completed'].includes(registration.status)) {
      setActiveTab('actions')
    }
  }, [registration])

  // Update status mutation
  const updateStatusMutation = useMutation(
    ({ id, data }) => registrationService.updateStatus(id, data),
    {
      onSuccess: () => {
        toast.success('Status berhasil diupdate')
        queryClient.invalidateQueries(['registration', id])
        queryClient.invalidateQueries('registrations')
        // Reset form
        setActionType('')
        setRejectionReason('')
        setSurveyDate('')
        setSurveyResults('')
        setActionNotes('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal update status')
      }
    }
  )

  // Create customer mutation
  const createCustomerMutation = useMutation(
    (regId) => registrationService.createCustomer(regId),
    {
      onSuccess: (data) => {
        toast.success('Customer dan ticket instalasi berhasil dibuat!')
        queryClient.invalidateQueries(['registration', id])
        queryClient.invalidateQueries('registrations')
        queryClient.invalidateQueries('customers')
        queryClient.invalidateQueries('tickets')
      },
      onError: (error) => {
        console.error('❌ CREATE CUSTOMER ERROR:', error)
        toast.error(error.response?.data?.message || 'Gagal membuat customer')
      }
    }
  )

  const handleSubmitAction = () => {
    if (!registration) return

    let data = {
      status: actionType,
      notes: actionNotes
    }

    if (actionType === 'rejected') {
      if (!rejectionReason.trim()) {
        toast.error('Alasan penolakan wajib diisi')
        return
      }
      data.rejection_reason = rejectionReason
    }

    if (actionType === 'survey_scheduled') {
      if (!surveyDate) {
        toast.error('Tanggal survey wajib diisi')
        return
      }
      data.survey_scheduled_date = surveyDate
    }

    if (actionType === 'survey_completed') {
      if (!surveyResults.trim()) {
        toast.error('Hasil survey wajib diisi')
        return
      }
      data.survey_notes = surveyResults
      data.survey_result = 'feasible'
    }

    updateStatusMutation.mutate({ id: registration.id, data })
  }

  const handleCreateCustomer = () => {
    setShowCreateCustomerModal(true)
  }

  const confirmCreateCustomer = () => {
    createCustomerMutation.mutate(registration.id)
    setShowCreateCustomerModal(false)
  }

  // ==================== QUICK ACTION HANDLERS ====================

  const handleQuickCall = () => {
    window.location.href = `tel:${registration.phone}`
  }

  const handleQuickEmail = () => {
    window.location.href = `mailto:${registration.email}`
  }

  const handleQuickVerify = async () => {
    if (!window.confirm(`Verify registration ${registration.registration_number}?`)) return

    try {
      await registrationService.updateStatus(registration.id, 'verified', { notes: 'Quick verified' })
      toast.success(`Registration ${registration.registration_number} verified`)
      queryClient.invalidateQueries(['registration', id])
      queryClient.invalidateQueries('registrations')
    } catch (error) {
      toast.error('Failed to verify registration')
      console.error('Quick verify error:', error)
    }
  }

  const handleQuickReject = async () => {
    const reason = window.prompt('Alasan reject:')
    if (!reason) return

    try {
      await registrationService.updateStatus(registration.id, 'rejected', { 
        rejection_reason: reason,
        notes: 'Quick rejected'
      })
      toast.success(`Registration ${registration.registration_number} rejected`)
      queryClient.invalidateQueries(['registration', id])
      queryClient.invalidateQueries('registrations')
    } catch (error) {
      toast.error('Failed to reject registration')
      console.error('Quick reject error:', error)
    }
  }

  const handleQuickApprove = async () => {
    if (!window.confirm(`Approve registration ${registration.registration_number}?`)) return

    try {
      await registrationService.updateStatus(registration.id, 'approved', { notes: 'Quick approved' })
      toast.success(`Registration ${registration.registration_number} approved`)
      queryClient.invalidateQueries(['registration', id])
      queryClient.invalidateQueries('registrations')
    } catch (error) {
      toast.error('Failed to approve registration')
      console.error('Quick approve error:', error)
    }
  }

  const handleQuickScheduleSurvey = async () => {
    const surveyDate = window.prompt('Survey date (YYYY-MM-DD):', new Date().toISOString().split('T')[0])
    if (!surveyDate) return

    try {
      await registrationService.updateStatus(registration.id, 'survey_scheduled', { 
        survey_date: surveyDate,
        notes: 'Survey scheduled via quick action'
      })
      toast.success(`Survey scheduled for ${registration.registration_number}`)
      queryClient.invalidateQueries(['registration', id])
      queryClient.invalidateQueries('registrations')
    } catch (error) {
      toast.error('Failed to schedule survey')
      console.error('Quick schedule survey error:', error)
    }
  }

  const formatStatusText = (status) => {
    if (!status) return '-'
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_verification: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      verified: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
      survey_scheduled: { color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: Calendar },
      survey_completed: { color: 'bg-purple-100 text-purple-800 border-purple-300', icon: ClipboardCheck },
      approved: { color: 'bg-green-100 text-green-800 border-green-300', icon: UserCheck },
      customer_created: { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: Home },
      rejected: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle }
    }

    const config = statusConfig[status] || statusConfig.pending_verification
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon className="h-4 w-4" />
        {formatStatusText(status)}
      </span>
    )
  }

  const formatCurrency = (amount) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <AlertCircle className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Registration Not Found</h3>
        <p className="text-gray-500 mb-4">Pendaftaran tidak ditemukan</p>
        <BackButton to="/registrations" label="Back to Registrations" />
      </div>
    )
  }

  const tabs = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'actions', label: 'Actions', icon: Settings },
    { id: 'timeline', label: 'Timeline', icon: Calendar }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BackButton to="/registrations" label="Back to Registrations" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {registration.registration_number} - {registration.full_name}
            </h1>
            <p className="text-gray-600">Pendaftaran Customer Baru</p>
          </div>
        </div>
        <div>
          {getStatusBadge(registration.status)}
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Customer */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2 mr-3" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600">Customer</p>
                <p className="text-base font-semibold text-gray-900 truncate">{registration.full_name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {registration.phone}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Email */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-green-600 bg-green-100 rounded-lg p-2 mr-3" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{registration.email}</p>
                {registration.whatsapp_verified && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    WhatsApp Verified
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Package */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600 bg-purple-100 rounded-lg p-2 mr-3" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600">Package</p>
                <p className="text-base font-semibold text-gray-900 truncate">
                  {selectedPackage?.name || 'Loading...'}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedPackage ? formatCurrency(selectedPackage.price) + '/bln' : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Status & Date */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600 bg-orange-100 rounded-lg p-2 mr-3" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600">Created</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatDate(registration.created_at)}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(registration.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {!['customer_created', 'rejected', 'cancelled'].includes(registration.status) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Quick Call */}
              {registration.phone && (
                <button
                  onClick={handleQuickCall}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <PhoneCall className="h-4 w-4" />
                  Call Customer
                </button>
              )}

              {/* Quick Email */}
              {registration.email && (
                <button
                  onClick={handleQuickEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <MailIcon className="h-4 w-4" />
                  Email Customer
                </button>
              )}

              {/* Quick Verify (only for pending) */}
              {canVerify && registration.status === 'pending_verification' && (
                <button
                  onClick={handleQuickVerify}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <UserCheck className="h-4 w-4" />
                  Quick Verify
                </button>
              )}

              {/* Quick Approve (only for verified) */}
              {canApprove && registration.status === 'verified' && (
                <button
                  onClick={handleQuickApprove}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  Quick Approve
                </button>
              )}

              {/* Quick Schedule Survey (only for verified) */}
              {canVerify && registration.status === 'verified' && (
                <button
                  onClick={handleQuickScheduleSurvey}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule Survey
                </button>
              )}

              {/* Quick Create Customer (only for approved) */}
              {canCreateCustomer && registration.status === 'approved' && !registration.customer_id && (
                <button
                  onClick={handleCreateCustomer}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  Create Customer
                </button>
              )}

              {/* Quick Reject (only for non-final statuses) */}
              {canReject && !['customer_created', 'rejected', 'cancelled'].includes(registration.status) && (
                <button
                  onClick={handleQuickReject}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Quick Reject
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs Card */}
      <div className="card">
        {/* Tabs Navigation */}
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
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="card-body">
          {/* DETAILS TAB */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Personal & Address Info - 2 Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Data Pribadi</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Nama Lengkap</p>
                        <p className="font-medium text-gray-900">{registration.full_name}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{registration.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">WhatsApp</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{registration.phone}</p>
                          {registration.whatsapp_verified && (
                            <CheckCircle className="h-4 w-4 text-green-500" title="Verified" />
                          )}
                        </div>
                      </div>
                    </div>

                    {registration.id_card_number && (
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Nomor KTP</p>
                          <p className="font-medium text-gray-900">{registration.id_card_number}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Alamat</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Alamat Lengkap</p>
                        <p className="text-gray-900">{registration.address}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pl-8">
                      {registration.rt && (
                        <div>
                          <p className="text-sm text-gray-500">RT</p>
                          <p className="font-medium text-gray-900">{registration.rt}</p>
                        </div>
                      )}
                      {registration.rw && (
                        <div>
                          <p className="text-sm text-gray-500">RW</p>
                          <p className="font-medium text-gray-900">{registration.rw}</p>
                        </div>
                      )}
                      {registration.kelurahan && (
                        <div>
                          <p className="text-sm text-gray-500">Kelurahan</p>
                          <p className="font-medium text-gray-900">{registration.kelurahan}</p>
                        </div>
                      )}
                      {registration.kecamatan && (
                        <div>
                          <p className="text-sm text-gray-500">Kecamatan</p>
                          <p className="font-medium text-gray-900">{registration.kecamatan}</p>
                        </div>
                      )}
                      {registration.city && (
                        <div>
                          <p className="text-sm text-gray-500">Kota</p>
                          <p className="font-medium text-gray-900">{registration.city}</p>
                        </div>
                      )}
                      {registration.postal_code && (
                        <div>
                          <p className="text-sm text-gray-500">Kode Pos</p>
                          <p className="font-medium text-gray-900">{registration.postal_code}</p>
                        </div>
                      )}
                    </div>

                    {registration.address_notes && (
                      <div className="pl-8 pt-2 border-t">
                        <p className="text-sm text-gray-500">Catatan Alamat</p>
                        <p className="text-sm text-gray-700 italic">{registration.address_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Package Information - Full Width */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Informasi Paket</h4>
                {selectedPackage ? (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Package className="h-10 w-10 text-blue-600 bg-white rounded-lg p-2 shadow-sm" />
                        <div>
                          <h5 className="text-xl font-semibold text-gray-900">{selectedPackage.name}</h5>
                          <p className="text-sm text-gray-600 mt-1">{selectedPackage.description}</p>
                          
                          <div className="flex items-center gap-6 mt-4">
                            <div>
                              <p className="text-xs text-gray-500">Kecepatan</p>
                              <p className="text-lg font-semibold text-blue-600">
                                {selectedPackage.speed_mbps} Mbps
                              </p>
                            </div>
                            <div className="h-8 w-px bg-gray-300"></div>
                            <div>
                              <p className="text-xs text-gray-500">Harga Bulanan</p>
                              <p className="text-lg font-semibold text-green-600">
                                {formatCurrency(selectedPackage.price)}
                              </p>
                            </div>
                            <div className="h-8 w-px bg-gray-300"></div>
                            <div>
                              <p className="text-xs text-gray-500">Tipe</p>
                              <p className="text-sm font-medium text-gray-900 capitalize">
                                {selectedPackage.type}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Installation Preference */}
                    {registration.preferred_installation_date && (
                      <div className="mt-4 pt-4 border-t border-blue-200 flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Preferensi Instalasi</p>
                          <p className="font-medium text-gray-900">
                            {formatDate(registration.preferred_installation_date)}
                            {registration.preferred_time_slot && (
                              <span className="ml-2 text-gray-600">
                                ({registration.preferred_time_slot === 'morning' ? 'Pagi' : 
                                  registration.preferred_time_slot === 'afternoon' ? 'Siang' : 'Sore'})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {registration.notes && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-sm text-gray-600 mb-1">Catatan Customer</p>
                        <p className="text-gray-900 italic">"{registration.notes}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Paket tidak ditemukan</p>
                )}
              </div>

              {/* Survey Information (if exists) */}
              {(registration.survey_scheduled_date || registration.survey_notes) && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Informasi Survey</h4>
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    {registration.survey_scheduled_date && (
                      <div className="flex items-start gap-3 mb-3">
                        <Calendar className="h-5 w-5 text-indigo-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Tanggal Survey</p>
                          <p className="font-medium text-gray-900">
                            {new Date(registration.survey_scheduled_date).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    )}
                    {registration.survey_notes && (
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-indigo-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Hasil Survey</p>
                          <p className="text-gray-900 whitespace-pre-wrap">{registration.survey_notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACTIONS TAB */}
          {activeTab === 'actions' && (
            <div className="space-y-6">
              {/* Approved - Create Customer */}
              {registration.status === 'approved' && !registration.customer_id && (
                <div>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-6">
                    <p className="font-medium text-blue-900">🎉 Registration Approved!</p>
                    <p className="text-sm text-blue-800 mt-1">
                      Pendaftaran sudah disetujui. Klik tombol di bawah untuk membuat data customer dan ticket instalasi.
                    </p>
                  </div>

                  <button
                    onClick={handleCreateCustomer}
                    disabled={createCustomerMutation.isLoading}
                    className="w-full px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2 text-lg font-medium"
                  >
                    <Home className="h-6 w-6" />
                    {createCustomerMutation.isLoading ? 'Creating Customer...' : 'Buat Customer & Ticket Instalasi'}
                  </button>
                </div>
              )}

              {/* Customer Already Created */}
              {registration.customer_id && (
                <div>
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded mb-6">
                    <p className="font-medium text-green-900">✅ Customer Sudah Dibuat!</p>
                    <p className="text-sm text-green-800 mt-1">
                      Customer dan installation ticket sudah dibuat.
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(`/customers/${registration.customer_id}`)}
                    className="w-full btn btn-primary py-4 text-lg"
                  >
                    <User className="h-6 w-6 mr-2" />
                    Lihat Customer Detail
                  </button>
                </div>
              )}

              {/* Rejected - No Actions */}
              {registration.status === 'rejected' && (
                <div className="text-center py-12">
                  <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Registration {formatStatusText(registration.status)}
                  </h3>
                  <p className="text-gray-500">Tidak ada tindakan yang tersedia</p>
                  {registration.rejection_reason && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl mx-auto">
                      <p className="text-sm font-medium text-red-900 mb-1">Alasan:</p>
                      <p className="text-red-800">"{registration.rejection_reason}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Active Actions - Pending/Verified/Survey */}
              {!['approved', 'customer_created', 'rejected'].includes(registration.status) && (
                <div>
                  {/* PENDING VERIFICATION */}
                  {registration.status === 'pending_verification' && (
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                        <p className="text-sm font-medium text-yellow-900">⏳ Pending Verification</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Pendaftaran menunggu verifikasi data. Pilih tindakan di bawah ini.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className={`
                          relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors
                          ${actionType === 'verified'
                            ? 'border-blue-500 text-blue-600 bg-blue-50'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                          }
                        `}>
                          <input
                            type="radio"
                            name="action"
                            value="verified"
                            checked={actionType === 'verified'}
                            onChange={() => setActionType('verified')}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="flex items-center">
                              <UserCheck className={`h-5 w-5 mr-3 ${
                                actionType === 'verified' ? 'text-blue-600' : 'text-gray-400'
                              }`} />
                              <div className="text-sm">
                                <div className={`font-medium ${
                                  actionType === 'verified' ? 'text-blue-600' : 'text-gray-900'
                                }`}>
                                  Verifikasi Data
                                </div>
                                <div className="text-gray-500">Data sudah diperiksa dan valid</div>
                              </div>
                            </div>
                          </div>
                          {actionType === 'verified' && (
                            <div className="flex-shrink-0 text-blue-600">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                          )}
                        </label>

                        <label className={`
                          relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors
                          ${actionType === 'rejected'
                            ? 'border-red-500 text-red-600 bg-red-50'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                          }
                        `}>
                          <input
                            type="radio"
                            name="action"
                            value="rejected"
                            checked={actionType === 'rejected'}
                            onChange={() => setActionType('rejected')}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="flex items-center">
                              <XCircle className={`h-5 w-5 mr-3 ${
                                actionType === 'rejected' ? 'text-red-600' : 'text-gray-400'
                              }`} />
                              <div className="text-sm">
                                <div className={`font-medium ${
                                  actionType === 'rejected' ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  Tolak Pendaftaran
                                </div>
                                <div className="text-gray-500">Data tidak valid atau tidak memenuhi syarat</div>
                              </div>
                            </div>
                          </div>
                          {actionType === 'rejected' && (
                            <div className="flex-shrink-0 text-red-600">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  )}

                  {/* VERIFIED */}
                  {registration.status === 'verified' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                        <p className="text-sm font-medium text-blue-900">✅ Data Verified</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Data sudah diverifikasi. Pilih langkah selanjutnya.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className={`
                          relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors
                          ${actionType === 'approved'
                            ? 'border-green-500 text-green-600 bg-green-50'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                          }
                        `}>
                          <input
                            type="radio"
                            name="action"
                            value="approved"
                            checked={actionType === 'approved'}
                            onChange={() => setActionType('approved')}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="flex items-center">
                              <CheckCircle className={`h-5 w-5 mr-3 ${
                                actionType === 'approved' ? 'text-green-600' : 'text-gray-400'
                              }`} />
                              <div className="text-sm">
                                <div className={`font-medium ${
                                  actionType === 'approved' ? 'text-green-600' : 'text-gray-900'
                                }`}>
                                  Approve Langsung
                                </div>
                                <div className="text-gray-500">Fast track: Skip survey</div>
                              </div>
                            </div>
                          </div>
                          {actionType === 'approved' && (
                            <div className="flex-shrink-0 text-green-600">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                          )}
                        </label>

                        <label className={`
                          relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors
                          ${actionType === 'survey_scheduled'
                            ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                          }
                        `}>
                          <input
                            type="radio"
                            name="action"
                            value="survey_scheduled"
                            checked={actionType === 'survey_scheduled'}
                            onChange={() => setActionType('survey_scheduled')}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="flex items-center">
                              <Calendar className={`h-5 w-5 mr-3 ${
                                actionType === 'survey_scheduled' ? 'text-indigo-600' : 'text-gray-400'
                              }`} />
                              <div className="text-sm">
                                <div className={`font-medium ${
                                  actionType === 'survey_scheduled' ? 'text-indigo-600' : 'text-gray-900'
                                }`}>
                                  Schedule Survey
                                </div>
                                <div className="text-gray-500">Perlu survey lokasi & coverage</div>
                              </div>
                            </div>
                          </div>
                          {actionType === 'survey_scheduled' && (
                            <div className="flex-shrink-0 text-indigo-600">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                          )}
                        </label>

                        <label className={`
                          relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors
                          ${actionType === 'rejected'
                            ? 'border-red-500 text-red-600 bg-red-50'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                          }
                        `}>
                          <input
                            type="radio"
                            name="action"
                            value="rejected"
                            checked={actionType === 'rejected'}
                            onChange={() => setActionType('rejected')}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="flex items-center">
                              <XCircle className={`h-5 w-5 mr-3 ${
                                actionType === 'rejected' ? 'text-red-600' : 'text-gray-400'
                              }`} />
                              <div className="text-sm">
                                <div className={`font-medium ${
                                  actionType === 'rejected' ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  Reject Pendaftaran
                                </div>
                                <div className="text-gray-500">Tidak ada coverage atau tidak layak</div>
                              </div>
                            </div>
                          </div>
                          {actionType === 'rejected' && (
                            <div className="flex-shrink-0 text-red-600">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  )}

                  {/* SURVEY SCHEDULED */}
                  {registration.status === 'survey_scheduled' && (
                    <div className="space-y-4">
                      <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded">
                        <p className="text-sm font-medium text-indigo-900">📅 Survey Scheduled</p>
                        <p className="text-sm text-indigo-700 mt-1">
                          Survey telah dijadwalkan pada {new Date(registration.survey_scheduled_date).toLocaleString('id-ID')}. 
                          Setelah survey dilakukan, update status di bawah ini.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className={`
                          relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors
                          ${actionType === 'survey_completed'
                            ? 'border-purple-500 text-purple-600 bg-purple-50'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                          }
                        `}>
                          <input
                            type="radio"
                            name="action"
                            value="survey_completed"
                            checked={actionType === 'survey_completed'}
                            onChange={() => setActionType('survey_completed')}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="flex items-center">
                              <ClipboardCheck className={`h-5 w-5 mr-3 ${
                                actionType === 'survey_completed' ? 'text-purple-600' : 'text-gray-400'
                              }`} />
                              <div className="text-sm">
                                <div className={`font-medium ${
                                  actionType === 'survey_completed' ? 'text-purple-600' : 'text-gray-900'
                                }`}>
                                  Survey Completed
                                </div>
                                <div className="text-gray-500">Lokasi feasible untuk instalasi</div>
                              </div>
                            </div>
                          </div>
                          {actionType === 'survey_completed' && (
                            <div className="flex-shrink-0 text-purple-600">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                          )}
                        </label>

                        <label className={`
                          relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors
                          ${actionType === 'rejected'
                            ? 'border-red-500 text-red-600 bg-red-50'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                          }
                        `}>
                          <input
                            type="radio"
                            name="action"
                            value="rejected"
                            checked={actionType === 'rejected'}
                            onChange={() => setActionType('rejected')}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="flex items-center">
                              <XCircle className={`h-5 w-5 mr-3 ${
                                actionType === 'rejected' ? 'text-red-600' : 'text-gray-400'
                              }`} />
                              <div className="text-sm">
                                <div className={`font-medium ${
                                  actionType === 'rejected' ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  Reject - Tidak Feasible
                                </div>
                                <div className="text-gray-500">Lokasi tidak memungkinkan</div>
                              </div>
                            </div>
                          </div>
                          {actionType === 'rejected' && (
                            <div className="flex-shrink-0 text-red-600">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  )}

                  {/* SURVEY COMPLETED */}
                  {registration.status === 'survey_completed' && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                        <p className="text-sm font-medium text-green-900">✅ Survey Completed</p>
                        <p className="text-sm text-green-700 mt-1">
                          Survey sudah selesai. Pilih tindakan selanjutnya di bawah ini.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className={`
                          relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors
                          ${actionType === 'approved'
                            ? 'border-green-500 text-green-600 bg-green-50'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                          }
                        `}>
                          <input
                            type="radio"
                            name="action"
                            value="approved"
                            checked={actionType === 'approved'}
                            onChange={() => setActionType('approved')}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="flex items-center">
                              <CheckCircle className={`h-5 w-5 mr-3 ${
                                actionType === 'approved' ? 'text-green-600' : 'text-gray-400'
                              }`} />
                              <div className="text-sm">
                                <div className={`font-medium ${
                                  actionType === 'approved' ? 'text-green-600' : 'text-gray-900'
                                }`}>
                                  Approve Pendaftaran
                                </div>
                                <div className="text-gray-500">Lokasi feasible, siap create customer</div>
                              </div>
                            </div>
                          </div>
                          {actionType === 'approved' && (
                            <div className="flex-shrink-0 text-green-600">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                          )}
                        </label>

                        <label className={`
                          relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors
                          ${actionType === 'rejected'
                            ? 'border-red-500 text-red-600 bg-red-50'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                          }
                        `}>
                          <input
                            type="radio"
                            name="action"
                            value="rejected"
                            checked={actionType === 'rejected'}
                            onChange={() => setActionType('rejected')}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="flex items-center">
                              <XCircle className={`h-5 w-5 mr-3 ${
                                actionType === 'rejected' ? 'text-red-600' : 'text-gray-400'
                              }`} />
                              <div className="text-sm">
                                <div className={`font-medium ${
                                  actionType === 'rejected' ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  Reject - Tidak Feasible
                                </div>
                                <div className="text-gray-500">Lokasi tidak layak untuk instalasi</div>
                              </div>
                            </div>
                          </div>
                          {actionType === 'rejected' && (
                            <div className="flex-shrink-0 text-red-600">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Form Fields */}
                  {actionType && (
                    <div className="space-y-6 mt-6">
                      {/* Rejection Reason */}
                      {actionType === 'rejected' && (
                        <div>
                          <label className="form-label">
                            Alasan Penolakan <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={6}
                            className="form-input"
                            placeholder="Jelaskan alasan penolakan dengan detail..."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Contoh: Lokasi tidak ada coverage ODP, jarak terlalu jauh, atau data tidak valid
                          </p>
                        </div>
                      )}

                      {/* Survey Date */}
                      {actionType === 'survey_scheduled' && (
                        <div>
                          <label className="form-label">
                            Tanggal & Waktu Survey <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="datetime-local"
                            value={surveyDate}
                            onChange={(e) => setSurveyDate(e.target.value)}
                            className="form-input"
                          />
                        </div>
                      )}

                      {/* Survey Results */}
                      {actionType === 'survey_completed' && (
                        <div>
                          <label className="form-label">
                            Hasil Survey <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={surveyResults}
                            onChange={(e) => setSurveyResults(e.target.value)}
                            rows={8}
                            className="form-input"
                            placeholder="Jelaskan hasil survey dengan detail..."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Informasi: Lokasi ODP, jarak ke customer, panjang kabel, hambatan, dan kesimpulan feasibility
                          </p>
                        </div>
                      )}

                      {/* Notes (Optional) */}
                      {(actionType === 'verified' || actionType === 'approved' || actionType === 'survey_scheduled') && (
                        <div>
                          <label className="form-label">Catatan (Opsional)</label>
                          <textarea
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                            rows={3}
                            className="form-input"
                            placeholder="Tambahkan catatan jika diperlukan..."
                          />
                        </div>
                      )}

                      {/* Submit Buttons */}
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setActionType('')
                            setRejectionReason('')
                            setSurveyDate('')
                            setSurveyResults('')
                            setActionNotes('')
                          }}
                          className="btn-secondary"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleSubmitAction}
                          disabled={
                            updateStatusMutation.isLoading ||
                            (actionType === 'rejected' && !rejectionReason) ||
                            (actionType === 'survey_scheduled' && !surveyDate) ||
                            (actionType === 'survey_completed' && !surveyResults)
                          }
                          className="btn-primary"
                        >
                          {updateStatusMutation.isLoading ? (
                            <>
                              <span className="inline-block animate-spin mr-2">⏳</span>
                              Processing...
                            </>
                          ) : (
                            'Konfirmasi'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TIMELINE TAB */}
          {activeTab === 'timeline' && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-6">Approval Timeline</h4>
              
              <div className="border-l-4 border-gray-200 pl-6 space-y-6">
                {/* Created */}
                <div className="relative">
                  <div className="absolute -left-[1.85rem] mt-1.5 h-4 w-4 rounded-full bg-green-500 border-4 border-white shadow"></div>
                  <div>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Pendaftaran Dibuat
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(registration.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Verified */}
                {registration.verified_at && (
                  <div className="relative">
                    <div className="absolute -left-[1.85rem] mt-1.5 h-4 w-4 rounded-full bg-blue-500 border-4 border-white shadow"></div>
                    <div>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                        Data Diverifikasi
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(registration.verified_at).toLocaleString('id-ID')}
                      </p>
                      {registration.verification_notes && (
                        <div className="mt-2 bg-blue-50 rounded p-3 border-l-2 border-blue-400">
                          <p className="text-sm text-blue-900 italic">"{registration.verification_notes}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Survey Scheduled */}
                {registration.survey_scheduled_date && (
                  <div className="relative">
                    <div className="absolute -left-[1.85rem] mt-1.5 h-4 w-4 rounded-full bg-indigo-500 border-4 border-white shadow"></div>
                    <div>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-600" />
                        Survey Dijadwalkan
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Scheduled for: {new Date(registration.survey_scheduled_date).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Survey Completed */}
                {registration.survey_completed_date && (
                  <div className="relative">
                    <div className="absolute -left-[1.85rem] mt-1.5 h-4 w-4 rounded-full bg-purple-500 border-4 border-white shadow"></div>
                    <div>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-purple-600" />
                        Survey Selesai
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(registration.survey_completed_date).toLocaleString('id-ID')}
                      </p>
                      {registration.survey_notes && (
                        <div className="mt-2 bg-purple-50 rounded p-3 border-l-2 border-purple-400">
                          <p className="text-sm font-medium text-purple-900 mb-1">Hasil Survey:</p>
                          <p className="text-sm text-purple-900 whitespace-pre-wrap">"{registration.survey_notes}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Approved */}
                {registration.approved_at && (
                  <div className="relative">
                    <div className="absolute -left-[1.85rem] mt-1.5 h-4 w-4 rounded-full bg-green-500 border-4 border-white shadow"></div>
                    <div>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Pendaftaran Disetujui
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(registration.approved_at).toLocaleString('id-ID')}
                      </p>
                      {registration.approval_notes && (
                        <div className="mt-2 bg-green-50 rounded p-3 border-l-2 border-green-400">
                          <p className="text-sm text-green-900 italic">"{registration.approval_notes}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rejected */}
                {registration.rejection_reason && (
                  <div className="relative">
                    <div className="absolute -left-[1.85rem] mt-1.5 h-4 w-4 rounded-full bg-red-500 border-4 border-white shadow"></div>
                    <div>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Pendaftaran Ditolak
                      </p>
                      <div className="mt-2 bg-red-50 rounded p-3 border-l-2 border-red-400">
                        <p className="text-sm font-medium text-red-900 mb-1">Alasan:</p>
                        <p className="text-sm text-red-800">"{registration.rejection_reason}"</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer Created */}
                {registration.customer_id && (
                  <div className="relative">
                    <div className="absolute -left-[1.85rem] mt-1.5 h-4 w-4 rounded-full bg-purple-500 border-4 border-white shadow"></div>
                    <div>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <Home className="h-4 w-4 text-purple-600" />
                        Customer Created
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Customer ID: {registration.customer_id}
                      </p>
                      <button
                        onClick={() => navigate(`/customers/${registration.customer_id}`)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        → View Customer Detail
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Customer Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCreateCustomerModal}
        onClose={() => setShowCreateCustomerModal(false)}
        onConfirm={confirmCreateCustomer}
        title="🏠 Buat Customer & Ticket Instalasi"
        message={registration ? `Apakah Anda yakin ingin membuat customer dan ticket instalasi untuk "${registration.full_name}"?` : ''}
        confirmText="Ya, Buat Customer"
        cancelText="Batal"
        type="success"
        isLoading={createCustomerMutation.isLoading}
      >
        {registration && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Nama:</span>
                <span className="font-medium text-gray-900">{registration.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">No. HP:</span>
                <span className="font-medium text-gray-900">{registration.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paket:</span>
                <span className="font-medium text-gray-900">{selectedPackage?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Harga:</span>
                <span className="font-medium text-gray-900">
                  Rp {new Intl.NumberFormat('id-ID').format(selectedPackage?.price || 0)}/bulan
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-gray-600">
                ✅ Customer baru akan dibuat di sistem<br/>
                🎫 Ticket instalasi akan otomatis dibuatkan<br/>
                📧 Notifikasi akan dikirim ke teknisi<br/>
                🔗 Status registrasi akan di-update
              </p>
            </div>
          </div>
        )}
      </ConfirmationModal>
    </div>
  )
}

export default RegistrationDetailPage
