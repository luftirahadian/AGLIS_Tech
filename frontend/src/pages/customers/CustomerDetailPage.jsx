import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from 'react-query'
import {
  User, Phone, Mail, MapPin, Package, CreditCard,
  Calendar, Activity, Plus, Trash2, Edit,
  Wifi, Router, Cable, DollarSign, Clock, Star, AlertCircle,
  CheckCircle, XCircle, Zap, Globe, Shield, ChevronRight,
  PhoneCall, Mail as MailIcon, MessageCircle, FileText, RefreshCw, Wallet
} from 'lucide-react'
import { customerService } from '../../services/customerService'
import packageService from '../../services/packageService'
import { ticketService } from '../../services/ticketService'
import socketService from '../../services/socketService'
import LoadingSpinner from '../../components/LoadingSpinner'
import BackButton from '../../components/common/BackButton'
import toast from 'react-hot-toast'
import { Link as RouterLink } from 'react-router-dom'

const CustomerDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddEquipment, setShowAddEquipment] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  
  // State untuk inline editing
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedPhone, setEditedPhone] = useState('')
  const [editedAddress, setEditedAddress] = useState('')

  const { 
    data: customerData, 
    isLoading, 
    error,
    refetch 
  } = useQuery(
    ['customer', id],
    () => customerService.getCustomer(id),
    {
      enabled: !!id,
      staleTime: 30000
    }
  )

  // Fetch packages for dropdown
  const { data: packagesData } = useQuery(
    'packages',
    packageService.getAll,
    {
      refetchOnWindowFocus: false
    }
  )

  // Fetch customer tickets
  const { data: ticketsData, isLoading: ticketsLoading } = useQuery(
    ['customer-tickets', id],
    () => ticketService.getTickets({ customer_id: id, limit: 100 }),
    {
      enabled: !!id && activeTab === 'tickets',
      staleTime: 30000
    }
  )

  const packages = packagesData || []
  const customerTickets = Array.isArray(ticketsData?.data?.tickets) 
    ? ticketsData.data.tickets 
    : []

  // Listen to socket events for real-time updates
  useEffect(() => {
    const handleCustomerUpdate = (data) => {
      if (data.customer && data.customer.id === parseInt(id)) {
        queryClient.invalidateQueries(['customer', id])
        toast.success('Customer data updated')
        console.log('🔄 Customer data refreshed')
      }
    }

    const handlePaymentAdded = (data) => {
      if (data.customer_id === parseInt(id)) {
        queryClient.invalidateQueries(['customer', id])
        toast.success('New payment added')
        console.log('💰 Payment added')
      }
    }

    const handleEquipmentAdded = (data) => {
      if (data.customer_id === parseInt(id)) {
        queryClient.invalidateQueries(['customer', id])
        toast.success('Equipment added')
        console.log('🔧 Equipment added')
      }
    }

    const handleTicketUpdate = (data) => {
      if (data.ticket && data.ticket.customer_id === parseInt(id)) {
        queryClient.invalidateQueries(['customer-tickets', id])
        console.log('🎫 Ticket updated')
      }
    }

    // Register socket event listeners
    socketService.on('customer-updated', handleCustomerUpdate)
    socketService.on('payment-added', handlePaymentAdded)
    socketService.on('equipment-added', handleEquipmentAdded)
    socketService.on('ticket-updated', handleTicketUpdate)
    socketService.on('ticket-created', handleTicketUpdate)

    return () => {
      // Cleanup listeners
      socketService.off('customer-updated', handleCustomerUpdate)
      socketService.off('payment-added', handlePaymentAdded)
      socketService.off('equipment-added', handleEquipmentAdded)
      socketService.off('ticket-updated', handleTicketUpdate)
      socketService.off('ticket-created', handleTicketUpdate)
    }
  }, [id, queryClient])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !customerData?.data?.customer) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <AlertCircle className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Not Found</h3>
        <p className="text-gray-500 mb-4">Customer yang Anda cari tidak ditemukan</p>
        <BackButton to="/customers" label="Back to Customers" />
      </div>
    )
  }

  const customer = customerData.data.customer
  const equipment = customerData.data.equipment || []
  const recentPayments = customerData.data.recent_payments || []
  const serviceHistory = customerData.data.service_history || []
  const activeComplaints = customerData.data.active_complaints || []
  const ticketStats = customerData.data.ticket_stats || {}

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Format status text untuk display yang lebih baik
  const formatStatusText = (status) => {
    if (!status) return '-'
    // Convert snake_case to Title Case
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // ==================== QUICK ACTION HANDLERS ====================
  
  const handleQuickCall = () => {
    window.location.href = `tel:${customer.phone}`
  }

  const handleQuickEmail = () => {
    window.location.href = `mailto:${customer.email}`
  }

  const handleQuickWhatsApp = () => {
    const phoneNumber = customer.phone.replace(/^0/, '62') // Convert 08xx to 628xx
    window.open(`https://wa.me/${phoneNumber}`, '_blank')
  }

  const handleQuickCreateTicket = () => {
    navigate('/tickets/new', { state: { customer: customer } })
  }

  const handleQuickAddPayment = () => {
    setShowAddPayment(true)
  }

  const handleQuickSuspend = async () => {
    if (window.confirm(`Suspend customer ${customer.name}?`)) {
      try {
        await customerService.updateCustomer(customer.id, { account_status: 'suspended' })
        toast.success('Customer suspended successfully')
        refetch()
      } catch (error) {
        toast.error('Failed to suspend customer')
        console.error('Suspend error:', error)
      }
    }
  }

  const handleQuickActivate = async () => {
    if (window.confirm(`Activate customer ${customer.name}?`)) {
      try {
        await customerService.updateCustomer(customer.id, { account_status: 'active' })
        toast.success('Customer activated successfully')
        refetch()
      } catch (error) {
        toast.error('Failed to activate customer')
        console.error('Activate error:', error)
      }
    }
  }

  const getStatusBadge = (status, type = 'account') => {
    const statusConfig = {
      account: {
        active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
        inactive: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
        suspended: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle },
        pending_installation: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
        pending_activation: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Clock }
      },
      payment: {
        paid: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
        unpaid: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
        overdue: { bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertCircle }
      }
    }

    const config = statusConfig[type] || statusConfig.account
    const statusInfo = config[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle }
    const Icon = statusInfo.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {formatStatusText(status)}
      </span>
    )
  }

  // Handle payment status update
  const handlePaymentStatusUpdate = async (newStatus) => {
    if (!customer?.id) return

    try {
      await customerService.updateCustomer(customer.id, {
        payment_status: newStatus
      })
      toast.success(`Payment status updated to ${formatStatusText(newStatus)}`)
      refetch()
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast.error('Failed to update payment status')
    }
  }

  // Handle account status update  
  const handleAccountStatusUpdate = async (newStatus) => {
    if (!customer?.id) return

    try {
      await customerService.updateCustomer(customer.id, {
        account_status: newStatus
      })
      toast.success(`Account status updated to ${formatStatusText(newStatus)}`)
      refetch()
    } catch (error) {
      console.error('Error updating account status:', error)
      toast.error('Failed to update account status')
    }
  }

  // Handle delete customer (deactivate)
  const handleDeleteCustomer = async () => {
    if (!customer?.id) return

    const confirmMessage = `Apakah Anda yakin ingin menonaktifkan customer ${customer.name}?\n\nCustomer ID: ${customer.customer_id}\n\nCustomer akan dinonaktifkan dan tidak dapat login ke sistem.`
    
    if (window.confirm(confirmMessage)) {
      try {
        await customerService.deleteCustomer(customer.id)
        toast.success('Customer berhasil dinonaktifkan')
        // Redirect to customers page after delete
        navigate('/customers')
      } catch (error) {
        console.error('Error deleting customer:', error)
        toast.error('Gagal menonaktifkan customer')
      }
    }
  }

  // Handle inline field updates
  const handleSaveField = async (field, value) => {
    if (!customer?.id || !value.trim()) {
      toast.error('Value cannot be empty')
      return
    }

    try {
      await customerService.updateCustomer(customer.id, {
        [field]: value
      })
      toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`)
      refetch()
      
      // Reset editing state
      if (field === 'name') setIsEditingName(false)
      if (field === 'phone') setIsEditingPhone(false)
      if (field === 'address') setIsEditingAddress(false)
    } catch (error) {
      console.error(`Error updating ${field}:`, error)
      toast.error(`Failed to update ${field}`)
    }
  }

  const handleCancelEdit = (field) => {
    if (field === 'name') {
      setIsEditingName(false)
      setEditedName(customer.name)
    }
    if (field === 'phone') {
      setIsEditingPhone(false)
      setEditedPhone(customer.phone)
    }
    if (field === 'address') {
      setIsEditingAddress(false)
      setEditedAddress(customer.address)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { 
      id: 'tickets', 
      label: 'Tickets', 
      icon: Activity,
      badge: ticketStats.total_tickets || customerTickets.length || null
    },
    { id: 'service', label: 'Service History', icon: Package },
    { 
      id: 'equipment', 
      label: 'Equipment', 
      icon: Router,
      badge: equipment.length || null
    },
    { 
      id: 'payments', 
      label: 'Payments', 
      icon: CreditCard,
      badge: recentPayments.length || null
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BackButton to="/customers" label="Back to Customers" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600">Customer ID: {customer.customer_id}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </button>
        </div>
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info - Editable */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              {/* Editable Name */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="form-input flex-1 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveField('name', editedName)}
                      className="text-green-600 hover:text-green-800"
                      title="Save"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleCancelEdit('name')}
                      className="text-red-600 hover:text-red-800"
                      title="Cancel"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{customer.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setEditedName(customer.name)
                        setIsEditingName(true)
                      }}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Edit name"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Editable Phone */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Phone Number</label>
                {isEditingPhone ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedPhone}
                      onChange={(e) => setEditedPhone(e.target.value)}
                      className="form-input flex-1 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveField('phone', editedPhone)}
                      className="text-green-600 hover:text-green-800"
                      title="Save"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleCancelEdit('phone')}
                      className="text-red-600 hover:text-red-800"
                      title="Cancel"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{customer.phone}</span>
                    </div>
                    <button
                      onClick={() => {
                        setEditedPhone(customer.phone)
                        setIsEditingPhone(true)
                      }}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Edit phone"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Email (non-editable) */}
              {customer.email && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email</label>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{customer.email}</span>
                  </div>
                </div>
              )}

              {/* Alternate Phone - NEW! (Conditional) */}
              {customer.phone_alt && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Alternate Phone</label>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{customer.phone_alt}</span>
                    <span className="ml-2 text-xs text-gray-500">(Backup)</span>
                  </div>
                </div>
              )}

              {/* Editable Address */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Address</label>
                {isEditingAddress ? (
                  <div className="flex items-start gap-2">
                    <textarea
                      value={editedAddress}
                      onChange={(e) => setEditedAddress(e.target.value)}
                      className="form-input flex-1 text-sm"
                      rows="3"
                      autoFocus
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleSaveField('address', editedAddress)}
                        className="text-green-600 hover:text-green-800"
                        title="Save"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleCancelEdit('address')}
                        className="text-red-600 hover:text-red-800"
                        title="Cancel"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                      <span className="text-sm text-gray-900">{customer.address}</span>
                    </div>
                    <button
                      onClick={() => {
                        setEditedAddress(customer.address)
                        setIsEditingAddress(true)
                      }}
                      className="text-blue-600 hover:text-blue-800 transition-colors ml-2 flex-shrink-0"
                      title="Edit address"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Package Info */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Package Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Package</span>
                <span className="text-sm font-medium text-gray-900">{customer.package_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bandwidth</span>
                <div className="flex items-center gap-3 text-sm font-medium text-gray-900">
                  <div className="flex items-center gap-1">
                    <span className="text-blue-600">↑</span>
                    <span>{customer.bandwidth_up} Mbps</span>
                  </div>
                  <span className="text-gray-400">/</span>
                  <div className="flex items-center gap-1">
                    <span className="text-green-600">↓</span>
                    <span>{customer.bandwidth_down} Mbps</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly Price</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(customer.monthly_price)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">SLA Level</span>
                <span className={`text-sm font-medium ${
                  customer.sla_level === 'gold' ? 'text-yellow-600' :
                  customer.sla_level === 'silver' ? 'text-gray-600' : 'text-orange-600'
                }`}>
                  <Shield className="h-3 w-3 inline mr-1" />
                  {customer.sla_level?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Service Type</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {customer.service_type}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status & Stats */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status & Statistics</h3>
            <div className="space-y-4">
              {/* Account Status dengan Quick Actions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Account Status</span>
                  {getStatusBadge(customer.account_status, 'account')}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccountStatusUpdate('active')}
                    disabled={customer.account_status === 'active'}
                    className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Active
                  </button>
                  <button
                    onClick={() => handleAccountStatusUpdate('suspended')}
                    disabled={customer.account_status === 'suspended'}
                    className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suspend
                  </button>
                  <button
                    onClick={() => handleAccountStatusUpdate('inactive')}
                    disabled={customer.account_status === 'inactive'}
                    className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Inactive
                  </button>
                </div>
              </div>

              {/* Payment Status dengan Quick Actions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Payment Status</span>
                  {getStatusBadge(customer.payment_status, 'payment')}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePaymentStatusUpdate('paid')}
                    disabled={customer.payment_status === 'paid'}
                    className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Paid
                  </button>
                  <button
                    onClick={() => handlePaymentStatusUpdate('pending')}
                    disabled={customer.payment_status === 'pending'}
                    className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => handlePaymentStatusUpdate('unpaid')}
                    disabled={customer.payment_status === 'unpaid'}
                    className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Unpaid
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Tickets</span>
                <span className="text-sm font-medium text-gray-900">
                  {ticketStats.total_tickets || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Customer Rating</span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="text-sm font-medium text-gray-900">
                    {customer.customer_rating || 0}/5
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Outstanding</span>
                <span className={`text-sm font-medium ${
                  parseFloat(customer.outstanding_balance) > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(customer.outstanding_balance)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Call Customer */}
            {customer.phone && (
              <button
                onClick={handleQuickCall}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium inline-flex items-center gap-2 transition-colors"
              >
                <PhoneCall className="h-4 w-4" />
                Call Customer
              </button>
            )}

            {/* Email Customer */}
            {customer.email && (
              <button
                onClick={handleQuickEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium inline-flex items-center gap-2 transition-colors"
              >
                <MailIcon className="h-4 w-4" />
                Email Customer
              </button>
            )}

            {/* WhatsApp */}
            {customer.phone && (
              <button
                onClick={handleQuickWhatsApp}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm font-medium inline-flex items-center gap-2 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </button>
            )}

            {/* Create Ticket */}
            <button
              onClick={handleQuickCreateTicket}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium inline-flex items-center gap-2 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Create Ticket
            </button>

            {/* Add Payment */}
            <button
              onClick={handleQuickAddPayment}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Wallet className="h-4 w-4" />
              Add Payment
            </button>

            {/* Suspend/Activate */}
            {customer.account_status === 'active' ? (
              <button
                onClick={handleQuickSuspend}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm font-medium inline-flex items-center gap-2 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Suspend
              </button>
            ) : customer.account_status === 'suspended' ? (
              <button
                onClick={handleQuickActivate}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium inline-flex items-center gap-2 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Activate
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                  {tab.badge && tab.badge > 0 && (
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab.id 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="card-body">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Service & Installation Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  Service & Installation
                </h4>
                <div className="space-y-3">
                  {/* ODP - NEW! */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">ODP Assignment</span>
                    {customer.odp ? (
                      <Link 
                        to={`/master-data/odp?search=${customer.odp}`}
                        className="text-sm font-medium text-blue-600 hover:underline flex items-center"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {customer.odp}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">Not assigned</span>
                    )}
                  </div>

                  {/* Installation Date - NEW! */}
                  {customer.installation_date && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Installation Date</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(customer.installation_date)}
                      </span>
                    </div>
                  )}

                  {/* Registration Date */}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Registration Date</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(customer.registration_date)}
                    </span>
                  </div>

                  {/* Last Payment Date - NEW! */}
                  {customer.last_payment_date && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Payment</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(customer.last_payment_date)}
                      </span>
                    </div>
                  )}

                  {/* IP Address */}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">IP Address</span>
                    <span className="text-sm font-medium text-gray-900">
                      {customer.ip_address ? (
                        <>
                          <span className="font-mono">{customer.ip_address}</span>
                          <span className="text-xs text-gray-500 ml-2">({customer.ip_type})</span>
                        </>
                      ) : (
                        <span className="text-gray-400">Not assigned yet</span>
                      )}
                    </span>
                  </div>

                  {/* Customer Type - NEW! */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Customer Type</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      customer.customer_type === 'vip' ? 'bg-purple-100 text-purple-800' :
                      customer.customer_type === 'corporate' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.customer_type?.toUpperCase() || 'REGULAR'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical Information - NEW! (Conditional) */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-orange-600" />
                  Technical Information
                </h4>
                <div className="space-y-3">
                  {/* Signal Strength */}
                  {customer.signal_strength !== null && customer.signal_strength !== undefined && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Signal Strength</span>
                        <span className="font-semibold text-gray-900">{customer.signal_strength}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full transition-all ${
                            customer.signal_strength >= 80 ? 'bg-green-500' :
                            customer.signal_strength >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${customer.signal_strength}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Signal Quality */}
                  {customer.signal_quality && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Signal Quality</span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        customer.signal_quality === 'excellent' ? 'bg-green-100 text-green-800' :
                        customer.signal_quality === 'good' ? 'bg-blue-100 text-blue-800' :
                        customer.signal_quality === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {customer.signal_quality.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Assigned Technician */}
                  {customer.assigned_technician_id && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Assigned Technician</span>
                      <Link 
                        to={`/technicians/${customer.assigned_technician_id}`}
                        className="text-sm font-medium text-blue-600 hover:underline flex items-center"
                      >
                        <User className="h-3 w-3 mr-1" />
                        View Details
                      </Link>
                    </div>
                  )}

                  {/* GPS Coordinates */}
                  {(customer.latitude && customer.longitude) && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">GPS Location</span>
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`, '_blank')}
                        className="text-sm font-medium text-blue-600 hover:underline flex items-center"
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        View on Map
                      </button>
                    </div>
                  )}

                  {/* Service Quality Score */}
                  {customer.service_quality_score > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Service Quality</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="h-1.5 bg-blue-500 rounded-full"
                            style={{ width: `${customer.service_quality_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{customer.service_quality_score}%</span>
                      </div>
                    </div>
                  )}

                  {/* Empty state jika tidak ada technical data */}
                  {!customer.signal_strength && !customer.signal_quality && !customer.assigned_technician_id && !customer.latitude && !customer.service_quality_score && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                      <Zap className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No technical data available yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Internal Notes - NEW! (Conditional) */}
              {customer.notes && (
                <div className="lg:col-span-2">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                    Internal Notes
                  </h4>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              <div className="lg:col-span-2">
                <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-red-800 mb-1">Danger Zone</h4>
                      <p className="text-sm text-red-600">
                        Menonaktifkan customer akan membuat customer tidak dapat login dan mengakses layanan.
                      </p>
                    </div>
                    <button
                      onClick={handleDeleteCustomer}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2 font-medium"
                    >
                      <Trash2 className="h-4 w-4" />
                      Deactivate Customer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Customer Tickets</h4>
                  <p className="text-sm text-gray-600">
                    History semua tiket untuk customer ini
                  </p>
                </div>
                <RouterLink 
                  to={`/tickets/create?customer_id=${customer.id}`}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Ticket
                </RouterLink>
              </div>

              {ticketsLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : customerTickets.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tickets Found</h3>
                  <p className="text-gray-500 mb-4">Customer ini belum memiliki tiket</p>
                  <RouterLink 
                    to={`/tickets/create?customer_id=${customer.id}`}
                    className="btn-primary inline-flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Ticket
                  </RouterLink>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Ticket Number</th>
                        <th className="table-header-cell">Type</th>
                        <th className="table-header-cell">Priority</th>
                        <th className="table-header-cell">Status</th>
                        <th className="table-header-cell">Technician</th>
                        <th className="table-header-cell">Created Date</th>
                        <th className="table-header-cell text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {customerTickets.map((ticket) => (
                        <tr 
                          key={ticket.id} 
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          className="cursor-pointer hover:bg-blue-50 transition-colors"
                          title="Klik untuk lihat detail ticket"
                        >
                          <td className="table-cell">
                            <div className="font-medium text-blue-600">
                              {ticket.ticket_number}
                            </div>
                            <div className="text-sm text-gray-500 truncate" title={ticket.title}>
                              {ticket.title}
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className="capitalize">{formatStatusText(ticket.type)}</span>
                          </td>
                          <td className="table-cell">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              ticket.priority === 'critical' ? 'bg-red-100 text-red-800' :
                              ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              ticket.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {formatStatusText(ticket.priority)}
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              ticket.status === 'completed' ? 'bg-green-100 text-green-800' :
                              ticket.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              ticket.status === 'on_hold' ? 'bg-purple-100 text-purple-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {formatStatusText(ticket.status)}
                            </span>
                          </td>
                          <td className="table-cell">
                            {ticket.technician_name || 'Unassigned'}
                          </td>
                          <td className="table-cell">
                            {new Date(ticket.created_at).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center justify-center text-gray-400">
                              <ChevronRight className="h-5 w-5" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Service History Tab */}
          {activeTab === 'service' && (
            <div>
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900">Service History</h4>
                <p className="text-sm text-gray-600">
                  History perubahan layanan dan paket customer
                </p>
              </div>

              {serviceHistory.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Service History</h3>
                  <p className="text-gray-500">Belum ada perubahan layanan untuk customer ini</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceHistory.map((history, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            history.action_type === 'upgrade' ? 'bg-green-100' :
                            history.action_type === 'downgrade' ? 'bg-orange-100' :
                            history.action_type === 'package_change' ? 'bg-blue-100' :
                            'bg-gray-100'
                          }`}>
                            <Package className={`h-5 w-5 ${
                              history.action_type === 'upgrade' ? 'text-green-600' :
                              history.action_type === 'downgrade' ? 'text-orange-600' :
                              history.action_type === 'package_change' ? 'text-blue-600' :
                              'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 capitalize">
                              {formatStatusText(history.action_type || 'Service Change')}
                            </h5>
                            <p className="text-sm text-gray-600 mt-1">
                              {history.description || 'Perubahan layanan'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(history.change_date || history.created_at)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                        {/* Previous Package */}
                        {history.previous_package && (
                          <div className="bg-red-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 mb-1">Previous Package</p>
                            <p className="font-medium text-gray-900">{history.previous_package}</p>
                            <p className="text-sm text-gray-600">{history.previous_bandwidth} Mbps</p>
                            <p className="text-sm text-gray-900">{formatCurrency(history.previous_price)}</p>
                          </div>
                        )}
                        
                        {/* New Package */}
                        {history.new_package && (
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 mb-1">New Package</p>
                            <p className="font-medium text-gray-900">{history.new_package}</p>
                            <p className="text-sm text-gray-600">{history.new_bandwidth} Mbps</p>
                            <p className="text-sm text-gray-900">{formatCurrency(history.new_price)}</p>
                          </div>
                        )}
                      </div>

                      {history.notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded text-sm text-gray-700">
                          <strong>Notes:</strong> {history.notes}
                        </div>
                      )}

                      {history.processed_by && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                          <User className="h-3 w-3" />
                          <span>Processed by: {history.processed_by_name || history.processed_by}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Equipment Tab */}
          {activeTab === 'equipment' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Customer Equipment</h4>
                  <p className="text-sm text-gray-600">Perangkat yang digunakan oleh customer</p>
                </div>
                <button 
                  onClick={() => setShowAddEquipment(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Equipment
                </button>
              </div>

              {equipment.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Router className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Equipment Registered</h3>
                  <p className="text-gray-500 mb-4">Belum ada equipment yang terdaftar untuk customer ini</p>
                  <button 
                    onClick={() => setShowAddEquipment(true)}
                    className="btn-primary inline-flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Equipment
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {equipment.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          {item.equipment_type === 'modem' && <Wifi className="h-5 w-5 text-blue-500 mr-2" />}
                          {item.equipment_type === 'router' && <Router className="h-5 w-5 text-green-500 mr-2" />}
                          {item.equipment_type === 'cable' && <Cable className="h-5 w-5 text-gray-500 mr-2" />}
                          <span className="font-medium text-gray-900 capitalize">
                            {item.equipment_type}
                          </span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Brand</span>
                          <span className="font-medium">{item.brand || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Model</span>
                          <span className="font-medium">{item.model || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Serial</span>
                          <span className="font-medium text-xs">{item.serial_number || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Installed</span>
                          <span className="font-medium">{formatDate(item.installation_date)}</span>
                        </div>
                      </div>
                      {item.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-600">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Payment History</h4>
                  <p className="text-sm text-gray-600">Riwayat pembayaran bulanan customer</p>
                </div>
                <button 
                  onClick={() => setShowAddPayment(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </button>
              </div>

              {recentPayments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
                  <p className="text-gray-500 mb-4">Belum ada riwayat pembayaran untuk customer ini</p>
                  <button 
                    onClick={() => setShowAddPayment(true)}
                    className="btn-primary inline-flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Record First Payment
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">{payment.invoice_number}</h5>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatDate(payment.payment_date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </div>
                          {getStatusBadge(payment.payment_status, 'payment')}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {payment.payment_method}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Billing Period</p>
                          <p className="text-sm font-medium text-gray-900">
                            {payment.billing_period || 'Monthly'}
                          </p>
                        </div>
                      </div>

                      {payment.notes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Notes:</p>
                          <p className="text-sm text-gray-700">{payment.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals - TODO: Implement proper forms */}
      {showAddEquipment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Add Equipment</h3>
              <p className="text-sm text-gray-500 mt-2">Equipment form will be implemented</p>
              <div className="mt-4">
                <button
                  onClick={() => setShowAddEquipment(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Record Payment</h3>
              <p className="text-sm text-gray-500 mt-2">Payment form will be implemented</p>
              <div className="mt-4">
                <button
                  onClick={() => setShowAddPayment(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerDetailPage