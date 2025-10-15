/**
 * WhatsApp Message Templates API Routes
 * CRUD operations for managing WhatsApp notification templates
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/whatsapp-templates
 * Get all templates
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, search, is_active } = req.query;
    
    let query = 'SELECT * FROM whatsapp_message_templates WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount} OR code ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }

    query += ' ORDER BY category, name';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/whatsapp-templates/:id
 * Get template by ID
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM whatsapp_message_templates WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/whatsapp-templates/code/:code
 * Get template by code
 */
router.get('/code/:code', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      'SELECT * FROM whatsapp_message_templates WHERE code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get template by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/whatsapp-templates
 * Create new template
 */
router.post('/', authMiddleware, authorize('admin', 'supervisor'), [
  body('code').notEmpty().withMessage('Template code is required'),
  body('name').notEmpty().withMessage('Template name is required'),
  body('category').isIn(['ticket', 'payment', 'customer', 'team', 'marketing']).withMessage('Invalid category'),
  body('template').notEmpty().withMessage('Template message is required'),
  body('variables').optional()
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

    const {
      code,
      name,
      category,
      description,
      template,
      variables,
      is_active
    } = req.body;

    const result = await pool.query(
      `INSERT INTO whatsapp_message_templates 
       (code, name, category, description, template, variables, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        code.toUpperCase(),
        name,
        category,
        description,
        template,
        variables || {},
        is_active !== false,
        req.user.id
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create template error:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        message: 'Template code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/whatsapp-templates/:id
 * Update template
 */
router.put('/:id', authMiddleware, authorize('admin', 'supervisor'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      description,
      template,
      variables,
      is_active
    } = req.body;

    const result = await pool.query(
      `UPDATE whatsapp_message_templates
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           description = $3,
           template = COALESCE($4, template),
           variables = COALESCE($5, variables),
           is_active = COALESCE($6, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, category, description, template, variables, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/whatsapp-templates/:id
 * Delete template
 */
router.delete('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM whatsapp_message_templates WHERE id = $1 RETURNING code, name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: `Template "${result.rows[0].name}" deleted successfully`
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/whatsapp-templates/:id/test
 * Test send template with sample data
 */
router.post('/:id/test', authMiddleware, [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('testData').optional()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, testData } = req.body;

    // Get template
    const templateResult = await pool.query(
      'SELECT * FROM whatsapp_message_templates WHERE id = $1',
      [id]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    const template = templateResult.rows[0];
    
    // Use provided test data or template variables
    const data = testData || template.variables || {};

    // Simple template variable replacement
    let message = template.template;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      message = message.replace(regex, value);
    }

    // Send via WhatsApp service
    const whatsappService = require('../services/whatsappService');
    const sendResult = await whatsappService.sendMessage(phone, message);

    // Update usage count
    await pool.query(
      'UPDATE whatsapp_message_templates SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    if (sendResult.success) {
      res.json({
        success: true,
        message: 'Test message sent successfully',
        data: {
          phone: phone,
          preview: message,
          provider: sendResult.provider
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test message',
        error: sendResult.error
      });
    }
  } catch (error) {
    console.error('Test template error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

