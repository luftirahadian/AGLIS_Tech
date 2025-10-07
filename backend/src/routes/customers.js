const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const pool = require('../config/database');

const router = express.Router();

// Get all customers with enhanced filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      customer_type, 
      service_type, 
      account_status,
      payment_status,
      package_id 
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, 
             pm.package_name, pm.bandwidth_down, pm.monthly_price,
             COUNT(t.id) as total_tickets
      FROM customers c
      LEFT JOIN packages_master pm ON c.package_id = pm.id
      LEFT JOIN tickets t ON c.id = t.customer_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Search functionality
    if (search) {
      paramCount++;
      query += ` AND (c.name ILIKE $${paramCount} OR c.customer_id ILIKE $${paramCount} OR c.phone ILIKE $${paramCount} OR c.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Filters
    if (customer_type) {
      paramCount++;
      query += ` AND c.customer_type = $${paramCount}`;
      params.push(customer_type);
    }

    if (service_type) {
      paramCount++;
      query += ` AND c.service_type = $${paramCount}`;
      params.push(service_type);
    }

    if (account_status) {
      paramCount++;
      query += ` AND c.account_status = $${paramCount}`;
      params.push(account_status);
    }

    if (payment_status) {
      paramCount++;
      query += ` AND c.payment_status = $${paramCount}`;
      params.push(payment_status);
    }

    if (package_id) {
      paramCount++;
      query += ` AND c.package_id = $${paramCount}`;
      params.push(package_id);
    }

    query += ` GROUP BY c.id, pm.package_name, pm.bandwidth_down, pm.monthly_price`;
    query += ` ORDER BY c.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT c.id) 
      FROM customers c
      LEFT JOIN packages_master pm ON c.package_id = pm.id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (c.name ILIKE $${countParamCount} OR c.customer_id ILIKE $${countParamCount} OR c.phone ILIKE $${countParamCount} OR c.email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (customer_type) {
      countParamCount++;
      countQuery += ` AND c.customer_type = $${countParamCount}`;
      countParams.push(customer_type);
    }

    if (service_type) {
      countParamCount++;
      countQuery += ` AND c.service_type = $${countParamCount}`;
      countParams.push(service_type);
    }

    if (account_status) {
      countParamCount++;
      countQuery += ` AND c.account_status = $${countParamCount}`;
      countParams.push(account_status);
    }

    if (payment_status) {
      countParamCount++;
      countQuery += ` AND c.payment_status = $${countParamCount}`;
      countParams.push(payment_status);
    }

    if (package_id) {
      countParamCount++;
      countQuery += ` AND c.package_id = $${countParamCount}`;
      countParams.push(package_id);
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

// Get customer by ID with full details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get customer with package details
    const customerQuery = `
      SELECT c.*, 
             pm.package_name, pm.package_type as package_category, 
             pm.bandwidth_up, pm.bandwidth_down, pm.monthly_price,
             pm.sla_level, pm.description as package_description
      FROM customers c
      LEFT JOIN packages_master pm ON c.package_id = pm.id
      WHERE c.id = $1
    `;

    const customerResult = await pool.query(customerQuery, [id]);

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const customer = customerResult.rows[0];

    // Get customer equipment
    const equipmentQuery = `
      SELECT * FROM customer_equipment 
      WHERE customer_id = $1 AND status = 'active'
      ORDER BY installation_date DESC
    `;
    const equipmentResult = await pool.query(equipmentQuery, [id]);

    // Get recent payments
    const paymentsQuery = `
      SELECT * FROM customer_payments 
      WHERE customer_id = $1 
      ORDER BY payment_date DESC 
      LIMIT 5
    `;
    const paymentsResult = await pool.query(paymentsQuery, [id]);

    // Get service history
    const serviceQuery = `
      SELECT csh.*
      FROM customer_service_history csh
      WHERE csh.customer_id = $1 
      ORDER BY csh.service_date DESC 
      LIMIT 10
    `;
    const serviceResult = await pool.query(serviceQuery, [id]);

    // Get active complaints
    const complaintsQuery = `
      SELECT * FROM customer_complaints 
      WHERE customer_id = $1 AND status IN ('open', 'in_progress')
      ORDER BY complaint_date DESC
    `;
    const complaintsResult = await pool.query(complaintsQuery, [id]);

    // Get ticket statistics
    const ticketStatsQuery = `
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tickets,
        COUNT(CASE WHEN status IN ('open', 'in_progress') THEN 1 END) as active_tickets,
        AVG(CASE WHEN status = 'completed' THEN 
          EXTRACT(EPOCH FROM (updated_at - created_at))/3600 
        END) as avg_resolution_hours
      FROM tickets 
      WHERE customer_id = $1
    `;
    const ticketStatsResult = await pool.query(ticketStatsQuery, [id]);

    res.json({
      success: true,
      data: {
        customer,
        equipment: equipmentResult.rows,
        recent_payments: paymentsResult.rows,
        service_history: serviceResult.rows,
        active_complaints: complaintsResult.rows,
        ticket_stats: ticketStatsResult.rows[0]
      }
    });

  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new customer with comprehensive data
router.post('/', [
  body('customer_id').notEmpty().withMessage('Customer ID is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('package_id').isInt().withMessage('Package ID must be a valid integer'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('ktp').optional().isLength({ min: 16, max: 16 }).withMessage('KTP must be 16 digits'),
  body('latitude').optional().isFloat().withMessage('Latitude must be a valid number'),
  body('longitude').optional().isFloat().withMessage('Longitude must be a valid number')
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
      customer_id, name, ktp, phone, phone_alt, email, address, 
      latitude, longitude, odp, pic_name, pic_position, pic_phone,
      business_type, operating_hours, customer_type, payment_type,
      service_type, package_id, subscription_start_date, billing_cycle,
      ip_address, ip_type, notes
    } = req.body;

    // Check if customer_id already exists
    const existingCustomer = await pool.query(
      'SELECT id FROM customers WHERE customer_id = $1',
      [customer_id]
    );

    if (existingCustomer.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID already exists'
      });
    }

    // Verify package exists
    const packageCheck = await pool.query(
      'SELECT id FROM packages_master WHERE id = $1 AND is_active = true',
      [package_id]
    );

    if (packageCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive package selected'
      });
    }

    // Generate username and password (same as customer_id)
    const username = customer_id;
    const password = customer_id;
    const client_area_password = customer_id;
    
    // Hash passwords
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedClientPassword = await bcrypt.hash(client_area_password, 10);

    // Calculate due date (30 days from subscription start)
    const startDate = subscription_start_date || new Date();
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const query = `
      INSERT INTO customers (
        customer_id, name, ktp, phone, phone_alt, email, address,
        latitude, longitude, odp, pic_name, pic_position, pic_phone,
        business_type, operating_hours, username, password, client_area_password,
        customer_type, payment_type, service_type, package_id,
        subscription_start_date, billing_cycle, due_date, ip_address, ip_type,
        notes, registration_date
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
      )
      RETURNING *
    `;

    const result = await pool.query(query, [
      customer_id, name, ktp, phone, phone_alt, email, address,
      latitude, longitude, odp, pic_name, pic_position, pic_phone,
      business_type, operating_hours, username, hashedPassword, hashedClientPassword,
      customer_type || 'regular', payment_type || 'postpaid', service_type || 'broadband',
      package_id, startDate, billing_cycle || 'monthly', dueDate, ip_address, ip_type || 'dynamic',
      notes, new Date()
    ]);

    // Remove sensitive data from response
    const customerData = { ...result.rows[0] };
    delete customerData.password;
    delete customerData.client_area_password;

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: { 
        customer: customerData,
        credentials: {
          username: username,
          password: password, // In production, this should be sent via secure channel
          client_area_password: client_area_password
        }
      }
    });

  } catch (error) {
    console.error('Create customer error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Customer ID or username already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update customer
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('package_id').optional().isInt().withMessage('Package ID must be a valid integer'),
  body('latitude').optional().isFloat().withMessage('Latitude must be a valid number'),
  body('longitude').optional().isFloat().withMessage('Longitude must be a valid number')
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

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.customer_id;
    delete updateData.username;
    delete updateData.password;
    delete updateData.client_area_password;

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

    // Remove sensitive data from response
    const customerData = { ...result.rows[0] };
    delete customerData.password;
    delete customerData.client_area_password;

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: { customer: customerData }
    });

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get packages master for dropdown
router.get('/packages/list', async (req, res) => {
  try {
    const query = `
      SELECT id, package_name, package_type, bandwidth_down, monthly_price, sla_level
      FROM packages_master 
      WHERE is_active = true 
      ORDER BY package_type, monthly_price
    `;

    const result = await pool.query(query);

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

// Add customer equipment
router.post('/:id/equipment', [
  body('equipment_type').notEmpty().withMessage('Equipment type is required'),
  body('brand').optional().notEmpty().withMessage('Brand cannot be empty'),
  body('model').optional().notEmpty().withMessage('Model cannot be empty')
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
    const { equipment_type, brand, model, serial_number, mac_address, warranty_expiry, notes } = req.body;

    // Verify customer exists
    const customerCheck = await pool.query('SELECT id FROM customers WHERE id = $1', [id]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const query = `
      INSERT INTO customer_equipment (
        customer_id, equipment_type, brand, model, serial_number, 
        mac_address, installation_date, warranty_expiry, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      id, equipment_type, brand, model, serial_number,
      mac_address, new Date(), warranty_expiry, notes
    ]);

    res.status(201).json({
      success: true,
      message: 'Equipment added successfully',
      data: { equipment: result.rows[0] }
    });

  } catch (error) {
    console.error('Add equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add customer payment
router.post('/:id/payments', [
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('payment_method').notEmpty().withMessage('Payment method is required'),
  body('billing_period_start').isISO8601().withMessage('Valid billing period start date is required'),
  body('billing_period_end').isISO8601().withMessage('Valid billing period end date is required')
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
      amount, payment_method, payment_reference, 
      billing_period_start, billing_period_end, notes 
    } = req.body;

    // Verify customer exists
    const customerCheck = await pool.query('SELECT id FROM customers WHERE id = $1', [id]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Generate invoice number
    const invoiceResult = await pool.query(
      'SELECT COUNT(*) FROM customer_payments WHERE EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)'
    );
    const count = parseInt(invoiceResult.rows[0].count) + 1;
    const year = new Date().getFullYear();
    const invoice_number = `INV-${year}-${count.toString().padStart(6, '0')}`;

    const query = `
      INSERT INTO customer_payments (
        customer_id, invoice_number, payment_date, amount, payment_method,
        payment_reference, billing_period_start, billing_period_end, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await pool.query(query, [
      id, invoice_number, new Date(), amount, payment_method,
      payment_reference, billing_period_start, billing_period_end, notes, req.user?.id
    ]);

    // Update customer's last payment date and outstanding balance
    await pool.query(`
      UPDATE customers 
      SET last_payment_date = $1, 
          outstanding_balance = GREATEST(outstanding_balance - $2, 0),
          payment_status = CASE 
            WHEN outstanding_balance - $2 <= 0 THEN 'paid' 
            ELSE payment_status 
          END
      WHERE id = $3
    `, [new Date(), amount, id]);

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: { payment: result.rows[0] }
    });

  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete customer (soft delete by deactivating)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer has active tickets
    const ticketCheck = await pool.query(
      'SELECT COUNT(*) FROM tickets WHERE customer_id = $1 AND status IN (\'open\', \'in_progress\')',
      [id]
    );

    if (parseInt(ticketCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with active tickets'
      });
    }

    // Soft delete by setting account status to inactive
    const result = await pool.query(
      'UPDATE customers SET account_status = \'inactive\', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING customer_id, name',
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
      message: 'Customer deactivated successfully'
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