const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

const router = express.Router();

// Get all packages
router.get('/', async (req, res) => {
  try {
    const { package_type, is_active = 'true' } = req.query;

    let query = 'SELECT * FROM packages_master WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (package_type) {
      paramCount++;
      query += ` AND package_type = $${paramCount}`;
      params.push(package_type);
    }

    if (is_active !== 'all') {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }

    query += ' ORDER BY package_type, monthly_price';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: { packages: result.rows }
    });

  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get package by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT p.*, 
             COUNT(c.id) as customer_count
      FROM packages_master p
      LEFT JOIN customers c ON p.id = c.package_id
      WHERE p.id = $1
      GROUP BY p.id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.json({
      success: true,
      data: { package: result.rows[0] }
    });

  } catch (error) {
    console.error('Get package error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new package
router.post('/', [
  body('package_name').notEmpty().withMessage('Package name is required'),
  body('package_type').isIn(['broadband', 'dedicated', 'corporate', 'mitra']).withMessage('Invalid package type'),
  body('bandwidth_up').isInt({ min: 1 }).withMessage('Upload bandwidth must be a positive integer'),
  body('bandwidth_down').isInt({ min: 1 }).withMessage('Download bandwidth must be a positive integer'),
  body('monthly_price').isFloat({ min: 0 }).withMessage('Monthly price must be a positive number'),
  body('setup_fee').optional().isFloat({ min: 0 }).withMessage('Setup fee must be a positive number'),
  body('sla_level').optional().isIn(['bronze', 'silver', 'gold']).withMessage('Invalid SLA level')
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
      package_name, package_type, bandwidth_up, bandwidth_down,
      monthly_price, setup_fee, sla_level, description
    } = req.body;

    const query = `
      INSERT INTO packages_master (
        package_name, package_type, bandwidth_up, bandwidth_down,
        monthly_price, setup_fee, sla_level, description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      package_name, package_type, bandwidth_up, bandwidth_down,
      monthly_price, setup_fee || 0, sla_level || 'silver', description
    ]);

    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: { package: result.rows[0] }
    });

  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update package
router.put('/:id', [
  body('package_name').optional().notEmpty().withMessage('Package name cannot be empty'),
  body('package_type').optional().isIn(['broadband', 'dedicated', 'corporate', 'mitra']).withMessage('Invalid package type'),
  body('bandwidth_up').optional().isInt({ min: 1 }).withMessage('Upload bandwidth must be a positive integer'),
  body('bandwidth_down').optional().isInt({ min: 1 }).withMessage('Download bandwidth must be a positive integer'),
  body('monthly_price').optional().isFloat({ min: 0 }).withMessage('Monthly price must be a positive number'),
  body('setup_fee').optional().isFloat({ min: 0 }).withMessage('Setup fee must be a positive number'),
  body('sla_level').optional().isIn(['bronze', 'silver', 'gold']).withMessage('Invalid SLA level')
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

    const { id } = req.params;
    const updateData = req.body;

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 0;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        paramCount++;
        updates.push(`${key} = $${paramCount}`);
        params.push(updateData[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    paramCount++;
    params.push(id);

    const query = `
      UPDATE packages_master 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.json({
      success: true,
      message: 'Package updated successfully',
      data: { package: result.rows[0] }
    });

  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Toggle package active status
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE packages_master 
      SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.json({
      success: true,
      message: `Package ${result.rows[0].is_active ? 'activated' : 'deactivated'} successfully`,
      data: { package: result.rows[0] }
    });

  } catch (error) {
    console.error('Toggle package status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete package (only if no customers are using it)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any customers are using this package
    const customerCheck = await pool.query(
      'SELECT COUNT(*) FROM customers WHERE package_id = $1',
      [id]
    );

    if (parseInt(customerCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete package that is being used by customers'
      });
    }

    const result = await pool.query(
      'DELETE FROM packages_master WHERE id = $1 RETURNING package_name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.json({
      success: true,
      message: 'Package deleted successfully'
    });

  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get package statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const query = `
      SELECT 
        pm.package_type,
        COUNT(pm.id) as total_packages,
        COUNT(CASE WHEN pm.is_active THEN 1 END) as active_packages,
        COUNT(c.id) as total_customers,
        AVG(pm.monthly_price) as avg_price,
        SUM(CASE WHEN c.id IS NOT NULL THEN pm.monthly_price ELSE 0 END) as total_revenue
      FROM packages_master pm
      LEFT JOIN customers c ON pm.id = c.package_id
      GROUP BY pm.package_type
      ORDER BY pm.package_type
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: { stats: result.rows }
    });

  } catch (error) {
    console.error('Get package stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
