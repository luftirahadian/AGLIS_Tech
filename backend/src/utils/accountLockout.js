const pool = require('../config/database');

/**
 * Account Lockout Service
 * Prevents brute force attacks by locking accounts after repeated failed login attempts
 * 
 * Lockout Tiers:
 * - Tier 1: 5 failed attempts → Lock for 5 minutes
 * - Tier 2: 10 failed attempts → Lock for 1 hour
 * - Tier 3: 15 failed attempts → Lock indefinitely (requires admin unlock)
 */

const LOCKOUT_CONFIG = {
  // Tier 1: First lockout (temporary)
  MAX_ATTEMPTS_TIER_1: 5,
  LOCKOUT_DURATION_TIER_1: 5 * 60 * 1000, // 5 minutes in milliseconds
  
  // Tier 2: Second lockout (longer temporary)
  MAX_ATTEMPTS_TIER_2: 10,
  LOCKOUT_DURATION_TIER_2: 60 * 60 * 1000, // 1 hour in milliseconds
  
  // Tier 3: Permanent lockout (requires admin)
  MAX_ATTEMPTS_TIER_3: 15,
  
  // Reset counter after 24 hours of no failed attempts
  RESET_AFTER_MS: 24 * 60 * 60 * 1000 // 24 hours
};

/**
 * Check if account is currently locked
 * @param {string} username - Username or email
 * @returns {Object} - { locked: boolean, message: string, ... }
 */
async function isAccountLocked(username) {
  try {
    const query = `
      SELECT id, username, failed_login_attempts, locked_until, last_failed_login
      FROM users
      WHERE username = $1 OR email = $1
    `;
    
    const result = await pool.query(query, [username]);
    
    if (result.rows.length === 0) {
      return { locked: false, message: null };
    }
    
    const user = result.rows[0];
    const now = new Date();
    
    // Check for Tier 3: Indefinite lock (15+ attempts, no locked_until set)
    if (user.failed_login_attempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS_TIER_3 && !user.locked_until) {
      return {
        locked: true,
        message: 'Account is locked indefinitely due to repeated failed login attempts. Please contact an administrator.',
        requiresAdminUnlock: true,
        userId: user.id,
        tier: 3
      };
    }
    
    // Check if temporary lock is still active
    if (user.locked_until && new Date(user.locked_until) > now) {
      const minutesRemaining = Math.ceil((new Date(user.locked_until) - now) / 60000);
      return {
        locked: true,
        message: `Account is temporarily locked. Please try again in ${minutesRemaining} minute(s).`,
        lockedUntil: user.locked_until,
        minutesRemaining,
        userId: user.id,
        tier: user.failed_login_attempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS_TIER_2 ? 2 : 1
      };
    }
    
    return { locked: false, message: null };
  } catch (error) {
    console.error('Check account lock error:', error);
    throw error;
  }
}

/**
 * Record failed login attempt and apply lockout if necessary
 * @param {string} username - Username or email
 * @param {string} ipAddress - IP address of the attempt
 * @param {string} userAgent - User agent string
 * @returns {Object} - { locked: boolean, failedAttempts: number, ... }
 */
