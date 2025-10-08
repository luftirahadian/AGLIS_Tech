import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  Wrench, User, Phone, Mail, MapPin, Award, Star,
  Calendar, Activity, CheckCircle, Clock, AlertCircle,
  Zap, Shield, Target
} from 'lucide-react'
import BackButton from '../../components/common/BackButton'
import LoadingSpinner from '../../components/LoadingSpinner'
import { technicianService } from '../../services/technicianService'
import toast from 'react-hot-toast'

const TechnicianDetailPage = () => {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: technicianData, isLoading, error } = useQuery(
    ['technician', id],
    () => technicianService.getTechnician(id),
    {
      enabled: !!id,
      staleTime: 30000
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
        <p className="text-gray-500 mb-4">Technician yang Anda cari tidak ditemukan</p>
        <BackButton to="/technicians" label="Back to Technicians" />
      </div>
    )
  }

  const technician = technicianData.data.technician
  const stats = technicianData.data.stats || {}
  const recentTickets = technicianData.data.recent_tickets || []

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { color: 'green', label: 'Available' },
      on_duty: { color: 'blue', label: 'On Duty' },
      off_duty: { color: 'gray', label: 'Off Duty' },
      on_leave: { color: 'yellow', label: 'On Leave' },
      active: { color: 'green', label: 'Active' },
      inactive: { color: 'red', label: 'Inactive' },
      suspended: { color: 'orange', label: 'Suspended' }
    }

    const config = statusConfig[status] || { color: 'gray', label: status }
    
    return (
      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-${config.color}-100 text-${config.color}-800`}>
        {config.label}
      </span>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'performance', label: 'Performance', icon: Award },
    { id: 'tickets', label: 'Recent Tickets', icon: Activity }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BackButton to="/technicians" label="Back to Technicians" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{technician.full_name}</h1>
            <p className="text-gray-600">Employee ID: {technician.employee_id}</p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center mb-4">
              <Phone className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Contact</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                <span className="text-sm">{technician.phone_number || '-'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                <span className="text-sm">{technician.email || '-'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="text-sm">{technician.work_zone || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Info */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center mb-4">
              <Activity className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Availability</span>
                {getStatusBadge(technician.availability_status)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Employment</span>
                {getStatusBadge(technician.employment_status)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Skill Level</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {technician.skill_level}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center mb-4">
              <Star className="h-5 w-5 text-yellow-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Performance</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Rating</span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-gray-900 ml-1">
                    {stats.avg_rating ? stats.avg_rating.toFixed(1) : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Tickets</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.total_tickets || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.completed_tickets || 0}
                </span>
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
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Full Name</span>
                    <span className="text-sm font-medium text-gray-900">{technician.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Employee ID</span>
                    <span className="text-sm font-medium text-gray-900">{technician.employee_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hire Date</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(technician.hire_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Max Daily Tickets</span>
                    <span className="text-sm font-medium text-gray-900">{technician.max_daily_tickets || '-'}</span>
                  </div>
                </div>
              </div>

              {technician.specializations && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Specializations</h4>
                  <div className="flex flex-wrap gap-2">
                    {technician.specializations.map((spec, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Metrics</h3>
              <p className="text-gray-500">Detailed performance analytics will be displayed here.</p>
            </div>
          )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <div>
              {recentTickets.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Tickets</h3>
                  <p className="text-gray-500">No tickets assigned to this technician yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-gray-900">{ticket.title}</h5>
                          <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(ticket.created_at)}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          ticket.status === 'completed' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          ticket.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TechnicianDetailPage
