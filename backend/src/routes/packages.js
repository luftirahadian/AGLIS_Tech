const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

// Get all packages
router.get('/', async (req, res) => {
  try {
    const { type, search, sort_by, sort_order, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT id, package_name as name, package_type as type, 
             bandwidth_down as speed_mbps, monthly_price as price, 
             description, is_active, created_at, updated_at
      FROM packages_master
      WHERE is_active = true
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 0;
    
    if (type && type !== 'all') {
      paramCount++;
      conditions.push(`package_type = $${paramCount}`);
      params.push(type);
    }
    
    if (search) {
      paramCount++;
      conditions.push(`(package_name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }
    
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }
    
    // Sorting
    const allowedSortColumns = {
      'name': 'package_name',
      'type': 'package_type',
      'speed_mbps': 'bandwidth_down',
      'price': 'monthly_price'
    };
    
    const sortColumn = allowedSortColumns[sort_by] || 'package_type, bandwidth_down';
    const sortDirection = sort_order === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortColumn} ${sortDirection}`;
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM packages_master WHERE is_active = true`;
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
    console.error('Error fetching packages:', error);
    res.status(500).json({ message: 'Error fetching packages' });
  }
});

// Get package by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT id, package_name as name, package_type as type, 
              bandwidth_down as speed_mbps, monthly_price as price, 
              description, created_at, updated_at
       FROM packages_master WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({ message: 'Error fetching package' });
  }
});

// Create package
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('type').isIn(['broadband', 'dedicated', 'corporate']).withMessage('Invalid package type'),
    body('speed_mbps').isInt({ min: 1 }).withMessage('Speed must be at least 1 Mbps'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be 0 or greater'),
    body('description').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, type, speed_mbps, price, description } = req.body;

      // Check if package name already exists
      const existingPackage = await pool.query(
        'SELECT id FROM packages_master WHERE LOWER(package_name) = LOWER($1)',
        [name]
      );

      if (existingPackage.rows.length > 0) {
        return res.status(400).json({ message: 'Package name already exists' });
      }

      const result = await pool.query(
        `INSERT INTO packages_master (package_name, package_type, bandwidth_up, bandwidth_down, monthly_price, description)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, package_name as name, package_type as type, bandwidth_down as speed_mbps, monthly_price as price, description, created_at, updated_at`,
        [name, type, speed_mbps, speed_mbps, price, description || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating package:', error);
      res.status(500).json({ message: 'Error creating package' });
    }
  }
);

// Update package
router.put(
  '/:id',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('type').isIn(['broadband', 'dedicated', 'corporate']).withMessage('Invalid package type'),
    body('speed_mbps').isInt({ min: 1 }).withMessage('Speed must be at least 1 Mbps'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be 0 or greater'),
    body('description').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { name, type, speed_mbps, price, description } = req.body;

      // Check if package exists
      const packageExists = await pool.query(
        'SELECT id FROM packages_master WHERE id = $1',
        [id]
      );

      if (packageExists.rows.length === 0) {
        return res.status(404).json({ message: 'Package not found' });
      }

      // Check if new name conflicts with another package
      const nameConflict = await pool.query(
        'SELECT id FROM packages_master WHERE LOWER(package_name) = LOWER($1) AND id != $2',
        [name, id]
      );

      if (nameConflict.rows.length > 0) {
        return res.status(400).json({ message: 'Package name already exists' });
      }

      const result = await pool.query(
        `UPDATE packages_master 
         SET package_name = $1, package_type = $2, bandwidth_up = $3, bandwidth_down = $4, 
             monthly_price = $5, description = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING id, package_name as name, package_type as type, bandwidth_down as speed_mbps, monthly_price as price, description, created_at, updated_at`,
        [name, type, speed_mbps, speed_mbps, price, description || null, id]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating package:', error);
      res.status(500).json({ message: 'Error updating package' });
    }
  }
);

// Delete package
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if package is being used by any customers
    const customerCount = await pool.query(
      'SELECT COUNT(*) as count FROM customers WHERE package_id = $1',
      [id]
    );

    if (parseInt(customerCount.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete package. It is being used by customers.' 
      });
    }

    // Instead of deleting, set is_active to false (soft delete)
    const result = await pool.query(
      'UPDATE packages_master SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ message: 'Error deleting package' });
  }
});

module.exports = router;
