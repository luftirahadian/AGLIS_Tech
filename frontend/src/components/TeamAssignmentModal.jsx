import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { X, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { technicianService } from '../services/technicianService';
import api from '../services/api';
import MultiTechnicianSelector from './MultiTechnicianSelector';
import toast from 'react-hot-toast';

const TeamAssignmentModal = ({ isOpen, onClose, ticket }) => {
  const queryClient = useQueryClient();
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [leadTechnicianId, setLeadTechnicianId] = useState(null);

  // Fetch available technicians
  const { data: techniciansData, isLoading } = useQuery(
    'technicians-active',
    () => technicianService.getTechnicians({ status: 'active' }),
    {
      enabled: isOpen
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

  const technicians = techniciansData?.data || techniciansData || [];

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

