// ═══════════════════════════════════════════════════════════════
// 📊 NOTIFICATION ANALYTICS ROUTES
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/notificationAnalyticsService');
const { checkPermission } = require('../middleware/auth');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📈 EVENT TRACKING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/notification-analytics/track/view
 * Track notification view
 */
router.post('/track/view', async (req, res, next) => {
  try {
    const { notification_id, metadata } = req.body;
    await analyticsService.trackView(notification_id, req.user.id, metadata);
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/notification-analytics/track/read
 * Track notification read
 */
router.post('/track/read', async (req, res, next) => {
  try {
    const { notification_id } = req.body;
    await analyticsService.trackRead(notification_id, req.user.id);
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/notification-analytics/track/click
 * Track notification click
 */
router.post('/track/click', async (req, res, next) => {
  try {
    const { notification_id } = req.body;
    await analyticsService.trackClick(notification_id, req.user.id);
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 ANALYTICS REPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/notification-analytics/overview
 * Get overall analytics summary
 */
router.get('/overview', checkPermission('view_analytics'), async (req, res, next) => {
  try {
    const { start_date, end_date, type, priority } = req.query;
    
    const stats = await analyticsService.getOverallStats({
      start_date,
      end_date,
      type,
      priority
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notification-analytics/by-type
 * Get analytics by notification type
 */
router.get('/by-type', checkPermission('view_analytics'), async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    
    const stats = await analyticsService.getStatsByType({
      start_date,
      end_date
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notification-analytics/by-priority
 * Get analytics by priority
 */
router.get('/by-priority', checkPermission('view_analytics'), async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    
    const stats = await analyticsService.getStatsByPriority({
      start_date,
      end_date
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notification-analytics/trend
 * Get daily analytics trend
 */
router.get('/trend', checkPermission('view_analytics'), async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    const trend = await analyticsService.getDailyTrend(days);

    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notification-analytics/devices
 * Get device/channel distribution
 */
router.get('/devices', checkPermission('view_analytics'), async (req, res, next) => {
  try {
    const stats = await analyticsService.getDeviceStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notification-analytics/top-performing
 * Get top performing notifications
 */
router.get('/top-performing', checkPermission('view_analytics'), async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const notifications = await analyticsService.getTopPerformingNotifications(limit);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

