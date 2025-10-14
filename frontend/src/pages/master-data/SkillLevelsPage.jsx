import React from 'react'
import { useQuery } from 'react-query'
import { Award, TrendingUp, Users, Clock } from 'lucide-react'
import masterDataService from '../../services/masterDataService'
import LoadingSpinner from '../../components/LoadingSpinner'
import BackButton from '../../components/common/BackButton'

const SkillLevelsPage = () => {
  const { data, isLoading } = useQuery(
    'skill-levels',
    () => masterDataService.getSkillLevels({ active_only: 'true' })
  )

  const skillLevels = data?.data || []

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skill Levels</h1>
          <p className="text-gray-600 mt-1">Manage technician skill level definitions</p>
        </div>
        <BackButton to="/dashboard" label="Back to Dashboard" />
      </div>

      {/* Skill Levels Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {skillLevels.map((level) => (
          <div key={level.id} className="card hover:shadow-lg transition-shadow">
            <div className="card-body">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="text-3xl mr-3">{level.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{level.name}</h3>
                    <span 
                      className="inline-block px-3 py-1 text-xs font-semibold rounded-full mt-1"
                      style={{ backgroundColor: `${level.color}20`, color: level.color }}
                    >
                      {level.badge_text}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">{level.description}</p>

              {/* Requirements */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center text-blue-600 mb-1">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-xs font-medium">Experience</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {level.min_experience_months} months
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center text-green-600 mb-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-xs font-medium">Min Tickets</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {level.min_completed_tickets} tickets
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="flex items-center text-yellow-600 mb-1">
                    <Award className="h-4 w-4 mr-1" />
                    <span className="text-xs font-medium">Min Rating</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {level.min_avg_rating}/5.0
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="flex items-center text-purple-600 mb-1">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="text-xs font-medium">Daily Capacity</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {level.daily_ticket_capacity} tickets
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div className="border-t pt-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Capabilities:</h4>
                <div className="flex flex-wrap gap-2">
                  {level.can_handle_critical_tickets && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Critical Tickets</span>
                  )}
                  {level.can_mentor_others && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Can Mentor</span>
                  )}
                  {level.requires_supervision && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">Needs Supervision</span>
                  )}
                  {!level.requires_supervision && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Independent</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SkillLevelsPage

