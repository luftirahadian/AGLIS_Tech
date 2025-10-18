const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { saveBase64File, getFileUrl } = require('../utils/fileUpload');
const whatsappService = require('../services/whatsappService');
const whatsappNotificationService = require('../services/whatsappNotificationService');
const { publicRegistrationLimiter } = require('../middleware/rateLimiter');
const { verifyCaptchaMiddleware } = require('../utils/recaptchaVerify');

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
router.post('/public/request-otp', publicRegistrationLimiter, [
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
router.post('/public/verify-otp', publicRegistrationLimiter, [
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
router.post('/public', publicRegistrationLimiter, verifyCaptchaMiddleware, [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[0-9+\-() ]+$/).withMessage('Valid phone number is required'),
  body('whatsapp_verified').custom(value => value === true || value === 'true').withMessage('WhatsApp number must be verified'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('package_id').custom(value => !isNaN(parseInt(value))).withMessage('Package selection is required'),
  body('preferred_installation_date').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid date format'),
  body('id_card_photo').optional({ nullable: true, checkFalsy: true }).isString()
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
    // Check if email already registered (phone boleh sama)
    const existingCheck = await pool.query(
      `SELECT id FROM customer_registrations 
       WHERE email = $1
       AND status NOT IN ('rejected', 'cancelled')`,
      [email]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar. Silakan gunakan email lain atau hubungi customer service.'
      });
    }

    // Check if email already exists as customer (phone boleh sama)
    const customerCheck = await pool.query(
      'SELECT id, name FROM customers WHERE email = $1',
      [email]
    );

    if (customerCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar sebagai customer aktif. Silakan login atau hubungi customer service.'
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
      const trackingUrl = `${process.env.FRONTEND_URL || 'https://portal.aglis.biz.id'}/track/${registration.registration_number}`;
      
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
        // Get room sizes for debugging
        const adminRoom = io.sockets.adapter.rooms.get('role_admin');
        const supervisorRoom = io.sockets.adapter.rooms.get('role_supervisor');
        const csRoom = io.sockets.adapter.rooms.get('role_customer_service');
        
        console.log('📡 [Socket.IO] Emitting new_registration event:', {
          registration_number: registration.registration_number,
          full_name: registration.full_name,
          rooms: ['role_admin', 'role_supervisor', 'role_customer_service'],
          listeners: {
            role_admin: adminRoom?.size || 0,
            role_supervisor: supervisorRoom?.size || 0,
            role_customer_service: csRoom?.size || 0
          }
        });
        
        // Try room-based emission first
        io.to('role_admin').to('role_supervisor').to('role_customer_service').emit('new_registration', {
          registration: registration
        });
        
        // Fallback: If no listeners in rooms, broadcast to all connected clients
        const totalListeners = (adminRoom?.size || 0) + (supervisorRoom?.size || 0) + (csRoom?.size || 0);
        if (totalListeners === 0) {
          console.log('⚠️ [Socket.IO] No listeners in role rooms, broadcasting to all connected clients');
          io.emit('new_registration', {
            registration: registration
          });
        }
        
        console.log('✅ [Socket.IO] new_registration event emitted successfully');
      } else {
        console.warn('⚠️ [Socket.IO] io object not available, event not emitted');
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
    console.error('❌❌❌ PUBLIC REGISTRATION ERROR ❌❌❌');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan. Silakan coba lagi.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        r.address,
        r.city,
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
      dateFilter,
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

    // Date filter
    if (dateFilter === 'today') {
      query += ` AND DATE(r.created_at) = CURRENT_DATE`;
    } else if (dateFilter === 'week') {
      query += ` AND r.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
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
        COUNT(CASE WHEN status = 'customer_created' THEN 1 END) as customer_created,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
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
    'survey_completed', 'approved', 'customer_created', 'rejected', 'cancelled'
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

      // Emit Socket.IO event for real-time updates
      const io = req.app.get('io');
      if (io) {
        // Emit to admin/staff roles
        io.to('role_admin').to('role_supervisor').to('role_customer_service').emit('registration_updated', {
          registration_id: updatedReg.id,
          registration_number: updatedReg.registration_number,
          email: updatedReg.email,
          old_status: registration.status,
          new_status: updatedReg.status,
          full_name: updatedReg.full_name,
          phone: updatedReg.phone,
          updated_by: req.user.id,
          updated_at: updatedReg.updated_at
        });

        // Emit broadcast event for public tracking page
        io.emit('registration_status_changed', {
          registration_id: updatedReg.id,
          registration_number: updatedReg.registration_number,
          email: updatedReg.email,
          status: updatedReg.status,
          old_status: registration.status
        });

        console.log(`📡 [Socket.IO] Registration status update emitted: ${registration.status} → ${updatedReg.status}`);
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

    console.log(`📝 Starting customer creation for registration ID: ${id}`);
    console.log(`📋 Registration data:`, {
      name: registration.full_name,
      email: registration.email,
      phone: registration.phone,
      ktp: registration.id_card_number
    });

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      console.log('✅ Transaction BEGIN');

      // Generate customer ID - Format: AGLSyyyymmddxxxx (4 digits)
      // Use MAX approach for reliability
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}${month}${day}`;
      
      const maxResult = await client.query(
        "SELECT customer_id FROM customers WHERE customer_id LIKE $1 ORDER BY customer_id DESC LIMIT 1",
        [`AGLS${today}%`]
      );
      
      let dailyCount = 1;
      if (maxResult.rows.length > 0) {
        const lastId = maxResult.rows[0].customer_id;
        const lastNumber = parseInt(lastId.slice(-4));
        dailyCount = lastNumber + 1;
      }
      
      const customer_id = `AGLS${today}${dailyCount.toString().padStart(4, '0')}`;

      // Generate username and password (username must be unique!)
      // Format: {email_prefix}_{last8phone}@customer
      const emailPrefix = registration.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const phoneLastDigits = registration.phone.slice(-8);
      const username = `${emailPrefix}_${phoneLastDigits}@customer`;
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('customer123', 10); // Default password
      const clientPassword = Math.random().toString(36).slice(-8).toUpperCase(); // Random client area password

      // Create customer
      const customerQuery = `
        INSERT INTO customers (
          customer_id, name, email, phone, ktp,
          address, city, service_type, package_id,
          account_status, username, password, client_area_password
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const customerResult = await client.query(customerQuery, [
        customer_id,
        registration.full_name,
        registration.email,
        registration.phone,
        registration.id_card_number, // KTP
        registration.address,
        registration.city, // Add city from registration
        registration.service_type,
        registration.package_id,
        'pending_installation', // account_status
        username,
        hashedPassword,
        clientPassword
      ]);

      const customer = customerResult.rows[0];
      console.log('✅ Customer created:', {
        id: customer.id,
        customer_id: customer.customer_id,
        name: customer.name,
        ktp: customer.ktp
      });

      // Create installation ticket - Format: TKTyyyymmddxxx
      // Get daily ticket count (not customer count)
      // Generate ticket number - Use MAX approach for reliability
      const maxTicketResult = await client.query(
        "SELECT ticket_number FROM tickets WHERE ticket_number LIKE $1 ORDER BY ticket_number DESC LIMIT 1",
        [`TKT${today}%`]
      );
      
      let dailyTicketCount = 1;
      if (maxTicketResult.rows.length > 0) {
        const lastTicketNumber = maxTicketResult.rows[0].ticket_number;
        const lastNumber = parseInt(lastTicketNumber.slice(-3));
        dailyTicketCount = lastNumber + 1;
      }
      
      const ticketNumber = `TKT${today}${dailyTicketCount.toString().padStart(3, '0')}`;
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
      console.log('✅ Ticket created:', {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        customer_id: ticket.customer_id
      });

      // Update registration with customer_id, ticket_id, and status
      console.log(`📝 Updating registration ${id} with customer_id=${customer.id}, ticket_id=${ticket.id}`);
      const updateResult = await client.query(
        `UPDATE customer_registrations 
         SET customer_id = $1, installation_ticket_id = $2, status = 'customer_created'
         WHERE id = $3
         RETURNING id, status, customer_id, installation_ticket_id`,
        [customer.id, ticket.id, id]
      );
      console.log('✅ Registration updated:', updateResult.rows[0]);

      await client.query('COMMIT');
      console.log('✅ Transaction COMMITTED');

      // Emit Socket.IO events for real-time updates
      const io = req.app.get('io');
      if (io) {
        // Notify customer-created event
        io.emit('customer-created', {
          customerId: customer.id,
          customer_id: customer.customer_id,
          name: customer.name,
          status: 'pending_installation'
        });
        
        // Notify registration status updated
        io.emit('registration-updated', {
          registrationId: id,
          registration_number: registration.registration_number,
          oldStatus: 'approved',
          newStatus: 'customer_created',
          action: 'customer_created'
        });

        // Notify ticket created
        io.emit('ticket-created', {
          ticketId: ticket.id,
          ticket_number: ticket.ticket_number,
          type: 'installation',
          customer_id: customer.customer_id
        });

        console.log(`✅ Customer ${customer.customer_id} and ticket ${ticket.ticket_number} created from registration ${registration.registration_number}`);
      }

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
    console.error('❌❌❌ CREATE CUSTOMER ERROR ❌❌❌');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error detail:', error.detail);
    console.error('SQL:', error.sql);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

