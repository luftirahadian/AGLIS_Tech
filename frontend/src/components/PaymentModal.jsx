import React, { useState, useEffect } from 'react'
import { X, DollarSign, Calendar, CreditCard, Wallet, Building2, Smartphone, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const PaymentModal = ({ isOpen, onClose, customer, onSuccess }) => {
  const [formData, setFormData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'transfer',
    payment_reference: '',
    billing_period_start: '',
    billing_period_end: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAutoCalculate, setShowAutoCalculate] = useState(true)

  // Auto-calculate amount based on package price and outstanding balance
  useEffect(() => {
    if (customer && showAutoCalculate) {
      const packagePrice = parseFloat(customer.monthly_price) || 0
      const outstanding = parseFloat(customer.outstanding_balance) || 0
      const totalAmount = packagePrice + outstanding
      
      setFormData(prev => ({
        ...prev,
        amount: totalAmount.toString()
      }))

      // Auto-set billing period (current month)
      const today = new Date()
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      
      setFormData(prev => ({
        ...prev,
        billing_period_start: firstDay.toISOString().split('T')[0],
        billing_period_end: lastDay.toISOString().split('T')[0]
      }))
    }
  }, [customer, showAutoCalculate])

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: Wallet },
    { value: 'transfer', label: 'Bank Transfer', icon: Building2 },
    { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
    { value: 'ewallet', label: 'E-Wallet (GoPay, OVO, Dana)', icon: Smartphone }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Disable auto-calculate if user manually changes amount
    if (name === 'amount') {
      setShowAutoCalculate(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Masukkan jumlah pembayaran yang valid')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Call parent's onSuccess with form data
      await onSuccess({
        ...formData,
        customer_id: customer.id,
        amount: parseFloat(formData.amount)
      })
      
      // Reset form
      setFormData({
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: 'transfer',
        payment_reference: '',
        billing_period_start: '',
        billing_period_end: '',
        notes: ''
      })
      setShowAutoCalculate(true)
      
      onClose()
    } catch (error) {
      console.error('Payment submission error:', error)
      // Error handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetAutoCalculate = () => {
    setShowAutoCalculate(true)
    const packagePrice = parseFloat(customer.monthly_price) || 0
    const outstanding = parseFloat(customer.outstanding_balance) || 0
    const totalAmount = packagePrice + outstanding
    setFormData(prev => ({
      ...prev,
      amount: totalAmount.toString()
    }))
  }

  if (!isOpen) return null

  const packagePrice = parseFloat(customer?.monthly_price) || 0
  const outstanding = parseFloat(customer?.outstanding_balance) || 0
  const autoCalculatedAmount = packagePrice + outstanding

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border max-w-2xl shadow-lg rounded-lg bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">💰 Record Payment</h3>
            <p className="text-sm text-gray-600 mt-1">
              Catat pembayaran untuk <span className="font-medium">{customer?.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Auto-Calculate Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Payment Calculation</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Harga Paket (Monthly):</span>
                  <span className="font-medium">Rp {packagePrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Outstanding Balance:</span>
                  <span className="font-medium">Rp {outstanding.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between border-t border-blue-300 pt-2 font-semibold">
                  <span>Total Amount:</span>
                  <span>Rp {autoCalculatedAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
              {!showAutoCalculate && (
                <button
                  type="button"
                  onClick={handleResetAutoCalculate}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Reset to auto-calculated amount
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Tanggal Pembayaran *
            </label>
            <input
              type="date"
              name="payment_date"
              value={formData.payment_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Jumlah Pembayaran (Rp) *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="Masukkan jumlah pembayaran"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {!showAutoCalculate && (
              <p className="text-xs text-amber-600 mt-1">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                Manual amount (auto-calculate disabled)
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metode Pembayaran *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, payment_method: method.value }))}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      formData.payment_method === method.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-xs font-medium block">{method.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Payment Reference (conditional) */}
          {formData.payment_method !== 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referensi Pembayaran
                {formData.payment_method === 'transfer' && ' (No. Rekening / VA)'}
                {formData.payment_method === 'card' && ' (Last 4 digits)'}
                {formData.payment_method === 'ewallet' && ' (Transaction ID)'}
              </label>
              <input
                type="text"
                name="payment_reference"
                value={formData.payment_reference}
                onChange={handleChange}
                placeholder={
                  formData.payment_method === 'transfer' ? 'e.g. BCA 1234567890' :
                  formData.payment_method === 'card' ? 'e.g. **** 1234' :
                  formData.payment_method === 'ewallet' ? 'e.g. TRX-2024-001' : ''
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Billing Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Periode Awal
              </label>
              <input
                type="date"
                name="billing_period_start"
                value={formData.billing_period_start}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Periode Akhir
              </label>
              <input
                type="date"
                name="billing_period_end"
                value={formData.billing_period_end}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Catatan tambahan (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4" />
                  Record Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PaymentModal

