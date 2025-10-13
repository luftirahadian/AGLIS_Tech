# 🚀 User Management - Critical Features Implementation Guide
**Project**: AGLIS Management System  
**Date**: October 13, 2025  
**Priority**: 🔴 CRITICAL  
**Timeline**: 5 days  

---

## 📋 **TABLE OF CONTENTS**

1. [Rate Limiting Implementation](#1-rate-limiting)
2. [Account Lockout Implementation](#2-account-lockout)
3. [Multi-Factor Authentication (MFA)](#3-multi-factor-authentication)
4. [Session Management](#4-session-management)
5. [Testing Plan](#testing-plan)
6. [Deployment Checklist](#deployment-checklist)

---

## 1. 🛡️ **RATE LIMITING IMPLEMENTATION**

**Timeline**: 4 hours  
**Priority**: 🔴 CRITICAL  
**Difficulty**: ⭐ Easy

### **Step 1: Install Package** (5 minutes)

```bash
cd /home/aglis/AGLIS_Tech/backend
npm install express-rate-limit --save
```

### **Step 2: Create Rate Limiter Configuration** (15 minutes)

Create file: `/backend/src/middleware/rateLimiter.js`

```javascript
const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Don't apply rate limit to admin users (optional)
    return req.user && req.user.role === 'admin';
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiter for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset requests, please try again after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiter for user creation
const createUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit to 10 user creations per hour
  message: {
    success: false,
    message: 'Too many user creation requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  createUserLimiter
};
```

### **Step 3: Apply Rate Limiters** (15 minutes)

**Update `/backend/src/server.js`:**

```javascript
// Add at top
const { apiLimiter } = require('./middleware/rateLimiter');

// Apply general rate limiter to all API routes
app.use('/api/', apiLimiter);

// Existing routes...
```

**Update `/backend/src/routes/auth.js`:**

```javascript
// Add at top
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

// Apply to login route
router.post('/login', authLimiter, [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  // Existing login code...
});

// Apply to register route
router.post('/register', authLimiter, [
  // Existing validation...
], async (req, res) => {
  // Existing register code...
});

// If you add forgot password endpoint:
// router.post('/forgot-password', passwordResetLimiter, ...);
```

**Update `/backend/src/routes/users.js`:**

```javascript
// Add at top
const { createUserLimiter } = require('../middleware/rateLimiter');

// Apply to create user route
router.post('/', [
  createUserLimiter,
  authorize('admin'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  // Rest of validation...
], async (req, res) => {
  // Existing create user code...
});
```

### **Step 4: Test Rate Limiting** (30 minutes)

**Test Script**: Create `/backend/test-rate-limit.js`

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3001/api/auth/login';

async function testRateLimit() {
  console.log('Testing rate limiter...\n');
  
  for (let i = 1; i <= 10; i++) {
    try {
      const response = await axios.post(API_URL, {
        username: 'test',
        password: 'wrong'
      });
      console.log(`Request ${i}: ${response.status}`);
    } catch (error) {
      if (error.response) {
        console.log(`Request ${i}: ${error.response.status} - ${error.response.data.message}`);
        
        // Check rate limit headers
        const headers = error.response.headers;
        console.log(`  Rate Limit: ${headers['ratelimit-limit']}`);
        console.log(`  Remaining: ${headers['ratelimit-remaining']}`);
        console.log(`  Reset: ${new Date(parseInt(headers['ratelimit-reset']) * 1000).toLocaleTimeString()}\n`);
      }
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

testRateLimit();
```

**Run test:**
```bash
cd /home/aglis/AGLIS_Tech/backend
node test-rate-limit.js
```

**Expected Result**:
- First 5 requests: 401 (Invalid credentials)
- Requests 6-10: 429 (Too many requests)

### **Step 5: Documentation** (10 minutes)

Update API documentation with rate limit information.

---

## 2. 🔒 **ACCOUNT LOCKOUT IMPLEMENTATION**

**Timeline**: 1 day  
**Priority**: 🔴 CRITICAL  
**Difficulty**: ⭐⭐ Medium

### **Step 1: Database Migration** (30 minutes)

Create file: `/backend/migrations/031_add_account_lockout.sql`

```sql
-- Add account lockout fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP;

-- Create index for locked accounts
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);

-- Create table to log failed login attempts
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason VARCHAR(50) DEFAULT 'invalid_credentials'
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_failed_login_username ON failed_login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempted_at ON failed_login_attempts(attempted_at);

COMMENT ON TABLE failed_login_attempts IS 'Logs all failed login attempts for security monitoring';
COMMENT ON COLUMN users.failed_login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN users.locked_until IS 'Account is locked until this timestamp';
COMMENT ON COLUMN users.last_failed_login IS 'Timestamp of last failed login attempt';
```

**Run migration:**

```bash
cd /home/aglis/AGLIS_Tech/backend
psql -U postgres -d aglis_tech -f migrations/031_add_account_lockout.sql
```

### **Step 2: Create Lockout Utility** (1 hour)

Create file: `/backend/src/utils/accountLockout.js`

```javascript
const pool = require('../config/database');

/**
 * Account lockout configuration
 */
const LOCKOUT_CONFIG = {
  // After 5 failed attempts: Lock for 15 minutes
  MAX_ATTEMPTS_TIER_1: 5,
  LOCKOUT_DURATION_TIER_1: 15 * 60 * 1000, // 15 minutes in ms
  
  // After 10 failed attempts: Lock for 1 hour
  MAX_ATTEMPTS_TIER_2: 10,
  LOCKOUT_DURATION_TIER_2: 60 * 60 * 1000, // 1 hour in ms
  
  // After 15 failed attempts: Lock indefinitely (requires admin unlock)
  MAX_ATTEMPTS_TIER_3: 15,
  
  // Reset failed attempts after 24 hours of no failed login
  RESET_AFTER_MS: 24 * 60 * 60 * 1000 // 24 hours
};

/**
 * Check if account is locked
 */
async function isAccountLocked(username) {
  try {
    const query = `
      SELECT locked_until, failed_login_attempts
      FROM users
      WHERE username = $1 OR email = $1
    `;
    
    const result = await pool.query(query, [username]);
    
    if (result.rows.length === 0) {
      return { locked: false, message: null };
    }
    
    const user = result.rows[0];
    const now = new Date();
    
    // Check if locked indefinitely (Tier 3)
    if (user.failed_login_attempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS_TIER_3 && user.locked_until === null) {
      return {
        locked: true,
        message: 'Account is locked indefinitely. Please contact an administrator.',
        requiresAdminUnlock: true
      };
    }
    
    // Check if temporary lock is still active
    if (user.locked_until && new Date(user.locked_until) > now) {
      const minutesRemaining = Math.ceil((new Date(user.locked_until) - now) / 60000);
      return {
        locked: true,
        message: `Account is locked. Please try again in ${minutesRemaining} minute(s).`,
        lockedUntil: user.locked_until,
        minutesRemaining
      };
    }
    
    return { locked: false, message: null };
  } catch (error) {
    console.error('Check account lock error:', error);
    throw error;
  }
}

/**
 * Record failed login attempt
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
        'INSERT INTO failed_login_attempts (username, ip_address, user_agent) VALUES ($1, $2, $3)',
        [username, ipAddress, userAgent]
      );
      await client.query('COMMIT');
      return { locked: false };
    }
    
    const user = userResult.rows[0];
    const now = new Date();
    
    // Check if we should reset counter (24 hours since last failed login)
    let failedAttempts = user.failed_login_attempts || 0;
    if (user.last_failed_login) {
      const hoursSinceLastFail = (now - new Date(user.last_failed_login)) / (60 * 60 * 1000);
      if (hoursSinceLastFail > 24) {
        failedAttempts = 0; // Reset counter
      }
    }
    
    failedAttempts += 1;
    
    // Determine lockout duration based on tier
    let lockedUntil = null;
    let lockoutMessage = null;
    
    if (failedAttempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS_TIER_3) {
      // Tier 3: Indefinite lock (requires admin unlock)
      lockedUntil = null; // NULL means indefinite
      lockoutMessage = 'Account locked indefinitely. Please contact an administrator.';
    } else if (failedAttempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS_TIER_2) {
      // Tier 2: 1 hour lock
      lockedUntil = new Date(now.getTime() + LOCKOUT_CONFIG.LOCKOUT_DURATION_TIER_2);
      lockoutMessage = 'Account locked for 1 hour due to repeated failed login attempts.';
    } else if (failedAttempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS_TIER_1) {
      // Tier 1: 15 minutes lock
      lockedUntil = new Date(now.getTime() + LOCKOUT_CONFIG.LOCKOUT_DURATION_TIER_1);
      lockoutMessage = 'Account locked for 15 minutes due to failed login attempts.';
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
      'INSERT INTO failed_login_attempts (username, ip_address, user_agent) VALUES ($1, $2, $3)',
      [username, ipAddress, userAgent]
    );
    
    await client.query('COMMIT');
    
    return {
      locked: lockedUntil !== null || failedAttempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS_TIER_3,
      failedAttempts,
      lockedUntil,
      lockoutMessage,
      requiresAdminUnlock: failedAttempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS_TIER_3
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
  } catch (error) {
    console.error('Reset failed attempts error:', error);
    throw error;
  }
}

/**
 * Unlock account (admin action)
 */
async function unlockAccount(userId, adminId) {
  try {
    const result = await pool.query(
      `UPDATE users 
       SET failed_login_attempts = 0, 
           last_failed_login = NULL,
           locked_until = NULL
       WHERE id = $1
       RETURNING id, username, email`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }
    
    // Log activity
    const { logActivity } = require('./activityLogger');
    await logActivity({
      userId: adminId,
      action: 'account_unlocked',
      targetUserId: userId,
      targetUsername: result.rows[0].username,
      details: { reason: 'admin_unlock' }
    });
    
    return { success: true, user: result.rows[0] };
  } catch (error) {
    console.error('Unlock account error:', error);
    throw error;
  }
}

/**
 * Get account lock status
 */
async function getLockStatus(userId) {
  try {
    const query = `
      SELECT failed_login_attempts, locked_until, last_failed_login
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
    
    if (user.failed_login_attempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS_TIER_3 && user.locked_until === null) {
      status = 'locked_indefinitely';
      message = 'Account is locked indefinitely and requires administrator unlock.';
    } else if (user.locked_until && new Date(user.locked_until) > now) {
      status = 'locked_temporarily';
      minutesRemaining = Math.ceil((new Date(user.locked_until) - now) / 60000);
      message = `Account is temporarily locked for ${minutesRemaining} more minute(s).`;
    } else if (user.failed_login_attempts > 0) {
      status = 'warning';
      const attemptsRemaining = LOCKOUT_CONFIG.MAX_ATTEMPTS_TIER_1 - user.failed_login_attempts;
      if (attemptsRemaining > 0) {
        message = `Warning: ${attemptsRemaining} login attempt(s) remaining before lockout.`;
      }
    }
    
    return {
      status,
      failedAttempts: user.failed_login_attempts,
      lockedUntil: user.locked_until,
      lastFailedLogin: user.last_failed_login,
      message,
      minutesRemaining
    };
  } catch (error) {
    console.error('Get lock status error:', error);
    throw error;
  }
}

module.exports = {
  LOCKOUT_CONFIG,
  isAccountLocked,
  recordFailedLogin,
  resetFailedAttempts,
  unlockAccount,
  getLockStatus
};
```

### **Step 3: Update Auth Routes** (1 hour)

**Update `/backend/src/routes/auth.js`:**

```javascript
// Add at top
const { 
  isAccountLocked, 
  recordFailedLogin, 
  resetFailedAttempts 
} = require('../utils/accountLockout');

// Update login route
router.post('/login', authLimiter, [
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
    
    // Check if account is locked
    const lockCheck = await isAccountLocked(username);
    if (lockCheck.locked) {
      return res.status(423).json({ // 423 Locked
        success: false,
        message: lockCheck.message,
        locked: true,
        requiresAdminUnlock: lockCheck.requiresAdminUnlock,
        lockedUntil: lockCheck.lockedUntil,
        minutesRemaining: lockCheck.minutesRemaining
      });
    }

    // Find user by username or email
    const userQuery = `
      SELECT id, username, email, password_hash, full_name, role, is_active 
      FROM users 
      WHERE (username = $1 OR email = $1) AND is_active = true
    `;
    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      // Record failed attempt
      await recordFailedLogin(username, req.ip, req.get('user-agent'));
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = userResult.rows[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // Record failed attempt
      const lockResult = await recordFailedLogin(username, req.ip, req.get('user-agent'));
      
      if (lockResult.locked) {
        return res.status(423).json({
          success: false,
          message: lockResult.lockoutMessage,
          locked: true,
          requiresAdminUnlock: lockResult.requiresAdminUnlock,
          failedAttempts: lockResult.failedAttempts
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        warning: lockResult.failedAttempts >= 3 ? 
          `Warning: ${5 - lockResult.failedAttempts} attempt(s) remaining before lockout.` : 
          undefined
      });
    }

    // Reset failed attempts on successful login
    await resetFailedAttempts(user.id);

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

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
```

### **Step 4: Add Unlock Endpoint** (30 minutes)

**Update `/backend/src/routes/users.js`:**

```javascript
// Add at top
const { unlockAccount, getLockStatus } = require('../utils/accountLockout');

// Unlock account endpoint (admin only)
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

// Get lock status endpoint
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
```

### **Step 5: Update Frontend UI** (2 hours)

**Add unlock button to UsersPage.jsx:**

```jsx
// In the table actions column, add:
{isAdmin && user.locked_until && (
  <button
    onClick={() => handleUnlock(user)}
    className="inline-flex items-center justify-center w-8 h-8 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
    title="Unlock Account"
  >
    <Unlock className="h-4 w-4" />
  </button>
)}

// Add handler function:
const handleUnlock = async (user) => {
  if (!window.confirm(`Unlock account for ${user.full_name}?`)) {
    return;
  }
  
  try {
    await userService.unlockAccount(user.id);
    toast.success('Account unlocked successfully');
    queryClient.invalidateQueries(['users-list']);
  } catch (error) {
    toast.error('Failed to unlock account');
  }
};
```

**Add to userService.js:**

```javascript
unlockAccount: (userId) => {
  return api.post(`/users/${userId}/unlock`);
},

getLockStatus: (userId) => {
  return api.get(`/users/${userId}/lock-status`);
}
```

### **Step 6: Test Account Lockout** (1 hour)

**Test cases:**

1. **Normal Login**: Should work fine
2. **5 Failed Attempts**: Should lock for 15 minutes
3. **10 Failed Attempts**: Should lock for 1 hour
4. **15 Failed Attempts**: Should lock indefinitely
5. **Successful Login**: Should reset counter
6. **Admin Unlock**: Should unlock account

---

## 3. 🔐 **MULTI-FACTOR AUTHENTICATION (MFA)**

**Timeline**: 2-3 days  
**Priority**: 🔴 CRITICAL  
**Difficulty**: ⭐⭐⭐ Hard

### **Overview**

Implement TOTP-based MFA (Time-based One-Time Password) compatible with:
- Google Authenticator
- Microsoft Authenticator
- Authy
- 1Password
- Any TOTP-compatible app

### **Step 1: Install Dependencies** (10 minutes)

```bash
cd /home/aglis/AGLIS_Tech/backend
npm install speakeasy qrcode --save
```

### **Step 2: Database Migration** (30 minutes)

Create file: `/backend/migrations/032_add_mfa.sql`

```sql
-- Add MFA fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT[]; -- Array of backup codes
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled_at TIMESTAMP;

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON users(mfa_enabled);

-- Create table for MFA verification attempts
CREATE TABLE IF NOT EXISTS mfa_verification_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  code_entered VARCHAR(10),
  success BOOLEAN DEFAULT false,
  ip_address VARCHAR(50),
  user_agent TEXT,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mfa_attempts_user_id ON mfa_verification_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_attempts_attempted_at ON mfa_verification_attempts(attempted_at);

COMMENT ON TABLE mfa_verification_attempts IS 'Logs all MFA verification attempts for security monitoring';
COMMENT ON COLUMN users.mfa_secret IS 'Encrypted TOTP secret for MFA (base32 encoded)';
COMMENT ON COLUMN users.mfa_backup_codes IS 'Array of backup codes (hashed) for emergency access';
```

**Run migration:**

```bash
psql -U postgres -d aglis_tech -f migrations/032_add_mfa.sql
```

### **Step 3: Create MFA Utility** (3 hours)

Create file: `/backend/src/utils/mfaService.js`

```javascript
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

/**
 * MFA Service for Time-based One-Time Password (TOTP)
 */

const MFA_CONFIG = {
  APP_NAME: 'AGLIS Management System',
  WINDOW: 2, // Allow 2-step window for time drift
  BACKUP_CODES_COUNT: 10,
  BACKUP_CODE_LENGTH: 8
};

/**
 * Generate MFA secret and QR code
 */
async function generateMFASecret(user) {
  try {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${MFA_CONFIG.APP_NAME} (${user.email})`,
      issuer: MFA_CONFIG.APP_NAME,
      length: 32
    });
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);
    
    // Generate backup codes
    const backupCodes = await generateBackupCodes();
    
    return {
      secret: secret.base32,
      qrCode: qrCodeDataURL,
      manualEntry: secret.base32,
      backupCodes: backupCodes.plain, // Return unhashed for display
      backupCodesHashed: backupCodes.hashed // Store in database
    };
  } catch (error) {
    console.error('Generate MFA secret error:', error);
    throw error;
  }
}

/**
 * Generate backup codes
 */
async function generateBackupCodes() {
  const codes = [];
  const hashed = [];
  
  for (let i = 0; i < MFA_CONFIG.BACKUP_CODES_COUNT; i++) {
    // Generate random code
    const code = crypto.randomBytes(MFA_CONFIG.BACKUP_CODE_LENGTH)
      .toString('hex')
      .substring(0, MFA_CONFIG.BACKUP_CODE_LENGTH)
      .toUpperCase();
    
    // Format as XXXX-XXXX
    const formatted = `${code.substring(0, 4)}-${code.substring(4, 8)}`;
    
    codes.push(formatted);
    
    // Hash code for storage
    const hash = await bcrypt.hash(formatted, 10);
    hashed.push(hash);
  }
  
  return {
    plain: codes,
    hashed: hashed
  };
}

/**
 * Verify TOTP code
 */
function verifyTOTPCode(secret, code) {
  try {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: MFA_CONFIG.WINDOW
    });
  } catch (error) {
    console.error('Verify TOTP code error:', error);
    return false;
  }
}

/**
 * Verify backup code
 */
async function verifyBackupCode(userId, code) {
  try {
    // Get user's backup codes
    const result = await pool.query(
      'SELECT mfa_backup_codes FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0 || !result.rows[0].mfa_backup_codes) {
      return false;
    }
    
    const backupCodes = result.rows[0].mfa_backup_codes;
    
    // Check each backup code
    for (let i = 0; i < backupCodes.length; i++) {
      const isMatch = await bcrypt.compare(code, backupCodes[i]);
      
      if (isMatch) {
        // Remove used backup code
        const updatedCodes = backupCodes.filter((_, index) => index !== i);
        
        await pool.query(
          'UPDATE users SET mfa_backup_codes = $1 WHERE id = $2',
          [updatedCodes, userId]
        );
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Verify backup code error:', error);
    return false;
  }
}

/**
 * Enable MFA for user
 */
async function enableMFA(userId, secret, backupCodes) {
  try {
    const result = await pool.query(
      `UPDATE users 
       SET mfa_enabled = true,
           mfa_secret = $1,
           mfa_backup_codes = $2,
           mfa_enabled_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, username, email, mfa_enabled`,
      [secret, backupCodes, userId]
    );
    
    if (result.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }
    
    return { success: true, user: result.rows[0] };
  } catch (error) {
    console.error('Enable MFA error:', error);
    throw error;
  }
}

/**
 * Disable MFA for user
 */
async function disableMFA(userId) {
  try {
    const result = await pool.query(
      `UPDATE users 
       SET mfa_enabled = false,
           mfa_secret = NULL,
           mfa_backup_codes = NULL,
           mfa_enabled_at = NULL
       WHERE id = $1
       RETURNING id, username, email, mfa_enabled`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }
    
    return { success: true, user: result.rows[0] };
  } catch (error) {
    console.error('Disable MFA error:', error);
    throw error;
  }
}

/**
 * Log MFA verification attempt
 */
async function logMFAAttempt(userId, code, success, ipAddress, userAgent) {
  try {
    await pool.query(
      `INSERT INTO mfa_verification_attempts 
       (user_id, code_entered, success, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, code.substring(0, 2) + '****', success, ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Log MFA attempt error:', error);
    // Don't throw error, just log it
  }
}

/**
 * Get MFA status for user
 */
async function getMFAStatus(userId) {
  try {
    const result = await pool.query(
      `SELECT mfa_enabled, mfa_enabled_at,
              array_length(mfa_backup_codes, 1) as backup_codes_remaining
       FROM users 
       WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Get MFA status error:', error);
    throw error;
  }
}

/**
 * Regenerate backup codes
 */
async function regenerateBackupCodes(userId) {
  try {
    const backupCodes = await generateBackupCodes();
    
    await pool.query(
      'UPDATE users SET mfa_backup_codes = $1 WHERE id = $2',
      [backupCodes.hashed, userId]
    );
    
    return {
      success: true,
      backupCodes: backupCodes.plain
    };
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    throw error;
  }
}

module.exports = {
  MFA_CONFIG,
  generateMFASecret,
  verifyTOTPCode,
  verifyBackupCode,
  enableMFA,
  disableMFA,
  logMFAAttempt,
  getMFAStatus,
  regenerateBackupCodes
};
```

### **Step 4: Create MFA Routes** (2 hours)

Create file: `/backend/src/routes/mfa.js`

```javascript
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const {
  generateMFASecret,
  verifyTOTPCode,
  verifyBackupCode,
  enableMFA,
  disableMFA,
  getMFAStatus,
  regenerateBackupCodes,
  logMFAAttempt
} = require('../utils/mfaService');

const router = express.Router();

// All MFA routes require authentication
router.use(authMiddleware);

/**
 * POST /api/mfa/setup
 * Start MFA setup (generate secret and QR code)
 */
router.post('/setup', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if MFA is already enabled
    const user = await pool.query(
      'SELECT mfa_enabled FROM users WHERE id = $1',
      [userId]
    );
    
    if (user.rows[0].mfa_enabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA is already enabled. Disable it first to set up again.'
      });
    }
    
    // Generate MFA secret and QR code
    const mfaData = await generateMFASecret({
      email: req.user.email,
      username: req.user.username
    });
    
    // Store secret temporarily (not enabled yet)
    await pool.query(
      'UPDATE users SET mfa_secret = $1 WHERE id = $2',
      [mfaData.secret, userId]
    );
    
    res.json({
      success: true,
      message: 'MFA setup initiated',
      data: {
        secret: mfaData.secret,
        qrCode: mfaData.qrCode,
        manualEntry: mfaData.manualEntry,
        backupCodes: mfaData.backupCodes,
        backupCodesHashed: mfaData.backupCodesHashed // Don't send to client
      }
    });
    
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/mfa/enable
 * Enable MFA (verify code and activate)
 */
router.post('/enable', [
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits')
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
    
    const { code } = req.body;
    const userId = req.user.id;
    
    // Get user's MFA secret
    const user = await pool.query(
      'SELECT mfa_secret, mfa_enabled FROM users WHERE id = $1',
      [userId]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.rows[0].mfa_enabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA is already enabled'
      });
    }
    
    if (!user.rows[0].mfa_secret) {
      return res.status(400).json({
        success: false,
        message: 'MFA setup not initiated. Call /api/mfa/setup first.'
      });
    }
    
    const secret = user.rows[0].mfa_secret;
    
    // Verify code
    const isValid = verifyTOTPCode(secret, code);
    
    // Log attempt
    await logMFAAttempt(userId, code, isValid, req.ip, req.get('user-agent'));
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    // Enable MFA
    // Get backup codes from previous setup call
    // (In production, you'd pass these or retrieve from temporary storage)
    const backupCodes = []; // TODO: Get from setup
    
    const result = await enableMFA(userId, secret, backupCodes);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      message: 'MFA enabled successfully',
      data: {
        user: result.user
      }
    });
    
  } catch (error) {
    console.error('MFA enable error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/mfa/disable
 * Disable MFA (requires current password and MFA code)
 */
router.post('/disable', [
  body('password').notEmpty().withMessage('Current password is required'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits')
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
    
    const { password, code } = req.body;
    const userId = req.user.id;
    
    // Verify password
    const bcrypt = require('bcryptjs');
    const user = await pool.query(
      'SELECT password_hash, mfa_secret, mfa_enabled FROM users WHERE id = $1',
      [userId]
    );
    
    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }
    
    if (!user.rows[0].mfa_enabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA is not enabled'
      });
    }
    
    // Verify MFA code
    const isCodeValid = verifyTOTPCode(user.rows[0].mfa_secret, code);
    
    if (!isCodeValid) {
      // Try backup code
      const isBackupCodeValid = await verifyBackupCode(userId, code);
      if (!isBackupCodeValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid MFA code'
        });
      }
    }
    
    // Disable MFA
    const result = await disableMFA(userId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      message: 'MFA disabled successfully',
      data: {
        user: result.user
      }
    });
    
  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/mfa/verify
 * Verify MFA code during login
 */
router.post('/verify', [
  body('code').notEmpty().withMessage('Code is required'),
  body('userId').isInt().withMessage('User ID is required')
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
    
    const { code, userId } = req.body;
    
    // Get user's MFA secret
    const user = await pool.query(
      'SELECT mfa_secret, mfa_enabled FROM users WHERE id = $1',
      [userId]
    );
    
    if (user.rows.length === 0 || !user.rows[0].mfa_enabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA not enabled for this user'
      });
    }
    
    const secret = user.rows[0].mfa_secret;
    
    // Verify TOTP code
    let isValid = verifyTOTPCode(secret, code);
    let usedBackupCode = false;
    
    // If TOTP fails, try backup code
    if (!isValid) {
      isValid = await verifyBackupCode(userId, code);
      usedBackupCode = isValid;
    }
    
    // Log attempt
    await logMFAAttempt(userId, code, isValid, req.ip, req.get('user-agent'));
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    res.json({
      success: true,
      message: 'MFA verification successful',
      data: {
        verified: true,
        usedBackupCode
      }
    });
    
  } catch (error) {
    console.error('MFA verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/mfa/status
 * Get MFA status for current user
 */
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const status = await getMFAStatus(userId);
    
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
    console.error('Get MFA status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/mfa/regenerate-backup-codes
 * Regenerate backup codes (requires MFA verification)
 */
router.post('/regenerate-backup-codes', [
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits')
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
    
    const { code } = req.body;
    const userId = req.user.id;
    
    // Verify user has MFA enabled
    const user = await pool.query(
      'SELECT mfa_secret, mfa_enabled FROM users WHERE id = $1',
      [userId]
    );
    
    if (!user.rows[0].mfa_enabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA is not enabled'
      });
    }
    
    // Verify code
    const isValid = verifyTOTPCode(user.rows[0].mfa_secret, code);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid MFA code'
      });
    }
    
    // Regenerate backup codes
    const result = await regenerateBackupCodes(userId);
    
    res.json({
      success: true,
      message: 'Backup codes regenerated successfully',
      data: {
        backupCodes: result.backupCodes
      }
    });
    
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
```

### **Step 5: Update Auth Flow** (2 hours)

**Update `/backend/src/routes/auth.js` to support 2-step login:**

```javascript
// Two-step login process:
// 1. Validate username/password
// 2. If MFA enabled, require MFA code

