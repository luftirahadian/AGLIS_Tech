const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authMiddleware to all routes
router.use(authMiddleware);

// Get all users (admin/supervisor only)
router.get('/', authorize('admin', 'supervisor'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search, sort_by, sort_order } = req.query;

    let query = `
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role, 
             u.is_active, u.avatar_url, u.last_login, u.created_at, u.deleted_at,
             t.employee_id, t.availability_status
      FROM users u
      LEFT JOIN technicians t ON u.id = t.user_id
      WHERE u.deleted_at IS NULL
    `;
    const params = [];
    let paramCount = 0;

    if (role && role !== 'all') {
      paramCount++;
      query += ` AND u.role = $${paramCount}`;
      params.push(role);
    }

    if (status === 'active') {
      query += ` AND u.is_active = true`;
    } else if (status === 'inactive') {
      query += ` AND u.is_active = false`;
    }

    if (search) {
      paramCount++;
      query += ` AND (u.full_name ILIKE $${paramCount} OR u.username ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Sorting
    const allowedSortColumns = {
      'full_name': 'u.full_name',
      'username': 'u.username',
      'email': 'u.email',
      'role': 'u.role',
      'last_login': 'u.last_login',
      'is_active': 'u.is_active',
      'created_at': 'u.created_at'
    };
    
    const sortColumn = allowedSortColumns[sort_by] || 'u.created_at';
    const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortColumn} ${sortDirection}`;

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users u WHERE u.deleted_at IS NULL';
    const countParams = [];
    let countParamCount = 0;

    if (role && role !== 'all') {
      countParamCount++;
      countQuery += ` AND u.role = $${countParamCount}`;
      countParams.push(role);
    }

    if (status === 'active') {
      countQuery += ` AND u.is_active = true`;
    } else if (status === 'inactive') {
      countQuery += ` AND u.is_active = false`;
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (u.full_name ILIKE $${countParamCount} OR u.username ILIKE $${countParamCount} OR u.email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalRecords = parseInt(countResult.rows[0].total);
    
    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRecords,
        pages: Math.ceil(totalRecords / parseInt(limit))
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

// Create new user (admin only)
router.post('/', [
  authorize('admin'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('role').isIn(['admin', 'supervisor', 'technician', 'customer_service']).withMessage('Invalid role')
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

    const { username, email, password, full_name, phone, role, is_active = true } = req.body;

    // Check if username or email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, phone, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, email, full_name, phone, role, is_active, created_at`,
      [username, email, password_hash, full_name, phone, role, is_active]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: result.rows[0] }
    });

  } catch (error) {
    console.error('Create user error:', error);
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
             u.is_active, u.avatar_url, u.last_login, u.created_at, u.deleted_at,
             t.employee_id, t.skills, t.service_areas, t.availability_status, 
             t.rating, t.total_completed_tickets, t.hire_date
      FROM users u
      LEFT JOIN technicians t ON u.id = t.user_id
      WHERE u.id = $1 AND u.deleted_at IS NULL
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

// Reset user password (admin only)
router.post('/:id/reset-password', [
  authorize('admin'),
  body('new_password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
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
    const { new_password, force_change = true } = req.body;

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id, username, email, full_name FROM users WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [password_hash, id]
    );

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        user: userCheck.rows[0],
        temporary_password: new_password
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Soft delete user (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query; // Support permanent delete via query param

    // Cannot delete yourself
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    let result;
    if (permanent) {
      // Permanent delete (hard delete)
      result = await pool.query(
        'DELETE FROM users WHERE id = $1 RETURNING id, username',
        [id]
      );
    } else {
      // Soft delete
      result = await pool.query(
        `UPDATE users 
         SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $1
         WHERE id = $2 AND deleted_at IS NULL
         RETURNING id, username`,
        [req.user.id, id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found or already deleted'
      });
    }

    res.json({
      success: true,
      message: `User ${permanent ? 'permanently' : 'successfully'} deleted`
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Restore soft-deleted user (admin only)
router.post('/:id/restore', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE users 
       SET deleted_at = NULL, deleted_by = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING id, username, email, full_name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found or not deleted'
      });
    }

    res.json({
      success: true,
      message: 'User restored successfully',
      data: { user: result.rows[0] }
    });

  } catch (error) {
    console.error('Restore user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
