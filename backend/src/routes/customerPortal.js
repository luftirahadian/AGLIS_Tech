const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const whatsappService = require('../services/whatsappService');
const { body, validationResult } = require('express-validator');

/**
 * Customer Portal Routes
 * 
 * Self-service portal for customers
 * Login via OTP, view invoices, submit tickets, track installations
 */

// Customer authentication middleware
const customerAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify this is a customer token
    if (decoded.type !== 'customer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type.'
      });
    }

    // Get customer from database
    const result = await pool.query(
      'SELECT id, customer_id, name, email, phone, account_status, portal_active FROM customers WHERE id = $1',
      [decoded.customerId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Customer not found.'
      });
    }

    const customer = result.rows[0];
    
    if (!customer.portal_active) {
      return res.status(401).json({
        success: false,
        message: 'Portal access is disabled.'
      });
    }

    req.customer = customer;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }

    console.error('Customer auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Request OTP for customer login
router.post('/request-otp', [
  body('phone').isMobilePhone('id-ID').withMessage('Invalid phone number'),
  body('customer_id').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { phone, customer_id } = req.body;

    // Find customer by phone or customer_id
    let query = 'SELECT id, customer_id, name, email, phone FROM customers WHERE ';
    let params = [];
    
    if (customer_id) {
      query += 'customer_id = $1';
      params = [customer_id];
    } else {
      query += 'phone = $1';
      params = [phone];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer tidak ditemukan. Silakan hubungi customer service.'
      });
    }

    const customer = result.rows[0];

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const expiryMinutes = 10;

    // Store OTP in Redis (or database)
    await whatsappService.storeOTP(customer.phone, otp, expiryMinutes, 'customer_login');

    // Send OTP via WhatsApp
    const message = `🔑 *KODE LOGIN CUSTOMER PORTAL*

Hi ${customer.name},

Kode login Anda: *${otp}*

⏰ Berlaku: ${expiryMinutes} menit
🌐 Portal: ${process.env.FRONTEND_URL}/customer/login

*JANGAN BERIKAN kode ini kepada siapapun!*

AGLIS Net - Secure Access 🔐`;

    await whatsappService.sendMessage(customer.phone, message);

    res.json({
      success: true,
      message: 'OTP telah dikirim ke WhatsApp Anda',
      data: {
        phone: customer.phone.replace(/(\d{4})\d+(\d{3})/, '$1****$2'), // Masked
        expiresIn: `${expiryMinutes} menit`
      }
    });

  } catch (error) {
    console.error('❌ [CUSTOMER PORTAL] Request OTP error:', error);
    console.error('❌ [CUSTOMER PORTAL] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Gagal mengirim OTP. Silakan coba lagi.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify OTP and login
router.post('/verify-otp', [
  body('phone').isMobilePhone('id-ID').withMessage('Invalid phone number'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { phone, otp } = req.body;

    console.log(`🔐 [CUSTOMER PORTAL] Verify OTP attempt - Phone: ${phone}, OTP: ${otp.substring(0, 2)}****`);

    // Verify OTP
    const verifyResult = await whatsappService.verifyOTP(phone, otp);

    console.log(`🔐 [CUSTOMER PORTAL] Verify result:`, verifyResult);

    if (!verifyResult.success) {
      return res.status(401).json({
        success: false,
        message: verifyResult.error || 'Kode OTP salah atau sudah expired.',
        attemptsLeft: verifyResult.attemptsLeft
      });
    }

    // Get customer
    const result = await pool.query(
      'SELECT id, customer_id, name, email, phone, account_status FROM customers WHERE phone = $1',
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer tidak ditemukan.'
      });
    }

    const customer = result.rows[0];

    // Update last login
    await pool.query(
      'UPDATE customers SET last_login_at = NOW() WHERE id = $1',
      [customer.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        customerId: customer.id,
        customerCode: customer.customer_id,
        type: 'customer'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Customer token valid for 7 days
    );

    // Create session record
    await pool.query(
      `INSERT INTO customer_sessions (customer_id, session_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
      [customer.id, token, req.ip, req.headers['user-agent']]
    );

    res.json({
      success: true,
      message: 'Login berhasil!',
      data: {
        customer: {
          id: customer.id,
          customer_id: customer.customer_id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          account_status: customer.account_status
        },
        token
      }
    });

  } catch (error) {
    console.error('❌ [CUSTOMER PORTAL] Verify OTP error:', error);
    console.error('❌ [CUSTOMER PORTAL] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Login gagal. Silakan coba lagi.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get customer profile
router.get('/profile', customerAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.*,
        pm.package_name,
        pm.bandwidth_down,
        pm.bandwidth_up,
        pm.monthly_price,
        st.type_name as service_type_name
      FROM customers c
      LEFT JOIN packages_master pm ON c.package_id = pm.id
      LEFT JOIN service_types st ON c.service_type = st.type_code
      WHERE c.id = $1`,
      [req.customer.id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data profil.'
    });
  }
});

// Update customer profile
router.put('/profile', customerAuth, [
  body('email').optional().isEmail(),
  body('phone').optional().isMobilePhone('id-ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, phone, address, city, province } = req.body;
    
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (email) {
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

    if (city) {
      paramCount++;
      updates.push(`city = $${paramCount}`);
      params.push(city);
    }

    if (province) {
      paramCount++;
      updates.push(`province = $${paramCount}`);
      params.push(province);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    paramCount++;
    updates.push(`updated_at = $${paramCount}`);
    params.push(new Date());

    paramCount++;
    params.push(req.customer.id);

    const query = `
      UPDATE customers
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui profil.'
    });
  }
});

// Get customer tickets
router.get('/tickets', customerAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        t.*,
        tech.full_name as technician_name,
        tech.phone as technician_phone
      FROM tickets t
      LEFT JOIN technicians tech ON t.assigned_technician_id = tech.id
      WHERE t.customer_id = $1
    `;
    const params = [req.customer.id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM tickets WHERE customer_id = $1' + (status ? ' AND status = $2' : ''),
      status ? [req.customer.id, status] : [req.customer.id]
    );

    res.json({
      success: true,
      data: {
        tickets: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data tiket.'
    });
  }
});

// Get customer invoices
router.get('/invoices', customerAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT *
      FROM invoices
      WHERE customer_id = $1
    `;
    const params = [req.customer.id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY invoice_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM invoices WHERE customer_id = $1' + (status ? ' AND status = $2' : ''),
      status ? [req.customer.id, status] : [req.customer.id]
    );

    res.json({
      success: true,
      data: {
        invoices: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data invoice.'
    });
  }
});

// Submit new ticket (customer)
router.post('/tickets', customerAuth, [
  body('type').isIn(['repair', 'upgrade', 'dismantle']).withMessage('Invalid ticket type'),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('priority').optional().isIn(['low', 'normal', 'high']).withMessage('Invalid priority')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { type, title, description, priority = 'normal' } = req.body;

    // Generate ticket number
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const dateResult = await client.query('SELECT CURRENT_DATE as today');
      const today = dateResult.rows[0].today.toISOString().slice(0, 10).replace(/-/g, '');
      
      const lockId = parseInt(today) % 2147483647;
      await client.query('SELECT pg_advisory_xact_lock($1)', [lockId]);
      
      const countResult = await client.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 12) AS INTEGER)), 0) as max_num
         FROM tickets 
         WHERE ticket_number LIKE 'TKT' || $1 || '%'`,
        [today]
      );
      const dailyCount = parseInt(countResult.rows[0].max_num) + 1;
      const ticket_number = `TKT${today}${dailyCount.toString().padStart(3, '0')}`;

      // Calculate SLA
      const slaHours = { 'high': 4, 'normal': 24, 'low': 48 };
      const sla_due_date = new Date();
      sla_due_date.setHours(sla_due_date.getHours() + slaHours[priority]);

      // Insert ticket
      const ticketResult = await client.query(
        `INSERT INTO tickets (ticket_number, customer_id, type, priority, title, description, sla_due_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
         RETURNING *`,
        [ticket_number, req.customer.id, type, priority, title, description, sla_due_date]
      );

      // Insert status history
      await client.query(
        'INSERT INTO ticket_status_history (ticket_id, new_status, changed_by) VALUES ($1, $2, $3)',
        [ticketResult.rows[0].id, 'open', req.customer.id]
      );

      await client.query('COMMIT');

      const ticket = ticketResult.rows[0];

      // Send confirmation via WhatsApp
      const confirmMessage = `✅ *TIKET BERHASIL DIBUAT*

Nomor Tiket: #${ticket.ticket_number}
Jenis: ${type}
Priority: ${priority}

Deskripsi: ${title}

Status: Open - Menunggu penugasan teknisi

Tim kami akan segera memproses tiket Anda.

Track tiket: ${process.env.FRONTEND_URL}/customer/tickets

_AGLIS Net - Fast Response!_ 🚀`;

      whatsappService.sendMessage(req.customer.phone, confirmMessage).catch(err => {
        console.error('Failed to send ticket confirmation:', err);
      });

      res.json({
        success: true,
        message: 'Tiket berhasil dibuat',
        data: ticket
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat tiket.'
    });
  }
});

// Get customer dashboard stats
router.get('/dashboard/stats', customerAuth, async (req, res) => {
  try {
    const stats = await pool.query(
      `SELECT 
        COUNT(CASE WHEN status IN ('open', 'assigned', 'in_progress') THEN 1 END) as active_tickets,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tickets,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_tickets,
        COUNT(*) as total_tickets
      FROM tickets
      WHERE customer_id = $1`,
      [req.customer.id]
    );

    const invoiceStats = await pool.query(
      `SELECT 
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invoices,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices,
        SUM(CASE WHEN status = 'pending' OR status = 'overdue' THEN total_amount ELSE 0 END) as outstanding_amount
      FROM invoices
      WHERE customer_id = $1`,
      [req.customer.id]
    );

    res.json({
      success: true,
      data: {
        tickets: stats.rows[0],
        invoices: invoiceStats.rows[0]
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik.'
    });
  }
});

// Logout
router.post('/logout', customerAuth, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Delete session
    await pool.query(
      'DELETE FROM customer_sessions WHERE session_token = $1',
      [token]
    );

    res.json({
      success: true,
      message: 'Logout berhasil'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout gagal'
    });
  }
});

module.exports = router;
module.exports.customerAuth = customerAuth;