async function recordFailedLogin(username, ipAddress, userAgent) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Find user
    const userQuery = `
      SELECT id, username, failed_login_attempts, last_failed_login
      FROM users
      WHERE username = $1 OR email = $1
    `;
    const userResult = await client.query(userQuery, [username]);
    
    if (userResult.rows.length === 0) {
      // Log failed attempt even if user doesn't exist (for security monitoring)
      await client.query(
        'INSERT INTO failed_login_attempts (username, ip_address, user_agent, reason) VALUES ($1, $2, $3, $4)',
        [username, ipAddress, userAgent, 'user_not_found']
      );
      await client.query('COMMIT');
      return { locked: false, message: 'Invalid credentials' };
    }
    
    const user = userResult.rows[0];
    const now = new Date();
    
    // Check if we should reset counter (24 hours since last failed login)
    let failedAttempts = user.failed_login_attempts || 0;
    if (user.last_failed_login) {
      const hoursSinceLastFail = (now - new Date(user.last_failed_login)) / (60 * 60 * 1000);
      if (hoursSinceLastFail >= 24) {
        failedAttempts = 0; // Reset counter after 24 hours
      }
    }
    
    failedAttempts += 1;
    
    // Determine lockout based on tier
    let lockedUntil = null;
    let lockoutMessage = null;
    let tier = 0;
    
    if (failedAttempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS_TIER_3) {
      // Tier 3: Indefinite lock (requires admin unlock)
      lockedUntil = null; // NULL means indefinite when attempts >= 15
      lockoutMessage = 'Account locked indefinitely after 15 failed attempts. Contact administrator to unlock.';
      tier = 3;
    } else if (failedAttempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS_TIER_2) {
      // Tier 2: 1 hour lock
      lockedUntil = new Date(now.getTime() + LOCKOUT_CONFIG.LOCKOUT_DURATION_TIER_2);
      lockoutMessage = `Account locked for 1 hour after ${failedAttempts} failed attempts.`;
      tier = 2;
    } else if (failedAttempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS_TIER_1) {
      // Tier 1: 5 minutes lock
      lockedUntil = new Date(now.getTime() + LOCKOUT_CONFIG.LOCKOUT_DURATION_TIER_1);
      lockoutMessage = `Account locked for 5 minutes after ${failedAttempts} failed attempts.`;
      tier = 1;
    }
    
    // Update user record
    await client.query(
      `UPDATE users 
       SET failed_login_attempts = $1, 
           last_failed_login = $2,
           locked_until = $3
       WHERE id = $4`,
      [failedAttempts, now, lockedUntil, user.id]
    );
    
    // Log failed attempt
    await client.query(
      'INSERT INTO failed_login_attempts (username, ip_address, user_agent, reason, user_id) VALUES ($1, $2, $3, $4, $5)',
      [username, ipAddress, userAgent, 'invalid_password', user.id]
    );
    
    await client.query('COMMIT');
    
    const attemptsRemaining = LOCKOUT_CONFIG.MAX_ATTEMPTS_TIER_1 - failedAttempts;
    
    return {
      locked: tier > 0,
      failedAttempts,
      attemptsRemaining: Math.max(0, attemptsRemaining),
      lockedUntil,
      lockoutMessage,
      requiresAdminUnlock: tier === 3,
      tier,
      warning: tier === 0 && attemptsRemaining > 0 && attemptsRemaining <= 2
        ? `Warning: ${attemptsRemaining} attempt(s) remaining before lockout.`
        : null
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Record failed login error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Reset failed login attempts (called on successful login)
 * @param {number} userId - User ID
 */
async function resetFailedAttempts(userId) {
  try {
    await pool.query(
      `UPDATE users 
       SET failed_login_attempts = 0, 
           last_failed_login = NULL,
           locked_until = NULL
       WHERE id = $1`,
      [userId]
    );
    console.log(`✅ Reset failed attempts for user ${userId}`);
  } catch (error) {
    console.error('Reset failed attempts error:', error);
    throw error;
  }
}

/**
 * Unlock account (admin action)
 * @param {number} userId - User ID to unlock
 * @param {number} adminId - Admin user ID performing the unlock
 * @returns {Object} - { success: boolean, user: object }
 */
async function unlockAccount(userId, adminId) {
  try {
    const result = await pool.query(
      `UPDATE users 
       SET failed_login_attempts = 0, 
           last_failed_login = NULL,
           locked_until = NULL
       WHERE id = $1
       RETURNING id, username, email, failed_login_attempts`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }
    
    // Log activity
    try {
      const { logActivity } = require('./activityLogger');
      await logActivity({
        userId: adminId,
        action: 'account_unlocked',
        targetUserId: userId,
        targetUsername: result.rows[0].username,
        details: { reason: 'admin_unlock', previous_attempts: result.rows[0].failed_login_attempts }
      });
    } catch (logError) {
      console.error('Failed to log unlock activity:', logError);
      // Continue even if logging fails
    }
    
    console.log(`✅ Account unlocked for user ${userId} by admin ${adminId}`);
    
    return { success: true, user: result.rows[0] };
  } catch (error) {
    console.error('Unlock account error:', error);
    throw error;
  }
}

/**
 * Get account lock status
 * @param {number} userId - User ID
 * @returns {Object} - Lock status details
 */
async function getLockStatus(userId) {
  try {
    const query = `
      SELECT id, username, failed_login_attempts, locked_until, last_failed_login
      FROM users
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    const now = new Date();
    
    let status = 'active';
    let message = null;
    let minutesRemaining = null;
    let tier = 0;
    
    if (user.failed_login_attempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS_TIER_3 && !user.locked_until) {
      status = 'locked_indefinitely';
      message = 'Account is locked indefinitely and requires administrator unlock.';
      tier = 3;
    } else if (user.locked_until && new Date(user.locked_until) > now) {
      status = 'locked_temporarily';
      minutesRemaining = Math.ceil((new Date(user.locked_until) - now) / 60000);
      message = `Account is temporarily locked for ${minutesRemaining} more minute(s).`;
      tier = user.failed_login_attempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS_TIER_2 ? 2 : 1;
    } else if (user.failed_login_attempts > 0) {
      status = 'warning';
      const attemptsRemaining = LOCKOUT_CONFIG.MAX_ATTEMPTS_TIER_1 - user.failed_login_attempts;
      if (attemptsRemaining > 0) {
        message = `Warning: ${attemptsRemaining} login attempt(s) remaining before lockout.`;
      }
    }
    
    return {
      status,
      tier,
      failedAttempts: user.failed_login_attempts,
      lockedUntil: user.locked_until,
      lastFailedLogin: user.last_failed_login,
      message,
      minutesRemaining,
      requiresAdminUnlock: tier === 3
    };
  } catch (error) {
    console.error('Get lock status error:', error);
    throw error;
  }
}

/**
 * Get recent failed login attempts for monitoring
 * @param {Object} options - Query options
 * @returns {Array} - Failed login attempts
 */
async function getRecentFailedAttempts(options = {}) {
  try {
    const {
      hours = 24,
      limit = 100,
      username = null,
      ipAddress = null
    } = options;
    
    let query = `
      SELECT fla.*, u.username as actual_username, u.email
      FROM failed_login_attempts fla
      LEFT JOIN users u ON fla.user_id = u.id
      WHERE attempted_at > NOW() - INTERVAL '${hours} hours'
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (username) {
      paramCount++;
      query += ` AND fla.username = $${paramCount}`;
      params.push(username);
    }
    
    if (ipAddress) {
      paramCount++;
      query += ` AND fla.ip_address = $${paramCount}`;
      params.push(ipAddress);
    }
    
    query += ` ORDER BY attempted_at DESC LIMIT ${limit}`;
    
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Get recent failed attempts error:', error);
    throw error;
  }
}

module.exports = {
  LOCKOUT_CONFIG,
  isAccountLocked,
  recordFailedLogin,
  resetFailedAttempts,
  unlockAccount,
  getLockStatus,
  getRecentFailedAttempts
};


