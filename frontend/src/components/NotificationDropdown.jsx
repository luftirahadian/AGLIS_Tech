import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Bell, Check, CheckCheck, Trash2, X, Filter, Ticket, FileText, CreditCard, AlertTriangle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import notificationCenterService from '../services/notificationCenterService';
import socketService from '../services/socketService';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

/**
 * NotificationDropdown Component
 * Displays user notifications with real-time updates
 */
const NotificationDropdown = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dropdownRef = useRef(null);
  
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'ticket', 'registration', 'invoice'
  const [page, setPage] = useState(1);

  // Get notifications
  const { data: notificationsData, isLoading, refetch } = useQuery(
    ['notification-center', { page, filter }],
    () => {
      const params = { page, limit: 20 };
      
      if (filter === 'unread') {
        params.is_read = false;
      } else if (filter !== 'all') {
        params.type = filter;
      }
      
      return notificationCenterService.getNotifications(params);
    },
    {
      staleTime: 5000, // 5 seconds - shorter for fresher data
      refetchOnWindowFocus: true, // Refetch when window gains focus
      refetchOnMount: true, // Always fetch when component mounts
      refetchInterval: isOpen ? 10000 : false // Auto-refresh when dropdown is open
    }
  );

  // Refetch when dropdown opens
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  // Get unread count
  const { data: unreadData } = useQuery(
    'notification-unread-count',
    () => notificationCenterService.getUnreadCount(),
    {
      refetchInterval: 30000, // Refresh every 30s
      staleTime: 10000
    }
  );

  // Mark as read mutation
  const markAsReadMutation = useMutation(
    (notificationId) => notificationCenterService.markAsRead(notificationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notification-center');
        queryClient.invalidateQueries('notification-unread-count');
      }
    }
  );

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation(
    () => notificationCenterService.markAllAsRead(),
    {
      onSuccess: (data) => {
        toast.success(`${data.data.count} notifications marked as read`);
        queryClient.invalidateQueries('notification-center');
        queryClient.invalidateQueries('notification-unread-count');
      }
    }
  );

  // Delete notification mutation
  const deleteNotificationMutation = useMutation(
    (notificationId) => notificationCenterService.deleteNotification(notificationId),
    {
      onSuccess: () => {
        toast.success('Notification deleted');
        queryClient.invalidateQueries('notification-center');
        queryClient.invalidateQueries('notification-unread-count');
      }
    }
  );

  // Clear all read mutation
  const clearReadMutation = useMutation(
    () => notificationCenterService.clearReadNotifications(),
    {
      onSuccess: (data) => {
        toast.success(`${data.data.count} notifications cleared`);
        queryClient.invalidateQueries('notification-center');
        queryClient.invalidateQueries('notification-unread-count');
      }
    }
  );

  // Real-time Socket.IO updates
  useEffect(() => {
    if (!isOpen) return;

    const handleNewNotification = (data) => {
      console.log('🔔 New notification received:', data);
      queryClient.invalidateQueries('notification-center');
      queryClient.invalidateQueries('notification-unread-count');
      
      // Show toast for new notification
      toast.success(data.notification?.title || 'New notification', {
        icon: '🔔',
        duration: 3000
      });
    };

    const handleNotificationRead = (data) => {
      console.log('👁️ Notification read:', data);
      queryClient.invalidateQueries('notification-unread-count');
    };

    const handleNotificationsCleared = (data) => {
      console.log('🧹 Notifications cleared:', data);
      queryClient.invalidateQueries('notification-center');
    };

    socketService.on('new_notification', handleNewNotification);
    socketService.on('notification_read', handleNotificationRead);
    socketService.on('notifications_cleared', handleNotificationsCleared);
    socketService.on('notification_deleted', handleNotificationRead);
    socketService.on('notifications_all_read', handleNotificationRead);

    return () => {
      socketService.off('new_notification', handleNewNotification);
      socketService.off('notification_read', handleNotificationRead);
      socketService.off('notifications_cleared', handleNotificationsCleared);
      socketService.off('notification_deleted', handleNotificationRead);
      socketService.off('notifications_all_read', handleNotificationRead);
    };
  }, [isOpen, queryClient]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to link if exists
    const link = notification.data?.link;
    if (link) {
      navigate(link);
      onClose();
    }
  };

  // Get icon by notification type
  const getNotificationIcon = (type) => {
    const icons = {
      ticket: <Ticket className="h-5 w-5 text-blue-600" />,
      registration: <FileText className="h-5 w-5 text-green-600" />,
      invoice: <CreditCard className="h-5 w-5 text-yellow-600" />,
      alert: <AlertTriangle className="h-5 w-5 text-red-600" />,
      system: <Info className="h-5 w-5 text-gray-600" />
    };
    return icons[type] || <Bell className="h-5 w-5 text-gray-600" />;
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      normal: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800'
    };
    return colors[priority] || colors.normal;
  };

  const notifications = notificationsData?.data?.notifications || [];
  const pagination = notificationsData?.data?.pagination || {};

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 text-sm overflow-x-auto">
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: 'Unread' },
            { key: 'ticket', label: 'Tickets' },
            { key: 'registration', label: 'Registrations' },
            { key: 'invoice', label: 'Invoices' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setFilter(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 flex gap-2">
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isLoading}
            className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
          <button
            onClick={() => clearReadMutation.mutate()}
            disabled={clearReadMutation.isLoading}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Clear read
          </button>
        </div>
      )}

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'all' ? "You're all caught up!" : `No ${filter} notifications`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !notification.is_read ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-medium ${
                        !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h4>
                      
                      {/* Priority Badge */}
                      {notification.priority !== 'normal' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: idLocale
                        })}
                      </span>

                      {/* Actions */}
                      <div className="flex gap-1">
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReadMutation.mutate(notification.id);
                            }}
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4 text-blue-600" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotificationMutation.mutate(notification.id);
                          }}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Pagination */}
      {pagination.pages > 1 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

