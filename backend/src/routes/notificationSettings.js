// ═══════════════════════════════════════════════════════════════
// ⚙️ ADVANCED NOTIFICATION SETTINGS ROUTES
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const settingsService = require('../services/notificationSettingsAdvancedService');
const mobilePushService = require('../services/mobilePushService');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ SETTINGS MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/notification-settings/advanced
 * Get advanced notification settings
 */
router.get('/advanced', async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings(req.user.id);

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/notification-settings/advanced
 * Update advanced notification settings
 */
router.put('/advanced', async (req, res, next) => {
  try {
    const settings = await settingsService.updateSettings(req.user.id, req.body);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/notification-settings/type/:type
 * Update settings for specific notification type
 */
router.put('/type/:type', async (req, res, next) => {
  try {
    const result = await settingsService.updateTypeSettings(
      req.user.id,
      req.params.type,
      req.body
    );

    res.json({
      success: true,
      message: 'Type settings updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 MOBILE DEVICE MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/notification-settings/devices/register
 * Register device for push notifications
 */
router.post('/devices/register', async (req, res, next) => {
  try {
    const device = await mobilePushService.registerDevice(req.user.id, req.body);

    res.json({
      success: true,
      message: 'Device registered successfully',
      data: device
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/notification-settings/devices/unregister
 * Unregister device
 */
router.post('/devices/unregister', async (req, res, next) => {
  try {
    const { device_token } = req.body;
    
    if (!device_token) {
      return res.status(400).json({
        success: false,
        message: 'device_token is required'
      });
    }

    await mobilePushService.unregisterDevice(device_token);

    res.json({
      success: true,
      message: 'Device unregistered successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notification-settings/devices
 * Get user's registered devices
 */
router.get('/devices', async (req, res, next) => {
  try {
    const devices = await mobilePushService.getUserDevices(req.user.id);

    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

