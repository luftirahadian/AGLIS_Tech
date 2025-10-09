const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const { page, limit, category, search, low_stock } = req.query;

    let query = `
      SELECT id, item_code, name, description, category, unit, unit_price,
             minimum_stock, current_stock, location, supplier, is_active,
             created_at, updated_at,
             CASE WHEN current_stock <= minimum_stock THEN true ELSE false END as is_low_stock
      FROM inventory_items
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR item_code ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (low_stock === 'true') {
      query += ` AND current_stock <= minimum_stock`;
    }

    query += ` ORDER BY name`;
    
    // Only add pagination if page and limit are provided
    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);
    }

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM inventory_items WHERE is_active = true';
    const countParams = [];
    let countParamCount = 0;

    if (category) {
      countParamCount++;
      countQuery += ` AND category = $${countParamCount}`;
      countParams.push(category);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR item_code ILIKE $${countParamCount} OR description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (low_stock === 'true') {
      countQuery += ` AND current_stock <= minimum_stock`;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        items: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get inventory item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT i.*,
             CASE WHEN i.current_stock <= i.minimum_stock THEN true ELSE false END as is_low_stock
      FROM inventory_items i
      WHERE i.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Get recent transactions
    const transactionsQuery = `
      SELECT t.*, u.full_name as created_by_name, tech.employee_id
      FROM inventory_transactions t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN technicians tech ON t.technician_id = tech.id
      WHERE t.item_id = $1
      ORDER BY t.transaction_date DESC
      LIMIT 10
    `;

    const transactionsResult = await pool.query(transactionsQuery, [id]);

    const item = {
      ...result.rows[0],
      recent_transactions: transactionsResult.rows
    };

    res.json({
      success: true,
      data: { item }
    });

  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new inventory item (admin/supervisor only)
router.post('/', [
  authorize('admin', 'supervisor'),
  body('item_code').notEmpty().withMessage('Item code is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('unit').notEmpty().withMessage('Unit is required'),
  body('unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  body('minimum_stock').isInt({ min: 0 }).withMessage('Minimum stock must be a non-negative integer'),
  body('current_stock').isInt({ min: 0 }).withMessage('Current stock must be a non-negative integer')
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
      item_code, name, description, category, unit, 
      unit_price, minimum_stock, current_stock, location, supplier 
    } = req.body;

    const query = `
      INSERT INTO inventory_items (item_code, name, description, category, unit, 
                                 unit_price, minimum_stock, current_stock, location, supplier)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await pool.query(query, [
      item_code, name, description, category, unit,
      unit_price, minimum_stock, current_stock, location, supplier
    ]);

    // Create initial stock transaction if current_stock > 0
    if (current_stock > 0) {
      await pool.query(
        `INSERT INTO inventory_transactions (item_id, transaction_type, quantity, 
                                           reference_type, notes, created_by)
         VALUES ($1, 'in', $2, 'initial', 'Initial stock', $3)`,
        [result.rows[0].id, current_stock, req.user.id]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: { item: result.rows[0] }
    });

  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update inventory item (admin/supervisor only)
router.put('/:id', [
  authorize('admin', 'supervisor'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('unit').optional().notEmpty().withMessage('Unit cannot be empty'),
  body('unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  body('minimum_stock').optional().isInt({ min: 0 }).withMessage('Minimum stock must be a non-negative integer')
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
    const { 
      name, description, category, unit, unit_price, 
      minimum_stock, location, supplier, is_active 
    } = req.body;

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (name) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }

    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(description);
    }

    if (category) {
      paramCount++;
      updates.push(`category = $${paramCount}`);
      params.push(category);
    }

    if (unit) {
      paramCount++;
      updates.push(`unit = $${paramCount}`);
      params.push(unit);
    }

    if (unit_price !== undefined) {
      paramCount++;
      updates.push(`unit_price = $${paramCount}`);
      params.push(unit_price);
    }

    if (minimum_stock !== undefined) {
      paramCount++;
      updates.push(`minimum_stock = $${paramCount}`);
      params.push(minimum_stock);
    }

    if (location !== undefined) {
      paramCount++;
      updates.push(`location = $${paramCount}`);
      params.push(location);
    }

    if (supplier !== undefined) {
      paramCount++;
      updates.push(`supplier = $${paramCount}`);
      params.push(supplier);
    }

    if (is_active !== undefined) {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
    }

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
      UPDATE inventory_items 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: { item: result.rows[0] }
    });

  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Stock adjustment (admin/supervisor only)
router.post('/:id/adjust-stock', [
  authorize('admin', 'supervisor'),
  body('quantity').isInt().withMessage('Quantity must be an integer'),
  body('notes').notEmpty().withMessage('Notes are required for stock adjustment')
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
    const { quantity, notes } = req.body;

    // Get current item
    const itemResult = await pool.query(
      'SELECT * FROM inventory_items WHERE id = $1',
      [id]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const item = itemResult.rows[0];
    const newStock = item.current_stock + quantity;

    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for this adjustment'
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update stock
      await client.query(
        'UPDATE inventory_items SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newStock, id]
      );

      // Create transaction record
      await client.query(
        `INSERT INTO inventory_transactions (item_id, transaction_type, quantity, 
                                           reference_type, notes, created_by)
         VALUES ($1, 'adjustment', $2, 'adjustment', $3, $4)`,
        [id, quantity, notes, req.user.id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Stock adjusted successfully',
        data: {
          old_stock: item.current_stock,
          new_stock: newStock,
          adjustment: quantity
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Stock adjustment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get inventory transactions
router.get('/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT t.*, u.full_name as created_by_name, tech.employee_id
      FROM inventory_transactions t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN technicians tech ON t.technician_id = tech.id
      WHERE t.item_id = $1
      ORDER BY t.transaction_date DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [id, limit, offset]);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM inventory_transactions WHERE item_id = $1',
      [id]
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        transactions: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get low stock items
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const query = `
      SELECT id, item_code, name, category, current_stock, minimum_stock,
             (minimum_stock - current_stock) as shortage
      FROM inventory_items
      WHERE is_active = true AND current_stock <= minimum_stock
      ORDER BY (minimum_stock - current_stock) DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: { low_stock_items: result.rows }
    });

  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
