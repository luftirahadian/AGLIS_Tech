const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter Middleware
 * Protects API endpoints from abuse and brute force attacks
 */

/**
 * General API rate limiter
 * Applied to all API endpoints
 * Updated: Increased limits for better user experience
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs (increased from 100)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Don't apply rate limit to authenticated users
    // Authenticated users can make more requests for management purposes
    return req.user !== undefined;
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force login attacks
 * Updated: Increased limit for better user experience while maintaining security
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login attempts per 15 minutes (increased from 5)
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
 * Updated: Increased from 3 to 10 for better user experience
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 password reset requests per hour (increased from 3)
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
 * Updated: Increased from 3 to 10 registrations per hour for better user experience
 */
const publicRegistrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit to 10 registrations per hour per IP (increased from 3)
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
 * Updated: Increased from 50 to 200 for better user experience
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit to 200 uploads per 15 minutes (increased from 50)
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


