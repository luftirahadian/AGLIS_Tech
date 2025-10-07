const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

const router = express.Router();

// Get all customers
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, service_area, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, customer_code, full_name, email, phone, address, 
             service_area, package_type, installation_date, status, 
             coordinates, notes, created_at, updated_at
      FROM customers
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (service_area) {
      paramCount++;
      query += ` AND service_area = $${paramCount}`;
      params.push(service_area);
    }

    if (search) {
      paramCount++;
      query += ` AND (full_name ILIKE $${paramCount} OR customer_code ILIKE $${paramCount} OR phone ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM customers WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (status) {
      countParamCount++;
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
    }

    if (service_area) {
      countParamCount++;
      countQuery += ` AND service_area = $${countParamCount}`;
      countParams.push(service_area);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (full_name ILIKE $${countParamCount} OR customer_code ILIKE $${countParamCount} OR phone ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        customers: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT c.*, 
             COUNT(t.id) as total_tickets,
             COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tickets
      FROM customers c
      LEFT JOIN tickets t ON c.id = t.customer_id
      WHERE c.id = $1
      GROUP BY c.id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: { customer: result.rows[0] }
    });

  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new customer
router.post('/', [
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('service_area').notEmpty().withMessage('Service area is required'),
  body('package_type').notEmpty().withMessage('Package type is required'),
  body('email').optional().isEmail().withMessage('Please provide a valid email')
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
      full_name, email, phone, address, service_area, 
      package_type, coordinates, notes 
    } = req.body;

    // Generate customer code
    const codeResult = await pool.query(
      'SELECT COUNT(*) FROM customers WHERE service_area = $1',
      [service_area]
    );
    const count = parseInt(codeResult.rows[0].count) + 1;
    const customer_code = `${service_area.toUpperCase()}-${count.toString().padStart(4, '0')}`;

    // Parse coordinates if provided
    let coordinatesPoint = null;
    if (coordinates && coordinates.lat && coordinates.lng) {
      coordinatesPoint = `(${coordinates.lng}, ${coordinates.lat})`;
    }

    const query = `
      INSERT INTO customers (customer_code, full_name, email, phone, address, 
                           service_area, package_type, coordinates, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      customer_code, full_name, email, phone, address,
      service_area, package_type, coordinatesPoint, notes
    ]);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: { customer: result.rows[0] }
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update customer
router.put('/:id', [
  body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email')
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
      full_name, email, phone, address, service_area, 
      package_type, status, coordinates, notes, installation_date 
    } = req.body;

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (full_name) {
      paramCount++;
      updates.push(`full_name = $${paramCount}`);
      params.push(full_name);
    }

    if (email !== undefined) {
      paramCount++;
      updates.push(`email = $${paramCount}`);
      params.push(email);
    }

    if (phone) {
      paramCount++;
      updates.push(`phone = $${paramCount}`);
      params.push(phone);
    }

    if (address) {
      paramCount++;
      updates.push(`address = $${paramCount}`);
      params.push(address);
    }

    if (service_area) {
      paramCount++;
      updates.push(`service_area = $${paramCount}`);
      params.push(service_area);
    }

    if (package_type) {
      paramCount++;
      updates.push(`package_type = $${paramCount}`);
      params.push(package_type);
    }

    if (status) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(status);
    }

    if (coordinates) {
      paramCount++;
      const coordinatesPoint = `(${coordinates.lng}, ${coordinates.lat})`;
      updates.push(`coordinates = $${paramCount}`);
      params.push(coordinatesPoint);
    }

    if (notes !== undefined) {
      paramCount++;
      updates.push(`notes = $${paramCount}`);
      params.push(notes);
    }

    if (installation_date) {
      paramCount++;
      updates.push(`installation_date = $${paramCount}`);
      params.push(installation_date);
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
      UPDATE customers 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: { customer: result.rows[0] }
    });

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer has tickets
    const ticketCheck = await pool.query(
      'SELECT COUNT(*) FROM tickets WHERE customer_id = $1',
      [id]
    );

    if (parseInt(ticketCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with existing tickets'
      });
    }

    const result = await pool.query(
      'DELETE FROM customers WHERE id = $1 RETURNING id, customer_code, full_name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
