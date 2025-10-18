const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Create sample notifications for testing
router.post('/create-sample', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Sample notifications data
    const sampleNotifications = [
      {
        type: 'ticket_assigned',
        title: 'Tiket Baru Ditugaskan',
        message: 'Anda mendapat tiket baru #TK-001 untuk instalasi di Karawang',
        priority: 'high',
        data: { ticket_id: 1, customer_name: 'John Doe' }
      },
      {
        type: 'ticket_updated',
        title: 'Status Tiket Diperbarui',
        message: 'Tiket #TK-002 telah dipindahkan ke status "In Progress"',
        priority: 'normal',
        data: { ticket_id: 2, old_status: 'pending', new_status: 'in_progress' }
      },
      {
        type: 'system_alert',
        title: 'Peringatan Sistem',
        message: 'Server mengalami peningkatan beban. Monitor performa sistem.',
        priority: 'urgent',
        data: { alert_type: 'performance', severity: 'high' }
      },
      {
        type: 'technician_status',
        title: 'Status Teknisi Diperbarui',
        message: 'Teknisi Ahmad telah menyelesaikan tugas dan tersedia untuk penugasan baru',
        priority: 'normal',
        data: { technician_id: 3, status: 'available' }
      },
      {
        type: 'new_ticket',
        title: 'Tiket Baru Dibuat',
        message: 'Customer baru telah membuat tiket untuk layanan internet',
        priority: 'normal',
        data: { ticket_id: 4, customer_id: 5, service_type: 'internet' }
      },
      {
        type: 'ticket_completed',
        title: 'Tiket Selesai',
        message: 'Tiket #TK-003 telah berhasil diselesaikan. Customer telah memberikan rating 5 bintang.',
        priority: 'normal',
        data: { ticket_id: 3, rating: 5, completion_time: '2 hours' }
      }
    ];

    // Insert sample notifications
    const insertedNotifications = [];
    for (const notification of sampleNotifications) {
      const query = `
        INSERT INTO notifications (user_id, type, title, message, data, priority)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, type, title, message, data, priority, is_read, created_at
      `;
      
      const result = await pool.query(query, [
        userId,
        notification.type,
        notification.title,
        notification.message,
        JSON.stringify(notification.data),
        notification.priority
      ]);
      
      insertedNotifications.push(result.rows[0]);
    }

    // Emit real-time notifications via Socket.IO broadcaster
    if (global.socketBroadcaster) {
      insertedNotifications.forEach(notification => {
        global.socketBroadcaster.notifyUser(userId, {
          ...notification,
          timestamp: notification.created_at
        });
      });
    }

    res.json({
      success: true,
      data: { notifications: insertedNotifications },
      message: `Created ${insertedNotifications.length} sample notifications`
    });

  } catch (error) {
    console.error('Create sample notifications error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Clear all notifications for current user
router.delete('/clear-all', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      DELETE FROM notifications 
      WHERE user_id = $1
      RETURNING COUNT(*) as deleted_count
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({
      success: true,
      data: { deletedCount: result.rowCount },
      message: 'All notifications cleared'
    });
    
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
