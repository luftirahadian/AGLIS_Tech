import React, { useState } from 'react';
import { User, Star, Search, Briefcase, Activity } from 'lucide-react';

const MultiTechnicianSelector = ({ 
  availableTechnicians = [], 
  selectedTechnicians = [], 
  leadTechnicianId = null,
  onChange,
  onLeadChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTechnicians = availableTechnicians.filter(tech => 
    tech.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tech.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleTechnician = (tech) => {
    const isSelected = selectedTechnicians.some(t => t.technician_id === tech.id);
    
    if (isSelected) {
      // Remove technician
      const newSelection = selectedTechnicians.filter(t => t.technician_id !== tech.id);
      onChange(newSelection);
      
      // If removing lead, clear lead selection
      if (leadTechnicianId === tech.id) {
        onLeadChange(null);
      }
    } else {
      // Add technician
      const newTech = {
        technician_id: tech.id,
        role: 'member'
      };
      onChange([...selectedTechnicians, newTech]);
    }
  };

  const handleSetLead = (techId) => {
    // Update roles: set selected as lead, others as member
    const updated = selectedTechnicians.map(t => ({
      ...t,
      role: t.technician_id === techId ? 'lead' : (t.role === 'support' ? 'support' : 'member')
    }));
    onChange(updated);
    onLeadChange(techId);
  };

  const handleSetRole = (techId, newRole) => {
    const updated = selectedTechnicians.map(t => 
      t.technician_id === techId ? { ...t, role: newRole } : t
    );
    onChange(updated);
  };

  const getTechnicianWorkload = (tech) => {
    // TODO: Get from API - current active tickets count
    return tech.current_workload || 0;
  };

  const isSelected = (techId) => {
    return selectedTechnicians.some(t => t.technician_id === techId);
  };

  const getSelectedRole = (techId) => {
    const tech = selectedTechnicians.find(t => t.technician_id === techId);
    return tech?.role || 'member';
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari teknisi..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Selected Count */}
      {selectedTechnicians.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            <strong>{selectedTechnicians.length} teknisi</strong> dipilih
            {leadTechnicianId && (
              <span className="ml-2">
                • Lead: {availableTechnicians.find(t => t.id === leadTechnicianId)?.full_name}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Technician List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredTechnicians.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Tidak ada teknisi tersedia</p>
        ) : (
          filteredTechnicians.map((tech) => {
            const selected = isSelected(tech.id);
            const role = getSelectedRole(tech.id);
            const isLead = leadTechnicianId === tech.id;
            const workload = getTechnicianWorkload(tech);

            return (
              <div
                key={tech.id}
                className={`border rounded-lg p-4 transition-all ${
                  selected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => handleToggleTechnician(tech)}
                    className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                  />

                  {/* Tech Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{tech.full_name}</h4>
                      {isLead && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          <Star className="h-3 w-3 mr-1" />
                          LEAD
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                      {tech.specialization && (
                        <span className="flex items-center">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {tech.specialization}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        {workload} active tickets
                      </span>
                    </div>

                    {/* Role Selection (only for selected technicians) */}
                    {selected && (
                      <div className="mt-3 flex items-center space-x-2">
                        <label className="text-sm text-gray-600">Role:</label>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => handleSetLead(tech.id)}
                            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                              isLead
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <Star className="h-3 w-3 inline mr-1" />
                            Lead
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetRole(tech.id, 'member')}
                            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                              selected && role === 'member' && !isLead
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Member
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetRole(tech.id, 'support')}
                            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                              role === 'support'
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Support
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Validation Message */}
      {selectedTechnicians.length > 0 && !leadTechnicianId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-700">
            ⚠️ Pilih satu teknisi sebagai <strong>Lead</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default MultiTechnicianSelector;

