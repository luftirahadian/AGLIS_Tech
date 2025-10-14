// ═══════════════════════════════════════════════════════════════
// 🔔 NOTIFICATION TEMPLATES ROUTES
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const templateService = require('../services/notificationTemplateService');
const { checkPermission } = require('../middleware/auth');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📄 TEMPLATE CRUD OPERATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/notification-templates
 * Get all templates with optional filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, type, is_active } = req.query;
    
    const templates = await templateService.getAllTemplates({
      category,
      type,
      is_active: is_active !== undefined ? is_active === 'true' : undefined
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notification-templates/:id
 * Get template by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notification-templates/:id/preview
 * Preview template with example data
 */
router.get('/:id/preview', async (req, res, next) => {
  try {
    const preview = await templateService.previewTemplate(req.params.id);

    res.json({
      success: true,
      data: preview
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/notification-templates
 * Create new template (Admin only)
 */
router.post('/', checkPermission('manage_notifications'), async (req, res, next) => {
  try {
    const template = await templateService.createTemplate(req.body, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/notification-templates/:id
 * Update template (Admin only)
 */
router.put('/:id', checkPermission('manage_notifications'), async (req, res, next) => {
  try {
    const template = await templateService.updateTemplate(req.params.id, req.body, req.user.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/notification-templates/:id
 * Delete template (Admin only)
 */
router.delete('/:id', checkPermission('manage_notifications'), async (req, res, next) => {
  try {
    const template = await templateService.deleteTemplate(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 TEMPLATE RENDERING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/notification-templates/render
 * Render template with custom data
 */
router.post('/render', async (req, res, next) => {
  try {
    const { template_code, data } = req.body;

    if (!template_code || !data) {
      return res.status(400).json({
        success: false,
        message: 'template_code and data are required'
      });
    }

    const rendered = await templateService.renderNotification(template_code, data);

    res.json({
      success: true,
      data: rendered
    });
  } catch (error) {
    next(error);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 TEMPLATE METADATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/notification-templates/metadata/categories
 * Get all template categories
 */
router.get('/metadata/categories', async (req, res, next) => {
  try {
    const categories = await templateService.getCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notification-templates/metadata/types
 * Get all template types
 */
router.get('/metadata/types', async (req, res, next) => {
  try {
    const types = await templateService.getTypes();

    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notification-templates/:id/stats
 * Get template usage statistics
 */
router.get('/:id/stats', async (req, res, next) => {
  try {
    const stats = await templateService.getTemplateStats(req.params.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

