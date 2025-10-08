import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  X, User, MapPin, Star, Clock, Zap, Award, 
  CheckCircle, AlertCircle, Loader, Target,
  Users, TrendingUp, Navigation, Wrench
} from 'lucide-react'
import { ticketService } from '../services/ticketService'
import { technicianService } from '../services/technicianService'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'

const SmartAssignmentModal = ({ isOpen, onClose, ticket }) => {
  const [assignmentMode, setAssignmentMode] = useState('auto') // 'auto' or 'manual'
  const [selectedTechnician, setSelectedTechnician] = useState(null)
  const [assignmentOptions, setAssignmentOptions] = useState({
    force_zone: '',
    required_skills: []
  })
  
  const queryClient = useQueryClient()

  // Get assignment recommendations
  const { data: recommendationsData, isLoading: loadingRecommendations } = useQuery(
    ['assignment-recommendations', ticket?.id],
    () => ticketService.getAssignmentRecommendations(ticket.id),
    { 
      enabled: isOpen && !!ticket?.id,
      refetchOnWindowFocus: false
    }
  )

  // Auto assignment mutation
  const autoAssignMutation = useMutation(
    (options) => ticketService.autoAssignTicket(ticket.id, options),
    {
      onSuccess: (data) => {
        toast.success('Ticket berhasil di-assign secara otomatis!')
        queryClient.invalidateQueries(['tickets'])
        queryClient.invalidateQueries(['ticket', ticket.id])
        onClose()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal melakukan auto assignment')
      }
    }
  )

  // Manual assignment mutation
  const manualAssignMutation = useMutation(
    (technicianId) => ticketService.assignTicket(ticket.id, technicianId),
    {
      onSuccess: () => {
        toast.success('Ticket berhasil di-assign!')
        queryClient.invalidateQueries(['tickets'])
        queryClient.invalidateQueries(['ticket', ticket.id])
        onClose()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal melakukan assignment')
      }
    }
  )

  const handleAutoAssign = () => {
    autoAssignMutation.mutate(assignmentOptions)
  }

  const handleManualAssign = () => {
    if (!selectedTechnician) {
      toast.error('Pilih teknisi terlebih dahulu')
      return
    }
    manualAssignMutation.mutate(selectedTechnician.id)
  }

  const getAvailabilityBadge = (status) => {
    const badges = {
      available: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Available' },
      unavailable: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Unavailable' }
    }
    const badge = badges[status] || badges.unavailable
    const Icon = badge.icon
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    )
  }

  const getCapacityBadge = (status) => {
    const badges = {
      available: { color: 'bg-blue-100 text-blue-800', label: 'Has Capacity' },
      full: { color: 'bg-orange-100 text-orange-800', label: 'At Capacity' }
    }
    const badge = badges[status] || badges.full
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const getDistanceBadge = (status) => {
    const badges = {
      near: { color: 'bg-green-100 text-green-800', icon: Navigation, label: 'Nearby' },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: Navigation, label: 'Medium' },
      far: { color: 'bg-red-100 text-red-800', icon: Navigation, label: 'Far' },
      unknown: { color: 'bg-gray-100 text-gray-800', icon: Navigation, label: 'Unknown' }
    }
    const badge = badges[status] || badges.unknown
    const Icon = badge.icon
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    )
  }

  const getSkillLevelBadge = (level) => {
    const badges = {
      junior: { color: 'bg-blue-100 text-blue-800', label: 'Junior' },
      senior: { color: 'bg-purple-100 text-purple-800', label: 'Senior' },
      expert: { color: 'bg-orange-100 text-orange-800', label: 'Expert' },
      specialist: { color: 'bg-red-100 text-red-800', label: 'Specialist' }
    }
    const badge = badges[level] || badges.junior
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Award className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    )
  }

  if (!isOpen) return null

  const recommendations = recommendationsData?.data?.recommendations || []
  const ticketData = recommendationsData?.data?.ticket || ticket

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Target className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Smart Assignment - Ticket #{ticketData?.ticket_number}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Ticket Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer</label>
                  <p className="text-sm text-gray-900">{ticketData?.customer_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Service Type</label>
                  <p className="text-sm text-gray-900">{ticketData?.service_type || 'General'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    ticketData?.priority === 'high' ? 'bg-red-100 text-red-800' :
                    ticketData?.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {ticketData?.priority || 'low'}
                  </span>
                </div>
              </div>
            </div>

            {/* Assignment Mode Toggle */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setAssignmentMode('auto')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                  assignmentMode === 'auto'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                <Zap className="h-4 w-4 mr-2" />
                Auto Assignment
              </button>
              <button
                onClick={() => setAssignmentMode('manual')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                  assignmentMode === 'manual'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                <Users className="h-4 w-4 mr-2" />
                Manual Selection
              </button>
            </div>

            {/* Auto Assignment Options */}
            {assignmentMode === 'auto' && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-blue-900 mb-3">Assignment Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Force Work Zone
                    </label>
                    <select
                      className="form-input text-sm"
                      value={assignmentOptions.force_zone}
                      onChange={(e) => setAssignmentOptions(prev => ({ ...prev, force_zone: e.target.value }))}
                    >
                      <option value="">Any Zone</option>
                      <option value="Jakarta_Pusat">Jakarta Pusat</option>
                      <option value="Jakarta_Selatan">Jakarta Selatan</option>
                      <option value="Jakarta_Utara">Jakarta Utara</option>
                      <option value="Jakarta_Timur">Jakarta Timur</option>
                      <option value="Jakarta_Barat">Jakarta Barat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Required Skills
                    </label>
                    <select
                      className="form-input text-sm"
                      multiple
                      value={assignmentOptions.required_skills}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value)
                        setAssignmentOptions(prev => ({ ...prev, required_skills: values }))
                      }}
                    >
                      <option value="fiber_optic">Fiber Optic</option>
                      <option value="wireless">Wireless</option>
                      <option value="networking">Networking</option>
                      <option value="installation">Installation</option>
                      <option value="troubleshooting">Troubleshooting</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loadingRecommendations && (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600">Loading recommendations...</span>
              </div>
            )}

            {/* Technician Recommendations */}
            {!loadingRecommendations && recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">
                  {assignmentMode === 'auto' ? 'Top Matches' : 'Available Technicians'}
                </h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recommendations.slice(0, assignmentMode === 'auto' ? 3 : 10).map((tech) => (
                    <div
                      key={tech.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        assignmentMode === 'manual' && selectedTechnician?.id === tech.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => assignmentMode === 'manual' && setSelectedTechnician(tech)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h5 className="text-sm font-medium text-gray-900">{tech.full_name}</h5>
                              {getSkillLevelBadge(tech.skill_level)}
                            </div>
                            <p className="text-xs text-gray-500 mb-2">ID: {tech.employee_id}</p>
                            
                            {/* Status Badges */}
                            <div className="flex flex-wrap gap-2 mb-2">
                              {getAvailabilityBadge(tech.availability_status)}
                              {getCapacityBadge(tech.capacity_status)}
                              {getDistanceBadge(tech.distance_status)}
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div className="flex items-center">
                                <Star className="h-3 w-3 text-yellow-400 mr-1" />
                                <span>{tech.avg_rating ? parseFloat(tech.avg_rating).toFixed(1) : 'N/A'}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 text-blue-400 mr-1" />
                                <span>{tech.current_tickets}/{tech.max_daily_tickets}</span>
                              </div>
                              <div className="flex items-center">
                                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                                <span>{tech.avg_sla ? parseFloat(tech.avg_sla).toFixed(1) : 'N/A'}%</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 text-purple-400 mr-1" />
                                <span>{tech.work_zone?.replace('_', ' ')}</span>
                              </div>
                            </div>

                            {/* Specializations */}
                            {tech.specializations && tech.specializations.length > 0 && (
                              <div className="mt-2">
                                <div className="flex flex-wrap gap-1">
                                  {tech.specializations.slice(0, 3).map((spec, index) => (
                                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                      <Wrench className="h-3 w-3 mr-1" />
                                      {spec.replace('_', ' ')}
                                    </span>
                                  ))}
                                  {tech.specializations.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      +{tech.specializations.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Recommendation Score */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {tech.recommendation_score || 0}
                          </div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Recommendations */}
            {!loadingRecommendations && recommendations.length === 0 && (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No technicians available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No technicians match the current criteria.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {assignmentMode === 'auto' ? (
              <button
                onClick={handleAutoAssign}
                disabled={autoAssignMutation.isLoading || recommendations.length === 0}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {autoAssignMutation.isLoading ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Auto Assign
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleManualAssign}
                disabled={manualAssignMutation.isLoading || !selectedTechnician}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {manualAssignMutation.isLoading ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Assign Selected
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartAssignmentModal
