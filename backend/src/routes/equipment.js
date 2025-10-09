const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { body, param, validationResult } = require('express-validator');

// Validation middleware
const validateEquipment = [
  body('equipment_code').trim().notEmpty().withMessage('Kode equipment wajib diisi')
    .isLength({ min: 3 }).withMessage('Kode equipment minimal 3 karakter'),
  body('equipment_name').trim().notEmpty().withMessage('Nama equipment wajib diisi'),
  body('category').trim().notEmpty().withMessage('Kategori wajib diisi'),
  body('description').optional().trim(),
  body('unit').optional().trim(),
  body('is_active').optional().isBoolean().withMessage('is_active harus boolean')
];

// Get all Equipment
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, equipment_code, equipment_name, category,
             description, unit, is_active,
             created_at, updated_at
      FROM equipment_master
      ORDER BY equipment_name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ message: 'Error fetching equipment' });
  }
});

// Get Equipment by ID
router.get('/:id', 
  param('id').isInt().withMessage('Invalid equipment ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await pool.query(
        `SELECT id, equipment_code, equipment_name, category,
                description, unit, is_active,
                created_at, updated_at
         FROM equipment_master
         WHERE id = $1`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Equipment tidak ditemukan' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      res.status(500).json({ message: 'Error fetching equipment' });
    }
  }
);

// Create new Equipment
router.post('/', validateEquipment, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { equipment_code, equipment_name, category, description, unit, is_active } = req.body;

  try {
    // Check if equipment code already exists
    const existingEquipment = await pool.query(
      'SELECT id FROM equipment_master WHERE equipment_code = $1',
      [equipment_code]
    );

    if (existingEquipment.rows.length > 0) {
      return res.status(400).json({ message: 'Kode equipment sudah digunakan' });
    }

    const result = await pool.query(
      `INSERT INTO equipment_master (equipment_code, equipment_name, category, description, unit, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [equipment_code, equipment_name, category, description || null, unit || 'pcs', is_active !== undefined ? is_active : true]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ message: 'Error creating equipment' });
  }
});

// Update Equipment
router.put('/:id', 
  param('id').isInt().withMessage('Invalid equipment ID'),
  validateEquipment,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { equipment_code, equipment_name, category, description, unit, is_active } = req.body;

    try {
      // Check if equipment exists
      const equipmentCheck = await pool.query('SELECT id FROM equipment_master WHERE id = $1', [req.params.id]);
      if (equipmentCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Equipment tidak ditemukan' });
      }

      // Check if new code conflicts with existing equipment (excluding current equipment)
      const codeCheck = await pool.query(
        'SELECT id FROM equipment_master WHERE equipment_code = $1 AND id != $2',
        [equipment_code, req.params.id]
      );

      if (codeCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Kode equipment sudah digunakan' });
      }

      const result = await pool.query(
        `UPDATE equipment_master 
         SET equipment_code = $1, equipment_name = $2, category = $3,
             description = $4, unit = $5, is_active = $6,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [equipment_code, equipment_name, category, description, unit || 'pcs', is_active !== undefined ? is_active : true, req.params.id]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating equipment:', error);
      res.status(500).json({ message: 'Error updating equipment' });
    }
  }
);

// Delete Equipment
router.delete('/:id',
  param('id').isInt().withMessage('Invalid equipment ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if equipment exists
      const equipmentCheck = await pool.query('SELECT id FROM equipment_master WHERE id = $1', [req.params.id]);
      if (equipmentCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Equipment tidak ditemukan' });
      }

      // Check if equipment is being used in tickets
      const ticketCheck = await pool.query(
        `SELECT COUNT(*) as count FROM tickets 
         WHERE equipment_needed::jsonb @> '[{"equipment_code": $1}]'::jsonb`,
        [(await pool.query('SELECT equipment_code FROM equipment_master WHERE id = $1', [req.params.id])).rows[0].equipment_code]
      );

      if (parseInt(ticketCheck.rows[0].count) > 0) {
        return res.status(400).json({ 
          message: 'Equipment tidak dapat dihapus karena masih digunakan dalam ticket' 
        });
      }

      await pool.query('DELETE FROM equipment_master WHERE id = $1', [req.params.id]);

      res.json({ message: 'Equipment berhasil dihapus' });
    } catch (error) {
      console.error('Error deleting equipment:', error);
      res.status(500).json({ message: 'Error deleting equipment' });
    }
  }
);

module.exports = router;

