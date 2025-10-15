import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Ticket, FileText, User, LogOut,
  Clock, CheckCircle, XCircle, AlertTriangle, DollarSign,
  Phone, Mail, MapPin, Package, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const CustomerDashboardPage = () => {
  const navigate = useNavigate();

  // Get customer data from localStorage
  const customerData = JSON.parse(localStorage.getItem('customerData') || '{}');

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery(
    'customer-dashboard-stats',
    async () => {
      const token = localStorage.getItem('customerToken');
      const response = await api.get('/customer-portal/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      refetchInterval: 30000 // Refetch every 30 seconds
    }
  );

  // Fetch profile
  const { data: profileData, isLoading: profileLoading } = useQuery(
    'customer-profile',
    async () => {
      const token = localStorage.getItem('customerToken');
      const response = await api.get('/customer-portal/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  );

  // Fetch recent tickets
  const { data: ticketsData, isLoading: ticketsLoading } = useQuery(
    'customer-recent-tickets',
    async () => {
      const token = localStorage.getItem('customerToken');
      const response = await api.get('/customer-portal/tickets?limit=5', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  );

  const stats = statsData?.data || {};
  const profile = profileData?.data || {};
  const tickets = ticketsData?.data?.tickets || [];

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerData');
    toast.success('Logout berhasil');
    navigate('/customer/login');
  };

  if (statsLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Customer Portal</h1>
                <p className="text-sm text-gray-600">Welcome, {customerData.name || profile.name}!</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Tickets */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tiket Aktif</p>
                <p className="text-3xl font-bold text-gray-900">{stats.tickets?.active_tickets || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Completed Tickets */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tiket Selesai</p>
                <p className="text-3xl font-bold text-gray-900">{stats.tickets?.completed_tickets || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Pending Invoices */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Invoice Pending</p>
                <p className="text-3xl font-bold text-gray-900">{stats.invoices?.pending_invoices || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FileText className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Outstanding Amount */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tagihan</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rp {(stats.invoices?.outstanding_amount || 0).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <DollarSign className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Customer Info */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Informasi Pelanggan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Customer ID</p>
                <p className="font-semibold text-gray-900">{profile.customer_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nama</p>
                <p className="font-semibold text-gray-900">{profile.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">WhatsApp</p>
                <p className="font-semibold text-gray-900 flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {profile.phone}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-gray-900 flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  {profile.email || '-'}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Alamat</p>
                <p className="font-semibold text-gray-900 flex items-start">
                  <MapPin className="h-4 w-4 mr-1 mt-1" />
                  <span>{profile.address}</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Paket</p>
                <p className="font-semibold text-gray-900 flex items-center">
                  <Package className="h-4 w-4 mr-1" />
                  {profile.package_name || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bandwidth</p>
                <p className="font-semibold text-gray-900">
                  {profile.bandwidth_down ? `${profile.bandwidth_down} Mbps` : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/customer/tickets/new')}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Ticket className="h-5 w-5" />
                <span>Buat Tiket Baru</span>
              </button>
              <button
                onClick={() => navigate('/customer/invoices')}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <FileText className="h-5 w-5" />
                <span>Lihat Invoice</span>
              </button>
              <button
                onClick={() => navigate('/customer/tickets')}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Clock className="h-5 w-5" />
                <span>Track Tiket</span>
              </button>
              <button
                onClick={() => navigate('/customer/profile')}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <User className="h-5 w-5" />
                <span>Update Profil</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Ticket className="h-5 w-5 mr-2 text-blue-600" />
            Tiket Terbaru
          </h2>
          
          {ticketsLoading ? (
            <p className="text-gray-500 text-center py-4">Loading...</p>
          ) : tickets.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Belum ada tiket</p>
          ) : (
            <div className="space-y-3">
              {tickets.map(ticket => (
                <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-900">#{ticket.ticket_number}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          ticket.status === 'completed' ? 'bg-green-100 text-green-700' :
                          ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          ticket.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {ticket.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          ticket.priority === 'high' ? 'bg-red-100 text-red-700' :
                          ticket.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 font-medium mb-1">{ticket.title}</p>
                      <p className="text-xs text-gray-600 mb-2">{ticket.description?.substring(0, 100)}...</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(ticket.created_at).toLocaleDateString('id-ID')}
                        </span>
                        {ticket.technician_name && (
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {ticket.technician_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/customer/tickets/${ticket.id}`)}
                      className="ml-4 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tickets.length > 0 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/customer/tickets')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Lihat Semua Tiket →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboardPage;

