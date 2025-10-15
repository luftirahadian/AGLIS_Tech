import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  Ticket, Calendar, User, Clock, CheckCircle, AlertCircle,
  ArrowLeft, MessageCircle
} from 'lucide-react';
import api from '../../services/api';
import CustomerPortalLayout from '../../components/CustomerPortalLayout';

const CustomerTicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: ticketData, isLoading } = useQuery(
    ['customer-ticket-detail', id],
    async () => {
      const token = localStorage.getItem('customerToken');
      const response = await api.get(`/customer-portal/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Find the specific ticket
      const tickets = response?.data?.tickets || response?.tickets || [];
      return tickets.find(t => t.id === parseInt(id));
    }
  );

  const ticket = ticketData;

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
      open: <Clock className="h-5 w-5" />,
      assigned: <User className="h-5 w-5" />,
      in_progress: <AlertCircle className="h-5 w-5" />,
      completed: <CheckCircle className="h-5 w-5" />
    };
    return icons[status] || <Ticket className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <CustomerPortalLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </CustomerPortalLayout>
    );
  }

  if (!ticket) {
    return (
      <CustomerPortalLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Tiket tidak ditemukan</p>
            <button
              onClick={() => navigate('/customer/tickets')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Kembali ke Tiket Saya
            </button>
          </div>
        </div>
      </CustomerPortalLayout>
    );
  }

  return (
    <CustomerPortalLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/customer/tickets')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Tiket Saya</span>
        </button>

        {/* Ticket Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">#{ticket.ticket_number}</h1>
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
              <h2 className="text-lg font-medium text-gray-900 mb-2">{ticket.title}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Dibuat: {new Date(ticket.created_at).toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
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

        {/* Ticket Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Tiket</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Jenis Tiket</p>
              <p className="font-medium text-gray-900">{ticket.type}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Kategori</p>
              <p className="font-medium text-gray-900">{ticket.category || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Deskripsi Masalah</p>
              <p className="text-gray-900 whitespace-pre-line">{ticket.description}</p>
            </div>

            {ticket.resolution_notes && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-900 mb-2">✅ Solusi</p>
                <p className="text-sm text-green-800 whitespace-pre-line">{ticket.resolution_notes}</p>
              </div>
            )}

            {ticket.work_notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">📝 Catatan Teknisi</p>
                <p className="text-sm text-blue-800 whitespace-pre-line">{ticket.work_notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Tiket Dibuat</p>
                <p className="text-xs text-gray-600">
                  {new Date(ticket.created_at).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {ticket.started_at && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Pekerjaan Dimulai</p>
                  <p className="text-xs text-gray-600">
                    {new Date(ticket.started_at).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            )}

            {ticket.completed_at && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Tiket Selesai</p>
                  <p className="text-xs text-gray-600">
                    {new Date(ticket.completed_at).toLocaleString('id-ID')}
                  </p>
                  {ticket.actual_duration && (
                    <p className="text-xs text-gray-500">
                      Durasi: {Math.floor(ticket.actual_duration / 60)} jam {ticket.actual_duration % 60} menit
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Technician Info */}
        {ticket.technician_name && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Teknisi</h3>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{ticket.technician_name}</p>
                {ticket.technician_phone && (
                  <a 
                    href={`https://wa.me/${ticket.technician_phone.replace(/^0/, '62')}`}
                    className="text-sm text-green-600 hover:text-green-700 flex items-center"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {ticket.technician_phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customer Feedback */}
        {ticket.customer_rating && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Anda</h3>
            <div className="flex items-center space-x-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={`text-2xl ${star <= ticket.customer_rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                  ⭐
                </span>
              ))}
            </div>
            {ticket.customer_feedback && (
              <p className="text-sm text-gray-600 mt-2">{ticket.customer_feedback}</p>
            )}
          </div>
        )}
      </div>
    </CustomerPortalLayout>
  );
};

export default CustomerTicketDetailPage;

