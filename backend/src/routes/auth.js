const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const {
  isAccountLocked,
  recordFailedLogin,
  resetFailedAttempts
} = require('../utils/accountLockout');
const { verifyCaptchaMiddleware, getRecaptchaConfig } = require('../utils/recaptchaVerify');

const router = express.Router();

// Get reCAPTCHA configuration (public endpoint)
router.get('/recaptcha-config', (req, res) => {
  try {
    const config = getRecaptchaConfig();
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Get reCAPTCHA config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Register new user
router.post('/register', authLimiter, [
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

    const { username, email, password, full_name, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this username or email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const newUser = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, phone, role) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, username, email, full_name, role, created_at`,
      [username, email, password_hash, full_name, phone, role]
    );

    const user = newUser.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login user
router.post('/login', authLimiter, verifyCaptchaMiddleware, [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { username, password } = req.body;

    // STEP 1: Check if account is locked
    const lockCheck = await isAccountLocked(username);
    if (lockCheck.locked) {
      console.log(`🔒 Login attempt blocked - Account locked: ${username}`);
      return res.status(423).json({ // 423 Locked
        success: false,
        message: lockCheck.message,
        locked: true,
        requiresAdminUnlock: lockCheck.requiresAdminUnlock,
        lockedUntil: lockCheck.lockedUntil,
        minutesRemaining: lockCheck.minutesRemaining,
        tier: lockCheck.tier
      });
    }

    // STEP 2: Find user by username or email
    const userQuery = `
      SELECT id, username, email, password_hash, full_name, role, is_active 
      FROM users 
      WHERE (username = $1 OR email = $1) AND is_active = true
    `;
    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      // Record failed attempt (user not found)
      await recordFailedLogin(username, req.ip, req.get('user-agent'));
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = userResult.rows[0];

    // STEP 3: Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // Record failed attempt and check if account should be locked
      const lockResult = await recordFailedLogin(username, req.ip, req.get('user-agent'));
      
      console.log(`❌ Failed login attempt for ${username} - Attempt ${lockResult.failedAttempts}`);
      
      if (lockResult.locked) {
        // Account just got locked
        return res.status(423).json({
          success: false,
          message: lockResult.lockoutMessage,
          locked: true,
          requiresAdminUnlock: lockResult.requiresAdminUnlock,
          failedAttempts: lockResult.failedAttempts,
          tier: lockResult.tier
        });
      }
      
      // Not locked yet, but show warning if close to lockout
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        warning: lockResult.warning,
        attemptsRemaining: lockResult.attemptsRemaining
      });
    }

    // STEP 4: Password correct - Reset failed attempts
    await resetFailedAttempts(user.id);

    // STEP 5: Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // STEP 6: Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    console.log(`✅ Successful login for ${username}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userQuery = `
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role, 
             u.avatar_url, u.last_login, u.created_at,
             t.employee_id, t.skill_level, t.specializations, t.availability_status, t.customer_rating
      FROM users u
      LEFT JOIN technicians t ON u.id = t.user_id
      WHERE u.id = $1
    `;
    
    const result = await pool.query(userQuery, [req.user.id]);
    const user = result.rows[0];

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update profile
router.put('/profile', [
  authMiddleware,
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').optional()
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

    const { full_name, email, phone } = req.body;

    // Check if email is already used by another user
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, req.user.id]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email is already in use by another user'
      });
    }

    // Update profile
    const updateQuery = `
      UPDATE users 
      SET full_name = $1, email = $2, phone = $3, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $4
      RETURNING id, username, email, full_name, phone, role
    `;
    
    const result = await pool.query(updateQuery, [full_name, email, phone, req.user.id]);
    const updatedUser = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change password
router.put('/change-password', [
  authMiddleware,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
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

    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = userResult.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
