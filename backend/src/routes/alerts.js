const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const alertService = require('../services/alertService');
const { body, validationResult } = require('express-validator');

/**
 * Alert Management Routes
 * 
 * Manage alert rules, view alert history, resolve alerts
 */

// Get all alert rules
router.get('/rules', async (req, res) => {
  try {
    const { category, is_active } = req.query;
    
    let query = 'SELECT * FROM alert_rules WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }

    query += ' ORDER BY severity DESC, name';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching alert rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert rules'
    });
  }
});

// Get alert history
router.get('/history', async (req, res) => {
  try {
    const { days = 7, severity, resolved } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    let query = `
      SELECT ah.*, ar.name as rule_name, ar.category
      FROM alert_history ah
      LEFT JOIN alert_rules ar ON ah.alert_rule_id = ar.id
      WHERE ah.triggered_at >= $1
    `;
    const params = [since];
    let paramCount = 1;

    if (severity) {
      paramCount++;
      query += ` AND ah.severity = $${paramCount}`;
      params.push(severity);
    }

    if (resolved === 'true') {
      query += ' AND ah.resolved_at IS NOT NULL';
    } else if (resolved === 'false') {
      query += ' AND ah.resolved_at IS NULL';
    }

    query += ' ORDER BY ah.triggered_at DESC LIMIT 100';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching alert history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert history'
    });
  }
});

// Get active (unresolved) alerts
router.get('/active', async (req, res) => {
  try {
    const alerts = await alertService.getActiveAlerts();

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active alerts'
    });
  }
});

// Get alert statistics
router.get('/stats', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const stats = await alertService.getAlertStats(days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert statistics'
    });
  }
});

// Create alert rule
router.post('/rules', [
  body('name').notEmpty().withMessage('Name is required'),
  body('metric').notEmpty().withMessage('Metric is required'),
  body('condition').isIn(['greater_than', 'less_than', 'equals', 'not_equals']).withMessage('Invalid condition'),
  body('threshold').isNumeric().withMessage('Threshold must be numeric')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      name, description, category, metric, condition, threshold,
      severity, notification_channels, recipients, cooldown_minutes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO alert_rules 
       (name, description, category, metric, condition, threshold, severity, notification_channels, recipients, cooldown_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, description, category, metric, condition, threshold, severity || 'medium',
       JSON.stringify(notification_channels || ['email', 'whatsapp']),
       JSON.stringify(recipients || []),
       cooldown_minutes || 60]
    );

    res.json({
      success: true,
      message: 'Alert rule created',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating alert rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alert rule'
    });
  }
});

// Update alert rule
router.put('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, category, metric, condition, threshold,
      severity, notification_channels, recipients, is_active, cooldown_minutes
    } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (name) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }

    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(description);
    }

    if (category) {
      paramCount++;
      updates.push(`category = $${paramCount}`);
      params.push(category);
    }

    if (metric) {
      paramCount++;
      updates.push(`metric = $${paramCount}`);
      params.push(metric);
    }

    if (condition) {
      paramCount++;
      updates.push(`condition = $${paramCount}`);
      params.push(condition);
    }

    if (threshold !== undefined) {
      paramCount++;
      updates.push(`threshold = $${paramCount}`);
      params.push(threshold);
    }

    if (severity) {
      paramCount++;
      updates.push(`severity = $${paramCount}`);
      params.push(severity);
    }

    if (notification_channels) {
      paramCount++;
      updates.push(`notification_channels = $${paramCount}`);
      params.push(JSON.stringify(notification_channels));
    }

    if (recipients) {
      paramCount++;
      updates.push(`recipients = $${paramCount}`);
      params.push(JSON.stringify(recipients));
    }

    if (is_active !== undefined) {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
    }

    if (cooldown_minutes !== undefined) {
      paramCount++;
      updates.push(`cooldown_minutes = $${paramCount}`);
      params.push(cooldown_minutes);
    }

    paramCount++;
    updates.push(`updated_at = $${paramCount}`);
    params.push(new Date());

    paramCount++;
    params.push(id);

    const query = `
      UPDATE alert_rules
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Alert rule updated',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating alert rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alert rule'
    });
  }
});

// Delete alert rule
router.delete('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM alert_rules WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Alert rule deleted'
    });
  } catch (error) {
    console.error('Error deleting alert rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert rule'
    });
  }
});

// Resolve alert
router.post('/history/:id/resolve', [
  body('notes').optional()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    await alertService.resolveAlert(id, req.user.id, notes);

    res.json({
      success: true,
      message: 'Alert resolved'
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve alert'
    });
  }
});

// Trigger manual alert check
router.post('/check', async (req, res) => {
  try {
    const alerts = await alertService.checkAlerts();

    res.json({
      success: true,
      message: `Alert check completed`,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Error checking alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check alerts'
    });
  }
});

module.exports = router;

