import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Ticket, Plus, Calendar, User, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import CustomerPortalLayout from '../../components/CustomerPortalLayout';

const CustomerTicketsPage = () => {
  const queryClient = useQueryClient();
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    type: 'repair',
    title: '',
    description: '',
    priority: 'normal'
  });

  const { data, isLoading } = useQuery(
    ['customer-tickets', filter],
    async () => {
      const token = localStorage.getItem('customerToken');
      const statusFilter = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/customer-portal/tickets${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  );

  const createTicketMutation = useMutation(
    async (ticketData) => {
      const token = localStorage.getItem('customerToken');
      return api.post('/customer-portal/tickets', ticketData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    {
      onSuccess: () => {
        toast.success('Tiket berhasil dibuat! Tim kami akan segera memproses.');
        setShowNewTicketModal(false);
        setFormData({ type: 'repair', title: '', description: '', priority: 'normal' });
        queryClient.invalidateQueries('customer-tickets');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal membuat tiket');
      }
    }
  );

  const tickets = data?.data?.tickets || [];

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-blue-100 text-blue-700',
      assigned: 'bg-purple-100 text-purple-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      on_hold: 'bg-gray-100 text-gray-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status) => {
    const icons = {
      open: <Clock className="h-4 w-4" />,
      assigned: <User className="h-4 w-4" />,
      in_progress: <AlertCircle className="h-4 w-4" />,
      completed: <CheckCircle className="h-4 w-4" />
    };
    return icons[status] || <Ticket className="h-4 w-4" />;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createTicketMutation.mutate(formData);
  };

  return (
    <CustomerPortalLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Ticket className="h-7 w-7 mr-2 text-blue-600" />
              Tiket Saya
            </h1>
            <p className="text-gray-600">Kelola tiket support Anda</p>
          </div>
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Buat Tiket Baru</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'open', 'in_progress', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Semua' : 
                 status === 'in_progress' ? 'In Progress' :
                 status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Belum ada tiket</p>
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Buat tiket pertama Anda →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-gray-900">#{ticket.ticket_number}</span>
                      <span className={`px-3 py-1 text-sm rounded-full flex items-center space-x-1 ${getStatusBadge(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        <span>{ticket.status}</span>
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        ticket.priority === 'high' ? 'bg-red-100 text-red-700' :
                        ticket.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{ticket.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(ticket.created_at).toLocaleDateString('id-ID')}
                      </span>
                      {ticket.technician_name && (
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Teknisi: {ticket.technician_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Ticket Modal */}
        {showNewTicketModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Buat Tiket Baru</h2>
                  <button
                    onClick={() => setShowNewTicketModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jenis Tiket
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="repair">Perbaikan (Repair)</option>
                      <option value="upgrade">Upgrade Paket</option>
                      <option value="dismantle">Pemutusan Layanan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Judul Masalah
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Contoh: Internet lambat atau putus-putus"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deskripsi Detail
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Jelaskan masalah Anda secara detail..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioritas
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low (Tidak mendesak)</option>
                      <option value="normal">Normal</option>
                      <option value="high">High (Mendesak)</option>
                    </select>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      <strong>Catatan:</strong> Tiket Anda akan segera diproses oleh tim kami. 
                      Anda akan menerima notifikasi WhatsApp untuk setiap update.
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowNewTicketModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={createTicketMutation.isLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {createTicketMutation.isLoading ? 'Membuat...' : 'Buat Tiket'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomerPortalLayout>
  );
};

export default CustomerTicketsPage;

