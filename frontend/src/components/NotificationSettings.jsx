import React, { useState } from 'react'
import { 
  Settings, 
  Bell, 
  Mail, 
  Volume2, 
  Moon, 
  Clock,
  Check,
  X
} from 'lucide-react'
import { useNotificationSettings } from '../hooks/useNotifications'
import { toast } from 'react-hot-toast'

const NotificationSettings = ({ isOpen, onClose }) => {
  const { settings, updateSettings, isUpdating } = useNotificationSettings()
  const [formData, setFormData] = useState({
    email_notifications: true,
    push_notifications: true,
    sound_notifications: true,
    notification_types: {
      ticket_assigned: true,
      ticket_updated: true,
      ticket_completed: true,
      system_alert: true,
      technician_status: true,
      new_ticket: true
    },
    quiet_hours_start: '',
    quiet_hours_end: ''
  })

  // Update form data when settings are loaded
  React.useEffect(() => {
    if (settings) {
      setFormData({
        email_notifications: settings.email_notifications ?? true,
        push_notifications: settings.push_notifications ?? true,
        sound_notifications: settings.sound_notifications ?? true,
        notification_types: settings.notification_types || {
          ticket_assigned: true,
          ticket_updated: true,
          ticket_completed: true,
          system_alert: true,
          technician_status: true,
          new_ticket: true
        },
        quiet_hours_start: settings.quiet_hours_start || '',
        quiet_hours_end: settings.quiet_hours_end || ''
      })
    }
  }, [settings])

  const handleSubmit = (e) => {
    e.preventDefault()
    updateSettings(formData)
  }

  const handleNotificationTypeChange = (type, value) => {
    setFormData(prev => ({
      ...prev,
      notification_types: {
        ...prev.notification_types,
        [type]: value
      }
    }))
  }

  const handleQuietHoursToggle = () => {
    if (formData.quiet_hours_start && formData.quiet_hours_end) {
      setFormData(prev => ({
        ...prev,
        quiet_hours_start: '',
        quiet_hours_end: ''
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        quiet_hours_start: '22:00',
        quiet_hours_end: '07:00'
      }))
    }
  }

  const notificationTypeLabels = {
    ticket_assigned: 'Tiket Ditugaskan',
    ticket_updated: 'Tiket Diperbarui',
    ticket_completed: 'Tiket Selesai',
    system_alert: 'Peringatan Sistem',
    technician_status: 'Status Teknisi',
    new_ticket: 'Tiket Baru'
  }

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
            <Settings className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Pengaturan Notifikasi</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-blue-600" />
                Pengaturan Umum
              </h3>
              
              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Email Notifikasi</p>
                      <p className="text-sm text-gray-500">Terima notifikasi via email</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.email_notifications}
                      onChange={(e) => setFormData(prev => ({ ...prev, email_notifications: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Push Notifikasi</p>
                      <p className="text-sm text-gray-500">Terima notifikasi push di browser</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.push_notifications}
                      onChange={(e) => setFormData(prev => ({ ...prev, push_notifications: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Sound Notifications */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Suara Notifikasi</p>
                      <p className="text-sm text-gray-500">Mainkan suara saat ada notifikasi</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sound_notifications}
                      onChange={(e) => setFormData(prev => ({ ...prev, sound_notifications: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Notification Types */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Check className="h-5 w-5 mr-2 text-blue-600" />
                Tipe Notifikasi
              </h3>
              
              <div className="space-y-3">
                {Object.entries(notificationTypeLabels).map(([type, label]) => (
                  <div key={type} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="font-medium text-gray-900">{label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notification_types[type]}
                        onChange={(e) => handleNotificationTypeChange(type, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Quiet Hours */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Moon className="h-5 w-5 mr-2 text-blue-600" />
                Jam Tenang
              </h3>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-gray-900">Nonaktifkan Notifikasi</p>
                    <p className="text-sm text-gray-500">Jangan tampilkan notifikasi pada jam tertentu</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!(formData.quiet_hours_start && formData.quiet_hours_end)}
                      onChange={handleQuietHoursToggle}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                {formData.quiet_hours_start && formData.quiet_hours_end && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dari
                      </label>
                      <input
                        type="time"
                        value={formData.quiet_hours_start}
                        onChange={(e) => setFormData(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sampai
                      </label>
                      <input
                        type="time"
                        value={formData.quiet_hours_end}
                        onChange={(e) => setFormData(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isUpdating ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default NotificationSettings
