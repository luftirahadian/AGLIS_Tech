import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  User, Phone, Mail, MapPin, Award, Star, Calendar, Activity, 
  CheckCircle, Clock, AlertCircle, Wrench, Shield, Target,
  Edit, Save, X, PhoneCall, Send, MessageCircle, Briefcase,
  TrendingUp, BarChart3
} from 'lucide-react'
import BackButton from '../../components/common/BackButton'
import LoadingSpinner from '../../components/LoadingSpinner'
import { technicianService } from '../../services/technicianService'
import toast from 'react-hot-toast'

const TechnicianDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [editMode, setEditMode] = useState({
    availability: false,
    employment: false,
    skill: false
  })
  const [editValues, setEditValues] = useState({})

  const { data: technicianData, isLoading, error } = useQuery(
    ['technician', id],
    () => technicianService.getTechnician(id),
    {
      enabled: !!id,
      staleTime: 10000, // 10 seconds
      refetchOnWindowFocus: true
    }
  )

  // Update technician mutation
  const updateMutation = useMutation(
    (updateData) => technicianService.updateTechnician(id, updateData),
    {
      onSuccess: () => {
        toast.success('Status updated successfully!')
        queryClient.invalidateQueries(['technician', id])
        queryClient.invalidateQueries(['technicians'])
        setEditMode({ availability: false, employment: false, skill: false })
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update status')
      }
    }
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !technicianData?.data?.technician) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <AlertCircle className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Technician Not Found</h3>
        <p className="text-gray-500 mb-4">Teknisi yang Anda cari tidak ditemukan</p>
        <BackButton to="/technicians" label="Back to Technicians" />
      </div>
    )
  }

  const technician = technicianData.data.technician
  const stats = technicianData.data.stats || {}
  const recentTickets = technicianData.data.recent_tickets || []
  const activeTickets = technicianData.data.active_tickets || []
  const equipment = technicianData.data.equipment || []

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getYearsOfService = (hireDate) => {
    if (!hireDate) return 'N/A'
    const years = Math.floor((new Date() - new Date(hireDate)) / (365.25 * 24 * 60 * 60 * 1000))
    const months = Math.floor(((new Date() - new Date(hireDate)) % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000))
    return years > 0 ? `${years} tahun ${months} bulan` : `${months} bulan`
  }

  const getAvailabilityBadge = (status) => {
    const config = {
      available: { color: 'bg-green-100 text-green-800', label: 'Available' },
      busy: { color: 'bg-yellow-100 text-yellow-800', label: 'Busy' },
      break: { color: 'bg-blue-100 text-blue-800', label: 'Break' },
      offline: { color: 'bg-gray-100 text-gray-800', label: 'Offline' }
    }
    const badge = config[status] || config.offline
    return <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badge.color}`}>{badge.label}</span>
  }

  const getEmploymentBadge = (status) => {
    const config = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
      suspended: { color: 'bg-red-100 text-red-800', label: 'Suspended' },
      on_leave: { color: 'bg-yellow-100 text-yellow-800', label: 'On Leave' }
    }
    const badge = config[status] || config.inactive
    return <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badge.color}`}>{badge.label}</span>
  }

  const getSkillBadge = (level) => {
    const config = {
      junior: { color: 'bg-blue-100 text-blue-800', icon: '🌱' },
      senior: { color: 'bg-purple-100 text-purple-800', icon: '⭐' },
      expert: { color: 'bg-orange-100 text-orange-800', icon: '🏆' },
      specialist: { color: 'bg-red-100 text-red-800', icon: '💎' }
    }
    const badge = config[level] || config.junior
    return (
      <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${badge.color}`}>
        <span className="mr-1">{badge.icon}</span>
        <span className="capitalize">{level}</span>
      </span>
    )
  }

  const handleQuickCall = () => {
    if (technician.phone) {
      window.location.href = `tel:${technician.phone}`
    } else {
      toast.error('No phone number available')
    }
  }

  const handleQuickEmail = () => {
    if (technician.email) {
      window.location.href = `mailto:${technician.email}`
    } else {
      toast.error('No email available')
    }
  }

  const handleWhatsApp = () => {
    if (technician.phone) {
      const cleanPhone = technician.phone.replace(/[^0-9]/g, '')
      const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone
      window.open(`https://wa.me/${waPhone}`, '_blank')
    } else {
      toast.error('No phone number available')
    }
  }

  const handleEditStatus = (field) => {
    setEditMode({ ...editMode, [field]: true })
    setEditValues({ ...editValues, [field]: technician[field === 'availability' ? 'availability_status' : field === 'employment' ? 'employment_status' : 'skill_level'] })
  }

  const handleSaveStatus = (field) => {
    const fieldMap = {
      availability: 'availability_status',
      employment: 'employment_status',
      skill: 'skill_level'
    }
    updateMutation.mutate({ [fieldMap[field]]: editValues[field] })
  }

  const handleCancelEdit = (field) => {
    setEditMode({ ...editMode, [field]: false })
    setEditValues({ ...editValues, [field]: '' })
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'tickets', label: 'Tickets', icon: Activity, badge: activeTickets.length },
    { id: 'performance', label: 'Performance', icon: Award }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BackButton to="/technicians" label="Back to Technicians" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              {technician.full_name}
              {technician.username && (
                <span className="ml-3 text-sm font-normal text-gray-500">@{technician.username}</span>
              )}
            </h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-sm text-gray-600">ID: {technician.employee_id}</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-600">{technician.position || 'Technician'}</span>
              {technician.hire_date && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-600">{getYearsOfService(technician.hire_date)} masa kerja</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Tickets */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.total_tickets || 0}</div>
          <div className="text-xs text-blue-700">Total Tickets</div>
        </div>

        {/* Completed */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-500 rounded-lg">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-green-900">{stats.completed_tickets || 0}</div>
          <div className="text-xs text-green-700">Completed</div>
        </div>

        {/* Active */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-yellow-900">{stats.active_tickets || 0}</div>
          <div className="text-xs text-yellow-700">Active Now</div>
        </div>

        {/* Avg Rating */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Star className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {parseFloat(stats.avg_rating || 0).toFixed(1)}
          </div>
          <div className="text-xs text-purple-700">Avg Rating</div>
        </div>

        {/* Completion Rate */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-900">{parseFloat(stats.completion_rate || 0).toFixed(1)}%</div>
          <div className="text-xs text-indigo-700">Success Rate</div>
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Card - Enhanced */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Phone className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">Contact Info</h3>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Phone */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center flex-1 min-w-0">
                  <PhoneCall className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500">Phone</div>
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {technician.phone || '-'}
                    </div>
                  </div>
                </div>
                {technician.phone && (
                  <button
                    onClick={handleQuickCall}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-blue-50 rounded transition-all"
                    title="Call"
                  >
                    <PhoneCall className="h-4 w-4 text-blue-600" />
                  </button>
                )}
              </div>

              {/* Email */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center flex-1 min-w-0">
                  <Mail className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500">Email</div>
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {technician.email || '-'}
                    </div>
                  </div>
                </div>
                {technician.email && (
                  <button
                    onClick={handleQuickEmail}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-blue-50 rounded transition-all"
                    title="Email"
                  >
                    <Send className="h-4 w-4 text-blue-600" />
                  </button>
                )}
              </div>

              {/* Work Zone */}
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">Work Zone</div>
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {technician.work_zone || '-'}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={handleQuickCall}
                    disabled={!technician.phone}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PhoneCall className="h-4 w-4 mr-1" />
                    Call
                  </button>
                  <button
                    onClick={handleWhatsApp}
                    disabled={!technician.phone}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-emerald-300 text-sm font-medium rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    WA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Card - Editable */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Status</h3>
            </div>
            
            <div className="space-y-4">
              {/* Availability Status - Editable */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Availability</span>
                  {!editMode.availability && (
                    <button
                      onClick={() => handleEditStatus('availability')}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-3 w-3 text-gray-400" />
                    </button>
                  )}
                </div>
                {editMode.availability ? (
                  <div className="flex items-center space-x-2">
                    <select
                      value={editValues.availability || technician.availability_status}
                      onChange={(e) => setEditValues({ ...editValues, availability: e.target.value })}
                      className="flex-1 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="available">Available</option>
                      <option value="busy">Busy</option>
                      <option value="break">Break</option>
                      <option value="offline">Offline</option>
                    </select>
                    <button
                      onClick={() => handleSaveStatus('availability')}
                      className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                      title="Save"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleCancelEdit('availability')}
                      className="p-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-colors"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  getAvailabilityBadge(technician.availability_status)
                )}
              </div>

              {/* Employment Status - Editable */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Employment</span>
                  {!editMode.employment && (
                    <button
                      onClick={() => handleEditStatus('employment')}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-3 w-3 text-gray-400" />
                    </button>
                  )}
                </div>
                {editMode.employment ? (
                  <div className="flex items-center space-x-2">
                    <select
                      value={editValues.employment || technician.employment_status}
                      onChange={(e) => setEditValues({ ...editValues, employment: e.target.value })}
                      className="flex-1 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                      <option value="on_leave">On Leave</option>
                    </select>
                    <button
                      onClick={() => handleSaveStatus('employment')}
                      className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                      title="Save"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleCancelEdit('employment')}
                      className="p-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-colors"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  getEmploymentBadge(technician.employment_status)
                )}
              </div>

              {/* Skill Level - Editable */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Skill Level</span>
                  {!editMode.skill && (
                    <button
                      onClick={() => handleEditStatus('skill')}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-3 w-3 text-gray-400" />
                    </button>
                  )}
                </div>
                {editMode.skill ? (
                  <div className="flex items-center space-x-2">
                    <select
                      value={editValues.skill || technician.skill_level}
                      onChange={(e) => setEditValues({ ...editValues, skill: e.target.value })}
                      className="flex-1 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="junior">Junior 🌱</option>
                      <option value="senior">Senior ⭐</option>
                      <option value="expert">Expert 🏆</option>
                      <option value="specialist">Specialist 💎</option>
                    </select>
                    <button
                      onClick={() => handleSaveStatus('skill')}
                      className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                      title="Save"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleCancelEdit('skill')}
                      className="p-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-colors"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  getSkillBadge(technician.skill_level)
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Work Info Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Work Details</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500">Hire Date</div>
                <div className="text-sm font-medium text-gray-900">
                  {formatDate(technician.hire_date)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Years of Service</div>
                <div className="text-sm font-medium text-gray-900">
                  {getYearsOfService(technician.hire_date)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Max Daily Tickets</div>
                <div className="text-sm font-medium text-gray-900">
                  {technician.max_daily_tickets || 8} tickets/day
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Current Load</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        (stats.active_tickets / (technician.max_daily_tickets || 8)) > 0.8 ? 'bg-red-500' :
                        (stats.active_tickets / (technician.max_daily_tickets || 8)) > 0.5 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, (stats.active_tickets / (technician.max_daily_tickets || 8)) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {stats.active_tickets || 0}/{technician.max_daily_tickets || 8}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
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
                  } transition-colors`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs font-semibold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Equipment */}
              {equipment && equipment.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Wrench className="h-5 w-5 mr-2 text-gray-600" />
                    Assigned Equipment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {equipment.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{item.equipment_name}</div>
                            <div className="text-sm text-gray-500">{item.equipment_type}</div>
                          </div>
                          {item.serial_number && (
                            <div className="text-xs text-gray-400">S/N: {item.serial_number}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specializations */}
              {technician.specializations && technician.specializations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-gray-600" />
                    Specializations
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {technician.specializations.map((spec, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {technician.certifications && technician.certifications.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-gray-600" />
                    Certifications
                  </h3>
                  <div className="space-y-2">
                    {technician.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tickets' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Tickets</h3>
                <span className="text-sm text-gray-500">{recentTickets.length} total</span>
              </div>
              
              {recentTickets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No tickets assigned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTickets.map((ticket) => (
                    <div 
                      key={ticket.id}
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-blue-600">{ticket.ticket_number}</span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              ticket.priority === 'critical' ? 'bg-red-100 text-red-800' :
                              ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              ticket.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {ticket.priority}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              ticket.status === 'completed' ? 'bg-green-100 text-green-800' :
                              ticket.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {ticket.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 mb-1">{ticket.title}</div>
                          <div className="text-xs text-gray-500">
                            Customer: {ticket.customer_name || 'N/A'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(ticket.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Performance Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-700">This Month</span>
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{stats.tickets_this_month || 0}</div>
                  <div className="text-xs text-blue-600">Tickets handled</div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-green-700">Completed</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-900">{stats.completed_this_month || 0}</div>
                  <div className="text-xs text-green-600">This month</div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-purple-700">Success Rate</span>
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-purple-900">{parseFloat(stats.completion_rate || 0).toFixed(1)}%</div>
                  <div className="text-xs text-purple-600">Completion rate</div>
                </div>
              </div>

              {/* Rating Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Performance</h3>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center mb-2">
                        <Star className="h-8 w-8 text-yellow-500 fill-current" />
                        <span className="ml-3 text-4xl font-bold text-gray-900">
                          {parseFloat(stats.avg_rating || 0).toFixed(1)}
                        </span>
                        <span className="ml-2 text-2xl text-gray-400">/5.0</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Based on {stats.completed_tickets || 0} completed tickets
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600">{stats.completed_tickets || 0}</div>
                      <div className="text-sm text-gray-600">Total Completed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TechnicianDetailPage
