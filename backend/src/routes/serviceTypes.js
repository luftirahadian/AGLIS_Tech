const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { body, param, validationResult } = require('express-validator');

// Validation middleware for service types
const validateServiceType = [
  body('type_code').trim().notEmpty().withMessage('Type code wajib diisi')
    .matches(/^[a-z_]+$/).withMessage('Type code harus lowercase dengan underscore'),
  body('type_name').trim().notEmpty().withMessage('Type name wajib diisi'),
  body('description').optional().trim(),
  body('description').optional().trim(),
  body('default_duration').optional().isInt({ min: 1 }).withMessage('Duration minimal 1 menit'),
  body('icon').optional().isNumeric(),
  body('is_active').optional().isBoolean(),
  body('display_order').optional().isInt({ min: 0 })
];

// Get all service types
router.get('/', async (req, res) => {
  try {
    const { active_only, search, sort_by, sort_order, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT id, type_code, type_name, description, icon,
             default_duration, is_active, display_order,
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
      conditions.push(`(type_name ILIKE $${paramCount} OR type_code ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Sorting
    const allowedSortColumns = {
      'type_name': 'type_name',
      'type_code': 'type_code',
      'display_order': 'display_order',
      'default_duration': 'default_duration',
      'is_active': 'is_active',
    };
    
    const sortColumn = allowedSortColumns[sort_by] || 'display_order, type_name';
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
        `SELECT id, type_code, type_name, description, icon,
                default_duration, is_active, display_order,
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

  const { type_code, type_name, description, icon, default_duration, is_active, display_order } = req.body;

  try {
    // Check if type_code already exists
    const existingType = await pool.query(
      'SELECT id FROM service_types WHERE type_code = $1',
      [type_code]
    );

    if (existingType.rows.length > 0) {
      return res.status(400).json({ message: 'Type code sudah digunakan' });
    }

    const result = await pool.query(
      `INSERT INTO service_types (type_code, type_name, description, icon, default_duration, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [type_code, type_name, description, icon, default_duration || 120, is_active !== false, display_order || 0]
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

    const { type_code, type_name, description, icon, default_duration, is_active, display_order } = req.body;

    try {
      // Check if service type exists
      const typeCheck = await pool.query('SELECT id FROM service_types WHERE id = $1', [req.params.id]);
      if (typeCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Service type tidak ditemukan' });
      }

      // Check if new type_code conflicts with existing type (excluding current type)
      const codeCheck = await pool.query(
        'SELECT id FROM service_types WHERE type_code = $1 AND id != $2',
        [type_code, req.params.id]
      );

      if (codeCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Type code sudah digunakan' });
      }

      const result = await pool.query(
        `UPDATE service_types 
         SET type_code = $1, type_name = $2, description = $3, icon = $4,
             default_duration = $5, is_active = $6, display_order = $7,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING *`,
        [type_code, type_name, description, icon, default_duration, is_active, display_order, req.params.id]
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
      const typeCheck = await pool.query('SELECT id, type_code FROM service_types WHERE id = $1', [req.params.id]);
      if (typeCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Service type tidak ditemukan' });
      }

      // Check if service type is being used by tickets
      const ticketCheck = await pool.query(
        'SELECT COUNT(*) as count FROM tickets WHERE type = $1',
        [typeCheck.rows[0].type_code]
      );

      if (parseInt(ticketCheck.rows[0].count) > 0) {
        return res.status(400).json({ 
          message: 'Service type tidak dapat dihapus karena masih digunakan oleh ticket' 
        });
      }

      // Check if service type has categories
      const descriptionCheck = await pool.query(
        'SELECT COUNT(*) as count FROM service_categories WHERE service_type_code = $1',
        [typeCheck.rows[0].type_code]
      );

      if (parseInt(descriptionCheck.rows[0].count) > 0) {
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

