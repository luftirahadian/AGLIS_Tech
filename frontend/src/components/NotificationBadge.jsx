import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Bell } from 'lucide-react';
import notificationCenterService from '../services/notificationCenterService';
import NotificationDropdown from './NotificationDropdown';

/**
 * NotificationBadge Component
 * Displays notification bell icon with unread count badge
 * Opens dropdown on click
 */
const NotificationBadge = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Get unread count with real-time updates
  const { data: unreadData } = useQuery(
    'notification-unread-count',
    () => notificationCenterService.getUnreadCount(),
    {
      refetchInterval: 30000, // Refresh every 30s
      refetchOnWindowFocus: true,
      staleTime: 10000
    }
  );

  const unreadCount = unreadData?.data?.count || 0;

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="h-6 w-6" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <NotificationDropdown 
        isOpen={isDropdownOpen} 
        onClose={() => setIsDropdownOpen(false)} 
      />
    </div>
  );
};

export default NotificationBadge;

