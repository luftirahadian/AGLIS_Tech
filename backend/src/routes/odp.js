const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { body, param, validationResult } = require('express-validator');

// Validation middleware
const validateODP = [
  body('name').trim().notEmpty().withMessage('Nama ODP wajib diisi')
    .isLength({ min: 3 }).withMessage('Nama ODP minimal 3 karakter'),
  body('location').trim().notEmpty().withMessage('Lokasi wajib diisi'),
  body('area').optional().trim(),
  body('latitude').optional().isDecimal().withMessage('Latitude harus berupa angka'),
  body('longitude').optional().isDecimal().withMessage('Longitude harus berupa angka'),
  body('total_ports').isInt({ min: 1 }).withMessage('Total ports minimal 1'),
  body('used_ports').optional().isInt({ min: 0 }).withMessage('Used ports minimal 0'),
  body('status').isIn(['active', 'full', 'maintenance', 'inactive']).withMessage('Status tidak valid'),
  body('notes').optional().trim()
];

// Get all ODPs
router.get('/', async (req, res) => {
  try {
    const { status, area, search, sort_by, sort_order, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT id, name, location, area, latitude, longitude, 
             total_ports, used_ports, status, notes,
             created_at, updated_at
      FROM odp
      WHERE 1=1
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 0;
    
    if (status && status !== 'all') {
      paramCount++;
      conditions.push(`status = $${paramCount}`);
      params.push(status);
    }
    
    if (area && area !== 'all') {
      paramCount++;
      conditions.push(`area = $${paramCount}`);
      params.push(area);
    }
    
    if (search) {
      paramCount++;
      conditions.push(`(name ILIKE $${paramCount} OR location ILIKE $${paramCount} OR area ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }
    
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }
    
    // Sorting
    const allowedSortColumns = {
      'name': 'name',
      'location': 'location',
      'area': 'area',
      'total_ports': 'total_ports',
      'used_ports': 'used_ports',
      'status': 'status'
    };
    
    const sortColumn = allowedSortColumns[sort_by] || 'name';
    const sortDirection = sort_order === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortColumn} ${sortDirection}`;
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM odp WHERE 1=1`;
    if (conditions.length > 0) {
      countQuery += ' AND ' + conditions.join(' AND ');
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
    console.error('Error fetching ODPs:', error);
    res.status(500).json({ message: 'Error fetching ODPs' });
  }
});

// Get ODP by ID
router.get('/:id', 
  param('id').isInt().withMessage('Invalid ODP ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await pool.query(
        `SELECT id, name, location, area, latitude, longitude, 
                total_ports, used_ports, status, notes,
                created_at, updated_at
         FROM odp
         WHERE id = $1`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'ODP tidak ditemukan' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching ODP:', error);
      res.status(500).json({ message: 'Error fetching ODP' });
    }
  }
);

// Create new ODP
router.post('/', validateODP, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, location, area, latitude, longitude, total_ports, used_ports, status, notes } = req.body;

  try {
    // Check if ODP name already exists
    const existingODP = await pool.query(
      'SELECT id FROM odp WHERE name = $1',
      [name]
    );

    if (existingODP.rows.length > 0) {
      return res.status(400).json({ message: 'Nama ODP sudah digunakan' });
    }

    // Validate used_ports doesn't exceed total_ports
    if (used_ports > total_ports) {
      return res.status(400).json({ message: 'Used ports tidak boleh melebihi total ports' });
    }

    const result = await pool.query(
      `INSERT INTO odp (name, location, area, latitude, longitude, total_ports, used_ports, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, location, area, latitude || null, longitude || null, total_ports, used_ports || 0, status, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating ODP:', error);
    res.status(500).json({ message: 'Error creating ODP' });
  }
});

// Update ODP
router.put('/:id', 
  param('id').isInt().withMessage('Invalid ODP ID'),
  validateODP,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, location, area, latitude, longitude, total_ports, used_ports, status, notes } = req.body;

    try {
      // Check if ODP exists
      const odpCheck = await pool.query('SELECT id FROM odp WHERE id = $1', [req.params.id]);
      if (odpCheck.rows.length === 0) {
        return res.status(404).json({ message: 'ODP tidak ditemukan' });
      }

      // Check if new name conflicts with existing ODP (excluding current ODP)
      const nameCheck = await pool.query(
        'SELECT id FROM odp WHERE name = $1 AND id != $2',
        [name, req.params.id]
      );

      if (nameCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Nama ODP sudah digunakan' });
      }

      // Validate used_ports doesn't exceed total_ports
      if (used_ports > total_ports) {
        return res.status(400).json({ message: 'Used ports tidak boleh melebihi total ports' });
      }

      const result = await pool.query(
        `UPDATE odp 
         SET name = $1, location = $2, area = $3, latitude = $4, longitude = $5,
             total_ports = $6, used_ports = $7, status = $8, notes = $9,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $10
         RETURNING *`,
        [name, location, area, latitude || null, longitude || null, total_ports, used_ports, status, notes, req.params.id]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating ODP:', error);
      res.status(500).json({ message: 'Error updating ODP' });
    }
  }
);

// Delete ODP
router.delete('/:id',
  param('id').isInt().withMessage('Invalid ODP ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if ODP exists
      const odpCheck = await pool.query('SELECT id FROM odp WHERE id = $1', [req.params.id]);
      if (odpCheck.rows.length === 0) {
        return res.status(404).json({ message: 'ODP tidak ditemukan' });
      }

      // Check if ODP is being used by customers
      const customerCheck = await pool.query(
        'SELECT COUNT(*) as count FROM customers WHERE odp_location = (SELECT name FROM odp WHERE id = $1)',
        [req.params.id]
      );

      if (parseInt(customerCheck.rows[0].count) > 0) {
        return res.status(400).json({ 
          message: 'ODP tidak dapat dihapus karena masih digunakan oleh customer' 
        });
      }

      await pool.query('DELETE FROM odp WHERE id = $1', [req.params.id]);

      res.json({ message: 'ODP berhasil dihapus' });
    } catch (error) {
      console.error('Error deleting ODP:', error);
      res.status(500).json({ message: 'Error deleting ODP' });
    }
  }
);

module.exports = router;

