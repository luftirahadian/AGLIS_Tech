const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const userQuery = 'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [decoded.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    const user = userResult.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Not authenticated.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Permission-based authorization middleware
const checkPermission = (...permissionNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Not authenticated.'
        });
      }

      // Admin always has full access
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user's role has the required permissions
      const query = `
        SELECT p.name 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role = $1 
          AND p.name = ANY($2::text[])
          AND rp.granted = true
      `;
      
      const result = await pool.query(query, [req.user.role, permissionNames]);
      
      if (result.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to perform this action.',
          required_permissions: permissionNames
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

// Get user permissions
const getUserPermissions = async (role) => {
  try {
    // Admin has all permissions
    if (role === 'admin') {
      const allPermissions = await pool.query('SELECT name FROM permissions');
      return allPermissions.rows.map(row => row.name);
    }

    // Get permissions for specific role
    const query = `
      SELECT p.name, p.resource, p.action, p.description
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role = $1 AND rp.granted = true
      ORDER BY p.resource, p.action
    `;
    
    const result = await pool.query(query, [role]);
    return result.rows;
  } catch (error) {
    console.error('Get permissions error:', error);
    return [];
  }
};

// Check if user has specific permission
const hasPermission = async (role, permissionName) => {
  try {
    // Admin always has permission
    if (role === 'admin') {
      return true;
    }

    const query = `
      SELECT EXISTS (
        SELECT 1 FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role = $1 AND p.name = $2 AND rp.granted = true
      ) as has_permission
    `;
    
    const result = await pool.query(query, [role, permissionName]);
    return result.rows[0]?.has_permission || false;
  } catch (error) {
    console.error('Has permission check error:', error);
    return false;
  }
};

module.exports = { 
  authMiddleware, 
  authorize, 
  checkPermission,
  getUserPermissions,
  hasPermission
};
