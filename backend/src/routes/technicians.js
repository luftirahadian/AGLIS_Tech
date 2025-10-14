const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

const router = express.Router();

// Get all technicians with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, limit = 10, search, employment_status, availability_status,
      skill_level, work_zone, specialization,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*, 
             u.username, u.email as user_email, u.last_login,
             COUNT(DISTINCT ts.id) as total_skills,
             COUNT(DISTINCT tt.id) as active_tickets,
             AVG(tp.customer_satisfaction_avg) as avg_customer_rating
      FROM technicians t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN technician_skills ts ON t.id = ts.technician_id
      LEFT JOIN tickets tt ON t.id = tt.assigned_technician_id AND tt.status IN ('assigned', 'in_progress')
      LEFT JOIN technician_performance tp ON t.id = tp.technician_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (t.full_name ILIKE $${paramCount} OR t.employee_id ILIKE $${paramCount} OR t.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (employment_status) {
      paramCount++;
      query += ` AND t.employment_status = $${paramCount}`;
      params.push(employment_status);
    }

    if (availability_status) {
      paramCount++;
      query += ` AND t.availability_status = $${paramCount}`;
      params.push(availability_status);
    }

    if (skill_level) {
      paramCount++;
      query += ` AND t.skill_level = $${paramCount}`;
      params.push(skill_level);
    }

    if (work_zone) {
      paramCount++;
      query += ` AND t.work_zone = $${paramCount}`;
      params.push(work_zone);
    }

    if (specialization) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(t.specializations)`;
      params.push(specialization);
    }

    query += ` GROUP BY t.id, u.username, u.email, u.last_login`;
    
    // Dynamic sorting with whitelist for security
    const allowedSortColumns = {
      'full_name': 't.full_name',
      'employee_id': 't.employee_id',
      'availability_status': 't.availability_status',
      'skill_level': 't.skill_level',
      'work_zone': 't.work_zone',
      'created_at': 't.created_at'
    };
    
    const sortColumn = allowedSortColumns[sort_by] || 't.created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${sortColumn} ${sortDirection} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT t.id) as count
      FROM technicians t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (t.full_name ILIKE $${countParamCount} OR t.employee_id ILIKE $${countParamCount} OR t.email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (employment_status) {
      countParamCount++;
      countQuery += ` AND t.employment_status = $${countParamCount}`;
      countParams.push(employment_status);
    }

    if (availability_status) {
      countParamCount++;
      countQuery += ` AND t.availability_status = $${countParamCount}`;
      countParams.push(availability_status);
    }

    if (skill_level) {
      countParamCount++;
      countQuery += ` AND t.skill_level = $${countParamCount}`;
      countParams.push(skill_level);
    }

    if (work_zone) {
      countParamCount++;
      countQuery += ` AND t.work_zone = $${countParamCount}`;
      countParams.push(work_zone);
    }

    if (specialization) {
      countParamCount++;
      countQuery += ` AND $${countParamCount} = ANY(t.specializations)`;
      countParams.push(specialization);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        technicians: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get technicians error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get technician statistics - MUST be before /:id route
router.get('/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_technicians,
        COUNT(*) FILTER (WHERE availability_status = 'available') as available_technicians,
        COUNT(*) FILTER (WHERE availability_status = 'busy') as busy_technicians,
        COUNT(*) FILTER (WHERE availability_status = 'break') as break_technicians,
        COUNT(*) FILTER (WHERE availability_status = 'offline') as offline_technicians,
        COUNT(*) FILTER (WHERE employment_status = 'active') as active_employment,
        COUNT(*) FILTER (WHERE employment_status = 'inactive') as inactive_employment,
        AVG(tp.customer_satisfaction_avg) as avg_customer_rating,
        COUNT(DISTINCT tt.id) FILTER (WHERE tt.status IN ('assigned', 'in_progress')) as active_tickets
      FROM technicians t
      LEFT JOIN technician_performance tp ON t.id = tp.technician_id
      LEFT JOIN tickets tt ON t.id = tt.assigned_technician_id
    `;
    
    const result = await pool.query(statsQuery);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get technician stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get technician by ID with detailed information
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get technician basic info
    const technicianQuery = `
      SELECT t.*, 
             u.username, u.email as user_email, u.role,
             supervisor.full_name as supervisor_name
      FROM technicians t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN technicians supervisor ON t.supervisor_id = supervisor.id
      WHERE t.id = $1
    `;
    const technicianResult = await pool.query(technicianQuery, [id]);

    if (technicianResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    const technician = technicianResult.rows[0];

    // Get technician skills
    const skillsQuery = `
      SELECT ts.*, u.full_name as verified_by_name
      FROM technician_skills ts
      LEFT JOIN users u ON ts.verified_by = u.id
      WHERE ts.technician_id = $1
      ORDER BY ts.skill_category, ts.skill_name
    `;
    const skillsResult = await pool.query(skillsQuery, [id]);

    // Get current schedule
    const scheduleQuery = `
      SELECT * FROM technician_schedule
      WHERE technician_id = $1 AND schedule_date >= CURRENT_DATE
      ORDER BY schedule_date
      LIMIT 7
    `;
    const scheduleResult = await pool.query(scheduleQuery, [id]);

    // Get recent performance
    const performanceQuery = `
      SELECT tp.*, u.full_name as created_by_name
      FROM technician_performance tp
      LEFT JOIN users u ON tp.created_by = u.id
      WHERE tp.technician_id = $1
      ORDER BY tp.period_end DESC
      LIMIT 3
    `;
    const performanceResult = await pool.query(performanceQuery, [id]);

    // Get assigned equipment
    const equipmentQuery = `
      SELECT * FROM technician_equipment
      WHERE technician_id = $1 AND is_active = true
      ORDER BY equipment_type, equipment_name
    `;
    const equipmentResult = await pool.query(equipmentQuery, [id]);

    // Get specializations from junction table
    const specializationsQuery = `
      SELECT 
        ts.id, ts.proficiency_level, ts.years_experience, ts.acquired_date,
        s.id as specialization_id, s.code as specialization_code, 
        s.name as specialization_name, s.description,
        s.difficulty_level, s.is_high_demand, s.is_critical_service,
        sc.name as category_name, sc.code as category_code, sc.color as category_color
      FROM technician_specializations ts
      JOIN specializations s ON ts.specialization_id = s.id
      JOIN specialization_categories sc ON s.category_id = sc.id
      WHERE ts.technician_id = $1 AND ts.is_active = true
      ORDER BY sc.display_order, s.display_order
    `;
    const specializationsResult = await pool.query(specializationsQuery, [id]);

    // Get recent location history
    const locationQuery = `
      SELECT * FROM technician_location_history
      WHERE technician_id = $1
      ORDER BY recorded_at DESC
      LIMIT 10
    `;
    const locationResult = await pool.query(locationQuery, [id]);

    // Get active tickets
    const ticketsQuery = `
      SELECT t.*, c.name as customer_name, c.phone as customer_phone
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.assigned_technician_id = $1 AND t.status IN ('assigned', 'in_progress')
      ORDER BY t.priority DESC, t.created_at ASC
    `;
    const ticketsResult = await pool.query(ticketsQuery, [id]);

    // Get recent tickets (last 10)
    const recentTicketsQuery = `
      SELECT t.*, c.name as customer_name, c.phone as customer_phone,
             CASE 
               WHEN t.status = 'completed' THEN 'completed'
               WHEN t.status = 'cancelled' THEN 'cancelled'
               ELSE 'active'
             END as ticket_category
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.assigned_technician_id = $1
      ORDER BY t.created_at DESC
      LIMIT 10
    `;
    const recentTicketsResult = await pool.query(recentTicketsQuery, [id]);

    // Get comprehensive statistics
    const statsQuery = `
      SELECT 
        COUNT(t.id) as total_tickets,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tickets,
        COUNT(CASE WHEN t.status IN ('assigned', 'in_progress') THEN 1 END) as active_tickets,
        COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tickets,
        COUNT(CASE WHEN t.status = 'cancelled' THEN 1 END) as cancelled_tickets,
        COALESCE(AVG(CASE WHEN t.customer_rating IS NOT NULL THEN t.customer_rating END), 0) as avg_rating,
        COALESCE(
          ROUND(
            (COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::numeric / 
            NULLIF(COUNT(t.id), 0)) * 100, 
          1),
          0
        ) as completion_rate,
        COUNT(CASE WHEN t.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as tickets_this_month,
        COUNT(CASE WHEN t.status = 'completed' AND t.updated_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as completed_this_month
      FROM tickets t
      WHERE t.assigned_technician_id = $1
    `;
    const statsResult = await pool.query(statsQuery, [id]);

    res.json({
      success: true,
      data: {
        technician,
        skills: skillsResult.rows,
        schedule: scheduleResult.rows,
        performance: performanceResult.rows,
        equipment: equipmentResult.rows,
        specializations: specializationsResult.rows,
        location_history: locationResult.rows,
        active_tickets: ticketsResult.rows,
        recent_tickets: recentTicketsResult.rows,
        stats: statsResult.rows[0]
      }
    });

  } catch (error) {
    console.error('Get technician error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new technician
router.post('/', [
  body('user_id').isInt().withMessage('User ID is required'),
  body('employee_id').notEmpty().withMessage('Employee ID is required'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('hire_date').isDate().withMessage('Valid hire date is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('skill_level').isIn(['junior', 'senior', 'expert', 'specialist']).withMessage('Valid skill level is required'),
  body('work_zone').notEmpty().withMessage('Work zone is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      user_id, employee_id, full_name, phone, phone_alt, email, address,
      emergency_contact_name, emergency_contact_phone, hire_date, employment_status,
      position, department, supervisor_id, skill_level, specializations,
      work_zone, max_daily_tickets, preferred_shift
    } = req.body;

    // VALIDATION: Check if user_id already has technician profile
    if (user_id) {
      const existingTech = await pool.query(
        'SELECT id, employee_id FROM technicians WHERE user_id = $1',
        [user_id]
      );

      if (existingTech.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: `This user already has a technician profile (${existingTech.rows[0].employee_id}). Cannot create duplicate.`
        });
      }

      // Verify user exists and has technician role
      const userCheck = await pool.query(
        'SELECT id, role, full_name, email, phone FROM users WHERE id = $1',
        [user_id]
      );

      if (userCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User not found'
        });
      }

      if (userCheck.rows[0].role !== 'technician') {
        return res.status(400).json({
          success: false,
          message: `User role must be 'technician' (current: ${userCheck.rows[0].role})`
        });
      }
    }

    const query = `
      INSERT INTO technicians (
        user_id, employee_id, full_name, phone, phone_alt, email, address,
        emergency_contact_name, emergency_contact_phone, hire_date, employment_status,
        position, department, supervisor_id, skill_level, specializations,
        work_zone, max_daily_tickets, preferred_shift, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING *
    `;

    const values = [
      user_id, employee_id, full_name, phone, phone_alt || null, email, address || null,
      emergency_contact_name || null, emergency_contact_phone || null, hire_date,
      employment_status || 'active', position, department || 'field_operations',
      supervisor_id || null, skill_level, specializations || [],
      work_zone, max_daily_tickets || 8, preferred_shift || 'day', req.user.id
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      data: {
        technician: result.rows[0]
      },
      message: 'Technician created successfully'
    });

  } catch (error) {
    console.error('Create technician error:', error);
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Employee ID already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update technician
router.put('/:id', [
  body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('skill_level').optional().isIn(['junior', 'senior', 'expert', 'specialist']).withMessage('Valid skill level is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    // Build dynamic update query
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== 'id') {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        values.push(req.body[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    // Add updated_by and updated_at
    paramCount++;
    updateFields.push(`updated_by = $${paramCount}`);
    values.push(req.user.id);

    paramCount++;
    values.push(id);

    const query = `
      UPDATE technicians 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    res.json({
      success: true,
      data: {
        technician: result.rows[0]
      },
      message: 'Technician updated successfully'
    });

  } catch (error) {
    console.error('Update technician error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update technician availability status
router.patch('/:id/availability', [
  body('availability_status').isIn(['available', 'busy', 'break', 'offline']).withMessage('Valid availability status is required'),
  body('latitude').optional().isFloat().withMessage('Valid latitude is required'),
  body('longitude').optional().isFloat().withMessage('Valid longitude is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { availability_status, latitude, longitude } = req.body;

    // Update availability status
    const updateQuery = `
      UPDATE technicians 
      SET availability_status = $1,
          current_latitude = COALESCE($2, current_latitude),
          current_longitude = COALESCE($3, current_longitude),
          last_location_update = CASE WHEN $2 IS NOT NULL AND $3 IS NOT NULL THEN CURRENT_TIMESTAMP ELSE last_location_update END,
          is_available = CASE WHEN $1 = 'available' THEN true ELSE false END
      WHERE id = $4
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [availability_status, latitude, longitude, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    // Log location if provided
    if (latitude && longitude) {
      const locationQuery = `
        INSERT INTO technician_location_history (
          technician_id, latitude, longitude, activity_type, recorded_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `;
      await pool.query(locationQuery, [id, latitude, longitude, 'stationary']);
    }

    res.json({
      success: true,
      data: {
        technician: result.rows[0]
      },
      message: 'Availability status updated successfully'
    });

  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add skill to technician
router.post('/:id/skills', [
  body('skill_name').notEmpty().withMessage('Skill name is required'),
  body('skill_category').isIn(['technical', 'soft', 'certification']).withMessage('Valid skill category is required'),
  body('proficiency_level').isInt({ min: 1, max: 5 }).withMessage('Proficiency level must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { skill_name, skill_category, proficiency_level, notes } = req.body;

    const query = `
      INSERT INTO technician_skills (
        technician_id, skill_name, skill_category, proficiency_level, 
        notes, verified_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      id, skill_name, skill_category, proficiency_level, notes || null, req.user.id
    ]);

    res.status(201).json({
      success: true,
      data: {
        skill: result.rows[0]
      },
      message: 'Skill added successfully'
    });

  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get technician statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_technicians,
        COUNT(CASE WHEN employment_status = 'active' THEN 1 END) as active_technicians,
        COUNT(CASE WHEN availability_status = 'available' THEN 1 END) as available_technicians,
        COUNT(CASE WHEN availability_status = 'busy' THEN 1 END) as busy_technicians,
        COUNT(CASE WHEN skill_level = 'junior' THEN 1 END) as junior_technicians,
        COUNT(CASE WHEN skill_level = 'senior' THEN 1 END) as senior_technicians,
        COUNT(CASE WHEN skill_level = 'expert' THEN 1 END) as expert_technicians,
        COUNT(CASE WHEN skill_level = 'specialist' THEN 1 END) as specialist_technicians,
        AVG(customer_rating) as avg_customer_rating,
        AVG(sla_compliance_rate) as avg_sla_compliance
      FROM technicians
      WHERE employment_status = 'active'
    `;

    const result = await pool.query(statsQuery);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get technician stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get available technicians for assignment
router.get('/available/assignment', async (req, res) => {
  try {
    const { work_zone, specialization, skill_level } = req.query;

    let query = `
      SELECT t.id, t.employee_id, t.full_name, t.phone, t.skill_level,
             t.specializations, t.work_zone, t.current_latitude, t.current_longitude,
             t.max_daily_tickets, 
             COUNT(tt.id) as current_tickets,
             AVG(tp.customer_satisfaction_avg) as avg_rating
      FROM technicians t
      LEFT JOIN tickets tt ON t.id = tt.assigned_technician_id AND tt.status IN ('assigned', 'in_progress')
      LEFT JOIN technician_performance tp ON t.id = tp.technician_id
      WHERE t.employment_status = 'active' 
        AND t.availability_status = 'available'
        AND t.is_available = true
    `;
    const params = [];
    let paramCount = 0;

    if (work_zone) {
      paramCount++;
      query += ` AND t.work_zone = $${paramCount}`;
      params.push(work_zone);
    }

    if (specialization) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(t.specializations)`;
      params.push(specialization);
    }

    if (skill_level) {
      paramCount++;
      query += ` AND t.skill_level = $${paramCount}`;
      params.push(skill_level);
    }

    query += ` 
      GROUP BY t.id, t.employee_id, t.full_name, t.phone, t.skill_level,
               t.specializations, t.work_zone, t.current_latitude, t.current_longitude,
               t.max_daily_tickets
      HAVING COUNT(tt.id) < t.max_daily_tickets
      ORDER BY AVG(tp.customer_satisfaction_avg) DESC NULLS LAST, COUNT(tt.id) ASC
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        technicians: result.rows
      }
    });

  } catch (error) {
    console.error('Get available technicians error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete technician
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if technician exists
    const technicianCheck = await pool.query(
      'SELECT id, full_name FROM technicians WHERE id = $1',
      [id]
    );

    if (technicianCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    // Check if technician has active tickets
    const activeTicketsCheck = await pool.query(
      `SELECT COUNT(*) as count FROM tickets 
       WHERE assigned_technician_id = $1 AND status IN ('assigned', 'in_progress')`,
      [id]
    );

    if (parseInt(activeTicketsCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete technician with active tickets. Please reassign or complete all tickets first.'
      });
    }

    // Delete technician (cascading will handle related records)
    await pool.query('DELETE FROM technicians WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Technician deleted successfully',
      data: {
        deleted_technician: technicianCheck.rows[0]
      }
    });

  } catch (error) {
    console.error('Delete technician error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;