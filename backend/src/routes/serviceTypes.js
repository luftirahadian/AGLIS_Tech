const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { body, param, validationResult } = require('express-validator');

// Validation middleware for service types
const validateServiceType = [
  body('service_code').trim().notEmpty().withMessage('Service code wajib diisi')
    .matches(/^[a-z_]+$/).withMessage('Service code harus lowercase dengan underscore'),
  body('service_name').trim().notEmpty().withMessage('Service name wajib diisi'),
  body('description').optional().trim(),
  body('category').optional().trim(),
  body('estimated_duration').optional().isInt({ min: 1 }).withMessage('Duration minimal 1 menit'),
  body('base_price').optional().isNumeric(),
  body('is_active').optional().isBoolean(),
  body('display_order').optional().isInt({ min: 0 })
];

// Get all service types
router.get('/', async (req, res) => {
  try {
    const { active_only, search, sort_by, sort_order, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT id, service_code, service_name, category, description,
             estimated_duration, base_price, is_active, display_order,
             created_at, updated_at
      FROM service_types
    `;
    
    const params = [];
    let paramCount = 0;
    const conditions = [];
    
    if (active_only === 'true') {
      conditions.push('is_active = true');
    }
    
    if (search) {
      paramCount++;
      conditions.push(`(service_name ILIKE $${paramCount} OR service_code ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Sorting
    const allowedSortColumns = {
      'service_name': 'service_name',
      'service_code': 'service_code',
      'display_order': 'display_order',
      'estimated_duration': 'estimated_duration',
      'is_active': 'is_active',
      'category': 'category'
    };
    
    const sortColumn = allowedSortColumns[sort_by] || 'display_order, service_name';
    const sortDirection = sort_order === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortColumn} ${sortDirection}`;
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM service_types';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const countResult = await pool.query(countQuery, params);
    const totalRecords = parseInt(countResult.rows[0].total);
    
    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRecords,
        pages: Math.ceil(totalRecords / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching service types:', error);
    res.status(500).json({ message: 'Error fetching service types' });
  }
});

// Get service type by ID
router.get('/:id',
  param('id').isInt().withMessage('Invalid service type ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await pool.query(
        `SELECT id, service_code, service_name, category, description,
                estimated_duration, base_price, is_active, display_order,
                created_at, updated_at
         FROM service_types
         WHERE id = $1`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Service type tidak ditemukan' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching service type:', error);
      res.status(500).json({ message: 'Error fetching service type' });
    }
  }
);

// Create new service type
router.post('/', validateServiceType, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { service_code, service_name, category, description, estimated_duration, base_price, is_active, display_order } = req.body;

  try {
    // Check if service_code already exists
    const existingType = await pool.query(
      'SELECT id FROM service_types WHERE service_code = $1',
      [service_code]
    );

    if (existingType.rows.length > 0) {
      return res.status(400).json({ message: 'Type code sudah digunakan' });
    }

    const result = await pool.query(
      `INSERT INTO service_types (service_code, service_name, category, description, estimated_duration, base_price, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [service_code, service_name, category || 'other', description, estimated_duration || 120, base_price || 0, is_active !== false, display_order || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating service type:', error);
    res.status(500).json({ message: 'Error creating service type' });
  }
});

// Update service type
router.put('/:id',
  param('id').isInt().withMessage('Invalid service type ID'),
  validateServiceType,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { service_code, service_name, category, description, estimated_duration, base_price, is_active, display_order } = req.body;

    try {
      // Check if service type exists
      const typeCheck = await pool.query('SELECT id FROM service_types WHERE id = $1', [req.params.id]);
      if (typeCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Service type tidak ditemukan' });
      }

      // Check if new service_code conflicts with existing type (excluding current type)
      const codeCheck = await pool.query(
        'SELECT id FROM service_types WHERE service_code = $1 AND id != $2',
        [service_code, req.params.id]
      );

      if (codeCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Type code sudah digunakan' });
      }

      const result = await pool.query(
        `UPDATE service_types 
         SET service_code = $1, service_name = $2, category = $3, description = $4,
             estimated_duration = $5, base_price = $6, is_active = $7, display_order = $8,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $9
         RETURNING *`,
        [service_code, service_name, category, description, estimated_duration, base_price, is_active, display_order, req.params.id]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating service type:', error);
      res.status(500).json({ message: 'Error updating service type' });
    }
  }
);

// Delete service type
router.delete('/:id',
  param('id').isInt().withMessage('Invalid service type ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if service type exists
      const typeCheck = await pool.query('SELECT id, service_code FROM service_types WHERE id = $1', [req.params.id]);
      if (typeCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Service type tidak ditemukan' });
      }

      // Check if service type is being used by tickets
      const ticketCheck = await pool.query(
        'SELECT COUNT(*) as count FROM tickets WHERE type = $1',
        [typeCheck.rows[0].service_code]
      );

      if (parseInt(ticketCheck.rows[0].count) > 0) {
        return res.status(400).json({ 
          message: 'Service type tidak dapat dihapus karena masih digunakan oleh ticket' 
        });
      }

      // Check if service type has categories
      const categoryCheck = await pool.query(
        'SELECT COUNT(*) as count FROM service_categories WHERE service_service_code = $1',
        [typeCheck.rows[0].service_code]
      );

      if (parseInt(categoryCheck.rows[0].count) > 0) {
        return res.status(400).json({ 
          message: 'Service type tidak dapat dihapus karena masih memiliki kategori' 
        });
      }

      await pool.query('DELETE FROM service_types WHERE id = $1', [req.params.id]);

      res.json({ message: 'Service type berhasil dihapus' });
    } catch (error) {
      console.error('Error deleting service type:', error);
      res.status(500).json({ message: 'Error deleting service type' });
    }
  }
);

module.exports = router;

