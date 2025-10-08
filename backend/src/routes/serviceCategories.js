const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { body, param, validationResult } = require('express-validator');

// Validation middleware for service categories
const validateServiceCategory = [
  body('service_type_code').trim().notEmpty().withMessage('Service type code wajib diisi'),
  body('category_code').trim().notEmpty().withMessage('Category code wajib diisi')
    .matches(/^[a-z_]+$/).withMessage('Category code harus lowercase dengan underscore'),
  body('category_name').trim().notEmpty().withMessage('Category name wajib diisi'),
  body('description').optional().trim(),
  body('estimated_duration').optional().isInt({ min: 1 }).withMessage('Duration minimal 1 menit'),
  body('sla_multiplier').optional().isFloat({ min: 0.1, max: 10 }).withMessage('SLA multiplier antara 0.1 - 10'),
  body('requires_checklist').optional().isBoolean(),
  body('is_active').optional().isBoolean(),
  body('display_order').optional().isInt({ min: 0 })
];

// Get all service categories
router.get('/', async (req, res) => {
  try {
    const { service_type_code, active_only } = req.query;
    
    let query = `
      SELECT sc.id, sc.service_type_code, sc.category_code, sc.category_name,
             sc.description, sc.estimated_duration, sc.sla_multiplier,
             sc.requires_checklist, sc.is_active, sc.display_order,
             sc.created_at, sc.updated_at,
             st.type_name as service_type_name
      FROM service_categories sc
      JOIN service_types st ON sc.service_type_code = st.type_code
    `;
    
    const conditions = [];
    const params = [];
    
    if (service_type_code) {
      conditions.push(`sc.service_type_code = $${params.length + 1}`);
      params.push(service_type_code);
    }
    
    if (active_only === 'true') {
      conditions.push('sc.is_active = true');
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY sc.service_type_code, sc.display_order, sc.category_name';
    
    const result = await pool.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({ message: 'Error fetching service categories' });
  }
});

// Get service category by ID
router.get('/:id',
  param('id').isInt().withMessage('Invalid service category ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await pool.query(
        `SELECT sc.id, sc.service_type_code, sc.category_code, sc.category_name,
                sc.description, sc.estimated_duration, sc.sla_multiplier,
                sc.requires_checklist, sc.is_active, sc.display_order,
                sc.created_at, sc.updated_at,
                st.type_name as service_type_name
         FROM service_categories sc
         JOIN service_types st ON sc.service_type_code = st.type_code
         WHERE sc.id = $1`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Service category tidak ditemukan' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching service category:', error);
      res.status(500).json({ message: 'Error fetching service category' });
    }
  }
);

// Create new service category
router.post('/', validateServiceCategory, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    service_type_code, 
    category_code, 
    category_name, 
    description, 
    estimated_duration,
    sla_multiplier,
    requires_checklist,
    is_active,
    display_order
  } = req.body;

  try {
    // Check if service type exists
    const typeCheck = await pool.query(
      'SELECT id FROM service_types WHERE type_code = $1',
      [service_type_code]
    );

    if (typeCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Service type tidak ditemukan' });
    }

    // Check if category already exists for this service type
    const existingCategory = await pool.query(
      'SELECT id FROM service_categories WHERE service_type_code = $1 AND category_code = $2',
      [service_type_code, category_code]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(400).json({ message: 'Category code sudah digunakan untuk service type ini' });
    }

    const result = await pool.query(
      `INSERT INTO service_categories 
       (service_type_code, category_code, category_name, description, estimated_duration, 
        sla_multiplier, requires_checklist, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        service_type_code, 
        category_code, 
        category_name, 
        description, 
        estimated_duration || 120,
        sla_multiplier || 1.0,
        requires_checklist || false,
        is_active !== false,
        display_order || 0
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating service category:', error);
    res.status(500).json({ message: 'Error creating service category' });
  }
});

// Update service category
router.put('/:id',
  param('id').isInt().withMessage('Invalid service category ID'),
  validateServiceCategory,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      service_type_code, 
      category_code, 
      category_name, 
      description, 
      estimated_duration,
      sla_multiplier,
      requires_checklist,
      is_active,
      display_order
    } = req.body;

    try {
      // Check if category exists
      const categoryCheck = await pool.query(
        'SELECT id FROM service_categories WHERE id = $1', 
        [req.params.id]
      );
      
      if (categoryCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Service category tidak ditemukan' });
      }

      // Check if service type exists
      const typeCheck = await pool.query(
        'SELECT id FROM service_types WHERE type_code = $1',
        [service_type_code]
      );

      if (typeCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Service type tidak ditemukan' });
      }

      // Check if new category_code conflicts with existing category (excluding current category)
      const codeCheck = await pool.query(
        'SELECT id FROM service_categories WHERE service_type_code = $1 AND category_code = $2 AND id != $3',
        [service_type_code, category_code, req.params.id]
      );

      if (codeCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Category code sudah digunakan untuk service type ini' });
      }

      const result = await pool.query(
        `UPDATE service_categories 
         SET service_type_code = $1, category_code = $2, category_name = $3, 
             description = $4, estimated_duration = $5, sla_multiplier = $6,
             requires_checklist = $7, is_active = $8, display_order = $9,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $10
         RETURNING *`,
        [
          service_type_code, 
          category_code, 
          category_name, 
          description, 
          estimated_duration,
          sla_multiplier,
          requires_checklist,
          is_active,
          display_order,
          req.params.id
        ]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating service category:', error);
      res.status(500).json({ message: 'Error updating service category' });
    }
  }
);

// Delete service category
router.delete('/:id',
  param('id').isInt().withMessage('Invalid service category ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if category exists
      const categoryCheck = await pool.query(
        'SELECT id FROM service_categories WHERE id = $1',
        [req.params.id]
      );
      
      if (categoryCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Service category tidak ditemukan' });
      }

      // Note: We might want to check if category is being used by tickets
      // For now, we'll allow deletion

      await pool.query('DELETE FROM service_categories WHERE id = $1', [req.params.id]);

      res.json({ message: 'Service category berhasil dihapus' });
    } catch (error) {
      console.error('Error deleting service category:', error);
      res.status(500).json({ message: 'Error deleting service category' });
    }
  }
);

module.exports = router;

