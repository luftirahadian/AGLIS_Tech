// ═══════════════════════════════════════════════════════════════
// 💰 INVOICE DETAIL PAGE
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, ArrowLeft, Send, Edit, Trash2, Download, Plus,
  Calendar, User, CreditCard, DollarSign, Clock, AlertCircle,
  CheckCircle, Printer, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import invoiceService from '../../services/invoiceService';
import paymentService from '../../services/paymentService';

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'bank_transfer',
    payment_channel: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });

  // Fetch invoice
  const { data, isLoading } = useQuery(
    ['invoice', id],
    () => invoiceService.getById(id),
    {
      enabled: !!id
    }
  );

  const invoice = data?.data || null;

  // Send mutation
  const sendMutation = useMutation(
    () => invoiceService.markAsSent(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['invoice', id]);
        toast.success('Invoice sent successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send invoice');
      }
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    () => invoiceService.delete(id),
    {
      onSuccess: () => {
        toast.success('Invoice deleted successfully');
        navigate('/invoices');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete invoice');
      }
    }
  );

  // Record payment mutation
  const recordPaymentMutation = useMutation(
    (data) => paymentService.create({
      ...data,
      invoice_id: parseInt(id),
      customer_id: invoice.customer_id,
      auto_verify: true
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['invoice', id]);
        setShowPaymentModal(false);
        setPaymentData({
          amount: '',
          payment_method: 'bank_transfer',
          payment_channel: '',
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: '',
          notes: ''
        });
        toast.success('Payment recorded successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record payment');
      }
    }
  );

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Status badge
  const getStatusBadge = (status) => {
    const badges = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      sent: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sent' },
      viewed: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Viewed' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
      partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Partially Paid' },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Overdue' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Cancelled' }
    };

    const badge = badges[status] || badges.draft;

    return (
      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  // Handle record payment
  const handleRecordPayment = (e) => {
    e.preventDefault();
    
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(paymentData.amount) > invoice.outstanding_amount) {
      toast.error('Payment amount cannot exceed outstanding amount');
      return;
    }

    recordPaymentMutation.mutate({
      ...paymentData,
      amount: parseFloat(paymentData.amount)
    });
  };

  // Handle delete
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) {
      deleteMutation.mutate();
    }
  };

  // Handle send
  const handleSend = () => {
    if (window.confirm(`Send invoice ${invoice.invoice_number} to customer?`)) {
      sendMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Invoice not found</p>
          <button
            onClick={() => navigate('/invoices')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status !== 'paid';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Invoices</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{invoice.invoice_number}</h1>
            <p className="text-gray-600 mt-1">
              Created on {formatDate(invoice.created_at)}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {getStatusBadge(invoice.status)}
            
            <div className="flex space-x-2">
              {invoice.status === 'draft' && (
                <>
                  <button
                    onClick={() => navigate(`/invoices/${id}/edit`)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleSend}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </button>
                </>
              )}
              
              {invoice.status !== 'paid' && invoice.outstanding_amount > 0 && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Record Payment</span>
                </button>
              )}

              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                title="Print"
              >
                <Printer className="h-4 w-4" />
              </button>

              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Dates Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Bill To:</h3>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">{invoice.customer_name}</p>
                  {invoice.customer_email && (
                    <p className="text-sm text-gray-600">{invoice.customer_email}</p>
                  )}
                  {invoice.customer_phone && (
                    <p className="text-sm text-gray-600">{invoice.customer_phone}</p>
                  )}
                  {invoice.customer_address && (
                    <p className="text-sm text-gray-600">{invoice.customer_address}</p>
                  )}
                </div>
              </div>

              {/* Invoice Dates */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Invoice Details:</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Invoice Date:</span>
                    <span className="font-medium">{formatDate(invoice.invoice_date)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Due Date:</span>
                    <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                      {formatDate(invoice.due_date)}
                    </span>
                  </div>
                  {invoice.billing_period_start && invoice.billing_period_end && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Billing Period:</span>
                      <span className="font-medium">
                        {formatDate(invoice.billing_period_start)} - {formatDate(invoice.billing_period_end)}
                      </span>
                    </div>
                  )}
                  {invoice.sent_at && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Sent:</span>
                      <span className="font-medium">{formatDate(invoice.sent_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isOverdue && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Invoice Overdue</p>
                  <p className="text-sm text-red-700">
                    This invoice is {Math.floor((new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24))} days overdue
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Unit Price</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Discount</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.line_items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{item.description}</p>
                          {item.item_type && (
                            <p className="text-xs text-gray-500 mt-1 capitalize">
                              {item.item_type.replace('_', ' ')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {item.discount_amount > 0 ? formatCurrency(item.discount_amount) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {formatCurrency(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="space-y-2 max-w-sm ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span className="font-medium">-{formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({invoice.tax_percentage}%):</span>
                  <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
                </div>
                
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total_amount)}</span>
                </div>

                {invoice.paid_amount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Paid:</span>
                      <span className="font-medium">-{formatCurrency(invoice.paid_amount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-orange-600 border-t border-gray-300 pt-2">
                      <span>Outstanding:</span>
                      <span>{formatCurrency(invoice.outstanding_amount)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {(invoice.notes || invoice.payment_terms) && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              
              {invoice.notes && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                  <p className="text-sm text-gray-600">{invoice.notes}</p>
                </div>
              )}
              
              {invoice.payment_terms && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Payment Terms:</p>
                  <p className="text-sm text-gray-600">{invoice.payment_terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Summary & Payments */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Invoice Summary</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-100">Total Amount:</span>
                <span className="text-2xl font-bold">{formatCurrency(invoice.total_amount)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-blue-100">Paid:</span>
                <span className="text-xl font-semibold">{formatCurrency(invoice.paid_amount)}</span>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-blue-500">
                <span className="text-blue-100">Outstanding:</span>
                <span className="text-2xl font-bold">{formatCurrency(invoice.outstanding_amount)}</span>
              </div>
            </div>

            {invoice.status === 'paid' && (
              <div className="mt-4 p-3 bg-green-500 bg-opacity-30 rounded-lg flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Fully Paid</span>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
            </div>
            
            {invoice.payments && invoice.payments.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {payment.payment_method.replace('_', ' ').toUpperCase()}
                          {payment.payment_channel && ` - ${payment.payment_channel}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(payment.payment_date)}
                        </p>
                        {payment.reference_number && (
                          <p className="text-xs text-gray-500">
                            Ref: {payment.reference_number}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No payments recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Recording Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
              <p className="text-sm text-gray-600 mt-1">
                Outstanding: {formatCurrency(invoice.outstanding_amount)}
              </p>
            </div>

            <form onSubmit={handleRecordPayment} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="e_wallet">E-Wallet</option>
                  <option value="virtual_account">Virtual Account</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Channel
                </label>
                <input
                  type="text"
                  value={paymentData.payment_channel}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_channel: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., BCA, Mandiri, GoPay"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentData.payment_date}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={paymentData.reference_number}
                  onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Transaction/Receipt number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Additional payment notes..."
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={recordPaymentMutation.isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  disabled={recordPaymentMutation.isLoading}
                >
                  {recordPaymentMutation.isLoading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetailPage;

