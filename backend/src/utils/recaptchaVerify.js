const axios = require('axios');

/**
 * Google reCAPTCHA Verification Utility
 * Protects login and registration from bot attacks
 * 
 * Setup Instructions:
 * 1. Get keys from: https://www.google.com/recaptcha/admin/create
 * 2. Add to config.env:
 *    RECAPTCHA_SECRET_KEY=your_secret_key_here
 *    RECAPTCHA_ENABLED=true
 * 3. Restart backend
 */

const RECAPTCHA_CONFIG = {
  VERIFY_URL: 'https://www.google.com/recaptcha/api/siteverify',
  // Get from environment variable
  SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe', // Test key
  ENABLED: process.env.RECAPTCHA_ENABLED === 'true',
  // Minimum score for v3 (not used in v2, but kept for future)
  MIN_SCORE: parseFloat(process.env.RECAPTCHA_MIN_SCORE) || 0.5
};

/**
 * Verify reCAPTCHA token
 * @param {string} token - reCAPTCHA response token from frontend
 * @param {string} remoteip - Optional: User's IP address
 * @returns {Promise<Object>} - { success: boolean, score: number, action: string, ... }
 */
async function verifyRecaptcha(token, remoteip = null) {
  // If reCAPTCHA is disabled (for testing/development)
  if (!RECAPTCHA_CONFIG.ENABLED) {
    console.log('⚠️  reCAPTCHA verification skipped (RECAPTCHA_ENABLED=false)');
    return {
      success: true,
      skipped: true,
      message: 'reCAPTCHA verification skipped'
    };
  }

  // Validate token presence
  if (!token || token.trim() === '') {
    return {
      success: false,
      message: 'reCAPTCHA token is required',
      error: 'missing-input-response'
    };
  }

  try {
    // Prepare verification request
    const params = new URLSearchParams({
      secret: RECAPTCHA_CONFIG.SECRET_KEY,
      response: token
    });

    // Add IP if provided (optional but recommended)
    if (remoteip) {
      params.append('remoteip', remoteip);
    }

    // Call Google reCAPTCHA API
    const response = await axios.post(RECAPTCHA_CONFIG.VERIFY_URL, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 5000 // 5 second timeout
    });

    const data = response.data;

    // Log verification result
    if (data.success) {
      console.log('✅ reCAPTCHA verification successful', {
        action: data.action,
        score: data.score,
        hostname: data.hostname
      });
    } else {
      console.warn('❌ reCAPTCHA verification failed', {
        errors: data['error-codes'],
        hostname: data.hostname
      });
    }

    // Return verification result
    return {
      success: data.success,
      score: data.score, // For v3 only
      action: data.action, // For v3 only
      hostname: data.hostname,
      challenge_ts: data.challenge_ts,
      errors: data['error-codes'] || [],
      message: data.success ? 'reCAPTCHA verified' : 'reCAPTCHA verification failed'
    };

  } catch (error) {
    console.error('reCAPTCHA verification error:', error.message);
    
    // On error, we can choose to:
    // Option 1: Fail securely (block login) - RECOMMENDED
    // Option 2: Allow login (for development)
    
    // For production, fail securely
    if (process.env.NODE_ENV === 'production') {
      return {
        success: false,
        message: 'reCAPTCHA verification failed. Please try again.',
        error: 'network-error'
      };
    }
    
    // For development, warn but allow
    console.warn('⚠️  reCAPTCHA error in development - allowing request');
    return {
      success: true,
      skipped: true,
      message: 'reCAPTCHA verification skipped due to error (development mode)'
    };
  }
}

/**
 * Express middleware for reCAPTCHA verification
 * Use this to protect routes from bot attacks
 * 
 * Usage:
 * router.post('/login', verifyCaptchaMiddleware, async (req, res) => { ... })
 */
const verifyCaptchaMiddleware = async (req, res, next) => {
  try {
    // Get token from request body
    const token = req.body.recaptchaToken || req.body.captchaToken || req.body['g-recaptcha-response'];
    
    // Get user's IP
    const remoteip = req.ip || req.connection.remoteAddress;
    
    // Verify reCAPTCHA
    const result = await verifyRecaptcha(token, remoteip);
    
    // If verification failed, block request
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'reCAPTCHA verification failed',
        captchaError: true,
        errors: result.errors
      });
    }
    
    // Attach result to request for further processing
    req.recaptchaResult = result;
    
    // Continue to next middleware
    next();
    
  } catch (error) {
    console.error('reCAPTCHA middleware error:', error);
    
    // Fail securely in production
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        success: false,
        message: 'Security verification failed. Please try again.',
        captchaError: true
      });
    }
    
    // Allow in development with warning
    console.warn('⚠️  reCAPTCHA middleware error in development - allowing request');
    next();
  }
};

/**
 * Check if reCAPTCHA is enabled
 */
function isRecaptchaEnabled() {
  return RECAPTCHA_CONFIG.ENABLED;
}

/**
 * Get reCAPTCHA configuration (for frontend)
 */
function getRecaptchaConfig() {
  return {
    enabled: RECAPTCHA_CONFIG.ENABLED,
    siteKey: process.env.RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' // Test key
  };
}

module.exports = {
  verifyRecaptcha,
  verifyCaptchaMiddleware,
  isRecaptchaEnabled,
  getRecaptchaConfig,
  RECAPTCHA_CONFIG
};

