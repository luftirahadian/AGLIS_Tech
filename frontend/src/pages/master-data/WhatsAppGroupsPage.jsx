import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { MessageCircle, Plus, Edit2, Trash2, Send, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import whatsappGroupService from '../../services/whatsappGroupService'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/LoadingSpinner'

const WhatsAppGroupsPage = () => {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [showTestModal, setShowTestModal] = useState(false)
  const [testingGroup, setTestingGroup] = useState(null)
  const [testMessage, setTestMessage] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'technicians',
    work_zone: '',
    phone_number: '',
    group_chat_id: '',
    notification_types: ['ticket_assigned', 'new_ticket', 'sla_warning'],
    priority_filter: 'normal',
    is_active: true
  })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (showModal && editingGroup) {
      setFormData({
        name: editingGroup.name || '',
        description: editingGroup.description || '',
        category: editingGroup.category || 'technicians',
        work_zone: editingGroup.work_zone || '',
        phone_number: editingGroup.phone_number || '',
        group_chat_id: editingGroup.group_chat_id || '',
        notification_types: editingGroup.notification_types || [],
        priority_filter: editingGroup.priority_filter || 'normal',
        is_active: editingGroup.is_active !== undefined ? editingGroup.is_active : true
      })
    } else if (showModal && !editingGroup) {
      setFormData({
        name: '',
        description: '',
        category: 'technicians',
        work_zone: '',
        phone_number: '',
        group_chat_id: '',
        notification_types: ['ticket_assigned', 'new_ticket', 'sla_warning'],
        priority_filter: 'normal',
        is_active: true
      })
    }
  }, [showModal, editingGroup])

  // Fetch groups
  const { data, isLoading } = useQuery(
    ['whatsapp-groups', filterCategory],
    () => whatsappGroupService.getAll(filterCategory !== 'all' ? { category: filterCategory } : {}),
    {
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to load WhatsApp groups')
      }
    }
  )

  const groups = data?.data?.groups || []

  // Create mutation
  const createMutation = useMutation(
    (data) => whatsappGroupService.create(data),
    {
      onSuccess: () => {
        toast.success('WhatsApp group created successfully!')
        queryClient.invalidateQueries(['whatsapp-groups'])
        setShowModal(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create group')
      }
    }
  )

  // Update mutation
  const updateMutation = useMutation(
    ({ id, data }) => whatsappGroupService.update(id, data),
    {
      onSuccess: () => {
        toast.success('WhatsApp group updated successfully!')
        queryClient.invalidateQueries(['whatsapp-groups'])
        setShowModal(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update group')
      }
    }
  )

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => whatsappGroupService.delete(id),
    {
      onSuccess: () => {
        toast.success('WhatsApp group deleted successfully')
        queryClient.invalidateQueries(['whatsapp-groups'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete group')
      }
    }
  )

  // Test send mutation
  const testSendMutation = useMutation(
    ({ id, message }) => whatsappGroupService.testSend(id, message),
    {
      onSuccess: () => {
        toast.success('Test message sent successfully! Check your WhatsApp group.')
        setShowTestModal(false)
        setTestMessage('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send test message')
      }
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.category) {
      toast.error('Name and category are required')
      return
    }
    
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (group) => {
    if (window.confirm(`Hapus WhatsApp group "${group.name}"?`)) {
      deleteMutation.mutate(group.id)
    }
  }

  const handleTest = (group) => {
    setTestingGroup(group)
    setTestMessage(`🧪 *TEST MESSAGE*\n\nHalo ${group.name}!\n\nIni adalah test message dari AGLIS Management System.\n\nWaktu: ${new Date().toLocaleString('id-ID')}\n\n✅ Jika Anda menerima pesan ini, grup sudah terkonfigurasi dengan benar!`)
    setShowTestModal(true)
  }

  const sendTest = () => {
    if (!testMessage.trim()) {
      toast.error('Message cannot be empty')
      return
    }
    testSendMutation.mutate({ id: testingGroup.id, message: testMessage })
  }

  const getCategoryBadge = (category) => {
    const badges = {
      technicians: 'bg-blue-100 text-blue-700',
      supervisors: 'bg-purple-100 text-purple-700',
      managers: 'bg-indigo-100 text-indigo-700',
      noc: 'bg-orange-100 text-orange-700',
      customer_service: 'bg-green-100 text-green-700',
      all: 'bg-gray-100 text-gray-700'
    }
    return badges[category] || 'bg-gray-100 text-gray-700'
  }

  const notificationTypeOptions = [
    { value: 'ticket_assigned', label: 'Ticket Assigned' },
    { value: 'new_ticket', label: 'New Ticket' },
    { value: 'sla_warning', label: 'SLA Warning' },
    { value: 'urgent_alert', label: 'Urgent Alert' },
    { value: 'escalation', label: 'Escalation' },
    { value: 'daily_summary', label: 'Daily Summary' },
    { value: 'weekly_report', label: 'Weekly Report' },
    { value: 'system_alert', label: 'System Alert' },
    { value: 'performance_alert', label: 'Performance Alert' }
  ]

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <MessageCircle className="h-7 w-7 mr-3 text-green-600" />
              WhatsApp Groups
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Kelola grup WhatsApp untuk notifikasi tim
            </p>
          </div>
          <button
            onClick={() => {
              setEditingGroup(null)
              setShowModal(true)
            }}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5 mr-2" />
            Tambah Group
          </button>
        </div>

        {/* Filter */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {['all', 'technicians', 'supervisors', 'managers', 'noc', 'customer_service'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterCategory === cat
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {cat === 'all' ? 'Semua' : cat.replace('_', ' ').charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <MessageCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Belum ada WhatsApp group yang terdaftar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(group => (
            <div
              key={group.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-5 border border-gray-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-green-600" />
                    {group.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                </div>
                <div className="flex gap-1">
                  {group.is_verified && (
                    <CheckCircle className="h-5 w-5 text-green-600" title="Verified" />
                  )}
                  {!group.is_active && (
                    <XCircle className="h-5 w-5 text-red-600" title="Inactive" />
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Category:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadge(group.category)}`}>
                    {group.category.replace('_', ' ')}
                  </span>
                </div>
                
                {group.work_zone && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Work Zone:</span>
                    <span className="font-medium text-gray-900 capitalize">{group.work_zone}</span>
                  </div>
                )}
                
                {group.phone_number && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-mono text-gray-900">{group.phone_number}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Notification Types:</span>
                  <span className="text-gray-900 font-medium">
                    {group.notification_types?.length || 0} types
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleTest(group)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                  disabled={!group.phone_number && !group.group_chat_id}
                  title={!group.phone_number && !group.group_chat_id ? 'No phone/chat ID configured' : 'Send test message'}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Test
                </button>
                <button
                  onClick={() => {
                    setEditingGroup(group)
                    setShowModal(true)
                  }}
                  className="flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  title="Edit group"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(group)}
                  className="flex items-center px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
                  title="Delete group"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE/UPDATE Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-green-600" />
                {editingGroup ? 'Edit WhatsApp Group' : 'Tambah WhatsApp Group'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Group <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Contoh: Teknisi Purwakarta"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Deskripsi singkat tentang group ini..."
                />
              </div>

              {/* Category & Work Zone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="technicians">Technicians</option>
                    <option value="supervisors">Supervisors</option>
                    <option value="managers">Managers</option>
                    <option value="noc">NOC</option>
                    <option value="customer_service">Customer Service</option>
                    <option value="all">All</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Zone
                  </label>
                  <select
                    value={formData.work_zone}
                    onChange={(e) => setFormData({ ...formData, work_zone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">All Zones</option>
                    <option value="karawang">Karawang</option>
                    <option value="bekasi">Bekasi</option>
                    <option value="cikampek">Cikampek</option>
                    <option value="purwakarta">Purwakarta</option>
                    <option value="subang">Subang</option>
                    <option value="bandung">Bandung</option>
                  </select>
                </div>
              </div>

              {/* Phone Number & Chat ID */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="628123456789"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: 628xxxxxxxxx</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Chat ID
                  </label>
                  <input
                    type="text"
                    value={formData.group_chat_id}
                    onChange={(e) => setFormData({ ...formData, group_chat_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Notification Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Types
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {notificationTypeOptions.map(option => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notification_types.includes(option.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              notification_types: [...formData.notification_types, option.value]
                            })
                          } else {
                            setFormData({
                              ...formData,
                              notification_types: formData.notification_types.filter(t => t !== option.value)
                            })
                          }
                        }}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Priority Filter & Active Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority Filter
                  </label>
                  <select
                    value={formData.priority_filter}
                    onChange={(e) => setFormData({ ...formData, priority_filter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Minimum priority untuk notifikasi</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <label className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {(createMutation.isLoading || updateMutation.isLoading) ? 'Saving...' : (editingGroup ? 'Update' : 'Tambah')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Send className="h-5 w-5 mr-2 text-green-600" />
              Test Send - {testingGroup?.name}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Message:
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                placeholder="Enter test message..."
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-700">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Pesan akan dikirim ke: <strong>{testingGroup?.phone_number || testingGroup?.group_chat_id || '-'}</strong>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowTestModal(false)
                  setTestMessage('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={sendTest}
                disabled={testSendMutation.isLoading || !testMessage.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {testSendMutation.isLoading ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WhatsAppGroupsPage
