/**
 * WhatsApp Notifications API Routes
 * Phase 2: Manual Trigger Endpoints
 * 
 * Endpoints for:
 * - Emergency Alerts
 * - Maintenance Notifications
 * - Manual Daily Summary
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware, authorize } = require('../middleware/auth');
const whatsappNotificationService = require('../services/whatsappNotificationService');

const router = express.Router();

/**
 * POST /api/whatsapp-notifications/emergency-alert
 * Send emergency alert to all team
 */
router.post('/emergency-alert', authMiddleware, authorize('admin', 'supervisor', 'manager', 'noc'), [
  body('type').notEmpty().withMessage('Alert type is required'),
  body('area').notEmpty().withMessage('Affected area is required'),
  body('customersAffected').isInt().withMessage('Number of affected customers is required'),
  body('status').notEmpty().withMessage('Status is required'),
  body('eta').notEmpty().withMessage('ETA is required'),
  body('actions').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const alertData = {
      type: req.body.type,
      area: req.body.area,
      customersAffected: req.body.customersAffected,
      status: req.body.status,
      eta: req.body.eta,
      actions: req.body.actions
    };

    const result = await whatsappNotificationService.sendEmergencyAlert(alertData);

    if (result.success) {
      res.json({
        success: true,
        message: `Emergency alert sent to ${result.totalSent} recipients`,
        data: {
          totalRecipients: result.totalRecipients,
          totalSent: result.totalSent
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send emergency alert',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Emergency alert API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/whatsapp-notifications/maintenance
 * Send maintenance notification to affected customers
 */
router.post('/maintenance', authMiddleware, authorize('admin', 'supervisor', 'noc'), [
  body('type').notEmpty().withMessage('Maintenance type is required'),
  body('area').notEmpty().withMessage('Area is required'),
  body('startDate').notEmpty().withMessage('Start date is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('duration').notEmpty().withMessage('Duration is required'),
  body('impact').optional(),
  body('reason').notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const maintenanceData = {
      type: req.body.type,
      area: req.body.area,
      startDate: req.body.startDate,
      startTime: req.body.startTime,
      duration: req.body.duration,
      impact: req.body.impact,
      reason: req.body.reason
    };

    const result = await whatsappNotificationService.notifyMaintenance(maintenanceData);

    if (result.success) {
      res.json({
        success: true,
        message: `Maintenance notification sent to ${result.totalSent} customers`,
        data: {
          totalSent: result.totalSent,
          totalFailed: result.totalFailed
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send maintenance notification',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Maintenance notification API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/whatsapp-notifications/daily-summary
 * Manually trigger daily summary (for testing)
 */
router.post('/daily-summary', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  try {
    const result = await whatsappNotificationService.sendDailySummary();

    if (result.success) {
      res.json({
        success: true,
        message: `Daily summary sent to ${result.totalSent} managers/supervisors`,
        data: {
          totalSent: result.totalSent
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send daily summary',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Daily summary API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/whatsapp-notifications/stats
 * Get WhatsApp notification statistics
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const pool = require('../config/database');
    
    const statsQuery = `
      SELECT 
        notification_type,
        status,
        provider,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM whatsapp_notifications
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY notification_type, status, provider, DATE(created_at)
      ORDER BY date DESC, notification_type
    `;

    const result = await pool.query(statsQuery);

    const totalQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN provider = 'fonnte' THEN 1 END) as via_fonnte,
        COUNT(CASE WHEN provider = 'wablas' THEN 1 END) as via_wablas
      FROM whatsapp_notifications
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    `;

    const totalResult = await pool.query(totalQuery);

    res.json({
      success: true,
      data: {
        summary: totalResult.rows[0],
        details: result.rows
      }
    });
  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

