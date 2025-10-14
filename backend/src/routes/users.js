const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authMiddleware, authorize } = require('../middleware/auth');
const { logActivity, getActivityLogs } = require('../utils/activityLogger');
const { createUserLimiter } = require('../middleware/rateLimiter');
const { unlockAccount, getLockStatus } = require('../utils/accountLockout');

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
             u.email_verified, u.email_verified_at,
             u.failed_login_attempts, u.locked_until, u.last_failed_login,
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
router.post('/', createUserLimiter, [
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

    const { username, email, password, full_name, phone, role, is_active = true, work_zone } = req.body;

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

    // Start transaction for atomic user + technician creation
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (username, email, password_hash, full_name, phone, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, username, email, full_name, phone, role, is_active, created_at`,
        [username, email, password_hash, full_name, phone, role, is_active]
      );

      const newUser = userResult.rows[0];
      let technicianProfile = null;

      // AUTO-CREATE TECHNICIAN PROFILE if role is 'technician'
      if (role === 'technician') {
        // Generate employee_id automatically
        const employeeIdResult = await client.query(
          `SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1 as next_num
           FROM technicians 
           WHERE employee_id ~ '^TEC[0-9]+$'`
        );
        const nextNum = employeeIdResult.rows[0].next_num;
        const employee_id = `TEC${String(nextNum).padStart(4, '0')}`; // e.g., TEC0001

        // Create technician profile with default values
        const techResult = await client.query(
          `INSERT INTO technicians (
            user_id, employee_id, full_name, phone, email,
            hire_date, employment_status, position, department,
            skill_level, work_zone, max_daily_tickets,
            availability_status, is_available, created_by
          ) VALUES (
            $1, $2, $3, $4, $5, 
            CURRENT_DATE, $6, 'Field Technician', 'field_operations',
            'junior', $7, 8,
            'offline', false, $8
          ) RETURNING *`,
          [
            newUser.id, 
            employee_id, 
            full_name, 
            phone, 
            email,
            is_active ? 'active' : 'inactive',
            work_zone || 'karawang', // Use provided work_zone or default to karawang
            req.user.id
          ]
        );

        technicianProfile = techResult.rows[0];
        console.log(`✅ Auto-created technician profile ${employee_id} for user ${username}`);
      }

      await client.query('COMMIT');

      // Log activity
      await logActivity({
        userId: req.user.id,
        action: 'created',
        targetUserId: newUser.id,
        targetUsername: username,
        details: { 
          role, 
          is_active,
          auto_created_technician: role === 'technician',
          technician_employee_id: technicianProfile?.employee_id
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.status(201).json({
        success: true,
        message: role === 'technician' 
          ? `User and technician profile created successfully (${technicianProfile.employee_id})`
          : 'User created successfully',
        data: { 
          user: newUser,
          technician: technicianProfile
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

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
             u.email_verified, u.email_verified_at,
             u.failed_login_attempts, u.locked_until, u.last_failed_login,
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
    const { full_name, email, phone, role, is_active, work_zone } = req.body;

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

    // Start transaction for user + technician sync
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE users 
        SET ${updates.join(', ')} 
        WHERE id = $${paramCount}
        RETURNING id, username, email, full_name, phone, role, is_active, updated_at
      `;

      const result = await client.query(query, params);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updatedUser = result.rows[0];

      // AUTO-SYNC to technician profile if exists
      const techCheck = await client.query(
        'SELECT id FROM technicians WHERE user_id = $1',
        [id]
      );

      if (techCheck.rows.length > 0) {
        // Build technician sync updates
        const techUpdates = [];
        const techParams = [];
        let techParamCount = 0;

        if (full_name) {
          techParamCount++;
          techUpdates.push(`full_name = $${techParamCount}`);
          techParams.push(full_name);
        }

        if (email) {
          techParamCount++;
          techUpdates.push(`email = $${techParamCount}`);
          techParams.push(email);
        }

        if (phone) {
          techParamCount++;
          techUpdates.push(`phone = $${techParamCount}`);
          techParams.push(phone);
        }

        // Sync is_active to employment_status
        if (is_active !== undefined) {
          techParamCount++;
          techUpdates.push(`employment_status = $${techParamCount}`);
          techParams.push(is_active ? 'active' : 'inactive');
        }

        if (techUpdates.length > 0) {
          techParamCount++;
          techParams.push(id);

          await client.query(`
            UPDATE technicians
            SET ${techUpdates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $${techParamCount}
          `, techParams);

          console.log(`✅ Auto-synced technician profile for user ID ${id}`);
        }
      }

      // PREVENT role change if technician profile exists (unless changing TO technician)
      if (role && role !== 'technician' && techCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Cannot change role from technician. User has an active technician profile. Please delete technician profile first or keep role as technician.'
        });
      }

      // AUTO-CREATE technician profile if role changed TO technician
      if (role === 'technician' && techCheck.rows.length === 0) {
        const employeeIdResult = await client.query(
          `SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1 as next_num
           FROM technicians 
           WHERE employee_id ~ '^TEC[0-9]+$'`
        );
        const nextNum = employeeIdResult.rows[0].next_num;
        const employee_id = `TEC${String(nextNum).padStart(4, '0')}`;

        await client.query(
          `INSERT INTO technicians (
            user_id, employee_id, full_name, phone, email,
            hire_date, employment_status, position, department,
            skill_level, work_zone, max_daily_tickets,
            availability_status, is_available, created_by
          ) VALUES (
            $1, $2, $3, $4, $5, 
            CURRENT_DATE, $6, 'Field Technician', 'field_operations',
            'junior', $7, 8,
            'offline', false, $8
          )`,
          [
            updatedUser.id,
            employee_id,
            updatedUser.full_name,
            updatedUser.phone,
            updatedUser.email,
            updatedUser.is_active ? 'active' : 'inactive',
            work_zone || 'karawang',
            req.user.id
          ]
        );

        console.log(`✅ Auto-created technician profile ${employee_id} (role changed to technician)`);
      }

      await client.query('COMMIT');

      // Log activity
      await logActivity({
        userId: req.user.id,
        action: 'updated',
        targetUserId: parseInt(id),
        targetUsername: updatedUser.username,
        details: { full_name, email, phone, role, is_active },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user: updatedUser }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

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

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: 'password_reset',
      targetUserId: parseInt(id),
      targetUsername: userCheck.rows[0].username,
      details: { reset_by: 'admin' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

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

    // Check if user has technician profile
    const techCheck = await pool.query(
      'SELECT id, employee_id FROM technicians WHERE user_id = $1',
      [id]
    );

    // Check if technician has active tickets
    if (techCheck.rows.length > 0) {
      const activeTicketsCheck = await pool.query(
        `SELECT COUNT(*) as count FROM tickets 
         WHERE assigned_technician_id = $1 AND status IN ('assigned', 'in_progress')`,
        [techCheck.rows[0].id]
      );

      if (parseInt(activeTicketsCheck.rows[0].count) > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete user with active tickets. Technician has assigned/in-progress tickets. Please reassign or complete all tickets first.'
        });
      }
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      let result;
      if (permanent) {
        // Permanent delete (hard delete) - will CASCADE to technicians
        result = await client.query(
          'DELETE FROM users WHERE id = $1 RETURNING id, username',
          [id]
        );
      } else {
        // Soft delete user
        result = await client.query(
          `UPDATE users 
           SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $1, is_active = false
           WHERE id = $2 AND deleted_at IS NULL
           RETURNING id, username, role`,
          [req.user.id, id]
        );

        // Also deactivate technician profile if exists
        if (result.rows.length > 0 && result.rows[0].role === 'technician' && techCheck.rows.length > 0) {
          await client.query(
            `UPDATE technicians 
             SET employment_status = 'inactive', 
                 is_available = false,
                 availability_status = 'offline',
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1`,
            [id]
          );
          console.log(`✅ Auto-deactivated technician profile ${techCheck.rows[0].employee_id}`);
        }
      }

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'User not found or already deleted'
        });
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: permanent ? 'deleted_permanent' : 'deleted',
      targetUserId: parseInt(id),
      targetUsername: result.rows[0].username,
      details: { permanent },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

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

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE users 
         SET deleted_at = NULL, deleted_by = NULL, is_active = true, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND deleted_at IS NOT NULL
         RETURNING id, username, email, full_name, role`,
        [id]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'User not found or not deleted'
        });
      }

      const restoredUser = result.rows[0];

      // Also restore/reactivate technician profile if user is technician
      if (restoredUser.role === 'technician') {
        const techRestore = await client.query(
          `UPDATE technicians 
           SET employment_status = 'active',
               is_available = true,
               availability_status = 'available',
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $1
           RETURNING employee_id`,
          [id]
        );

        if (techRestore.rows.length > 0) {
          console.log(`✅ Auto-restored technician profile ${techRestore.rows[0].employee_id}`);
        }
      }

      await client.query('COMMIT');

      // Log activity
      await logActivity({
        userId: req.user.id,
        action: 'restored',
        targetUserId: parseInt(id),
        targetUsername: restoredUser.username,
        details: {},
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.json({
        success: true,
        message: 'User restored successfully',
        data: { user: restoredUser }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Restore user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get activity logs (admin/supervisor only)
router.get('/activity-logs/list', authorize('admin', 'supervisor'), async (req, res) => {
  try {
    const { user_id, target_user_id, action, limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const logs = await getActivityLogs({
      userId: user_id ? parseInt(user_id) : null,
      targetUserId: target_user_id ? parseInt(target_user_id) : null,
      action,
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: logs
    });

  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Unlock account (admin only)
router.post('/:id/unlock', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cannot unlock yourself
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot unlock your own account'
      });
    }
    
    const result = await unlockAccount(parseInt(id), req.user.id);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      message: 'Account unlocked successfully',
      data: { user: result.user }
    });
    
  } catch (error) {
    console.error('Unlock account error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get lock status (admin/supervisor only)
router.get('/:id/lock-status', authorize('admin', 'supervisor'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const status = await getLockStatus(parseInt(id));
    
    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error('Get lock status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
