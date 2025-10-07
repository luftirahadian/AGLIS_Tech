import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  ArrowLeft, User, Phone, Mail, MapPin, Package, CreditCard,
  Calendar, Activity, Settings, Plus, Edit, Trash2, Eye,
  Wifi, Router, Cable, DollarSign, Clock, Star, AlertCircle,
  CheckCircle, XCircle, Zap, Globe, Shield
} from 'lucide-react'
import { customerService } from '../../services/customerService'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const CustomerDetailPage = () => {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddEquipment, setShowAddEquipment] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)

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
        <Link to="/customers" className="btn-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Customer List
        </Link>
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

  const getStatusBadge = (status, type = 'account') => {
    const statusConfig = {
      account: {
        active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
        inactive: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
        suspended: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle }
      },
      payment: {
        paid: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
        unpaid: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock }
      }
    }

    const config = statusConfig[type] || statusConfig.account
    const statusInfo = config[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle }
    const Icon = statusInfo.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </span>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'equipment', label: 'Equipment', icon: Router },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'service', label: 'Service History', icon: Activity },
    { id: 'complaints', label: 'Complaints', icon: AlertCircle }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/customers" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600">Customer ID: {customer.customer_id}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <Edit className="h-4 w-4 mr-2" />
            Edit Customer
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </button>
        </div>
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-900">{customer.phone}</span>
              </div>
              {customer.phone_alt && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">{customer.phone_alt}</span>
                  <span className="text-xs text-gray-500 ml-2">(Alt)</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">{customer.email}</span>
                </div>
              )}
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                <span className="text-sm text-gray-900">{customer.address}</span>
              </div>
              {customer.odp && (
                <div className="flex items-center">
                  <Globe className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">ODP: {customer.odp}</span>
                </div>
              )}
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
                <span className="text-sm font-medium text-gray-900">
                  {customer.bandwidth_up}↑ / {customer.bandwidth_down}↓ Mbps
                </span>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Status</span>
                {getStatusBadge(customer.account_status, 'account')}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Status</span>
                {getStatusBadge(customer.payment_status, 'payment')}
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
                  {tab.id === 'complaints' && activeComplaints.length > 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                      {activeComplaints.length}
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
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Full Name</span>
                    <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">KTP</span>
                    <span className="text-sm font-medium text-gray-900">{customer.ktp || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Business Type</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {customer.business_type || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Operating Hours</span>
                    <span className="text-sm font-medium text-gray-900">
                      {customer.operating_hours || '-'}
                    </span>
                  </div>
                  {customer.pic_name && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">PIC Name</span>
                        <span className="text-sm font-medium text-gray-900">{customer.pic_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">PIC Position</span>
                        <span className="text-sm font-medium text-gray-900">{customer.pic_position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">PIC Phone</span>
                        <span className="text-sm font-medium text-gray-900">{customer.pic_phone}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Service Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Registration Date</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(customer.registration_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Activation Date</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(customer.account_activation_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subscription Start</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(customer.subscription_start_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Due Date</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(customer.due_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">IP Address</span>
                    <span className="text-sm font-medium text-gray-900">
                      {customer.ip_address || '-'} ({customer.ip_type})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Login</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(customer.last_login_date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Equipment Tab */}
          {activeTab === 'equipment' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-medium text-gray-900">Customer Equipment</h4>
                <button 
                  onClick={() => setShowAddEquipment(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Equipment
                </button>
              </div>

              {equipment.length === 0 ? (
                <div className="text-center py-8">
                  <Router className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Equipment</h3>
                  <p className="text-gray-500">Belum ada equipment yang terdaftar</p>
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
                <h4 className="text-lg font-medium text-gray-900">Payment History</h4>
                <button 
                  onClick={() => setShowAddPayment(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </button>
              </div>

              {recentPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments</h3>
                  <p className="text-gray-500">Belum ada riwayat pembayaran</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Invoice
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.invoice_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payment.payment_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {payment.payment_method}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(payment.payment_status, 'payment')}
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
              <h4 className="text-lg font-medium text-gray-900 mb-6">Service History</h4>
              {serviceHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Service History</h3>
                  <p className="text-gray-500">Belum ada riwayat layanan</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceHistory.map((service) => (
                    <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-gray-900 capitalize">{service.service_type}</h5>
                          <p className="text-sm text-gray-600">{formatDate(service.service_date)}</p>
                        </div>
                        {service.customer_rating && (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium">{service.customer_rating}/5</span>
                          </div>
                        )}
                      </div>
                      {service.service_notes && (
                        <p className="mt-2 text-sm text-gray-700">{service.service_notes}</p>
                      )}
                      {service.customer_feedback && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <p className="text-sm text-gray-700">"{service.customer_feedback}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Complaints Tab */}
          {activeTab === 'complaints' && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-6">Active Complaints</h4>
              {activeComplaints.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Complaints</h3>
                  <p className="text-gray-500">Tidak ada keluhan yang sedang aktif</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeComplaints.map((complaint) => (
                    <div key={complaint.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-medium text-gray-900 capitalize">{complaint.complaint_type}</h5>
                          <p className="text-sm text-gray-600">{formatDate(complaint.complaint_date)}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          complaint.priority === 'high' ? 'bg-red-100 text-red-800' :
                          complaint.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {complaint.priority} priority
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{complaint.complaint_description}</p>
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          complaint.status === 'open' ? 'bg-red-100 text-red-800' :
                          complaint.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {complaint.status.replace('_', ' ')}
                        </span>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          View Details
                        </button>
                      </div>
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