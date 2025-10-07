const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// Get all technicians
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, availability_status, service_area, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*, u.username, u.email, u.full_name, u.phone, u.is_active,
             s.username as supervisor_name
      FROM technicians t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users s ON t.supervisor_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (availability_status) {
      paramCount++;
      query += ` AND t.availability_status = $${paramCount}`;
      params.push(availability_status);
    }

    if (service_area) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(t.service_areas)`;
      params.push(service_area);
    }

    if (search) {
      paramCount++;
      query += ` AND (u.full_name ILIKE $${paramCount} OR t.employee_id ILIKE $${paramCount} OR u.phone ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY u.full_name LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) FROM technicians t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (availability_status) {
      countParamCount++;
      countQuery += ` AND t.availability_status = $${countParamCount}`;
      countParams.push(availability_status);
    }

    if (service_area) {
      countParamCount++;
      countQuery += ` AND $${countParamCount} = ANY(t.service_areas)`;
      countParams.push(service_area);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (u.full_name ILIKE $${countParamCount} OR t.employee_id ILIKE $${countParamCount} OR u.phone ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
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

// Get technician by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT t.*, u.username, u.email, u.full_name, u.phone, u.is_active,
             s.username as supervisor_name,
             COUNT(tk.id) as total_tickets,
             COUNT(CASE WHEN tk.status = 'completed' THEN 1 END) as completed_tickets,
             COUNT(CASE WHEN tk.status IN ('assigned', 'in_progress') THEN 1 END) as active_tickets
      FROM technicians t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users s ON t.supervisor_id = s.id
      LEFT JOIN tickets tk ON t.id = tk.assigned_technician_id
      WHERE t.id = $1
      GROUP BY t.id, u.id, s.id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    res.json({
      success: true,
      data: { technician: result.rows[0] }
    });

  } catch (error) {
    console.error('Get technician error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new technician (admin/supervisor only)
router.post('/', [
  authorize('admin', 'supervisor'),
  body('user_id').isInt().withMessage('User ID is required'),
  body('employee_id').notEmpty().withMessage('Employee ID is required'),
  body('skills').isArray().withMessage('Skills must be an array'),
  body('service_areas').isArray().withMessage('Service areas must be an array'),
  body('hire_date').isISO8601().withMessage('Please provide a valid hire date')
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
      user_id, employee_id, skills, service_areas, 
      max_daily_tickets, supervisor_id, hire_date 
    } = req.body;

    // Check if user exists and is a technician
    const userCheck = await pool.query(
      'SELECT id, role FROM users WHERE id = $1 AND role = $2',
      [user_id, 'technician']
    );

    if (userCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User not found or not a technician'
      });
    }

    // Check if technician profile already exists
    const technicianCheck = await pool.query(
      'SELECT id FROM technicians WHERE user_id = $1',
      [user_id]
    );

    if (technicianCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Technician profile already exists for this user'
      });
    }

    const query = `
      INSERT INTO technicians (user_id, employee_id, skills, service_areas, 
                             max_daily_tickets, supervisor_id, hire_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      user_id, employee_id, skills, service_areas,
      max_daily_tickets || 8, supervisor_id, hire_date
    ]);

    res.status(201).json({
      success: true,
      message: 'Technician created successfully',
      data: { technician: result.rows[0] }
    });

  } catch (error) {
    console.error('Create technician error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update technician
router.put('/:id', [
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('service_areas').optional().isArray().withMessage('Service areas must be an array'),
  body('availability_status').optional().isIn(['available', 'busy', 'off_duty', 'on_break']).withMessage('Invalid availability status')
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
      skills, service_areas, availability_status, 
      max_daily_tickets, supervisor_id, current_location 
    } = req.body;

    // Check if technician exists
    const technicianCheck = await pool.query(
      'SELECT user_id FROM technicians WHERE id = $1',
      [id]
    );

    if (technicianCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    // Check permissions - technicians can only update their own profile (limited fields)
    if (req.user.role === 'technician') {
      const technicianUserId = technicianCheck.rows[0].user_id;
      if (req.user.id !== technicianUserId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      // Technicians can only update availability_status and current_location
      if (skills || service_areas || max_daily_tickets || supervisor_id) {
        return res.status(403).json({
          success: false,
          message: 'Technicians can only update availability status and location'
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (skills && req.user.role !== 'technician') {
      paramCount++;
      updates.push(`skills = $${paramCount}`);
      params.push(skills);
    }

    if (service_areas && req.user.role !== 'technician') {
      paramCount++;
      updates.push(`service_areas = $${paramCount}`);
      params.push(service_areas);
    }

    if (availability_status) {
      paramCount++;
      updates.push(`availability_status = $${paramCount}`);
      params.push(availability_status);
    }

    if (max_daily_tickets && req.user.role !== 'technician') {
      paramCount++;
      updates.push(`max_daily_tickets = $${paramCount}`);
      params.push(max_daily_tickets);
    }

    if (supervisor_id && req.user.role !== 'technician') {
      paramCount++;
      updates.push(`supervisor_id = $${paramCount}`);
      params.push(supervisor_id);
    }

    if (current_location) {
      paramCount++;
      const locationPoint = `(${current_location.lng}, ${current_location.lat})`;
      updates.push(`current_location = $${paramCount}`);
      params.push(locationPoint);
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
      UPDATE technicians 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Technician updated successfully',
      data: { technician: result.rows[0] }
    });

  } catch (error) {
    console.error('Update technician error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get available technicians for assignment
router.get('/available/for-assignment', async (req, res) => {
  try {
    const { service_area, skills_required } = req.query;

    let query = `
      SELECT t.*, u.full_name, u.phone,
             COUNT(tk.id) as current_tickets
      FROM technicians t
      JOIN users u ON t.user_id = u.id AND u.is_active = true
      LEFT JOIN tickets tk ON t.id = tk.assigned_technician_id 
                          AND tk.status IN ('assigned', 'in_progress')
      WHERE t.availability_status = 'available'
    `;
    const params = [];
    let paramCount = 0;

    if (service_area) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(t.service_areas)`;
      params.push(service_area);
    }

    if (skills_required) {
      const skillsArray = Array.isArray(skills_required) ? skills_required : [skills_required];
      paramCount++;
      query += ` AND t.skills @> $${paramCount}`;
      params.push(skillsArray);
    }

    query += `
      GROUP BY t.id, u.id
      HAVING COUNT(tk.id) < t.max_daily_tickets
      ORDER BY COUNT(tk.id), t.rating DESC
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: { technicians: result.rows }
    });

  } catch (error) {
    console.error('Get available technicians error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
