const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { saveBase64File, getFileUrl } = require('../utils/fileUpload');
const whatsappService = require('../services/whatsappService');

const router = express.Router();

// Helper function to create notification
const createNotification = async (userId, type, title, message, data = null) => {
  try {
    const query = `
      INSERT INTO notifications (user_id, type, title, message, data, priority)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const priority = type.includes('urgent') ? 'high' : 'normal';
    const result = await pool.query(query, [userId, type, title, message, data, priority]);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// PUBLIC ROUTE: Request OTP for WhatsApp verification
router.post('/public/request-otp', [
  body('phone').matches(/^[0-9+\-() ]+$/).withMessage('Valid phone number is required'),
  body('full_name').optional().trim()
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

    const { phone, full_name } = req.body;

    // Validate WhatsApp number
    if (!whatsappService.isValidWhatsAppNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Nomor WhatsApp tidak valid. Pastikan nomor Indonesia yang aktif.'
      });
    }

    // Send OTP via WhatsApp
    const result = await whatsappService.sendAndSaveOTP(phone, full_name);

    if (!result.success && !result.disabled) {
      return res.status(500).json({
        success: false,
        message: 'Gagal mengirim OTP. Silakan coba lagi.'
      });
    }

    res.json({
      success: true,
      message: 'Kode OTP telah dikirim ke WhatsApp Anda',
      data: {
        otp: result.otp // Only in dev mode
      }
    });

  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan'
    });
  }
});

// PUBLIC ROUTE: Verify OTP
router.post('/public/verify-otp', [
  body('phone').matches(/^[0-9+\-() ]+$/).withMessage('Valid phone number is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
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

    const { phone, otp } = req.body;

    const result = await whatsappService.verifyOTP(phone, otp);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
        attemptsLeft: result.attemptsLeft
      });
    }

    res.json({
      success: true,
      message: 'Nomor WhatsApp berhasil diverifikasi'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan'
    });
  }
});

// PUBLIC ROUTE: Submit new customer registration (no auth required)
router.post('/public', [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[0-9+\-() ]+$/).withMessage('Valid phone number is required'),
  body('whatsapp_verified').custom(value => value === true || value === 'true').withMessage('WhatsApp number must be verified'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('package_id').custom(value => !isNaN(parseInt(value))).withMessage('Package selection is required'),
  body('preferred_installation_date').optional().isISO8601().withMessage('Invalid date format'),
  body('id_card_photo').optional().isString()
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

    let {
      full_name, email, phone, id_card_number, id_card_photo,
      address, rt, rw, kelurahan, kecamatan, city, postal_code,
      latitude, longitude, address_notes,
      package_id, preferred_installation_date, preferred_time_slot,
      notes, referral_code, utm_source, utm_medium, utm_campaign
    } = req.body;
    
    // Ensure package_id is integer
    package_id = parseInt(package_id);

    // Check if email or phone already registered
    const existingCheck = await pool.query(
      `SELECT id FROM customer_registrations 
       WHERE (email = $1 OR phone = $2) 
       AND status NOT IN ('rejected', 'cancelled')`,
      [email, phone]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email atau nomor telepon sudah terdaftar'
      });
    }

    // Check if already a customer
    const customerCheck = await pool.query(
      'SELECT id FROM customers WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (customerCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah terdaftar sebagai customer'
      });
    }

    // Verify package exists and is active (broadband only)
    const packageCheck = await pool.query(
      `SELECT id, package_name, package_type, monthly_price 
       FROM packages_master 
       WHERE id = $1 AND is_active = true AND package_type = 'broadband'`,
      [package_id]
    );

    if (packageCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Paket yang dipilih tidak tersedia'
      });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Handle KTP photo upload if provided
      let ktpPhotoPath = null;
      if (id_card_photo && id_card_photo.startsWith('data:image')) {
        ktpPhotoPath = await saveBase64File(id_card_photo, 'registrations');
      }

      // Insert registration
      const insertQuery = `
        INSERT INTO customer_registrations (
          full_name, email, phone, id_card_number, id_card_photo,
          address, rt, rw, kelurahan, kecamatan, city, postal_code,
          latitude, longitude, address_notes,
          service_type, package_id, preferred_installation_date, preferred_time_slot,
          notes, referral_code, utm_source, utm_medium, utm_campaign,
          status
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15,
          'broadband', $16, $17, $18,
          $19, $20, $21, $22, $23,
          'pending_verification'
        ) RETURNING *
      `;

      const result = await client.query(insertQuery, [
        full_name, email, phone, id_card_number, ktpPhotoPath,
        address, rt, rw, kelurahan, kecamatan, city, postal_code,
        latitude, longitude, address_notes,
        package_id, preferred_installation_date, preferred_time_slot,
        notes, referral_code, utm_source, utm_medium, utm_campaign
      ]);

      const registration = result.rows[0];

      await client.query('COMMIT');

      // Get package info for WhatsApp message
      const packageInfo = packageCheck.rows[0];

      // Send WhatsApp confirmation to customer
      const trackingUrl = `${process.env.REGISTRATION_TRACKING_URL || 'http://localhost:3000/track'}/${registration.registration_number}`;
      
      const waResult = await whatsappService.sendRegistrationConfirmation(phone, {
        name: full_name,
        registration_number: registration.registration_number,
        package_name: packageInfo.package_name,
        price: packageInfo.monthly_price,
        tracking_url: trackingUrl
      });

      console.log('📱 WhatsApp confirmation sent:', waResult);

      // Create notifications for admin and supervisors
      const adminQuery = `SELECT id FROM users WHERE role IN ('admin', 'supervisor', 'customer_service')`;
      const admins = await pool.query(adminQuery);
      
      for (const admin of admins.rows) {
        await createNotification(
          admin.id,
          'new_registration',
          'Pendaftaran Customer Baru',
          `${full_name} telah mendaftar sebagai customer baru. Nomor registrasi: ${registration.registration_number}`,
          { registration_id: registration.id, registration_number: registration.registration_number }
        );
      }

      // Emit Socket.IO event for real-time update
      const io = req.app.get('io');
      if (io) {
        io.to('role_admin').to('role_supervisor').to('role_customer_service').emit('new_registration', {
          registration: registration
        });
      }

      res.status(201).json({
        success: true,
        message: 'Pendaftaran berhasil! Kami akan menghubungi Anda segera.',
        data: {
          registration_number: registration.registration_number,
          id: registration.id,
          tracking_url: trackingUrl,
          whatsapp_sent: waResult.success
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Public registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan. Silakan coba lagi.'
    });
  }
});

// PUBLIC ROUTE: Check registration status by registration number or email
router.get('/public/status/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    const query = `
      SELECT 
        r.registration_number,
        r.full_name,
        r.email,
        r.phone,
        r.status,
        r.created_at,
        r.verified_at,
        r.approved_at,
        r.rejection_reason,
        r.survey_scheduled_date,
        r.preferred_installation_date,
        pm.package_name,
        pm.monthly_price
      FROM customer_registrations r
      LEFT JOIN packages_master pm ON r.package_id = pm.id
      WHERE r.registration_number = $1 OR r.email = $1
      ORDER BY r.created_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [identifier]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registrasi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Check status error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan'
    });
  }
});

