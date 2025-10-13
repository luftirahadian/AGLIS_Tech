const express = require('express');
const pool = require('../config/database');
const { authMiddleware, authorize, getUserPermissions } = require('../middleware/auth');

const router = express.Router();

// Get all permissions (Admin only)
router.get('/all', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const query = `
      SELECT id, name, resource, action, description
      FROM permissions
      ORDER BY resource, action
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: {
        permissions: result.rows
      }
    });
  } catch (error) {
    console.error('Get all permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get permissions for a specific role
router.get('/role/:role', authMiddleware, authorize('admin', 'supervisor'), async (req, res) => {
  try {
    const { role } = req.params;
    
    // Validate role
    const validRoles = ['admin', 'supervisor', 'technician', 'customer_service'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }
    
    const permissions = await getUserPermissions(role);
    
    res.json({
      success: true,
      data: {
        role,
        permissions
      }
    });
  } catch (error) {
    console.error('Get role permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get permission matrix for all roles (Admin only)
router.get('/matrix', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    // Get all permissions
    const permissionsQuery = `
      SELECT id, name, resource, action, description
      FROM permissions
      ORDER BY resource, action
    `;
    const permissionsResult = await pool.query(permissionsQuery);
    
    // Get role permissions for all roles
    const roles = ['admin', 'supervisor', 'technician', 'customer_service'];
    const matrix = {};
    
    for (const role of roles) {
      const rolePermsQuery = `
        SELECT p.id, p.name, rp.granted
        FROM permissions p
        LEFT JOIN role_permissions rp ON p.id = rp.permission_id AND rp.role = $1
        ORDER BY p.resource, p.action
      `;
      const result = await pool.query(rolePermsQuery, [role]);
      
      matrix[role] = result.rows.reduce((acc, row) => {
        acc[row.name] = row.granted || (role === 'admin');  // Admin always has all perms
        return acc;
      }, {});
    }
    
    res.json({
      success: true,
      data: {
        permissions: permissionsResult.rows,
        matrix
      }
    });
  } catch (error) {
    console.error('Get permission matrix error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update role permissions (Admin only)
router.put('/role/:role', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body; // Array of { permissionId, granted }
    
    // Validate role
    const validRoles = ['supervisor', 'technician', 'customer_service'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify admin permissions or invalid role'
      });
    }
    
    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be an array'
      });
    }
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update each permission
      for (const perm of permissions) {
        const { permissionId, granted } = perm;
        
        const query = `
          INSERT INTO role_permissions (role, permission_id, granted)
          VALUES ($1, $2, $3)
          ON CONFLICT (role, permission_id)
          DO UPDATE SET granted = $3, updated_at = CURRENT_TIMESTAMP
        `;
        
        await client.query(query, [role, permissionId, granted]);
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Permissions updated successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user's permissions
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const permissions = await getUserPermissions(req.user.role);
    
    res.json({
      success: true,
      data: {
        role: req.user.role,
        permissions
      }
    });
  } catch (error) {
    console.error('Get my permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

