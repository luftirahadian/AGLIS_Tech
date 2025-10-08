import React from 'react'
import { Search, Filter, X } from 'lucide-react'

const SearchAndFilter = ({ 
  searchValue, 
  onSearchChange, 
  filters = [],
  showClearButton = false,
  onClear
}) => {
  const hasActiveFilters = filters.some(filter => filter.value !== '' && filter.value !== null)

  return (
    <div className="card">
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div>
            <label className="form-label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="form-input pl-10"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Dynamic Filter Fields */}
          {filters.map((filter, index) => (
            <div key={index}>
              <label className="form-label">{filter.label}</label>
              {filter.type === 'select' ? (
                <select
                  className="form-input"
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                >
                  <option value="">All {filter.label}</option>
                  {filter.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={filter.type || 'text'}
                  placeholder={filter.placeholder || `Filter by ${filter.label}`}
                  className="form-input"
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                />
              )}
            </div>
          ))}

          {/* Clear Filters Button (if there are active filters) */}
          {(hasActiveFilters || searchValue) && (
            <div className="flex items-end">
              <button
                onClick={onClear}
                className="btn-outline flex items-center gap-2 w-full"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchAndFilter

