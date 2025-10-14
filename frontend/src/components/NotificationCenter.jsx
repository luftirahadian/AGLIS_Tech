import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Archive, 
  Trash2, 
  Filter, 
  Settings,
  Clock,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

const NotificationCenter = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('all')
  const [selectedNotifications, setSelectedNotifications] = useState(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    is_read: undefined
  })

  const {
    notifications,
    pagination,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    archive,
    delete: deleteNotification,
    isMarkingAllAsRead
  } = useNotifications({
    type: filters.type || undefined,
    priority: filters.priority || undefined,
    is_read: filters.is_read
  })

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread':
        return !notification.is_read
      case 'archived':
        return notification.is_archived
      case 'high':
        return notification.priority === 'high' || notification.priority === 'urgent'
      default:
        return !notification.is_archived
    }
  })

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'normal':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50'
      case 'high':
        return 'border-l-orange-500 bg-orange-50'
      case 'normal':
        return 'border-l-blue-500 bg-blue-50'
      case 'low':
        return 'border-l-green-500 bg-green-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'ticket_assigned':
      case 'ticket_updated':
      case 'ticket_completed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'system_alert':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'technician_status':
        return <Zap className="h-5 w-5 text-yellow-600" />
      case 'new_ticket':
        return <Bell className="h-5 w-5 text-green-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getTypeLabel = (type) => {
    const labels = {
      'ticket_assigned': 'Tiket Ditugaskan',
      'ticket_updated': 'Tiket Diperbarui',
      'ticket_completed': 'Tiket Selesai',
      'system_alert': 'Peringatan Sistem',
      'technician_status': 'Status Teknisi',
      'new_ticket': 'Tiket Baru'
    }
    return labels[type] || type
  }

  const handleSelectNotification = (id) => {
    const newSelected = new Set(selectedNotifications)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedNotifications(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set())
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)))
    }
  }

  const handleBulkAction = (action) => {
    selectedNotifications.forEach(id => {
      switch (action) {
        case 'mark-read':
          markAsRead(id)
          break
        case 'archive':
          archive(id)
          break
        case 'delete':
          deleteNotification(id)
          break
      }
    })
    setSelectedNotifications(new Set())
  }

  const tabs = [
    { id: 'all', label: 'Semua', count: notifications.length },
    { id: 'unread', label: 'Belum Dibaca', count: unreadCount },
    { id: 'high', label: 'Prioritas Tinggi', count: notifications.filter(n => n.priority === 'high' || n.priority === 'urgent').length },
    { id: 'archived', label: 'Diarsipkan', count: notifications.filter(n => n.is_archived).length }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bell className="h-6 w-6 text-blue-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Notifikasi</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-2 gap-3">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Tipe</option>
                <option value="ticket_assigned">Tiket Ditugaskan</option>
                <option value="ticket_updated">Tiket Diperbarui</option>
                <option value="ticket_completed">Tiket Selesai</option>
                <option value="system_alert">Peringatan Sistem</option>
                <option value="technician_status">Status Teknisi</option>
                <option value="new_ticket">Tiket Baru</option>
              </select>
              
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Prioritas</option>
                <option value="urgent">Urgent</option>
                <option value="high">Tinggi</option>
                <option value="normal">Normal</option>
                <option value="low">Rendah</option>
              </select>
              
              <select
                value={filters.is_read === undefined ? '' : filters.is_read.toString()}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  is_read: e.target.value === '' ? undefined : e.target.value === 'true' 
                }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Status</option>
                <option value="false">Belum Dibaca</option>
                <option value="true">Sudah Dibaca</option>
              </select>
              
              <button
                onClick={() => setFilters({ type: '', priority: '', is_read: undefined })}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {selectedNotifications.size === filteredNotifications.length ? 'Batal Pilih' : 'Pilih Semua'}
              </button>
              
              {selectedNotifications.size > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleBulkAction('mark-read')}
                    className="text-sm text-green-600 hover:text-green-800 font-medium"
                  >
                    Tandai Dibaca
                  </button>
                  <button
                    onClick={() => handleBulkAction('archive')}
                    className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                  >
                    Arsipkan
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={isMarkingAllAsRead}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Tandai Semua Dibaca</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Tidak ada notifikasi</p>
              <p className="text-sm text-center">
                {activeTab === 'unread' 
                  ? 'Semua notifikasi sudah dibaca' 
                  : 'Belum ada notifikasi yang tersedia'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id)
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleSelectNotification(notification.id)
                      }}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(notification.type)}
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {getTypeLabel(notification.type)}
                          </span>
                          {getPriorityIcon(notification.priority)}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { 
                              addSuffix: true, 
                              locale: id 
                            })}
                          </span>
                          
                          <div className="flex items-center space-x-1">
                            {!notification.is_read && (
                              <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                archive(notification.id)
                              }}
                              className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                              title="Arsipkan"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className={`mt-2 text-sm font-medium ${
                        !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h3>
                      
                      <p className={`mt-1 text-sm ${
                        !notification.is_read ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {notification.message}
                      </p>
                      
                      {notification.data && (
                        <div className="mt-2 text-xs text-gray-500">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(notification.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {pagination && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Menampilkan {filteredNotifications.length} dari {pagination.total} notifikasi
              </span>
              {pagination.hasNext && (
                <button className="text-blue-600 hover:text-blue-800 font-medium">
                  Lihat Lebih Banyak
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationCenter
