import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  UserPlus, Search, Filter, Eye, CheckCircle, XCircle, Clock,
  Calendar, Phone, Mail, MapPin, Package, Shield, FileCheck,
  UserCheck, ClipboardCheck, Home as HomeIcon, ChevronRight, BarChart3
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import registrationService from '../../services/registrationService'
import LoadingSpinner from '../../components/LoadingSpinner'

// KPI Card Component
const KPICard = ({ icon: Icon, title, value, color = 'blue' }) => {
  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-blue-600 bg-blue-50',
      green: 'bg-green-500 text-green-600 bg-green-50',
      yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-50',
      red: 'bg-red-500 text-red-600 bg-red-50',
      purple: 'bg-purple-500 text-purple-600 bg-purple-50',
      indigo: 'bg-indigo-500 text-indigo-600 bg-indigo-50',
      gray: 'bg-gray-500 text-gray-600 bg-gray-50'
    }
    return colors[color] || colors.blue
  }

  const colorClasses = getColorClasses(color).split(' ')
  const [iconBg, textColor, cardBg] = colorClasses

  return (
    <div className={`${cardBg} rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
          </div>
        </div>
        <div className={`${iconBg} p-3 rounded-lg flex-shrink-0`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )
}

const RegistrationsPage = () => {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState(null) // verify, approve, reject
  const [actionNotes, setActionNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [surveyDate, setSurveyDate] = useState('')
  
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  })

  // Fetch registrations
  const { data: registrationsData, isLoading } = useQuery(
    ['registrations', filters, currentPage],
    () => registrationService.getAll({
      ...filters,
      page: currentPage,
      limit: 10
    }),
    {
      keepPreviousData: true
    }
  )

  // Fetch statistics
  const { data: statsData } = useQuery(
    'registration-stats',
    () => registrationService.getStats(),
    {
      select: (response) => response.data
    }
  )

  // Update status mutation
  const updateStatusMutation = useMutation(
    ({ id, data }) => registrationService.updateStatus(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['registrations'])
        queryClient.invalidateQueries('registration-stats')
        setShowActionModal(false)
        setSelectedRegistration(null)
        setActionNotes('')
        setRejectionReason('')
        setSurveyDate('')
        toast.success('Status berhasil diupdate')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal update status')
      }
    }
  )

  // Create customer mutation
  const createCustomerMutation = useMutation(
    (id) => registrationService.createCustomer(id),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['registrations'])
        queryClient.invalidateQueries('registration-stats')
        toast.success('Customer dan ticket instalasi berhasil dibuat!')
        setShowDetailModal(false)
        setSelectedRegistration(null)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal membuat customer')
      }
    }
  )

  const handleAction = (registration, type) => {
    setSelectedRegistration(registration)
    setActionType(type)
    setShowActionModal(true)
  }

  const handleSubmitAction = () => {
    if (!selectedRegistration) return

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

    updateStatusMutation.mutate({ id: selectedRegistration.id, data })
  }

  const handleCreateCustomer = (registration) => {
    if (window.confirm(`Buat customer dan ticket instalasi untuk ${registration.full_name}?`)) {
      createCustomerMutation.mutate(registration.id)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending_verification: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      verified: { label: 'Verified', color: 'bg-blue-100 text-blue-800' },
      survey_scheduled: { label: 'Survey Scheduled', color: 'bg-indigo-100 text-indigo-800' },
      survey_completed: { label: 'Survey Done', color: 'bg-purple-100 text-purple-800' },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' }
    }
    const badge = badges[status] || badges.pending_verification
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>{badge.label}</span>
  }

  const stats = statsData || {}

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pendaftaran Customer</h1>
            <p className="text-gray-600 mt-1">Kelola pendaftaran customer baru dari public form</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/registration-analytics"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <BarChart3 className="-ml-1 mr-2 h-5 w-5" />
              Analytics
            </Link>
            <a
              href="/register"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="-ml-1 mr-2 h-5 w-5" />
              Form Pendaftaran
            </a>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard 
            icon={FileCheck} 
            title="Total Pendaftaran" 
            value={stats.total_registrations || 0} 
            color="blue" 
          />
          <KPICard 
            icon={Clock} 
            title="Pending" 
            value={stats.pending_verification || 0} 
            color="yellow" 
          />
          <KPICard 
            icon={CheckCircle} 
            title="Approved" 
            value={stats.approved || 0} 
            color="green" 
          />
          <KPICard 
            icon={UserPlus} 
            title="Hari Ini" 
            value={stats.today_registrations || 0} 
            color="indigo" 
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama, email, nomor..."
                  className="form-input pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="form-input"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Semua Status</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="verified">Verified</option>
                <option value="survey_scheduled">Survey Scheduled</option>
                <option value="survey_completed">Survey Completed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nomor Registrasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrationsData?.data?.registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">{reg.registration_number}</div>
                        <div className="text-xs text-gray-500">{new Date(reg.created_at).toLocaleDateString('id-ID')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{reg.full_name}</div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {reg.phone}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {reg.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{reg.package_name}</div>
                        <div className="text-xs text-gray-500">
                          Rp {reg.monthly_price?.toLocaleString('id-ID')}/bln
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(reg.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(reg.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedRegistration(reg)
                              setShowDetailModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>

                          {reg.status === 'pending_verification' && (
                            <button
                              onClick={() => handleAction(reg, 'verified')}
                              className="text-green-600 hover:text-green-900"
                              title="Verify"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}

                          {reg.status === 'verified' && (
                            <button
                              onClick={() => handleAction(reg, 'survey_scheduled')}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Schedule Survey"
                            >
                              <Calendar className="h-5 w-5" />
                            </button>
                          )}

                          {reg.status === 'survey_completed' && (
                            <button
                              onClick={() => handleAction(reg, 'approved')}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <UserCheck className="h-5 w-5" />
                            </button>
                          )}

                          {reg.status === 'approved' && !reg.customer_id && (
                            <button
                              onClick={() => handleCreateCustomer(reg)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Create Customer"
                            >
                              <HomeIcon className="h-5 w-5" />
                            </button>
                          )}

                          {!['approved', 'rejected', 'cancelled'].includes(reg.status) && (
                            <button
                              onClick={() => handleAction(reg, 'rejected')}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {registrationsData?.data?.registrations.length === 0 && (
                <div className="text-center py-12">
                  <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Belum ada pendaftaran</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {registrationsData?.data?.pagination && registrationsData.data.pagination.pages > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, registrationsData.data.pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{registrationsData.data.pagination.total}</span> results
                </p>
              </div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {Array.from({ length: registrationsData.data.pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`
                      relative inline-flex items-center px-4 py-2 border text-sm font-medium
                      ${page === currentPage
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }
                    `}
                  >
                    {page}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-8 py-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Detail Pendaftaran</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {getStatusBadge(selectedRegistration.status)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Nomor Registrasi</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      {selectedRegistration.registration_number}
                    </p>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Pribadi</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nama Lengkap</p>
                      <p className="font-medium text-gray-900">{selectedRegistration.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{selectedRegistration.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">WhatsApp</p>
                      <p className="font-medium text-green-600 flex items-center">
                        {selectedRegistration.phone}
                        <Shield className="h-4 w-4 ml-1" title="Verified" />
                      </p>
                    </div>
                    {selectedRegistration.id_card_number && (
                      <div>
                        <p className="text-sm text-gray-600">Nomor KTP</p>
                        <p className="font-medium text-gray-900">{selectedRegistration.id_card_number}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Alamat</h3>
                  <p className="text-gray-900">{selectedRegistration.address}</p>
                  {(selectedRegistration.rt || selectedRegistration.rw) && (
                    <p className="text-gray-600 text-sm mt-1">
                      RT {selectedRegistration.rt || '-'} / RW {selectedRegistration.rw || '-'}
                    </p>
                  )}
                  <p className="text-gray-600 text-sm mt-1">
                    {selectedRegistration.kelurahan}, {selectedRegistration.kecamatan}, {selectedRegistration.city} {selectedRegistration.postal_code}
                  </p>
                  {selectedRegistration.address_notes && (
                    <p className="text-gray-600 text-sm mt-2 italic">
                      Catatan: {selectedRegistration.address_notes}
                    </p>
                  )}
                </div>

                {/* Package Info */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Paket</h3>
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <p className="text-xl font-bold text-gray-900">{selectedRegistration.package_name}</p>
                    <p className="text-lg text-gray-600 mt-1">{selectedRegistration.bandwidth_down} Mbps</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      Rp {selectedRegistration.monthly_price?.toLocaleString('id-ID')}/bulan
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t pt-6 flex gap-3 justify-end">
                  {selectedRegistration.status === 'approved' && !selectedRegistration.customer_id && (
                    <button
                      onClick={() => handleCreateCustomer(selectedRegistration)}
                      disabled={createCustomerMutation.isLoading}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors inline-flex items-center"
                    >
                      <HomeIcon className="h-5 w-5 mr-2" />
                      Buat Customer & Ticket
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Modal */}
        {showActionModal && selectedRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {actionType === 'verified' && 'Verifikasi Data'}
                  {actionType === 'approved' && 'Setujui Pendaftaran'}
                  {actionType === 'rejected' && 'Tolak Pendaftaran'}
                  {actionType === 'survey_scheduled' && 'Jadwalkan Survey'}
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-gray-700">
                  Customer: <span className="font-semibold">{selectedRegistration.full_name}</span>
                </p>

                {actionType === 'survey_scheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Survey *
                    </label>
                    <input
                      type="datetime-local"
                      value={surveyDate}
                      onChange={(e) => setSurveyDate(e.target.value)}
                      className="form-input"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                )}

                {actionType === 'rejected' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alasan Penolakan *
                    </label>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="form-input"
                      placeholder="Jelaskan alasan penolakan..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="form-input"
                    placeholder="Tambahkan catatan..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowActionModal(false)
                    setActionNotes('')
                    setRejectionReason('')
                    setSurveyDate('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitAction}
                  disabled={updateStatusMutation.isLoading}
                  className={`
                    px-6 py-2 rounded-lg text-white transition-colors inline-flex items-center
                    ${actionType === 'rejected' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                    }
                    disabled:bg-gray-400 disabled:cursor-not-allowed
                  `}
                >
                  {updateStatusMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Konfirmasi
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RegistrationsPage

