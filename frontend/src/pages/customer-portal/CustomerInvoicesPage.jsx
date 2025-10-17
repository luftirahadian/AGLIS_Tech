import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { FileText, Download, Eye, DollarSign, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import CustomerPortalLayout from '../../components/CustomerPortalLayout';

const CustomerInvoicesPage = () => {
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery(
    ['customer-invoices', filter],
    async () => {
      const statusFilter = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/customer-portal/invoices${statusFilter}`);
      return response.data;
    }
  );

  const invoices = data?.data?.invoices || data?.invoices || [];

  const getStatusBadge = (status) => {
    const badges = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      overdue: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status) => {
    const icons = {
      paid: <CheckCircle className="h-4 w-4" />,
      pending: <Clock className="h-4 w-4" />,
      overdue: <AlertCircle className="h-4 w-4" />
    };
    return icons[status];
  };

  const handleDownload = (invoice) => {
    toast.success('Downloading invoice...');
    // TODO: Implement PDF download
  };

  return (
    <CustomerPortalLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <FileText className="h-7 w-7 mr-2 text-blue-600" />
            Invoice & Tagihan
          </h1>
          <p className="text-gray-600">Lihat dan download invoice Anda</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'overdue', 'paid'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Semua' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada invoice</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{invoice.invoice_number}</h3>
                      <span className={`px-3 py-1 text-sm rounded-full flex items-center space-x-1 ${getStatusBadge(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        <span>{invoice.status}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(invoice.invoice_date).toLocaleDateString('id-ID')}
                      </span>
                      {invoice.due_date && (
                        <span className="flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Jatuh tempo: {new Date(invoice.due_date).toLocaleDateString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      Rp {(invoice.total_amount || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <p>Period: {invoice.period_start ? new Date(invoice.period_start).toLocaleDateString('id-ID') : '-'} - {invoice.period_end ? new Date(invoice.period_end).toLocaleDateString('id-ID') : '-'}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDownload(invoice)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerPortalLayout>
  );
};

export default CustomerInvoicesPage;

