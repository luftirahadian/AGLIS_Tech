import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import notificationService from '../services/notificationService'
import socketService from '../services/socketService'
import { toast } from 'react-hot-toast'

// Hook for managing notifications with real-time updates
export const useNotifications = (params = {}) => {
  const queryClient = useQueryClient()
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch notifications
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['notifications', params],
    () => notificationService.getNotifications(params),
    {
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
      select: (response) => response.data
    }
  )

  // Update unread count when data changes
  useEffect(() => {
    if (notificationsData?.unreadCount !== undefined) {
      setUnreadCount(notificationsData.unreadCount)
    }
  }, [notificationsData?.unreadCount])

  // Socket.IO real-time updates
  useEffect(() => {
    if (!socketService.isConnected) {
      socketService.connect()
    }

    const handleNewNotification = (notification) => {
      console.log('🔔 [useNotifications] New notification received:', notification)
      
      // Update the notifications cache
      queryClient.setQueryData(['notifications', params], (oldData) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          notifications: [notification, ...(oldData.notifications || [])],
          unreadCount: (oldData.unreadCount || 0) + 1
        }
      })

      // Update unread count
      setUnreadCount(prev => prev + 1)

      // Show toast notification (optional)
      if (notification.priority === 'high' || notification.priority === 'urgent') {
        toast(notification.title, {
          icon: '🔔',
          duration: 5000
        })
      }
    }

    const handleNotificationUpdate = (data) => {
      console.log('🔄 [useNotifications] Notification update received:', data)
      refetch()
    }

    // Subscribe to socket events
    socketService.on('notification', handleNewNotification)
    socketService.on('notification_updated', handleNotificationUpdate)

    return () => {
      socketService.off('notification', handleNewNotification)
      socketService.off('notification_updated', handleNotificationUpdate)
    }
  }, [queryClient, params, refetch])

  // Mark as read mutation
  const markAsReadMutation = useMutation(
    (id) => notificationService.markAsRead(id),
    {
      onSuccess: (response, id) => {
        // Optimistically update the cache
        queryClient.setQueryData(['notifications', params], (oldData) => {
          if (!oldData) return oldData
          
          return {
            ...oldData,
            notifications: (oldData.notifications || []).map(notification =>
              notification.id === id
                ? { ...notification, is_read: true, read_at: new Date().toISOString() }
                : notification
            ),
            unreadCount: Math.max(0, (oldData.unreadCount || 0) - 1)
          }
        })
        
        setUnreadCount(prev => Math.max(0, prev - 1))
      },
      onError: (error) => {
        console.error('Failed to mark notification as read:', error)
        toast.error('Gagal menandai notifikasi sebagai dibaca')
      }
    }
  )

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation(
    () => notificationService.markAllAsRead(),
    {
      onSuccess: () => {
        // Optimistically update the cache
        queryClient.setQueryData(['notifications', params], (oldData) => {
          if (!oldData) return oldData
          
          return {
            ...oldData,
            notifications: (oldData.notifications || []).map(notification => ({
              ...notification,
              is_read: true,
              read_at: new Date().toISOString()
            })),
            unreadCount: 0
          }
        })
        
        setUnreadCount(0)
        toast.success('Semua notifikasi ditandai sebagai dibaca')
      },
      onError: (error) => {
        console.error('Failed to mark all notifications as read:', error)
        toast.error('Gagal menandai semua notifikasi sebagai dibaca')
      }
    }
  )

  // Archive mutation
  const archiveMutation = useMutation(
    (id) => notificationService.archive(id),
    {
      onSuccess: (response, id) => {
        // Optimistically update the cache
        queryClient.setQueryData(['notifications', params], (oldData) => {
          if (!oldData) return oldData
          
          return {
            ...oldData,
            notifications: (oldData.notifications || []).filter(notification => notification.id !== id),
            unreadCount: Math.max(0, (oldData.unreadCount || 0) - 1)
          }
        })
        
        setUnreadCount(prev => Math.max(0, prev - 1))
        toast.success('Notifikasi diarsipkan')
      },
      onError: (error) => {
        console.error('Failed to archive notification:', error)
        toast.error('Gagal mengarsipkan notifikasi')
      }
    }
  )

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => notificationService.delete(id),
    {
      onSuccess: (response, id) => {
        // Optimistically update the cache
        queryClient.setQueryData(['notifications', params], (oldData) => {
          if (!oldData) return oldData
          
          return {
            ...oldData,
            notifications: (oldData.notifications || []).filter(notification => notification.id !== id),
            unreadCount: Math.max(0, (oldData.unreadCount || 0) - 1)
          }
        })
        
        setUnreadCount(prev => Math.max(0, prev - 1))
        toast.success('Notifikasi dihapus')
      },
      onError: (error) => {
        console.error('Failed to delete notification:', error)
        toast.error('Gagal menghapus notifikasi')
      }
    }
  )

  return {
    notifications: notificationsData?.notifications || [],
    pagination: notificationsData?.pagination,
    unreadCount,
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    archive: archiveMutation.mutate,
    delete: deleteMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isLoading,
    isMarkingAllAsRead: markAllAsReadMutation.isLoading,
    isArchiving: archiveMutation.isLoading,
    isDeleting: deleteMutation.isLoading
  }
}

// Hook for notification settings
export const useNotificationSettings = () => {
  const queryClient = useQueryClient()

  const {
    data: settingsData,
    isLoading,
    error
  } = useQuery(
    ['notification-settings'],
    () => notificationService.getSettings(),
    {
      select: (response) => response.data?.settings
    }
  )

  const updateSettingsMutation = useMutation(
    (settings) => notificationService.updateSettings(settings),
    {
      onSuccess: (response) => {
        queryClient.setQueryData(['notification-settings'], {
          data: { settings: response.data.settings }
        })
        toast.success('Pengaturan notifikasi berhasil diperbarui')
      },
      onError: (error) => {
        console.error('Failed to update notification settings:', error)
        toast.error('Gagal memperbarui pengaturan notifikasi')
      }
    }
  )

  return {
    settings: settingsData,
    isLoading,
    error,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isLoading
  }
}

// Hook for unread count only (lightweight)
export const useUnreadCount = () => {
  const [unreadCount, setUnreadCount] = useState(0)

  const { data } = useQuery(
    ['notifications', 'unread-count'],
    () => notificationService.getNotifications({ limit: 1, is_read: false }),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      select: (response) => response.data?.unreadCount || 0
    }
  )

  useEffect(() => {
    if (data !== undefined) {
      setUnreadCount(data)
    }
  }, [data])

  // Socket.IO real-time updates for unread count
  useEffect(() => {
    if (!socketService.isConnected) {
      socketService.connect()
    }

    const handleNewNotification = () => {
      setUnreadCount(prev => prev + 1)
    }

    const handleNotificationUpdate = () => {
      // Refetch unread count
      setUnreadCount(data || 0)
    }

    socketService.on('notification', handleNewNotification)
    socketService.on('notification_updated', handleNotificationUpdate)

    return () => {
      socketService.off('notification', handleNewNotification)
      socketService.off('notification_updated', handleNotificationUpdate)
    }
  }, [data])

  return unreadCount
}
