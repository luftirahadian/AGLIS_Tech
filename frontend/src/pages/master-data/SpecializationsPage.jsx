import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Target, Filter } from 'lucide-react'
import masterDataService from '../../services/masterDataService'
import LoadingSpinner from '../../components/LoadingSpinner'
import BackButton from '../../components/common/BackButton'

const SpecializationsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const { data, isLoading } = useQuery(
    'specializations-grouped',
    () => masterDataService.getSpecializationsGrouped({ active_only: 'true' })
  )

  const categories = data?.data || []
  
  const filteredCategories = selectedCategory === 'all' 
    ? categories 
    : categories.filter(cat => cat.code === selectedCategory)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  const totalSpecs = categories.reduce((sum, cat) => sum + cat.specializations.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Specializations</h1>
          <p className="text-gray-600 mt-1">{totalSpecs} specializations across {categories.length} categories</p>
        </div>
        <BackButton to="/dashboard" label="Back to Dashboard" />
      </div>

      {/* Category Filter */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-select text-sm"
            >
              <option value="all">All Categories ({totalSpecs})</option>
              {categories.map((cat) => (
                <option key={cat.code} value={cat.code}>
                  {cat.name} ({cat.specializations.length})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Categories */}
      {filteredCategories.map((category) => (
        <div key={category.id} className="card">
          <div className="card-header" style={{ borderLeftColor: category.color, borderLeftWidth: '4px' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold" style={{ color: category.color }}>
                  {category.icon} {category.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
              </div>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                {category.specializations.length} specs
              </span>
            </div>
          </div>

          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.specializations.map((spec) => (
                <div key={spec.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">{spec.name}</h3>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                      L{spec.difficulty_level}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{spec.description}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                      {spec.required_skill_level}
                    </span>
                    {spec.is_high_demand && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                        High Demand
                      </span>
                    )}
                    {spec.is_critical_service && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                        Critical
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default SpecializationsPage

