const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin/supervisor only)
router.get('/', authorize('admin', 'supervisor'), async (req, res) => {
  try {
    const { page, limit, role, search } = req.query;

    let query = `
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role, 
             u.is_active, u.avatar_url, u.last_login, u.created_at,
             t.employee_id, t.availability_status
      FROM users u
      LEFT JOIN technicians t ON u.id = t.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      query += ` AND u.role = $${paramCount}`;
      params.push(role);
    }

    if (search) {
      paramCount++;
      query += ` AND (u.full_name ILIKE $${paramCount} OR u.username ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC`;
    
    // Only add pagination if page and limit are provided
    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);
    }

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users u WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (role) {
      countParamCount++;
      countQuery += ` AND u.role = $${countParamCount}`;
      countParams.push(role);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (u.full_name ILIKE $${countParamCount} OR u.username ILIKE $${countParamCount} OR u.email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user can access this profile
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const query = `
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role, 
             u.is_active, u.avatar_url, u.last_login, u.created_at,
             t.employee_id, t.skills, t.service_areas, t.availability_status, 
             t.rating, t.total_completed_tickets, t.hire_date
      FROM users u
      LEFT JOIN technicians t ON u.id = t.user_id
      WHERE u.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user: result.rows[0] }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user
router.put('/:id', [
  body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('role').optional().isIn(['admin', 'supervisor', 'technician', 'customer_service']).withMessage('Invalid role')
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
    const { full_name, email, phone, role, is_active } = req.body;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only admin can change role and is_active
    if ((role || is_active !== undefined) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can change role or account status'
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (full_name) {
      paramCount++;
      updates.push(`full_name = $${paramCount}`);
      params.push(full_name);
    }

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

    if (role && req.user.role === 'admin') {
      paramCount++;
      updates.push(`role = $${paramCount}`);
      params.push(role);
    }

    if (is_active !== undefined && req.user.role === 'admin') {
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
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, username, email, full_name, phone, role, is_active, updated_at
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: result.rows[0] }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete user (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Cannot delete yourself
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, username',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
