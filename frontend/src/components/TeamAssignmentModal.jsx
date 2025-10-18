import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { X, Users, AlertCircle, CheckCircle, User, Star, Search, Briefcase, Activity } from 'lucide-react';
import { technicianService } from '../services/technicianService';
import api from '../services/api';
import toast from 'react-hot-toast';

// Inline MultiTechnicianSelector to avoid module resolution issues
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
      const newSelection = selectedTechnicians.filter(t => t.technician_id !== tech.id);
      onChange(newSelection);
      if (leadTechnicianId === tech.id) {
        onLeadChange(null);
      }
    } else {
      const newTech = {
        technician_id: tech.id,
        role: 'member'
      };
      onChange([...selectedTechnicians, newTech]);
    }
  };

  const handleSetLead = (techId) => {
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
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => handleToggleTechnician(tech)}
                    className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                  />

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

const TeamAssignmentModal = ({ isOpen, onClose, ticket }) => {
  const queryClient = useQueryClient();
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [leadTechnicianId, setLeadTechnicianId] = useState(null);

  // Fetch available technicians
  const { data: techniciansData, isLoading } = useQuery(
    ['technicians-active', { status: 'active' }],
    () => technicianService.getTechnicians({ status: 'active' }),
    {
      enabled: isOpen,
      staleTime: 5 * 60 * 1000, // 5 minutes - fresh data
      cacheTime: 10 * 60 * 1000, // 10 minutes - keep in cache
      refetchOnWindowFocus: false,
      refetchOnMount: false // Don't refetch if cache exists
    }
  );

  // Team assignment mutation
  const assignTeamMutation = useMutation(
    async () => {
      const response = await api.put(`/tickets/${ticket.id}/assign-team`, {
        technicians: selectedTechnicians
      });
      return response;
    },
    {
      onSuccess: () => {
        toast.success('Tim berhasil di-assign!');
        queryClient.invalidateQueries(['tickets']);
        queryClient.invalidateQueries(['ticket', ticket.id]);
        onClose();
        setSelectedTechnicians([]);
        setLeadTechnicianId(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal assign tim');
      }
    }
  );

  // Extract technicians array - handle different response structures
  // API returns: { success: true, data: { technicians: [], pagination: {} } }
  const technicians = techniciansData?.data?.technicians || 
                     techniciansData?.technicians || 
                     (Array.isArray(techniciansData?.data) ? techniciansData.data : []) ||
                     (Array.isArray(techniciansData) ? techniciansData : []) ||
                     [];

  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedTechnicians.length === 0) {
      toast.error('Pilih minimal 1 teknisi');
      return;
    }

    if (!leadTechnicianId) {
      toast.error('Tentukan lead technician');
      return;
    }

    assignTeamMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Assign Technician Team</h2>
                <p className="text-sm text-gray-600">
                  Ticket #{ticket?.ticket_number} - {ticket?.title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} id="team-assignment-form">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Teknisi (bisa lebih dari 1)
                </label>
                
                <MultiTechnicianSelector
                  availableTechnicians={technicians}
                  selectedTechnicians={selectedTechnicians}
                  leadTechnicianId={leadTechnicianId}
                  onChange={setSelectedTechnicians}
                  onLeadChange={setLeadTechnicianId}
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-700">
                  <strong>💡 Catatan:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4 list-disc">
                  <li>Pilih minimal 1 teknisi (untuk single assignment)</li>
                  <li>Untuk tim, pilih 2+ teknisi</li>
                  <li>Tentukan 1 teknisi sebagai <strong>Lead</strong> (koordinator)</li>
                  <li>Lead bertanggung jawab untuk koordinasi & update</li>
                  <li>Semua anggota tim akan menerima notifikasi WhatsApp</li>
                </ul>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              {selectedTechnicians.length > 0 && (
                <p className="text-sm text-gray-600">
                  {selectedTechnicians.length === 1 ? (
                    <span><CheckCircle className="inline h-4 w-4 text-green-600 mr-1" />Single assignment ready</span>
                  ) : (
                    <span><Users className="inline h-4 w-4 text-blue-600 mr-1" />{selectedTechnicians.length} teknisi dalam tim</span>
                  )}
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="team-assignment-form"
                disabled={assignTeamMutation.isLoading || selectedTechnicians.length === 0 || !leadTechnicianId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {assignTeamMutation.isLoading ? 'Assigning...' : 
                 selectedTechnicians.length === 1 ? 'Assign Technician' : 
                 `Assign Team (${selectedTechnicians.length})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamAssignmentModal;
