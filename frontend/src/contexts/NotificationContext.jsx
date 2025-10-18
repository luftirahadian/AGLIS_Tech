import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import socketService from '../services/socketService';
import notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const listenersSetup = useRef(false); // Track if listeners are already setup
  const processedNotifications = useRef(new Set()); // Track processed notification IDs for deduplication
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [settings, setSettings] = useState({
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
    }
  });

  // Fetch notifications
  const { 
    data: notificationsData, 
    isLoading: notificationsLoading,
    refetch: refetchNotifications 
  } = useQuery(
    ['notifications', { page: 1, limit: 50, is_read: false }],
    () => notificationService.getNotifications({ page: 1, limit: 50, is_read: false }),
    {
      enabled: !!user,
      refetchInterval: 30000, // Refetch every 30 seconds as fallback
      onSuccess: (data) => {
        if (data?.data?.notifications) {
          setNotifications(data.data.notifications);
          setUnreadCount(data.data.unreadCount || 0);
        }
      }
    }
  );

  // Fetch notification settings
  const { data: settingsData } = useQuery(
    ['notification-settings'],
    notificationService.getSettings,
    {
      enabled: !!user,
      onSuccess: (data) => {
        if (data?.data?.settings) {
          setSettings(data.data.settings);
        }
      }
    }
  );

  // Handle new notification from Socket.IO
  const handleNewNotification = useCallback((notification) => {
    // Generate unique ID for deduplication
    const notifKey = `${notification.id || notification.type}-${notification.timestamp || Date.now()}`;
    
    // Check if already processed (deduplication)
    if (processedNotifications.current.has(notifKey)) {
      console.log('⚠️ Duplicate notification ignored:', notifKey);
      return;
    }
    
    // Mark as processed
    processedNotifications.current.add(notifKey);
    
    // Clean up old processed IDs after 10 seconds
    setTimeout(() => {
      processedNotifications.current.delete(notifKey);
    }, 10000);
    
    console.log('🔔 Received notification:', notification);
    
    // Add to notifications list
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show toast notification based on settings
    if (settings.push_notifications && shouldShowNotification(notification.type)) {
      showToastNotification(notification);
    }
    
    // Play sound if enabled
    if (settings.sound_notifications && shouldShowNotification(notification.type)) {
      // Determine sound type based on notification priority/type
      let soundType = 'default';
      if (notification.type === 'system_alert' || notification.type === 'sla_warning') {
        soundType = 'urgent';
      } else if (notification.type === 'ticket_completed' || notification.type === 'payment_received') {
        soundType = 'success';
      } else if (notification.type === 'ticket_assigned' || notification.type === 'new_ticket') {
        soundType = 'warning';
      }
      playNotificationSound(soundType);
    }
    
    // Invalidate queries to refresh data
    queryClient.invalidateQueries(['notifications']);
    
  }, [settings, queryClient]);

  // Handle ticket updates
  const handleTicketUpdate = useCallback((data) => {
    console.log('🎫 Ticket updated:', data);
    
    // Invalidate ticket-related queries
    queryClient.invalidateQueries(['tickets']);
    queryClient.invalidateQueries(['ticket', data.ticketId]);
    
    // Show notification if user is involved
    if (data.assignedTo === user?.id || data.updatedBy === user?.id) {
      toast.success(`Ticket #${data.ticketId} updated`);
    }
  }, [queryClient, user]);

  // Handle technician status changes
  const handleTechnicianStatusChange = useCallback((data) => {
    console.log('👷 Technician status changed:', data);
    
    // Invalidate technician-related queries
    queryClient.invalidateQueries(['technicians']);
    queryClient.invalidateQueries(['technician-stats']);
    
    // Show notification for supervisors/admins
    if (user?.role === 'admin' || user?.role === 'supervisor') {
      toast.info(`Technician status updated: ${data.status}`);
    }
  }, [queryClient, user]);

  // Handle technician created event
  const handleTechnicianCreated = useCallback((data) => {
    console.log('👷 New technician created:', data);
    
    // Invalidate technician-related queries to refresh list
    queryClient.invalidateQueries(['technicians']);
    queryClient.invalidateQueries(['technician-stats']);
    
    // Dispatch custom event for TechniciansPage
    window.dispatchEvent(new CustomEvent('technician-created', { detail: data }));
    
    // Show notification for admins/supervisors
    if (user?.role === 'admin' || user?.role === 'supervisor') {
      toast.success(`New technician added: ${data.technician?.employee_id || data.technician?.full_name}`);
    }
  }, [queryClient, user]);

  // Handle user created event
  const handleUserCreated = useCallback((data) => {
    console.log('👤 New user created:', data);
    
    // If technician user, also invalidate technician queries
    if (data.technician) {
      queryClient.invalidateQueries(['technicians']);
      queryClient.invalidateQueries(['technician-stats']);
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('technician-created', { detail: data }));
    }
    
    // Invalidate user-related queries
    queryClient.invalidateQueries(['users']);
  }, [queryClient]);

  // Handle system alerts
  const handleSystemAlert = useCallback((alert) => {
    console.log('⚠️ System alert:', alert);
    
    // Show system alert based on priority
    const toastOptions = {
      duration: alert.priority === 'urgent' ? 10000 : 5000,
      style: {
        background: alert.priority === 'urgent' ? '#ef4444' : '#f59e0b',
        color: 'white'
      }
    };
    
    toast(alert.message, toastOptions);
  }, []);

  // Check if notification type should be shown
  const shouldShowNotification = (type) => {
    return settings.notification_types?.[type] !== false;
  };

  // Show toast notification
  const showToastNotification = (notification) => {
    const toastOptions = {
      duration: 5000,
      style: {
        background: notification.priority === 'high' ? '#ef4444' : '#3b82f6',
        color: 'white'
      }
    };
    
    toast(notification.message, toastOptions);
  };

  // Play notification sound with different tones for different types
  const playNotificationSound = (type = 'default') => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Different sound patterns for different notification types
      const soundPatterns = {
        urgent: [{ freq: 880, duration: 0.1 }, { freq: 1046, duration: 0.15 }], // High priority
        success: [{ freq: 523, duration: 0.1 }, { freq: 659, duration: 0.1 }, { freq: 784, duration: 0.15 }], // Success chime
        warning: [{ freq: 659, duration: 0.15 }, { freq: 523, duration: 0.15 }], // Warning tone
        default: [{ freq: 659, duration: 0.12 }, { freq: 784, duration: 0.18 }] // Pleasant notification
      };
      
      const pattern = soundPatterns[type] || soundPatterns.default;
      let currentTime = audioContext.currentTime;
      
      pattern.forEach(({ freq, duration }) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        // Smooth envelope
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + duration);
        
        currentTime += duration + 0.05; // Small gap between notes
      });
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  // Initialize Socket.IO connection when user is available
  useEffect(() => {
    if (!user) return;
    
    console.log('🔗 Initializing Socket.IO connection...');
    socketService.connect(user);
    
    // Monitor connection status
    const checkConnection = () => {
      const status = socketService.getConnectionStatus();
      setIsSocketConnected(status.isConnected);
    };
    
    const connectionInterval = setInterval(checkConnection, 1000);
    
    return () => {
      clearInterval(connectionInterval);
    };
  }, [user]);

  // Setup socket event listeners (separate effect to prevent re-registration)
  useEffect(() => {
    if (!isSocketConnected || listenersSetup.current) return;

    console.log('📡 Setting up socket event listeners...');
    listenersSetup.current = true;
    
    // Setup socket event listeners
    socketService.on('notification', handleNewNotification);
    socketService.on('ticket_updated', handleTicketUpdate);
    socketService.on('technician_status_changed', handleTechnicianStatusChange);
    socketService.on('technician-created', handleTechnicianCreated);
    socketService.on('user-created', handleUserCreated);
    socketService.on('system_alert', handleSystemAlert);
    
    return () => {
      console.log('🔌 Cleaning up socket event listeners...');
      listenersSetup.current = false;
      socketService.off('notification', handleNewNotification);
      socketService.off('ticket_updated', handleTicketUpdate);
      socketService.off('technician_status_changed', handleTechnicianStatusChange);
      socketService.off('technician-created', handleTechnicianCreated);
      socketService.off('user-created', handleUserCreated);
      socketService.off('system_alert', handleSystemAlert);
    };
  }, [isSocketConnected, handleNewNotification, handleTicketUpdate, handleTechnicianStatusChange, handleTechnicianCreated, handleUserCreated, handleSystemAlert]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      console.log('🛑 Disconnecting socket on unmount...');
      socketService.disconnect();
    };
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Invalidate queries
      queryClient.invalidateQueries(['notifications']);
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      
      setUnreadCount(0);
      
      // Invalidate queries
      queryClient.invalidateQueries(['notifications']);
      
      toast.success('All notifications marked as read');
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Archive notification
  const archiveNotification = async (notificationId) => {
    try {
      await notificationService.archiveNotification(notificationId);
      
      // Remove from local state
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      // Invalidate queries
      queryClient.invalidateQueries(['notifications']);
      
      toast.success('Notification archived');
      
    } catch (error) {
      console.error('Error archiving notification:', error);
      toast.error('Failed to archive notification');
    }
  };

  // Update notification settings
  const updateSettings = async (newSettings) => {
    try {
      await notificationService.updateSettings(newSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
      
      // Invalidate queries
      queryClient.invalidateQueries(['notification-settings']);
      
      toast.success('Notification settings updated');
      
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Failed to update notification settings');
    }
  };

  // Join room (for specific tickets, etc.)
  const joinRoom = (room) => {
    if (isSocketConnected) {
      socketService.joinRoom(room);
    }
  };

  // Leave room
  const leaveRoom = (room) => {
    if (isSocketConnected) {
      socketService.leaveRoom(room);
    }
  };

  // Emit ticket update
  const emitTicketUpdate = (ticketData) => {
    if (isSocketConnected) {
      socketService.emitTicketUpdate(ticketData);
    }
  };

  // Emit technician status update
  const emitTechnicianStatusUpdate = (statusData) => {
    if (isSocketConnected) {
      socketService.emitTechnicianStatusUpdate(statusData);
    }
  };

  const value = {
    // State
    notifications,
    unreadCount,
    isSocketConnected,
    settings,
    isLoading: notificationsLoading,
    
    // Actions
    markAsRead,
    markAllAsRead,
    archiveNotification,
    updateSettings,
    refetchNotifications,
    
    // Socket actions
    joinRoom,
    leaveRoom,
    emitTicketUpdate,
    emitTechnicianStatusUpdate,
    
    // Connection management
    reconnect: () => socketService.reconnect(user),
    disconnect: () => socketService.disconnect()
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
