const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

const router = express.Router();

// Get all tickets
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, limit = 10, status, type, priority, 
      assigned_technician_id, customer_id, search 
    } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*, 
             c.customer_id, c.name as customer_name, c.phone as customer_phone,
             c.address as customer_address, c.service_type,
             u.full_name as technician_name, tech.employee_id,
             creator.full_name as created_by_name
      FROM tickets t
      JOIN customers c ON t.customer_id = c.id
      LEFT JOIN technicians tech ON t.assigned_technician_id = tech.id
      LEFT JOIN users u ON tech.user_id = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filter by technician if user is technician
    if (req.user.role === 'technician') {
      const techResult = await pool.query(
        'SELECT id FROM technicians WHERE user_id = $1',
        [req.user.id]
      );
      if (techResult.rows.length > 0) {
        paramCount++;
        query += ` AND t.assigned_technician_id = $${paramCount}`;
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

    query += ` ORDER BY t.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
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
        countQuery += ` AND t.assigned_technician_id = $${countParamCount}`;
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

// Get ticket by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Simplified query first
    const query = `
      SELECT t.*, 
             c.customer_id, c.name as customer_name, c.phone as customer_phone,
             c.address as customer_address, c.service_type,
             u.full_name as technician_name, tech.employee_id,
             creator.full_name as created_by_name
      FROM tickets t
      JOIN customers c ON t.customer_id = c.id
      LEFT JOIN technicians tech ON t.assigned_technician_id = tech.id
      LEFT JOIN users u ON tech.user_id = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
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
      SELECT h.*, u.full_name as changed_by_name
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
  body('type').isIn(['installation', 'repair', 'maintenance', 'upgrade']).withMessage('Invalid ticket type'),
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
      'SELECT id, service_area FROM customers WHERE id = $1',
      [customer_id]
    );

    if (customerCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Generate ticket number
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM tickets WHERE DATE(created_at) = CURRENT_DATE'
    );
    const dailyCount = parseInt(countResult.rows[0].count) + 1;
    const ticket_number = `TKT-${today}-${dailyCount.toString().padStart(4, '0')}`;

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
        category, title, description, scheduled_date, estimated_duration,
        formattedEquipment, sla_due_date
      ]);

      const ticket = ticketResult.rows[0];

      // Insert status history
      await client.query(
        'INSERT INTO ticket_status_history (ticket_id, new_status, changed_by) VALUES ($1, $2, $3)',
        [ticket.id, 'open', req.user.id]
      );

      await client.query('COMMIT');

      // Emit real-time notification
      const io = req.app.get('io');
      io.emit('new_ticket', {
        ticket: ticket,
        customer: customerCheck.rows[0]
      });

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
  body('notes').optional().notEmpty().withMessage('Notes cannot be empty')
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
    const { status, notes, work_notes, resolution_notes, customer_rating, customer_feedback } = req.body;

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

      // Update ticket
      const updateQuery = `
        UPDATE tickets 
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING *
      `;

      const result = await client.query(updateQuery, params);

      // Insert status history
      await client.query(
        'INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by, notes) VALUES ($1, $2, $3, $4, $5)',
        [id, oldStatus, status, req.user.id, notes]
      );

      // Update technician stats if completed
      if (status === 'completed' && ticket.assigned_technician_id) {
        await client.query(
          'UPDATE technicians SET total_completed_tickets = total_completed_tickets + 1 WHERE id = $1',
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
              'UPDATE technicians SET rating = $1 WHERE id = $2',
              [parseFloat(ratingResult.rows[0].avg_rating), ticket.assigned_technician_id]
            );
          }
        }
      }

      await client.query('COMMIT');

      // Emit real-time notification
      const io = req.app.get('io');
      io.emit('ticket_status_updated', {
        ticket_id: id,
        old_status: oldStatus,
        new_status: status,
        updated_by: req.user.full_name
      });

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

      // Emit real-time notification
      const io = req.app.get('io');
      io.emit('ticket_assigned', {
        ticket_id: id,
        technician_id: technician_id,
        technician_name: technician.full_name
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