// ============= PROTECTED ROUTES (Require Authentication) =============

// Get all registrations with filters and pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        r.*,
        pm.package_name,
        pm.package_type,
        pm.monthly_price,
        pm.bandwidth_down,
        v.full_name as verified_by_name,
        a.full_name as approved_by_name
      FROM customer_registrations r
      LEFT JOIN packages_master pm ON r.package_id = pm.id
      LEFT JOIN users v ON r.verified_by = v.id
      LEFT JOIN users a ON r.approved_by = a.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND r.status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      query += ` AND (
        r.full_name ILIKE $${paramCount} OR 
        r.email ILIKE $${paramCount} OR 
        r.phone ILIKE $${paramCount} OR 
        r.registration_number ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    // Validate sort parameters
    const allowedSortColumns = ['created_at', 'updated_at', 'full_name', 'status', 'registration_number'];
    const sortColumn = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = ['ASC', 'DESC'].includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    query += ` ORDER BY r.${sortColumn} ${sortDirection}`;
    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM customer_registrations r WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (status) {
      countParamCount++;
      countQuery += ` AND r.status = $${countParamCount}`;
      countParams.push(status);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (
        r.full_name ILIKE $${countParamCount} OR 
        r.email ILIKE $${countParamCount} OR 
        r.phone ILIKE $${countParamCount} OR 
        r.registration_number ILIKE $${countParamCount}
      )`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        registrations: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get registration statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN status = 'pending_verification' THEN 1 END) as pending_verification,
        COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified,
        COUNT(CASE WHEN status = 'survey_scheduled' THEN 1 END) as survey_scheduled,
        COUNT(CASE WHEN status = 'survey_completed' THEN 1 END) as survey_completed,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_registrations,
        COUNT(CASE WHEN DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_registrations
      FROM customer_registrations
    `;

    const result = await pool.query(statsQuery);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single registration by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        r.*,
        pm.package_name,
        pm.package_type,
        pm.monthly_price,
        pm.bandwidth_down,
        v.full_name as verified_by_name,
        a.full_name as approved_by_name,
        c.customer_id as customer_code,
        c.name as customer_name
      FROM customer_registrations r
      LEFT JOIN packages_master pm ON r.package_id = pm.id
      LEFT JOIN users v ON r.verified_by = v.id
      LEFT JOIN users a ON r.approved_by = a.id
      LEFT JOIN customers c ON r.customer_id = c.id
      WHERE r.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update registration status (verify, approve, reject, etc.)
router.put('/:id/status', authMiddleware, [
  body('status').isIn([
    'pending_verification', 'verified', 'survey_scheduled', 
    'survey_completed', 'approved', 'rejected', 'cancelled'
  ]).withMessage('Invalid status'),
  body('notes').optional().isString()
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
    const { status, notes, rejection_reason, survey_scheduled_date } = req.body;

    // Get current registration
    const currentReg = await pool.query(
      'SELECT * FROM customer_registrations WHERE id = $1',
      [id]
    );

    if (currentReg.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    const registration = currentReg.rows[0];
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let updateQuery = 'UPDATE customer_registrations SET status = $1, updated_at = CURRENT_TIMESTAMP';
      const params = [status];
      let paramCount = 1;

      // Handle different status transitions
      if (status === 'verified') {
        paramCount++;
        updateQuery += `, verified_by = $${paramCount}`;
        params.push(req.user.id);
        
        paramCount++;
        updateQuery += `, verified_at = $${paramCount}`;
        params.push(new Date());
        
        if (notes) {
          paramCount++;
          updateQuery += `, verification_notes = $${paramCount}`;
          params.push(notes);
        }
      }

      if (status === 'approved') {
        paramCount++;
        updateQuery += `, approved_by = $${paramCount}`;
        params.push(req.user.id);
        
        paramCount++;
        updateQuery += `, approved_at = $${paramCount}`;
        params.push(new Date());
        
        if (notes) {
          paramCount++;
          updateQuery += `, approval_notes = $${paramCount}`;
          params.push(notes);
        }
      }

      if (status === 'rejected' && rejection_reason) {
        paramCount++;
        updateQuery += `, rejection_reason = $${paramCount}`;
        params.push(rejection_reason);
      }

      if (status === 'survey_scheduled' && survey_scheduled_date) {
        paramCount++;
        updateQuery += `, survey_scheduled_date = $${paramCount}`;
        params.push(survey_scheduled_date);
        
        // Create survey ticket
        try {
          const dateResult = await client.query('SELECT CURRENT_DATE as today');
          const today = dateResult.rows[0].today.toISOString().slice(0, 10).replace(/-/g, '');
          const countResult = await client.query(
            'SELECT COUNT(*) FROM tickets WHERE DATE(created_at) = CURRENT_DATE'
          );
          const dailyCount = parseInt(countResult.rows[0].count) + 1;
          const ticketNumber = `TKT${today}${dailyCount.toString().padStart(3, '0')}`;
          
          const sla_due_date = new Date(survey_scheduled_date);
          sla_due_date.setHours(sla_due_date.getHours() + 24); // 24 hours SLA
          
          const surveyTicketQuery = `
            INSERT INTO tickets (
              ticket_number, created_by, type, priority, category,
              title, description, scheduled_date, estimated_duration,
              sla_due_date, status
            ) VALUES ($1, $2, 'maintenance', 'normal', 'site_survey', $3, $4, $5, 60, $6, 'open')
            RETURNING *
          `;
          
          const surveyTicketResult = await client.query(surveyTicketQuery, [
            ticketNumber,
            req.user.id,
            `Survey Lokasi - ${registration.full_name}`,
            `Survey lokasi untuk pendaftaran customer baru\n\nRegistration: ${registration.registration_number}\nNama: ${registration.full_name}\nAlamat: ${registration.address}\nTelepon: ${registration.phone}`,
            survey_scheduled_date,
            sla_due_date
          ]);
          
          const surveyTicket = surveyTicketResult.rows[0];
          
          // Update registration with survey ticket ID
          await client.query(
            'UPDATE customer_registrations SET survey_ticket_id = $1 WHERE id = $2',
            [surveyTicket.id, id]
          );
          
          console.log(`📋 Survey ticket created: ${ticketNumber} for registration ${registration.registration_number}`);
        } catch (error) {
          console.error('Error creating survey ticket:', error);
          // Don't fail the whole operation if ticket creation fails
        }
      }

      paramCount++;
      updateQuery += ` WHERE id = $${paramCount} RETURNING *`;
      params.push(id);

      const result = await client.query(updateQuery, params);
      const updatedReg = result.rows[0];

      await client.query('COMMIT');

      // Send WhatsApp notification to customer about status change
      if (['verified', 'survey_scheduled', 'approved', 'rejected'].includes(status)) {
        const waData = {
          name: updatedReg.full_name,
          status: status,
          registration_number: updatedReg.registration_number,
          rejection_reason: rejection_reason
        };

        if (status === 'survey_scheduled' && survey_scheduled_date) {
          waData.survey_date = new Date(survey_scheduled_date).toLocaleString('id-ID');
        }

        const waResult = await whatsappService.sendVerificationUpdate(
          updatedReg.phone,
          waData
        );

        console.log('📱 WhatsApp status update sent:', waResult);
      }

      res.json({
        success: true,
        message: 'Status updated successfully',
        data: updatedReg
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create customer and installation ticket from approved registration
router.post('/:id/create-customer', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Get registration
    const regResult = await pool.query(
      `SELECT r.*, pm.package_name 
       FROM customer_registrations r
       LEFT JOIN packages_master pm ON r.package_id = pm.id
       WHERE r.id = $1`,
      [id]
    );

    if (regResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    const registration = regResult.rows[0];

    if (registration.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Registration must be approved first'
      });
    }

    if (registration.customer_id) {
      return res.status(400).json({
        success: false,
        message: 'Customer already created'
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Generate customer ID
      const countResult = await client.query(
        "SELECT COUNT(*) FROM customers WHERE DATE(created_at) = CURRENT_DATE"
      );
      const dailyCount = parseInt(countResult.rows[0].count) + 1;
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const customer_id = `CUST${today}${dailyCount.toString().padStart(3, '0')}`;

      // Create customer
      const customerQuery = `
        INSERT INTO customers (
          customer_id, name, email, phone,
          address, service_type, package_id,
          status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending_installation', $8)
        RETURNING *
      `;

      const customerResult = await client.query(customerQuery, [
        customer_id,
        registration.full_name,
        registration.email,
        registration.phone,
        registration.address,
        registration.service_type,
        registration.package_id,
        req.user.id
      ]);

      const customer = customerResult.rows[0];

      // Create installation ticket
      const ticketNumber = `TKT${today}${(dailyCount * 10).toString().padStart(3, '0')}`;
      const sla_due_date = new Date();
      sla_due_date.setHours(sla_due_date.getHours() + 48); // 48 hours SLA for installation

      const ticketQuery = `
        INSERT INTO tickets (
          ticket_number, customer_id, created_by, type, priority,
          category, title, description, scheduled_date,
          estimated_duration, sla_due_date, status
        ) VALUES ($1, $2, $3, 'installation', 'normal', 'fiber_installation', $4, $5, $6, 120, $7, 'open')
        RETURNING *
      `;

      const ticketResult = await client.query(ticketQuery, [
        ticketNumber,
        customer.id,
        req.user.id,
        `Instalasi Baru - ${registration.full_name}`,
        `Instalasi untuk customer baru\nPaket: ${registration.package_name}\nAlamat: ${registration.address}`,
        registration.preferred_installation_date || new Date(),
        sla_due_date
      ]);

      const ticket = ticketResult.rows[0];

      // Update registration with customer_id and ticket_id
      await client.query(
        `UPDATE customer_registrations 
         SET customer_id = $1, installation_ticket_id = $2 
         WHERE id = $3`,
        [customer.id, ticket.id, id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Customer and installation ticket created successfully',
        data: {
          customer,
          ticket
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

