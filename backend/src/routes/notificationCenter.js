const express = require('express');
const router = express.Router();
const notificationCenterService = require('../services/notificationCenterService');
const authMiddleware = require('../middlewares/auth');

/**
 * Notification Center Routes
 * All routes require authentication
 */

// Get all notifications for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, type, is_read } = req.query;

    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      type: type || null,
      isRead: is_read !== undefined ? is_read === 'true' : null
    };

    const result = await notificationCenterService.getUserNotifications(userId, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Get unread notification count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationCenterService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
});

// Get notification statistics
router.get('/statistics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await notificationCenterService.getStatistics(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Mark a notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;

    const notification = await notificationCenterService.markAsRead(notificationId, userId);

    // Broadcast updated unread count via Socket.IO
    if (global.socketBroadcaster) {
      const unreadCount = await notificationCenterService.getUnreadCount(userId);
      global.socketBroadcaster.notifyUser(userId, 'notification_read', {
        notificationId,
        unreadCount
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationCenterService.markAllAsRead(userId);

    // Broadcast updated unread count via Socket.IO
    if (global.socketBroadcaster) {
      global.socketBroadcaster.notifyUser(userId, 'notifications_all_read', {
        count,
        unreadCount: 0
      });
    }

    res.json({
      success: true,
      message: `${count} notifications marked as read`,
      data: { count }
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Delete a notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;

    await notificationCenterService.deleteNotification(notificationId, userId);

    // Broadcast updated unread count via Socket.IO
    if (global.socketBroadcaster) {
      const unreadCount = await notificationCenterService.getUnreadCount(userId);
      global.socketBroadcaster.notifyUser(userId, 'notification_deleted', {
        notificationId,
        unreadCount
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete notification'
    });
  }
});

// Clear all read notifications
router.delete('/clear-read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationCenterService.clearReadNotifications(userId);

    // Broadcast via Socket.IO
    if (global.socketBroadcaster) {
      global.socketBroadcaster.notifyUser(userId, 'notifications_cleared', {
        count
      });
    }

    res.json({
      success: true,
      message: `${count} read notifications cleared`,
      data: { count }
    });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications'
    });
  }
});

// Create notification (internal use only - for testing)
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Only allow admin to create notifications directly
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create notifications directly'
      });
    }

    const { userId, type, title, message, link, data, priority } = req.body;

    const notification = await notificationCenterService.createNotification({
      userId: userId || req.user.id,
      type,
      title,
      message,
      link,
      data,
      priority
    });

    // Broadcast to user via Socket.IO
    if (global.socketBroadcaster) {
      global.socketBroadcaster.notifyUser(notification.user_id, 'new_notification', {
        notification
      });
    }

    res.status(201).json({
      success: true,
      message: 'Notification created',
      data: notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
});

module.exports = router;

