const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get user notifications with pagination
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      type, 
      is_read, 
      priority,
      include_archived = false 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereConditions = ['user_id = $1'];
    let queryParams = [userId];
    let paramCount = 1;
    
    if (type) {
      paramCount++;
      whereConditions.push(`type = $${paramCount}`);
      queryParams.push(type);
    }
    
    if (is_read !== undefined) {
      paramCount++;
      whereConditions.push(`is_read = $${paramCount}`);
      queryParams.push(is_read === 'true');
    }
    
    if (priority) {
      paramCount++;
      whereConditions.push(`priority = $${paramCount}`);
      queryParams.push(priority);
    }
    
    if (!include_archived || include_archived === 'false') {
      whereConditions.push('is_archived = FALSE');
    }
    
    // Add expiration check
    whereConditions.push('(expires_at IS NULL OR expires_at > NOW())');
    
    const whereClause = whereConditions.join(' AND ');
    
    // Get notifications
    const notificationsQuery = `
      SELECT id, type, title, message, data, priority, is_read, is_archived,
             created_at, read_at, expires_at
      FROM notifications 
      WHERE ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    queryParams.push(limit, offset);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM notifications 
      WHERE ${whereClause}
    `;
    
    const [notificationsResult, countResult] = await Promise.all([
      pool.query(notificationsQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
    ]);
    
    const notifications = notificationsResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    // Get unread count
    const unreadQuery = `
      SELECT COUNT(*) as unread_count 
      FROM notifications 
      WHERE user_id = $1 AND is_read = FALSE AND is_archived = FALSE 
      AND (expires_at IS NULL OR expires_at > NOW())
    `;
    
    const unreadResult = await pool.query(unreadQuery, [userId]);
    const unreadCount = parseInt(unreadResult.rows[0].unread_count);
    
    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        unreadCount
      }
    });
    
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get single notification
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const query = `
      SELECT id, type, title, message, data, priority, is_read, is_archived,
             created_at, read_at, expires_at
      FROM notifications 
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({
      success: true,
      data: { notification: result.rows[0] }
    });
    
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create notification (usually called by system)
router.post('/', async (req, res) => {
  try {
    const { user_id, type, title, message, data, priority = 'normal', expires_at } = req.body;
    
    // Validate required fields
    if (!user_id || !type || !title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: user_id, type, title, message' 
      });
    }
    
    const query = `
      INSERT INTO notifications (user_id, type, title, message, data, priority, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, type, title, message, data, priority, is_read, created_at, expires_at
    `;
    
    const result = await pool.query(query, [
      user_id, type, title, message, 
      data ? JSON.stringify(data) : null, 
      priority, expires_at
    ]);
    
    const notification = result.rows[0];
    
    // Emit real-time notification via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${user_id}`).emit('notification', {
        ...notification,
        timestamp: notification.created_at
      });
    }
    
    res.status(201).json({
      success: true,
      data: { notification },
      message: 'Notification created successfully'
    });
    
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const query = `
      UPDATE notifications 
      SET is_read = TRUE, read_at = NOW() 
      WHERE id = $1 AND user_id = $2
      RETURNING id, is_read, read_at
    `;
    
    const result = await pool.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({
      success: true,
      data: { notification: result.rows[0] },
      message: 'Notification marked as read'
    });
    
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      UPDATE notifications 
      SET is_read = TRUE, read_at = NOW() 
      WHERE user_id = $1 AND is_read = FALSE
      RETURNING COUNT(*) as updated_count
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({
      success: true,
      data: { updatedCount: result.rowCount },
      message: 'All notifications marked as read'
    });
    
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Archive notification
router.patch('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const query = `
      UPDATE notifications 
      SET is_archived = TRUE 
      WHERE id = $1 AND user_id = $2
      RETURNING id, is_archived
    `;
    
    const result = await pool.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({
      success: true,
      data: { notification: result.rows[0] },
      message: 'Notification archived'
    });
    
  } catch (error) {
    console.error('Archive notification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const query = `
      DELETE FROM notifications 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    
    const result = await pool.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get notification settings
router.get('/settings/preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT * FROM notification_settings 
      WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      // Create default settings if not exists
      const defaultSettings = {
        email_notifications: true,
        push_notifications: true,
        sound_notifications: true,
        desktop_notifications: true,
        whatsapp_notifications: true,
        notification_types: {
          ticket_assigned: true,
          ticket_updated: true,
          ticket_completed: true,
          system_alert: true,
          technician_status: true,
          new_ticket: true,
          new_registration: true,
          payment_received: true,
          sla_warning: true
        }
      };
      
      const insertQuery = `
        INSERT INTO notification_settings (user_id, email_notifications, push_notifications, 
                                         sound_notifications, desktop_notifications, whatsapp_notifications, notification_types)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const insertResult = await pool.query(insertQuery, [
        userId,
        defaultSettings.email_notifications,
        defaultSettings.push_notifications,
        defaultSettings.sound_notifications,
        defaultSettings.desktop_notifications,
        defaultSettings.whatsapp_notifications,
        JSON.stringify(defaultSettings.notification_types)
      ]);
      
      return res.json({
        success: true,
        data: { settings: insertResult.rows[0] }
      });
    }
    
    res.json({
      success: true,
      data: { settings: result.rows[0] }
    });
    
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update notification settings
router.put('/settings/preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      email_notifications, 
      push_notifications, 
      sound_notifications, 
      desktop_notifications,
      whatsapp_notifications,
      notification_types,
      quiet_hours_start,
      quiet_hours_end
    } = req.body;
    
    const query = `
      UPDATE notification_settings 
      SET email_notifications = COALESCE($2, email_notifications),
          push_notifications = COALESCE($3, push_notifications),
          sound_notifications = COALESCE($4, sound_notifications),
          desktop_notifications = COALESCE($5, desktop_notifications),
          whatsapp_notifications = COALESCE($6, whatsapp_notifications),
          notification_types = COALESCE($7, notification_types),
          quiet_hours_start = COALESCE($8, quiet_hours_start),
          quiet_hours_end = COALESCE($9, quiet_hours_end),
          updated_at = NOW()
      WHERE user_id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      userId,
      email_notifications,
      push_notifications,
      sound_notifications,
      desktop_notifications,
      whatsapp_notifications,
      notification_types ? JSON.stringify(notification_types) : null,
      quiet_hours_start,
      quiet_hours_end
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }
    
    res.json({
      success: true,
      data: { settings: result.rows[0] },
      message: 'Notification settings updated successfully'
    });
    
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Cleanup expired notifications (utility endpoint)
router.delete('/cleanup/expired', async (req, res) => {
  try {
    // Only allow admin users to run cleanup
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    
    const query = `
      DELETE FROM notifications 
      WHERE expires_at IS NOT NULL AND expires_at < NOW()
      RETURNING COUNT(*) as deleted_count
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: { deletedCount: result.rowCount },
      message: 'Expired notifications cleaned up'
    });
    
  } catch (error) {
    console.error('Cleanup expired notifications error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
