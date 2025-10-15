const express = require('express');
const pool = require('../config/database');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET all WhatsApp groups
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/', authMiddleware, authorize('admin', 'supervisor'), async (req, res) => {
  try {
    const { category, work_zone, is_active } = req.query;
    
    let query = `
      SELECT 
        wg.*,
        u.username as created_by_username,
        u.full_name as created_by_name
      FROM whatsapp_groups wg
      LEFT JOIN users u ON wg.created_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    // Filter by category
    if (category) {
      paramCount++;
      query += ` AND wg.category = $${paramCount}`;
      params.push(category);
    }
    
    // Filter by work zone
    if (work_zone) {
      paramCount++;
      query += ` AND (wg.work_zone = $${paramCount} OR wg.work_zone IS NULL)`;
      params.push(work_zone);
    }
    
    // Filter by active status
    if (is_active !== undefined) {
      paramCount++;
      query += ` AND wg.is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }
    
    query += ` ORDER BY wg.category, wg.work_zone NULLS LAST, wg.name`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: {
        groups: result.rows,
        total: result.rows.length
      }
    });
    
  } catch (error) {
    console.error('Get WhatsApp groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET single WhatsApp group
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/:id', authMiddleware, authorize('admin', 'supervisor'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        wg.*,
        u.username as created_by_username,
        u.full_name as created_by_name
      FROM whatsapp_groups wg
      LEFT JOIN users u ON wg.created_by = u.id
      WHERE wg.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'WhatsApp group not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        group: result.rows[0]
      }
    });
    
  } catch (error) {
    console.error('Get WhatsApp group error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CREATE WhatsApp group
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      work_zone,
      group_chat_id,
      phone_number,
      notification_types,
      priority_filter
    } = req.body;
    
    // Validate required fields
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required'
      });
    }
    
    // Validate category
    const validCategories = ['technicians', 'supervisors', 'managers', 'noc', 'customer_service', 'all'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }
    
    const query = `
      INSERT INTO whatsapp_groups (
        name, description, category, work_zone, group_chat_id, phone_number,
        notification_types, priority_filter, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      name,
      description || null,
      category,
      work_zone || null,
      group_chat_id || null,
      phone_number || null,
      JSON.stringify(notification_types || []),
      priority_filter || 'normal',
      req.user.id
    ]);
    
    res.status(201).json({
      success: true,
      data: {
        group: result.rows[0]
      },
      message: 'WhatsApp group created successfully'
    });
    
  } catch (error) {
    console.error('Create WhatsApp group error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UPDATE WhatsApp group
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.put('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      work_zone,
      group_chat_id,
      phone_number,
      notification_types,
      priority_filter,
      is_active,
      is_verified
    } = req.body;
    
    const query = `
      UPDATE whatsapp_groups SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        work_zone = COALESCE($4, work_zone),
        group_chat_id = COALESCE($5, group_chat_id),
        phone_number = COALESCE($6, phone_number),
        notification_types = COALESCE($7, notification_types),
        priority_filter = COALESCE($8, priority_filter),
        is_active = COALESCE($9, is_active),
        is_verified = COALESCE($10, is_verified),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      name,
      description,
      category,
      work_zone,
      group_chat_id,
      phone_number,
      notification_types ? JSON.stringify(notification_types) : null,
      priority_filter,
      is_active,
      is_verified,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'WhatsApp group not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        group: result.rows[0]
      },
      message: 'WhatsApp group updated successfully'
    });
    
  } catch (error) {
    console.error('Update WhatsApp group error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DELETE WhatsApp group
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.delete('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM whatsapp_groups WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'WhatsApp group not found'
      });
    }
    
    res.json({
      success: true,
      message: 'WhatsApp group deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete WhatsApp group error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST send message to WhatsApp group
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/:id/test', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    
    // Get group details
    const groupResult = await pool.query(
      'SELECT * FROM whatsapp_groups WHERE id = $1',
      [id]
    );
    
    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'WhatsApp group not found'
      });
    }
    
    const group = groupResult.rows[0];
    
    if (!group.phone_number && !group.group_chat_id) {
      return res.status(400).json({
        success: false,
        message: 'Group phone number or chat ID not configured'
      });
    }
    
    // Send test message via WhatsApp service
    const whatsappService = require('../services/whatsappService');
    const testMessage = message || `🧪 *TEST MESSAGE*\n\nThis is a test message from AGLIS Management System.\n\nGroup: ${group.name}\nTime: ${new Date().toLocaleString('id-ID')}\n\n✅ If you received this, the group is configured correctly!`;
    
    const target = group.phone_number || group.group_chat_id;
    const result = await whatsappService.sendMessage(target, testMessage);
    
    // Log the test
    await pool.query(
      `INSERT INTO whatsapp_notifications (
        group_id, recipient_type, phone_number, message, status, provider, provider_response
      ) VALUES ($1, 'group', $2, $3, $4, $5, $6)`,
      [id, target, testMessage, result.success ? 'sent' : 'failed', whatsappService.provider, JSON.stringify(result)]
    );
    
    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Test message sent successfully' : 'Failed to send test message'
    });
    
  } catch (error) {
    console.error('Test WhatsApp group error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET delivery logs for a group
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/:id/logs', authMiddleware, authorize('admin', 'supervisor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    
    const query = `
      SELECT 
        wn.*,
        n.type as notification_type,
        n.title as notification_title
      FROM whatsapp_notifications wn
      LEFT JOIN notifications n ON wn.notification_id = n.id
      WHERE wn.group_id = $1
      ORDER BY wn.created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [id, limit]);
    
    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM whatsapp_notifications
      WHERE group_id = $1
    `;
    
    const statsResult = await pool.query(statsQuery, [id]);
    
    res.json({
      success: true,
      data: {
        logs: result.rows,
        statistics: statsResult.rows[0]
      }
    });
    
  } catch (error) {
    console.error('Get WhatsApp group logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

