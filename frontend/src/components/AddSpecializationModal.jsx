import React, { useState } from 'react'
import { X, Target, TrendingUp, Clock } from 'lucide-react'
import { useQuery } from 'react-query'
import masterDataService from '../services/masterDataService'
import toast from 'react-hot-toast'

const AddSpecializationModal = ({ isOpen, onClose, technicianId, onSuccess }) => {
  const [formData, setFormData] = useState({
    specialization_id: '',
    proficiency_level: 'beginner',
    years_experience: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch specializations grouped by category
  const { data: specializationsData, isLoading } = useQuery(
    'specializations-grouped',
    () => masterDataService.getSpecializationsGrouped({ active_only: 'true' }),
    { enabled: isOpen }
  )

  const categories = specializationsData?.data || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.specialization_id) {
      toast.error('Please select a specialization')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/technicians/${technicianId}/specializations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add specialization')
      }

      toast.success(data.message || 'Specialization added successfully')
      onSuccess && onSuccess(data.data)
      onClose()
      
      // Reset form
      setFormData({
        specialization_id: '',
        proficiency_level: 'beginner',
        years_experience: 0
      })
    } catch (error) {
      console.error('Add specialization error:', error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Target className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Add Specialization</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Specialization Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Specialization *
            </label>
            {isLoading ? (
              <div className="text-sm text-gray-500">Loading specializations...</div>
            ) : (
              <select
                value={formData.specialization_id}
                onChange={(e) => setFormData({ ...formData, specialization_id: e.target.value })}
                className="form-select w-full"
                required
              >
                <option value="">-- Select Specialization --</option>
                {categories.map((category) => (
                  <optgroup key={category.id} label={`${category.icon} ${category.name}`}>
                    {category.specializations.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name} 
                        {spec.is_high_demand && ' ⭐'} 
                        {spec.is_critical_service && ' 🔴'}
                        {' [L' + spec.difficulty_level + ']'}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-1">
              ⭐ = High Demand | 🔴 = Critical Service | [L#] = Difficulty Level
            </p>
          </div>

          {/* Proficiency Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TrendingUp className="h-4 w-4 inline mr-1" />
              Proficiency Level *
            </label>
            <select
              value={formData.proficiency_level}
              onChange={(e) => setFormData({ ...formData, proficiency_level: e.target.value })}
              className="form-select w-full"
              required
            >
              <option value="beginner">Beginner - Just started learning</option>
              <option value="intermediate">Intermediate - Can work independently</option>
              <option value="expert">Expert - Master level, can train others</option>
            </select>
          </div>

          {/* Years of Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              Years of Experience
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="30"
              value={formData.years_experience}
              onChange={(e) => setFormData({ ...formData, years_experience: parseFloat(e.target.value) || 0 })}
              className="form-input w-full"
              placeholder="e.g., 2.5"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional - How many years of experience in this specific specialization
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !formData.specialization_id}
            >
              {isSubmitting ? 'Adding...' : 'Add Specialization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSpecializationModal

