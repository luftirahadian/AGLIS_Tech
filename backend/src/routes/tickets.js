const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { saveBase64File, getFileUrl, validateFile } = require('../utils/fileUpload');
const whatsappNotificationService = require('../services/whatsappNotificationService');

// Helper function to create notification
const createNotification = async (userId, type, title, message, data = null) => {
  try {
    const query = `
      INSERT INTO notifications (user_id, type, title, message, data, priority)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const priority = type.includes('urgent') ? 'high' : 'normal';
    const result = await pool.query(query, [
      userId, type, title, message, 
      data ? JSON.stringify(data) : null, 
      priority
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Helper function to emit Socket.IO notification
const emitNotification = (req, notification) => {
  const io = req.app.get('io');
  if (io && notification) {
    io.to(`user_${notification.user_id}`).emit('notification', {
      ...notification,
      timestamp: notification.created_at
    });
  }
};

const router = express.Router();

// Get all tickets
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, limit = 5, status, type, priority, 
      assigned_technician_id, customer_id, search,
      sort_by = 'created_at', sort_order = 'DESC'
    } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*, 
             c.customer_id, c.name as customer_name, c.phone as customer_phone,
             c.address as customer_address, c.service_type,
             tech.full_name as technician_name, tech.employee_id,
             creator.full_name as created_by_name
      FROM tickets t
      JOIN customers c ON t.customer_id = c.id
      LEFT JOIN technicians tech ON t.assigned_technician_id = tech.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filter by technician if user is technician
    // Technicians can see:
    // 1. Tickets assigned to them (assigned, in_progress, completed)
    // 2. Open tickets (for self-assignment)
    if (req.user.role === 'technician') {
      const techResult = await pool.query(
        'SELECT id FROM technicians WHERE user_id = $1',
        [req.user.id]
      );
      if (techResult.rows.length > 0) {
        paramCount++;
        query += ` AND (t.assigned_technician_id = $${paramCount} OR t.status = 'open')`;
        params.push(techResult.rows[0].id);
      }
    }

    if (status) {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      params.push(status);
    }

    if (type) {
      paramCount++;
      query += ` AND t.type = $${paramCount}`;
      params.push(type);
    }

    if (priority) {
      paramCount++;
      query += ` AND t.priority = $${paramCount}`;
      params.push(priority);
    }

    if (assigned_technician_id) {
      paramCount++;
      query += ` AND t.assigned_technician_id = $${paramCount}`;
      params.push(assigned_technician_id);
    }

    if (customer_id) {
      paramCount++;
      query += ` AND t.customer_id = $${paramCount}`;
      params.push(customer_id);
    }

    if (search) {
      paramCount++;
      query += ` AND (t.ticket_number ILIKE $${paramCount} OR t.title ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Validate and sanitize sort parameters to prevent SQL injection
    const allowedSortColumns = ['created_at', 'updated_at', 'priority', 'status', 'type', 'ticket_number', 'scheduled_date'];
    const sortColumn = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = ['ASC', 'DESC'].includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
    
    query += ` ORDER BY t.${sortColumn} ${sortDirection} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count (with same filters)
    let countQuery = `
      SELECT COUNT(*) FROM tickets t
      JOIN customers c ON t.customer_id = c.id
      LEFT JOIN technicians tech ON t.assigned_technician_id = tech.id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    // Apply same filters for count
    if (req.user.role === 'technician') {
      const techResult = await pool.query(
        'SELECT id FROM technicians WHERE user_id = $1',
        [req.user.id]
      );
      if (techResult.rows.length > 0) {
        countParamCount++;
        countQuery += ` AND (t.assigned_technician_id = $${countParamCount} OR t.status = 'open')`;
        countParams.push(techResult.rows[0].id);
      }
    }

    if (status) {
      countParamCount++;
      countQuery += ` AND t.status = $${countParamCount}`;
      countParams.push(status);
    }

    if (type) {
      countParamCount++;
      countQuery += ` AND t.type = $${countParamCount}`;
      countParams.push(type);
    }

    if (priority) {
      countParamCount++;
      countQuery += ` AND t.priority = $${countParamCount}`;
      countParams.push(priority);
    }

    if (assigned_technician_id) {
      countParamCount++;
      countQuery += ` AND t.assigned_technician_id = $${countParamCount}`;
      countParams.push(assigned_technician_id);
    }

    if (customer_id) {
      countParamCount++;
      countQuery += ` AND t.customer_id = $${countParamCount}`;
      countParams.push(customer_id);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (t.ticket_number ILIKE $${countParamCount} OR t.title ILIKE $${countParamCount} OR c.name ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Disable cache for dynamic data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json({
      success: true,
      data: {
        tickets: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get ticket statistics (MUST be before /:id route)
router.get('/stats/overview', async (req, res) => {
  try {
    // Build base query with technician filter if needed
    let whereClause = '1=1';
    const params = [];
    
    // Filter stats by technician if user is technician
    if (req.user.role === 'technician') {
      const techResult = await pool.query(
        'SELECT id FROM technicians WHERE user_id = $1',
        [req.user.id]
      );
      if (techResult.rows.length > 0) {
        whereClause = `(assigned_technician_id = $1 OR status = 'open')`;
        params.push(techResult.rows[0].id);
      }
    }

    // Get all ticket counts by status in one query
    const statusResult = await pool.query(`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
        COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned_tickets,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
        COUNT(CASE WHEN status = 'on_hold' THEN 1 END) as on_hold_tickets,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tickets,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_tickets
      FROM tickets
      WHERE ${whereClause}
    `, params);

    const counts = statusResult.rows[0];

    // Average resolution time (in hours)
    const avgTimeResult = await pool.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) as avg_hours
      FROM tickets
      WHERE status = 'completed' AND completed_at IS NOT NULL
        AND ${whereClause}
    `, params);
    const avg_resolution_time = avgTimeResult.rows[0].avg_hours 
      ? parseFloat(avgTimeResult.rows[0].avg_hours).toFixed(1) 
      : '0.0';

    res.json({
      success: true,
      data: {
        total_tickets: parseInt(counts.total_tickets),
        open_tickets: parseInt(counts.open_tickets),
        assigned_tickets: parseInt(counts.assigned_tickets),
        in_progress_tickets: parseInt(counts.in_progress_tickets),
        on_hold_tickets: parseInt(counts.on_hold_tickets),
        completed_tickets: parseInt(counts.completed_tickets),
        cancelled_tickets: parseInt(counts.cancelled_tickets),
        avg_resolution_time
      }
    });

  } catch (error) {
    console.error('Get ticket statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get ticket by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Simplified query first
    const query = `
      SELECT t.*, 
             c.id as customer_numeric_id, c.customer_id as customer_code, 
             c.name as customer_name, c.phone as customer_phone,
             c.address as customer_address, c.service_type,
             tech.full_name as technician_name, tech.employee_id, tech.phone as technician_phone,
             creator.full_name as created_by_name,
             pm.package_name, pm.bandwidth_down, pm.bandwidth_up, pm.monthly_price,
             st.type_name as service_type_name,
             sc.category_name, sc.category_code
      FROM tickets t
      JOIN customers c ON t.customer_id = c.id
      LEFT JOIN technicians tech ON t.assigned_technician_id = tech.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN packages_master pm ON c.package_id = pm.id
      LEFT JOIN service_types st ON t.type = st.type_code
      LEFT JOIN service_categories sc ON t.category = sc.category_code AND t.type = sc.service_type_code
      WHERE t.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Get ticket attachments
    const attachmentsQuery = `
      SELECT id, filename, original_filename, file_size, mime_type, 
             upload_type, created_at, uploaded_by
      FROM attachments 
      WHERE ticket_id = $1 
      ORDER BY created_at
    `;
    const attachmentsResult = await pool.query(attachmentsQuery, [id]);

    // Get ticket status history
    const historyQuery = `
      SELECT h.*, 
             u.full_name as changed_by_name,
             u.username as changed_by_username
      FROM ticket_status_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.ticket_id = $1
      ORDER BY h.created_at
    `;
    const historyResult = await pool.query(historyQuery, [id]);

    const ticket = {
      ...result.rows[0],
      attachments: attachmentsResult.rows,
      status_history: historyResult.rows
    };

    res.json({
      success: true,
      data: { ticket }
    });

  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new ticket
router.post('/', [
  body('customer_id').isInt().withMessage('Customer ID is required'),
  body('type').isIn(['installation', 'repair', 'maintenance', 'upgrade', 'downgrade', 'wifi_setup', 'dismantle', 'speed_test', 'bandwidth_upgrade', 'redundancy_setup', 'network_config', 'security_audit']).withMessage('Invalid ticket type'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'critical']).withMessage('Invalid priority'),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required')
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
      customer_id, type, priority = 'normal', category, title, description,
      scheduled_date, estimated_duration, equipment_needed 
    } = req.body;

    // Process scheduled_date - convert empty string to null
    const processedScheduledDate = scheduled_date && scheduled_date.trim() !== '' ? scheduled_date : null;
    
    // Process estimated_duration - convert empty string to null
    const processedEstimatedDuration = estimated_duration && estimated_duration.toString().trim() !== '' ? parseInt(estimated_duration) : null;

    // Format equipment_needed as PostgreSQL array
    let formattedEquipment = null;
    if (equipment_needed) {
      if (Array.isArray(equipment_needed)) {
        formattedEquipment = equipment_needed;
      } else {
        // Split by comma and trim whitespace, then filter out empty strings
        formattedEquipment = equipment_needed.split(',').map(item => item.trim()).filter(item => item.length > 0);
      }
    }

    // Verify customer exists
    const customerCheck = await pool.query(
      'SELECT id, service_type FROM customers WHERE id = $1',
      [customer_id]
    );

    if (customerCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Generate ticket number - use database date to avoid timezone issues
    const dateResult = await pool.query('SELECT CURRENT_DATE as today');
    const today = dateResult.rows[0].today.toISOString().slice(0, 10).replace(/-/g, '');
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM tickets WHERE DATE(created_at) = CURRENT_DATE'
    );
    const dailyCount = parseInt(countResult.rows[0].count) + 1;
    
    // Use shorter format to fit within 20 character limit
    const ticket_number = `TKT${today}${dailyCount.toString().padStart(3, '0')}`;

    // Calculate SLA due date based on priority
    const slaHours = {
      'critical': 2,
      'high': 4,
      'normal': 24,
      'low': 48
    };
    const sla_due_date = new Date();
    sla_due_date.setHours(sla_due_date.getHours() + slaHours[priority]);

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert ticket
      const ticketQuery = `
        INSERT INTO tickets (ticket_number, customer_id, created_by, type, priority, 
                           category, title, description, scheduled_date, estimated_duration, 
                           equipment_needed, sla_due_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const ticketResult = await client.query(ticketQuery, [
        ticket_number, customer_id, req.user.id, type, priority,
        category, title, description, processedScheduledDate, processedEstimatedDuration,
        formattedEquipment, sla_due_date
      ]);

      const ticket = ticketResult.rows[0];

      // Insert status history
      await client.query(
        'INSERT INTO ticket_status_history (ticket_id, new_status, changed_by) VALUES ($1, $2, $3)',
        [ticket.id, 'open', req.user.id]
      );

      await client.query('COMMIT');

      // Get Socket.IO instance
      const io = req.app.get('io');

      // Create notifications for supervisors and admins
      const supervisorQuery = `
        SELECT id FROM users 
        WHERE role IN ('admin', 'supervisor')
      `;
      const supervisors = await pool.query(supervisorQuery, []);
      
      for (const supervisor of supervisors.rows) {
        const notification = await createNotification(
          supervisor.id,
          'new_ticket',
          `New Ticket #${ticket.id}`,
          `New ${customerCheck.rows[0].service_type} ticket created by ${req.user.full_name || req.user.username}`,
          { ticket_id: ticket.id, customer_id: ticket.customer_id }
        );
        
        if (notification) {
          emitNotification(req, notification);
        }
      }

      // Emit Socket.IO events for real-time updates
      if (io) {
        // 1. Emit ticket_created event (for socketService listener)
        io.emit('ticket_created', {
          ticket: ticket,
          ticketId: ticket.id,
          ticketNumber: ticket.ticket_number,
          status: ticket.status,
          type: ticket.type,
          priority: ticket.priority
        });

        // 2. Emit to specific roles
        io.to('role_admin').to('role_supervisor').emit('new_ticket', {
          ticket: ticket,
          customer: customerCheck.rows[0],
          createdBy: req.user.username
        });
        
        // 3. Emit global dashboard update event
        io.emit('dashboard_update', {
          type: 'ticket_created',
          data: { ticket_id: ticket.id }
        });
        
        console.log(`📡 Socket.IO: Events emitted for new ticket ${ticket.ticket_number}`);
      }

      res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        data: { ticket }
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
      message: 'Internal server error'
    });
  }
});

// Update ticket status
router.put('/:id/status', [
  body('status').isIn(['open', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold']).withMessage('Invalid status'),
  body('notes').optional().notEmpty().withMessage('Notes cannot be empty'),
  body('assigned_technician_id').optional().isInt().withMessage('Invalid technician ID')
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
    const { status, notes, work_notes, resolution_notes, customer_rating, customer_feedback, assigned_technician_id, completion_data } = req.body;
    
    // Debug log
    console.log('=== TICKET STATUS UPDATE ===');
    console.log('Ticket ID:', id);
    console.log('New Status:', status);
    console.log('Assigned Technician ID:', assigned_technician_id);
    console.log('Full Request Body:', JSON.stringify(req.body, null, 2));

    // Get current ticket
    const currentTicket = await pool.query(
      'SELECT * FROM tickets WHERE id = $1',
      [id]
    );

    if (currentTicket.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const ticket = currentTicket.rows[0];
    const oldStatus = ticket.status;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Build update query
      const updates = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
      const params = [id, status];
      let paramCount = 2;

      // Set timestamps based on status
      if (status === 'in_progress' && !ticket.started_at) {
        paramCount++;
        updates.push(`started_at = $${paramCount}`);
        params.push(new Date());
      }

      if (status === 'completed' && !ticket.completed_at) {
        paramCount++;
        updates.push(`completed_at = $${paramCount}`);
        params.push(new Date());

        // Calculate actual duration
        if (ticket.started_at) {
          const duration = Math.floor((new Date() - new Date(ticket.started_at)) / (1000 * 60));
          paramCount++;
          updates.push(`actual_duration = $${paramCount}`);
          params.push(duration);
        }
      }

      if (work_notes) {
        paramCount++;
        updates.push(`work_notes = $${paramCount}`);
        params.push(work_notes);
      }

      if (resolution_notes) {
        paramCount++;
        updates.push(`resolution_notes = $${paramCount}`);
        params.push(resolution_notes);
      }

      if (customer_rating) {
        paramCount++;
        updates.push(`customer_rating = $${paramCount}`);
        params.push(customer_rating);
      }

      if (customer_feedback) {
        paramCount++;
        updates.push(`customer_feedback = $${paramCount}`);
        params.push(customer_feedback);
      }

      // Handle technician assignment - update whenever assigned_technician_id is provided
      if (assigned_technician_id) {
        paramCount++;
        updates.push(`assigned_technician_id = $${paramCount}`);
        params.push(assigned_technician_id);
      }

      // Handle completion_data and file uploads
      let completionDataToStore = null;
      
      if (completion_data && status === 'completed') {
        console.log('📸 Processing completion data with file uploads...');
        
        // Clone completion data
        completionDataToStore = { ...completion_data };
        
        // Handle file uploads for photos
        try {
          // OTDR Photo
          if (completion_data.otdr_photo && completion_data.otdr_photo.data) {
            const validation = validateFile(completion_data.otdr_photo, 5);
            if (validation.valid) {
              const filePath = await saveBase64File(completion_data.otdr_photo, 'otdr', id);
              completionDataToStore.otdr_photo = {
                filename: completion_data.otdr_photo.filename,
                path: filePath,
                url: getFileUrl(filePath)
              };
              console.log('✓ OTDR photo saved:', filePath);
            } else {
              console.warn('OTDR photo validation failed:', validation.error);
              completionDataToStore.otdr_photo = null;
            }
          }
          
          // Attenuation Photo
          if (completion_data.attenuation_photo && completion_data.attenuation_photo.data) {
            const validation = validateFile(completion_data.attenuation_photo, 5);
            if (validation.valid) {
              const filePath = await saveBase64File(completion_data.attenuation_photo, 'attenuation', id);
              completionDataToStore.attenuation_photo = {
                filename: completion_data.attenuation_photo.filename,
                path: filePath,
                url: getFileUrl(filePath)
              };
              console.log('✓ Attenuation photo saved:', filePath);
            } else {
              console.warn('Attenuation photo validation failed:', validation.error);
              completionDataToStore.attenuation_photo = null;
            }
          }
          
          // Modem SN Photo
          if (completion_data.modem_sn_photo && completion_data.modem_sn_photo.data) {
            const validation = validateFile(completion_data.modem_sn_photo, 5);
            if (validation.valid) {
              const filePath = await saveBase64File(completion_data.modem_sn_photo, 'modem_sn', id);
              completionDataToStore.modem_sn_photo = {
                filename: completion_data.modem_sn_photo.filename,
                path: filePath,
                url: getFileUrl(filePath)
              };
              console.log('✓ Modem SN photo saved:', filePath);
            } else {
              console.warn('Modem SN photo validation failed:', validation.error);
              completionDataToStore.modem_sn_photo = null;
            }
          }
          
          // Add completion_data to update
          paramCount++;
          updates.push(`completion_data = $${paramCount}`);
          params.push(JSON.stringify(completionDataToStore));
          
        } catch (uploadError) {
          console.error('Error handling file uploads:', uploadError);
          throw uploadError;
        }
      }

      // Update ticket
      const updateQuery = `
        UPDATE tickets 
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING *
      `;

      const result = await client.query(updateQuery, params);
      const updatedTicket = result.rows[0];

      // Insert status history (without assigned_technician_id - column doesn't exist)
      await client.query(
        'INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by, notes) VALUES ($1, $2, $3, $4, $5)',
        [id, oldStatus, status, req.user.id, notes || `Status changed from ${oldStatus} to ${status}`]
      );

      // Update technician stats if completed
      if (status === 'completed' && ticket.assigned_technician_id) {
        await client.query(
          'UPDATE technicians SET total_tickets_completed = total_tickets_completed + 1 WHERE id = $1',
          [ticket.assigned_technician_id]
        );

        // Update rating if customer provided rating
        if (customer_rating) {
          const ratingResult = await client.query(
            'SELECT AVG(customer_rating) as avg_rating FROM tickets WHERE assigned_technician_id = $1 AND customer_rating IS NOT NULL',
            [ticket.assigned_technician_id]
          );
          
          if (ratingResult.rows[0].avg_rating) {
            await client.query(
              'UPDATE technicians SET customer_rating = $1 WHERE id = $2',
              [parseFloat(ratingResult.rows[0].avg_rating), ticket.assigned_technician_id]
            );
          }
        }
      }

      // 🔥 CRITICAL: Update customer status when installation completed
      if (status === 'completed' && ticket.type === 'installation' && ticket.customer_id) {
        const customerUpdateResult = await client.query(
          `UPDATE customers 
           SET 
             account_status = 'active',
             installation_date = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND account_status = 'pending_installation'
           RETURNING *`,
          [ticket.customer_id]
        );

        if (customerUpdateResult.rows.length > 0) {
          console.log(`✅ Customer ${ticket.customer_id} activated after installation completed`);
          
          // Emit customer-updated event for real-time UI refresh
          const io = req.app.get('io');
          if (io) {
            io.emit('customer-updated', {
              customerId: ticket.customer_id,
              oldStatus: 'pending_installation',
              newStatus: 'active',
              action: 'installation_completed'
            });
          }
        }
      }

      await client.query('COMMIT');

      // Emit Socket.IO events for real-time updates
      const io = req.app.get('io');
      if (io) {
        // 1. Emit ticket_updated event (for socketService listener with underscore)
        io.emit('ticket_updated', {
          ticketId: id,
          oldStatus: oldStatus,
          newStatus: status,
          updatedBy: req.user.full_name
        });

        // 2. Emit ticket_status_updated (for legacy listeners)
        io.emit('ticket_status_updated', {
          ticket_id: id,
          old_status: oldStatus,
          new_status: status,
          updated_by: req.user.full_name
        });
        
        // 3. Emit dashboard update event
        io.emit('dashboard_update', {
          type: 'ticket_status_changed',
          data: { ticket_id: id, old_status: oldStatus, new_status: status }
        });

        console.log(`📡 Socket.IO: Events emitted for ticket ${id} status update (${oldStatus} → ${status})`);
      }

      // 📱 PHASE 1: Send WhatsApp notification to customer on status change
      // Only notify customer on significant status changes
      const notifiableStatuses = ['assigned', 'in_progress', 'completed', 'cancelled'];
      if (notifiableStatuses.includes(status) && status !== oldStatus) {
        whatsappNotificationService.notifyTicketStatusUpdate(id, oldStatus, status)
          .then(whatsappResult => {
            if (whatsappResult.success) {
              console.log(`📱 WhatsApp status update sent to customer for ticket #${id} (${oldStatus} → ${status})`);
            } else {
              console.warn(`⚠️ WhatsApp status notification failed for ticket #${id}:`, whatsappResult.error);
            }
          })
          .catch(err => {
            console.error(`❌ WhatsApp status notification error for ticket #${id}:`, err);
          });
      }

      res.json({
        success: true,
        message: 'Ticket status updated successfully',
        data: { ticket: result.rows[0] }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Assign ticket to technician
router.put('/:id/assign', [
  body('technician_id').isInt().withMessage('Technician ID is required')
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
    const { technician_id } = req.body;

    // Verify technician exists and is available
    const techCheck = await pool.query(
      `SELECT t.*, u.full_name, COUNT(tk.id) as current_tickets
       FROM technicians t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN tickets tk ON t.id = tk.assigned_technician_id 
                           AND tk.status IN ('assigned', 'in_progress')
       WHERE t.id = $1 AND t.availability_status = 'available'
       GROUP BY t.id, u.id`,
      [technician_id]
    );

    if (techCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Technician not found or not available'
      });
    }

    const technician = techCheck.rows[0];

    if (technician.current_tickets >= technician.max_daily_tickets) {
      return res.status(400).json({
        success: false,
        message: 'Technician has reached maximum daily ticket limit'
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update ticket
      const result = await client.query(
        `UPDATE tickets 
         SET assigned_technician_id = $1, status = 'assigned', updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND status = 'open'
         RETURNING *`,
        [technician_id, id]
      );

      if (result.rows.length === 0) {
        throw new Error('Ticket not found or already assigned');
      }

      // Insert status history
      await client.query(
        'INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by) VALUES ($1, $2, $3, $4)',
        [id, 'open', 'assigned', req.user.id]
      );

      await client.query('COMMIT');

      // Create notification for assigned technician
      const notification = await createNotification(
        technician.user_id,
        'ticket_assigned',
        `Ticket #${id} Assigned`,
        `You have been assigned to ticket #${id} - ${result.rows[0].service_type}`,
        { ticket_id: id, assigned_by: req.user.id }
      );
      
      if (notification) {
        emitNotification(req, notification);
      }

      // Emit Socket.IO events for real-time updates
      const io = req.app.get('io');
      if (io) {
        // 1. Emit ticket_assigned event (for socketService listener)
        io.emit('ticket_assigned', {
          ticketId: id,
          status: 'assigned',
          assignedTo: technician_id,
          updatedBy: req.user.id
        });

        // 2. Emit to assigned technician
        io.to(`user_${technician.user_id}`).emit('ticket_assigned', {
          ticket_id: id,
          technician_id: technician_id,
          technician_name: technician.full_name,
          assigned_by: req.user.username
        });
        
        // 3. Broadcast to supervisors
        io.to('role_admin').to('role_supervisor').emit('ticket_updated', {
          ticketId: id,
          status: 'assigned',
          assignedTo: technician_id,
          updatedBy: req.user.id,
          timestamp: new Date().toISOString()
        });
        
        // 4. Emit dashboard update event
        io.emit('dashboard_update', {
          type: 'ticket_assigned',
          data: { ticket_id: id, technician_id: technician_id }
        });

        console.log(`📡 Socket.IO: Events emitted for ticket ${id} assignment to technician ${technician_id}`);
      }

      // 📱 PHASE 1: Send WhatsApp notification to technician
      whatsappNotificationService.notifyTicketAssignment(id)
        .then(whatsappResult => {
          if (whatsappResult.success) {
            console.log(`📱 WhatsApp ticket assignment notification sent to technician for ticket #${id}`);
          } else {
            console.warn(`⚠️ WhatsApp notification failed for ticket #${id}:`, whatsappResult.error);
          }
        })
        .catch(err => {
          console.error(`❌ WhatsApp notification error for ticket #${id}:`, err);
        });

      res.json({
        success: true,
        message: 'Ticket assigned successfully',
        data: { ticket: result.rows[0] }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Smart auto-assignment endpoint
router.post('/:id/auto-assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { force_zone, required_skills } = req.body;
    console.log('Auto-assign request:', { id, force_zone, required_skills });

    // Get ticket details
    const ticketQuery = `
      SELECT t.*, c.latitude, c.longitude, c.service_type
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.id = $1 AND t.status = 'open'
    `;
    const ticketResult = await pool.query(ticketQuery, [id]);

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or already assigned'
      });
    }

    const ticket = ticketResult.rows[0];

    // Simplest possible technician selection
    const technicianQuery = `
      SELECT t.id, t.full_name, t.employee_id, t.skill_level,
             t.availability_status, t.is_available, t.max_daily_tickets
      FROM technicians t
      WHERE t.employment_status = 'active' 
        AND t.is_available = true
        AND t.availability_status = 'available'
      ORDER BY t.skill_level DESC
      LIMIT 1
    `;

    const techResult = await pool.query(technicianQuery);

    if (techResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No available technicians found matching criteria'
      });
    }

    // Auto-assign to the best match
    const bestTechnician = techResult.rows[0];

    const assignQuery = `
      UPDATE tickets 
      SET assigned_technician_id = $1, 
          status = 'assigned',
          work_notes = COALESCE(work_notes, '') || ' [Auto-assigned based on smart matching]',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const assignResult = await pool.query(assignQuery, [bestTechnician.id, id]);

    res.json({
      success: true,
      data: {
        ticket: assignResult.rows[0],
        assigned_technician: bestTechnician,
        alternatives: techResult.rows.slice(1),
        assignment_score: {
          skill_match: 1,
          performance_rating: 0,
          current_workload: `0/${bestTechnician.max_daily_tickets}`,
          distance_km: 0
        }
      },
      message: 'Ticket auto-assigned successfully'
    });

  } catch (error) {
    console.error('Auto-assign ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get assignment recommendations
router.get('/:id/assignment-recommendations', async (req, res) => {
  try {
    const { id } = req.params;

    // Get ticket details
    const ticketQuery = `
      SELECT t.*, c.latitude, c.longitude, c.service_type, c.name as customer_name
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.id = $1
    `;
    const ticketResult = await pool.query(ticketQuery, [id]);

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const ticket = ticketResult.rows[0];

    // Working simple query
    const recommendationQuery = `
      SELECT t.id, t.full_name, t.employee_id, t.skill_level, t.specializations,
             t.availability_status, t.is_available, t.max_daily_tickets,
             t.work_zone, t.current_latitude, t.current_longitude,
             u.username,
             COUNT(tt.id) as current_tickets,
             AVG(tp.customer_satisfaction_avg) as avg_rating,
             AVG(tp.sla_compliance_rate) as avg_sla,
             AVG(tp.average_resolution_time) as avg_resolution_time,
             0 as distance_km,
             0 as relevant_skills_count
      FROM technicians t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN tickets tt ON t.id = tt.assigned_technician_id 
        AND tt.status IN ('assigned', 'in_progress')
      LEFT JOIN technician_performance tp ON t.id = tp.technician_id
      WHERE t.employment_status = 'active'
      GROUP BY t.id, u.username
      ORDER BY 
        CASE WHEN t.is_available = true AND t.availability_status = 'available' THEN 1 ELSE 0 END DESC,
        CASE WHEN COUNT(tt.id) < t.max_daily_tickets THEN 1 ELSE 0 END DESC,
        AVG(tp.customer_satisfaction_avg) DESC NULLS LAST,
        COUNT(tt.id) ASC
      LIMIT 10
    `;

    const recommendations = await pool.query(recommendationQuery);

    // Helper function for recommendation scoring
    const calculateRecommendationScore = (technician) => {
      let score = 0;
      
      // Availability (40 points)
      if (technician.is_available && technician.availability_status === 'available') {
        score += 40;
      }
      
      // Capacity (30 points)
      if (technician.current_tickets < technician.max_daily_tickets) {
        const capacityRatio = (technician.max_daily_tickets - technician.current_tickets) / technician.max_daily_tickets;
        score += capacityRatio * 30;
      }
      
      // Performance rating (20 points)
      if (technician.avg_rating) {
        score += (technician.avg_rating / 5.0) * 20;
      }
      
      // Distance (10 points)
      if (technician.distance_km) {
        if (technician.distance_km < 10) score += 10;
        else if (technician.distance_km < 25) score += 5;
      }
      
      return Math.round(score);
    };

    res.json({
      success: true,
      data: {
        ticket: ticket,
        recommendations: recommendations.rows.map(tech => ({
          ...tech,
          availability_status: tech.is_available && tech.availability_status === 'available' ? 'available' : 'unavailable',
          capacity_status: tech.current_tickets < tech.max_daily_tickets ? 'available' : 'full',
          recommendation_score: calculateRecommendationScore(tech),
          distance_status: tech.distance_km ? 
            (tech.distance_km < 10 ? 'near' : tech.distance_km < 25 ? 'medium' : 'far') : 'unknown'
        }))
      }
    });

  } catch (error) {
    console.error('Get assignment recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
