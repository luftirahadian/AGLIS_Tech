import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { 
  Search, CheckCircle, Clock, Calendar, XCircle, Wifi,
  User, Mail, Phone, MapPin, Package, AlertCircle, Shield,
  FileCheck, UserCheck, ClipboardCheck, Home as HomeIcon
} from 'lucide-react'
import registrationService from '../../services/registrationService'
import socketService from '../../services/socketService'

const TrackingPage = () => {
  const { registrationNumber } = useParams()
  const [searchInput, setSearchInput] = useState(registrationNumber || '')
  const [searchQuery, setSearchQuery] = useState(registrationNumber || '')

  const { data: trackingData, isLoading, error, refetch } = useQuery(
    ['track-registration', searchQuery],
    () => registrationService.trackStatus(searchQuery),
    {
      enabled: !!searchQuery,
      retry: false,
      select: (response) => response.data
    }
  )

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim())
      refetch()
    }
  }

  // Socket.IO real-time updates
  useEffect(() => {
    if (!searchQuery || !trackingData) return

    // Connect to socket (if not already connected)
    socketService.connect()

    // Listen for registration updates
    const handleRegistrationUpdate = (data) => {
      console.log('📡 [TrackingPage] Registration update received:', data)
      
      // Check if the update is for the current registration
      if (
        data.registration_number === searchQuery || 
        data.registration_number === trackingData.registration_number ||
        data.email === searchQuery ||
        data.email === trackingData.email
      ) {
        console.log('✅ [TrackingPage] Update is for current registration, refetching...')
        refetch()
      }
    }

    // Subscribe to socket events
    socketService.on('registration_updated', handleRegistrationUpdate)
    socketService.on('registration_status_changed', handleRegistrationUpdate)

    console.log('🔌 [TrackingPage] Socket listeners setup for:', searchQuery)

    // Cleanup on unmount or when searchQuery changes
    return () => {
      console.log('🔌 [TrackingPage] Removing socket listeners')
      socketService.off('registration_updated', handleRegistrationUpdate)
      socketService.off('registration_status_changed', handleRegistrationUpdate)
    }
  }, [searchQuery, trackingData, refetch])

  const getStatusInfo = (status) => {
    const statusMap = {
      pending_verification: {
        label: 'Menunggu Verifikasi',
        icon: Clock,
        color: 'yellow',
        description: 'Data Anda sedang dalam proses verifikasi oleh tim kami'
      },
      verified: {
        label: 'Terverifikasi',
        icon: UserCheck,
        color: 'blue',
        description: 'Data Anda telah diverifikasi. Menunggu jadwal survey'
      },
      survey_scheduled: {
        label: 'Survey Dijadwalkan',
        icon: Calendar,
        color: 'indigo',
        description: 'Survey lokasi telah dijadwalkan'
      },
      survey_completed: {
        label: 'Survey Selesai',
        icon: ClipboardCheck,
        color: 'purple',
        description: 'Survey lokasi telah selesai. Menunggu persetujuan'
      },
      approved: {
        label: 'Disetujui',
        icon: CheckCircle,
        color: 'green',
        description: 'Pendaftaran Anda telah disetujui! Instalasi akan segera dijadwalkan'
      },
      customer_created: {
        label: 'Customer Telah Dibuat',
        icon: CheckCircle,
        color: 'green',
        description: 'Selamat! Anda telah terdaftar sebagai customer. Instalasi akan segera dijadwalkan'
      },
      rejected: {
        label: 'Ditolak',
        icon: XCircle,
        color: 'red',
        description: 'Pendaftaran Anda ditolak'
      },
      cancelled: {
        label: 'Dibatalkan',
        icon: XCircle,
        color: 'gray',
        description: 'Pendaftaran dibatalkan'
      }
    }
    return statusMap[status] || statusMap.pending_verification
  }

  const getStepStatus = (currentStatus, stepStatus) => {
    const statusOrder = [
      'pending_verification',
      'verified',
      'survey_scheduled',
      'survey_completed',
      'approved',
      'customer_created'
    ]
    
    const currentIndex = statusOrder.indexOf(currentStatus)
    const stepIndex = statusOrder.indexOf(stepStatus)
    
    if (currentStatus === 'rejected' || currentStatus === 'cancelled') {
      return stepIndex <= currentIndex ? 'completed' : 'pending'
    }
    
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'current'
    return 'pending'
  }

  // Get next steps guidance based on status
  const getNextSteps = (status) => {
    const steps = {
      pending_verification: {
        title: 'Langkah Selanjutnya',
        items: [
          'Tim kami akan melakukan verifikasi data (1-2 hari kerja)',
          'Pastikan nomor WhatsApp Anda aktif',
          'Anda akan dihubungi untuk jadwal survey lokasi'
        ],
        color: 'blue'
      },
      verified: {
        title: 'Menunggu Jadwal Survey',
        items: [
          'Tim akan menghubungi Anda untuk jadwal survey',
          'Pastikan lokasi mudah diakses',
          'Siapkan denah lokasi jika diperlukan'
        ],
        color: 'blue'
      },
      survey_scheduled: {
        title: 'Persiapan Survey',
        items: [
          'Pastikan ada yang bisa menerima tim survey',
          'Siapkan akses ke lokasi instalasi',
          'Berikan informasi teknis lokasi jika ada'
        ],
        color: 'indigo'
      },
      survey_completed: {
        title: 'Menunggu Persetujuan',
        items: [
          'Survey lokasi telah selesai dilakukan',
          'Tim sedang review hasil survey',
          'Anda akan dihubungi untuk hasil persetujuan'
        ],
        color: 'purple'
      },
      approved: {
        title: 'Selamat! Pendaftaran Disetujui',
        items: [
          'Tim kami akan segera menghubungi untuk jadwal instalasi',
          'Pastikan nomor WhatsApp Anda aktif',
          'Proses pembuatan account customer sedang berlangsung'
        ],
        color: 'green'
      },
      customer_created: {
        title: 'Menunggu Jadwal Instalasi',
        items: [
          'Selamat! Anda sudah terdaftar sebagai customer',
          'Tim instalasi akan menghubungi untuk jadwal',
          'Pastikan nomor WhatsApp aktif dan lokasi siap diakses'
        ],
        color: 'green'
      }
    }
    return steps[status]
  }

  const statusInfo = trackingData ? getStatusInfo(trackingData.status) : null
  const StatusIcon = statusInfo?.icon || Clock

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/aglis-logo.svg" 
                alt="AGLIS Net" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AGLIS</h1>
                <p className="text-sm text-gray-500">Lacak Status Pendaftaran</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Box */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cek Status Pendaftaran</h2>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Masukkan nomor registrasi atau email"
                className="form-input w-full"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Search className="h-5 w-5 mr-2" />
              Cari
            </button>
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Mencari data...</p>
          </div>
        )}

        {/* Error State */}
        {error && searchQuery && !isLoading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Data Tidak Ditemukan</h3>
            <p className="text-gray-600">
              Pendaftaran dengan nomor/email tersebut tidak ditemukan.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Pastikan Anda memasukkan nomor registrasi atau email yang benar.
            </p>
          </div>
        )}

        {/* Tracking Result */}
        {trackingData && !isLoading && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className={`
                px-8 py-6 border-b-4
                ${statusInfo.color === 'green' ? 'bg-green-50 border-green-500' :
                  statusInfo.color === 'yellow' ? 'bg-yellow-50 border-yellow-500' :
                  statusInfo.color === 'blue' ? 'bg-blue-50 border-blue-500' :
                  statusInfo.color === 'red' ? 'bg-red-50 border-red-500' :
                  'bg-gray-50 border-gray-500'
                }
              `}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`
                      p-3 rounded-full
                      ${statusInfo.color === 'green' ? 'bg-green-500' :
                        statusInfo.color === 'yellow' ? 'bg-yellow-500' :
                        statusInfo.color === 'blue' ? 'bg-blue-500' :
                        statusInfo.color === 'red' ? 'bg-red-500' :
                        'bg-gray-500'
                      }
                    `}>
                      <StatusIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status Pendaftaran</p>
                      <p className={`
                        text-2xl font-bold
                        ${statusInfo.color === 'green' ? 'text-green-700' :
                          statusInfo.color === 'yellow' ? 'text-yellow-700' :
                          statusInfo.color === 'blue' ? 'text-blue-700' :
                          statusInfo.color === 'red' ? 'text-red-700' :
                          'text-gray-700'
                        }
                      `}>
                        {statusInfo.label}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{statusInfo.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Nomor Registrasi</p>
                    <p className="text-lg font-bold text-gray-900">{trackingData.registration_number}</p>
                  </div>
                </div>
              </div>

              {/* Registration Details */}
              <div className="p-8 space-y-6">
                {/* Personal Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Informasi Pribadi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Nama</p>
                        <p className="font-medium text-gray-900">{trackingData.full_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{trackingData.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">WhatsApp</p>
                        <p className="font-medium text-green-600 flex items-center">
                          {trackingData.phone}
                          <Shield className="h-4 w-4 ml-1" />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Package Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-600" />
                    Paket yang Dipilih
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <p className="text-xl font-bold text-gray-900">{trackingData.package_name}</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(trackingData.monthly_price)}/bulan
                    </p>
                  </div>
                </div>

                {/* Address Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                    Alamat Instalasi
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-900">{trackingData.address || 'Belum tersedia'}</p>
                    {trackingData.city && (
                      <p className="text-gray-600 text-sm mt-1">{trackingData.city}</p>
                    )}
                  </div>
                </div>

                {/* Survey Date Highlight */}
                {trackingData.status === 'survey_scheduled' && trackingData.survey_scheduled_date && (
                  <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-indigo-900 mb-2">📅 Survey Telah Dijadwalkan</h4>
                        <p className="text-indigo-800 text-lg font-semibold">
                          {new Date(trackingData.survey_scheduled_date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-indigo-700 text-sm mt-2">
                          Mohon siapkan akses lokasi untuk tim survey kami
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    Timeline
                  </h3>
                  <div className="space-y-4">
                    {[
                      { status: 'pending_verification', label: 'Pendaftaran Diterima', date: trackingData.created_at },
                      { status: 'verified', label: 'Data Diverifikasi', date: trackingData.verified_at },
                      { status: 'survey_scheduled', label: 'Survey Dijadwalkan', date: trackingData.survey_scheduled_date },
                      { status: 'survey_completed', label: 'Survey Selesai', date: null },
                      { status: 'approved', label: 'Disetujui', date: trackingData.approved_at },
                      { status: 'customer_created', label: 'Customer Dibuat', date: null }
                    ].map((step, index) => {
                      const stepStatus = getStepStatus(trackingData.status, step.status)
                      return (
                        <div key={index} className="flex items-start space-x-4">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                            ${stepStatus === 'completed' ? 'bg-green-500 text-white' :
                              stepStatus === 'current' ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                              'bg-gray-200 text-gray-400'
                            }
                          `}>
                            {stepStatus === 'completed' ? (
                              <CheckCircle className="h-6 w-6" />
                            ) : (
                              <div className="w-3 h-3 bg-current rounded-full" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${stepStatus === 'current' ? 'text-blue-600' : 'text-gray-900'}`}>
                              {step.label}
                            </p>
                            {step.date && (
                              <p className="text-sm text-gray-500">
                                {new Date(step.date).toLocaleString('id-ID')}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Rejection Reason */}
                {trackingData.status === 'rejected' && trackingData.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-red-900 mb-2">Alasan Penolakan</h4>
                        <p className="text-red-800">{trackingData.rejection_reason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Steps - Dynamic based on status */}
                {getNextSteps(trackingData.status) && (
                  <div className={`
                    border rounded-lg p-6
                    ${getNextSteps(trackingData.status).color === 'green' ? 'bg-green-50 border-green-200' :
                      getNextSteps(trackingData.status).color === 'blue' ? 'bg-blue-50 border-blue-200' :
                      getNextSteps(trackingData.status).color === 'indigo' ? 'bg-indigo-50 border-indigo-200' :
                      getNextSteps(trackingData.status).color === 'purple' ? 'bg-purple-50 border-purple-200' :
                      'bg-gray-50 border-gray-200'
                    }
                  `}>
                    <h4 className={`
                      font-semibold mb-3 flex items-center
                      ${getNextSteps(trackingData.status).color === 'green' ? 'text-green-900' :
                        getNextSteps(trackingData.status).color === 'blue' ? 'text-blue-900' :
                        getNextSteps(trackingData.status).color === 'indigo' ? 'text-indigo-900' :
                        getNextSteps(trackingData.status).color === 'purple' ? 'text-purple-900' :
                        'text-gray-900'
                      }
                    `}>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      {getNextSteps(trackingData.status).title}
                    </h4>
                    <ul className={`
                      space-y-2
                      ${getNextSteps(trackingData.status).color === 'green' ? 'text-green-800' :
                        getNextSteps(trackingData.status).color === 'blue' ? 'text-blue-800' :
                        getNextSteps(trackingData.status).color === 'indigo' ? 'text-indigo-800' :
                        getNextSteps(trackingData.status).color === 'purple' ? 'text-purple-800' :
                        'text-gray-800'
                      }
                    `}>
                      {getNextSteps(trackingData.status).items.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-white rounded-xl shadow-lg p-8 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Butuh Bantuan?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <Phone className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">WhatsApp</p>
                    <p className="text-sm text-gray-600">Chat dengan kami</p>
                  </div>
                </a>
                <a
                  href="tel:021-12345678"
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Phone className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Telepon</p>
                    <p className="text-sm text-gray-600">021-12345678</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!searchQuery && !isLoading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Lacak Pendaftaran Anda</h3>
            <p className="text-gray-600">
              Masukkan nomor registrasi atau email untuk melihat status pendaftaran
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrackingPage

