// ═══════════════════════════════════════════════════════════════
// 💰 INVOICE CREATE PAGE
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import { ArrowLeft, Plus, Trash2, Save, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import invoiceService from '../../services/invoiceService';
import { customerService } from '../../services/customerService';
import packageService from '../../services/packageService';

const InvoiceCreatePage = () => {
  const navigate = useNavigate();
  
  // State
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    billing_period_start: '',
    billing_period_end: '',
    tax_percentage: 11,
    discount_amount: 0,
    discount_percentage: 0,
    notes: '',
    internal_notes: '',
    invoice_type: 'recurring',
    auto_send: false
  });
  
  const [lineItems, setLineItems] = useState([
    {
      item_type: 'package',
      item_reference_id: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_amount: 0,
      discount_percentage: 0
    }
  ]);

  // Fetch customers
  const { data: customersData } = useQuery(
    'customers-for-invoice',
    () => customerService.getCustomers({ limit: 1000, status: 'active' })
  );

  // Fetch packages
  const { data: packagesData } = useQuery(
    'packages-for-invoice',
    () => packageService.getAll({ is_active: true })
  );

  const customers = customersData?.data?.customers || customersData?.customers || [];
  const packages = packagesData?.data || packagesData || [];

  // Create mutation
  const createMutation = useMutation(
    (data) => invoiceService.create(data),
    {
      onSuccess: (response) => {
        toast.success('Invoice created successfully');
        navigate(`/invoices/${response.data.id}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create invoice');
      }
    }
  );

  // Add line item
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        item_type: 'package',
        item_reference_id: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        discount_amount: 0,
        discount_percentage: 0
      }
    ]);
  };

  // Remove line item
  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // Update line item
  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    
    // Auto-populate from package
    if (field === 'item_reference_id' && updated[index].item_type === 'package') {
      const pkg = packages.find(p => p.id === parseInt(value));
      if (pkg) {
        updated[index].description = `${pkg.package_name} - ${pkg.package_type}`;
        updated[index].unit_price = pkg.monthly_price || 0;
      }
    }
    
    setLineItems(updated);
  };

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    
    lineItems.forEach(item => {
      const itemTotal = (item.quantity * item.unit_price) - (item.discount_amount || 0);
      subtotal += itemTotal;
    });
    
    const invoiceDiscount = formData.discount_amount || (subtotal * (formData.discount_percentage / 100));
    const subtotalAfterDiscount = subtotal - invoiceDiscount;
    const taxAmount = subtotalAfterDiscount * (formData.tax_percentage / 100);
    const total = subtotalAfterDiscount + taxAmount;
    
    return {
      subtotal,
      discount: invoiceDiscount,
      subtotalAfterDiscount,
      tax: taxAmount,
      total
    };
  };

  const totals = calculateTotals();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Handle submit
  const handleSubmit = (e, sendImmediately = false) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }
    
    if (lineItems.length === 0 || !lineItems[0].description) {
      toast.error('Please add at least one line item');
      return;
    }
    
    const invoiceData = {
      ...formData,
      line_items: lineItems,
      auto_send: sendImmediately
    };
    
    createMutation.mutate(invoiceData);
  };

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

        <h1 className="text-3xl font-bold text-gray-900">Create New Invoice</h1>
        <p className="text-gray-600 mt-1">Generate an invoice for customer billing</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer *
                  </label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Type
                  </label>
                  <select
                    value={formData.invoice_type}
                    onChange={(e) => setFormData({ ...formData, invoice_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="recurring">Recurring</option>
                    <option value="one_time">One Time</option>
                    <option value="installation">Installation</option>
                    <option value="additional">Additional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Period Start
                  </label>
                  <input
                    type="date"
                    value={formData.billing_period_start}
                    onChange={(e) => setFormData({ ...formData, billing_period_start: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Period End
                  </label>
                  <input
                    type="date"
                    value={formData.billing_period_end}
                    onChange={(e) => setFormData({ ...formData, billing_period_end: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={item.item_type}
                          onChange={(e) => updateLineItem(index, 'item_type', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="package">Package</option>
                          <option value="service">Service</option>
                          <option value="equipment">Equipment</option>
                          <option value="installation">Installation</option>
                          <option value="addon">Add-on</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {item.item_type === 'package' && (
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Package</label>
                          <select
                            value={item.item_reference_id}
                            onChange={(e) => updateLineItem(index, 'item_reference_id', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select...</option>
                            {packages.map(pkg => (
                              <option key={pkg.id} value={pkg.id}>
                                {pkg.package_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className={item.item_type === 'package' ? 'col-span-6' : 'col-span-9'}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Item description"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Qty</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0.01"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Discount</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.discount_amount}
                          onChange={(e) => updateLineItem(index, 'discount_amount', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                        <div className="px-2 py-1 text-sm font-semibold text-gray-900 bg-gray-50 rounded border border-gray-200">
                          {formatCurrency((item.quantity * item.unit_price) - (item.discount_amount || 0))}
                        </div>
                      </div>

                      <div className="col-span-1 flex items-end">
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Customer Visible)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Add any notes for the customer..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Internal Notes (Private)
                  </label>
                  <textarea
                    value={formData.internal_notes}
                    onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                    placeholder="Internal notes (not visible to customer)..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Totals Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Invoice Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-100">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
                
                {totals.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-200">
                    <span>Discount:</span>
                    <span className="font-medium">-{formatCurrency(totals.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-blue-100">Tax ({formData.tax_percentage}%):</span>
                  <span className="font-medium">{formatCurrency(totals.tax)}</span>
                </div>
                
                <div className="border-t border-blue-500 pt-3 flex justify-between">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>

            {/* Tax & Discount Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax & Discount</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tax_percentage}
                    onChange={(e) => setFormData({ ...formData, tax_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Amount (Rp)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0, discount_percentage: 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>

                <div className="text-center text-sm text-gray-500">OR</div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0, discount_amount: 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold"
                >
                  <Save className="h-5 w-5" />
                  <span>{createMutation.isLoading ? 'Creating...' : 'Save as Draft'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={createMutation.isLoading}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold"
                >
                  <Send className="h-5 w-5" />
                  <span>{createMutation.isLoading ? 'Creating...' : 'Create & Send'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/invoices')}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InvoiceCreatePage;

