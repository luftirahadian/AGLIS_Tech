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

// ============================================
// PHASE 3: CUSTOMER ENGAGEMENT ENDPOINTS
// ============================================

/**
 * POST /api/whatsapp-notifications/welcome/:customerId
 * Send welcome message to new customer
 */
router.post('/welcome/:customerId', authMiddleware, authorize('admin', 'customer_service'), async (req, res) => {
  try {
    const { customerId } = req.params;
    const result = await whatsappNotificationService.sendWelcomeMessage(customerId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Welcome message sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send welcome message',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Welcome message API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/whatsapp-notifications/upgrade-offer/:customerId
 * Send package upgrade offer to customer
 */
router.post('/upgrade-offer/:customerId', authMiddleware, authorize('admin', 'manager'), [
  body('upgradePackageId').isInt().withMessage('Upgrade package ID is required')
], async (req, res) => {
  try {
    const { customerId } = req.params;
    const { upgradePackageId } = req.body;

    const result = await whatsappNotificationService.sendUpgradeOffer(
      customerId,
      upgradePackageId
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Upgrade offer sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send upgrade offer',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Upgrade offer API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/whatsapp-notifications/survey/:ticketId
 * Send satisfaction survey after ticket completion
 */
router.post('/survey/:ticketId', authMiddleware, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const result = await whatsappNotificationService.sendSatisfactionSurvey(ticketId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Satisfaction survey sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send survey',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Survey API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/whatsapp-notifications/promotion-campaign
 * Send promotion campaign to targeted customers
 */
router.post('/promotion-campaign', authMiddleware, authorize('admin', 'manager'), [
  body('campaignTitle').notEmpty().withMessage('Campaign title is required'),
  body('offer').notEmpty().withMessage('Offer description is required'),
  body('validUntil').notEmpty().withMessage('Valid until date is required'),
  body('targetCustomers').optional()
], async (req, res) => {
  try {
    const campaignData = {
      campaignTitle: req.body.campaignTitle,
      offer: req.body.offer,
      discount: req.body.discount,
      validUntil: req.body.validUntil,
      terms: req.body.terms,
      ctaText: req.body.ctaText,
      ctaLink: req.body.ctaLink
    };

    const result = await whatsappNotificationService.sendPromotionCampaign(
      campaignData,
      req.body.targetCustomers || 'all'
    );

    if (result.success) {
      res.json({
        success: true,
        message: `Promotion sent to ${result.totalSent}/${result.totalCustomers} customers`,
        data: {
          totalSent: result.totalSent,
          totalFailed: result.totalFailed,
          totalCustomers: result.totalCustomers
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send promotion campaign',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Promotion campaign API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/whatsapp-notifications/technician-performance/:technicianId
 * Send performance report to specific technician (manual)
 */
router.post('/technician-performance/:technicianId', authMiddleware, authorize('admin', 'supervisor', 'manager'), async (req, res) => {
  try {
    const { technicianId } = req.params;
    const period = req.body.period || 'This Week';

    const result = await whatsappNotificationService.sendTechnicianPerformance(
      technicianId,
      period
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Performance report sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send performance report',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Performance report API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