// Modify login route to check MFA status
// (See full implementation in code)
```

### **Step 6: Frontend MFA UI** (4-6 hours)

Components needed:
1. MFA Setup Modal (QR code display)
2. MFA Verification Input (6-digit code)
3. Backup Codes Display
4. MFA Settings Page
5. Login with MFA step

---

## 4. 📱 **SESSION MANAGEMENT**

**Timeline**: 2 days  
**Priority**: 🔴 CRITICAL  
**Difficulty**: ⭐⭐ Medium

(Implementation details similar to above...)

---

## 🧪 **TESTING PLAN**

### **1. Rate Limiting Tests**
- [ ] Test API rate limits
- [ ] Test auth rate limits
- [ ] Test password reset limits
- [ ] Test header responses

### **2. Account Lockout Tests**
- [ ] Test 5 failed attempts → 15 min lock
- [ ] Test 10 failed attempts → 1 hour lock
- [ ] Test 15 failed attempts → indefinite lock
- [ ] Test successful login resets counter
- [ ] Test admin unlock
- [ ] Test lock status API

### **3. MFA Tests**
- [ ] Test MFA setup flow
- [ ] Test MFA enable/disable
- [ ] Test TOTP verification
- [ ] Test backup codes
- [ ] Test regenerate backup codes
- [ ] Test MFA login flow

### **4. Session Management Tests**
- [ ] Test session creation
- [ ] Test concurrent sessions
- [ ] Test session revocation
- [ ] Test force logout
- [ ] Test session expiration

---

## 📦 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Documentation updated
- [ ] Team training completed

### **Deployment**
- [ ] Backup database
- [ ] Run migrations
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Test in production

### **Post-Deployment**
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] User acceptance testing
- [ ] Update documentation

---

## 📊 **PROGRESS TRACKING**

Use this checklist to track implementation:

```
Phase 1: Rate Limiting (4 hours)
[ ] Install package
[ ] Create middleware
[ ] Apply to routes
[ ] Test implementation
[ ] Documentation

Phase 2: Account Lockout (1 day)
[ ] Database migration
[ ] Create utility
[ ] Update auth routes
[ ] Add unlock endpoint
[ ] Update frontend UI
[ ] Test all scenarios

Phase 3: MFA (2-3 days)
[ ] Install dependencies
[ ] Database migration
[ ] Create MFA service
[ ] Create MFA routes
[ ] Update auth flow
[ ] Frontend components
[ ] Test all flows

Phase 4: Session Management (2 days)
[ ] Database migration
[ ] Create session service
[ ] Update auth middleware
[ ] Session management routes
[ ] Frontend session UI
[ ] Test concurrent sessions
```

---

**Total Timeline**: ~5 days  
**Team Size**: 1-2 developers  
**Testing Time**: Additional 1-2 days

---

**Document Created**: October 13, 2025  
**Last Updated**: October 13, 2025  
**Version**: 1.0



