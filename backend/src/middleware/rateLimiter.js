const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter Middleware
 * Protects API endpoints from abuse and brute force attacks
 */

/**
 * General API rate limiter
 * Applied to all API endpoints
 */
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
    // Admins can make more requests for management purposes
    return req.user && req.user.role === 'admin';
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force login attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Count failed requests
  standardHeaders: true,
  legacyHeaders: false,
  // Custom handler for when limit is exceeded
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Your IP has been temporarily blocked.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000), // Seconds until reset
      blocked: true
    });
  }
});

/**
 * Strict rate limiter for password reset requests
 * Prevents abuse of password reset functionality
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset requests from this IP.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Rate limiter for user creation
 * Prevents spam user registration
 */
const createUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit to 10 user creations per hour per IP
  message: {
    success: false,
    message: 'Too many user creation requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Don't apply limit to admin creating users
    return req.user && req.user.role === 'admin';
  }
});

/**
 * Strict rate limiter for public registration
 * Prevents bot registrations
 */
const publicRegistrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit to 3 registrations per hour per IP
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for file uploads
 * Prevents upload spam
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit to 50 uploads per 15 minutes
  message: {
    success: false,
    message: 'Too many upload requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  createUserLimiter,
  publicRegistrationLimiter,
  uploadLimiter
};


