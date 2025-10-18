// ═══════════════════════════════════════════════════════════════
// ⚙️ ADVANCED NOTIFICATION SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Settings, Bell, Moon, Filter, Clock, Trash2, 
  Smartphone, Globe, Mail, MessageSquare, CheckCircle, MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import settingsService from '../../services/notificationSettingsService';

const NotificationSettingsPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('channels');

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery(
    'notification-settings-advanced',
    () => settingsService.getAdvancedSettings(),
    { refetchOnWindowFocus: false }
  );

  // Fetch devices
  const { data: devicesData } = useQuery(
    'notification-devices',
    () => settingsService.getDevices(),
    { refetchOnWindowFocus: false }
  );

  // React Query already extracts .data from response, so settingsData is the actual settings object
  const settings = settingsData?.data || settingsData || {};
  const devices = devicesData?.data || devicesData || [];

  // Debug: Log settings data
  console.log('🔍 [NotificationSettings] settingsData:', settingsData);
  console.log('🔍 [NotificationSettings] settings:', settings);
  console.log('🔍 [NotificationSettings] web_notifications:', settings.web_notifications);
  console.log('🔍 [NotificationSettings] whatsapp_notifications:', settings.whatsapp_notifications);

  // Update settings mutation
  const updateMutation = useMutation(
    (newSettings) => settingsService.updateAdvancedSettings(newSettings),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notification-settings-advanced');
        toast.success('Settings updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update settings');
      }
    }
  );

  // Unregister device mutation
  const unregisterMutation = useMutation(
    (deviceToken) => settingsService.unregisterDevice(deviceToken),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notification-devices');
        toast.success('Device unregistered successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to unregister device');
      }
    }
  );

  const handleSettingChange = (field, value) => {
    updateMutation.mutate({ [field]: value });
  };

  const handleUnregisterDevice = (deviceToken) => {
    if (window.confirm('Are you sure you want to unregister this device?')) {
      unregisterMutation.mutate(deviceToken);
    }
  };

  const tabs = [
    { id: 'channels', label: 'Channels', icon: Bell },
    { id: 'quiet-hours', label: 'Quiet Hours', icon: Moon },
    { id: 'filters', label: 'Filters', icon: Filter },
    { id: 'cleanup', label: 'Auto-Cleanup', icon: Trash2 },
    { id: 'devices', label: 'Devices', icon: Smartphone }
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
        <p className="text-gray-600 mt-1">Customize your notification preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Channels Tab */}
          {activeTab === 'channels' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Channels</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Choose which channels you want to receive notifications through
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Web Notifications */}
                <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Globe className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Web Notifications</h4>
                        <p className="text-sm text-gray-600">In-app notifications</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.web_notifications === true}
                        onChange={(e) => handleSettingChange('web_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Mobile Push */}
                <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Smartphone className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Mobile Push</h4>
                        <p className="text-sm text-gray-600">Push notifications on mobile</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.mobile_push === true}
                        onChange={(e) => handleSettingChange('mobile_push', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Email Notifications */}
                <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Mail className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-600">Receive via email</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.email_notifications === true}
                        onChange={(e) => handleSettingChange('email_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* WhatsApp Notifications */}
                <div className="border border-gray-200 rounded-lg p-6 hover:border-green-300 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <MessageCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">WhatsApp Notifications</h4>
                        <p className="text-sm text-gray-600">Receive via WhatsApp</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.whatsapp_notifications === true}
                        onChange={(e) => handleSettingChange('whatsapp_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                    <p className="text-xs text-green-700 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <strong>NEW!</strong> Notifikasi langsung ke WhatsApp Anda untuk respons lebih cepat
                    </p>
                  </div>
                </div>

                {/* SMS Notifications */}
                <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <MessageSquare className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">SMS Notifications</h4>
                        <p className="text-sm text-gray-600">Receive via SMS</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.sms_notifications === true}
                        onChange={(e) => handleSettingChange('sms_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quiet Hours Tab */}
          {activeTab === 'quiet-hours' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiet Hours</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Set times when you don't want to receive non-urgent notifications
                </p>
              </div>

              <div className="space-y-6">
                {/* Enable Quiet Hours */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Enable Quiet Hours</h4>
                    <p className="text-sm text-gray-600">Only urgent notifications will be delivered</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.quiet_hours_enabled}
                      onChange={(e) => handleSettingChange('quiet_hours_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {settings.quiet_hours_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={settings.quiet_hours_start || '22:00'}
                        onChange={(e) => handleSettingChange('quiet_hours_start', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={settings.quiet_hours_end || '07:00'}
                        onChange={(e) => handleSettingChange('quiet_hours_end', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Do Not Disturb */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Do Not Disturb</h4>
                      <p className="text-sm text-gray-600">Pause all notifications temporarily</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.dnd_enabled}
                        onChange={(e) => handleSettingChange('dnd_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters Tab */}
          {activeTab === 'filters' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Filters</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Choose which priority levels you want to receive
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Urgent Priority</h4>
                      <p className="text-sm text-gray-600">Critical notifications</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.show_urgent_priority}
                      onChange={(e) => handleSettingChange('show_urgent_priority', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">High Priority</h4>
                      <p className="text-sm text-gray-600">Important notifications</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.show_high_priority}
                      onChange={(e) => handleSettingChange('show_high_priority', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Normal Priority</h4>
                      <p className="text-sm text-gray-600">Standard notifications</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.show_normal_priority}
                      onChange={(e) => handleSettingChange('show_normal_priority', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Low Priority</h4>
                      <p className="text-sm text-gray-600">Informational notifications</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.show_low_priority}
                      onChange={(e) => handleSettingChange('show_low_priority', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Auto-Cleanup Tab */}
          {activeTab === 'cleanup' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto-Cleanup</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Automatically manage old notifications
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-Archive After (days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.auto_archive_after_days || 30}
                    onChange={(e) => handleSettingChange('auto_archive_after_days', parseInt(e.target.value))}
                    className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Read notifications will be archived automatically. Set to 0 to disable.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-Delete After (days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.auto_delete_after_days || 90}
                    onChange={(e) => handleSettingChange('auto_delete_after_days', parseInt(e.target.value))}
                    className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Archived notifications will be deleted permanently. Set to 0 to disable.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Devices Tab */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Registered Devices</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Manage devices registered for push notifications
                </p>
              </div>

              {devices.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No devices registered</h3>
                  <p className="text-gray-600">
                    Install the mobile app to receive push notifications
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {devices.map(device => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Smartphone className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {device.device_name || `${device.device_type} Device`}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {device.device_model} • {device.os_version}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Last active: {new Date(device.last_active_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {device.is_active && (
                          <span className="flex items-center space-x-1 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Active</span>
                          </span>
                        )}
                        <button
                          onClick={() => handleUnregisterDevice(device.device_token)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Unregister device"
                        >
                          <Trash2 className="h-5 w-5" />
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
    </div>
  );
};

export default NotificationSettingsPage;

