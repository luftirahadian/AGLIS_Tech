// ═══════════════════════════════════════════════════════════════
// 🔧 SPECIALIZATIONS API ROUTES
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, authorize } = require('../middleware/auth');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/specializations/categories - Get all categories
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const { active_only = 'true' } = req.query;

    let query = `
      SELECT id, code, name, description, display_order, icon, color, is_active,
             created_at, updated_at
      FROM specialization_categories
    `;

    if (active_only === 'true') {
      query += ' WHERE is_active = true';
    }

    query += ' ORDER BY display_order ASC';

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/specializations - Get all specializations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      category_id, 
      active_only = 'true', 
      skill_level,
      high_demand_only = 'false' 
    } = req.query;

    let query = `
      SELECT 
        s.id, s.category_id, s.code, s.name, s.description,
        s.required_skill_level, s.difficulty_level,
        s.is_high_demand, s.is_critical_service,
        s.icon, s.color, s.display_order, s.is_active,
        s.created_at, s.updated_at,
        sc.name as category_name, sc.code as category_code
      FROM specializations s
      LEFT JOIN specialization_categories sc ON s.category_id = sc.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (active_only === 'true') {
      query += ' AND s.is_active = true';
    }

    if (category_id) {
      paramCount++;
      query += ` AND s.category_id = $${paramCount}`;
      params.push(category_id);
    }

    if (skill_level) {
      paramCount++;
      query += ` AND s.required_skill_level = $${paramCount}`;
      params.push(skill_level);
    }

    if (high_demand_only === 'true') {
      query += ' AND s.is_high_demand = true';
    }

    query += ' ORDER BY sc.display_order ASC, s.display_order ASC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get specializations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/specializations/grouped - Get specializations grouped by category
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.get('/grouped', authMiddleware, async (req, res) => {
  try {
    const { active_only = 'true' } = req.query;

    // Get categories
    let categoryQuery = 'SELECT * FROM specialization_categories';
    if (active_only === 'true') {
      categoryQuery += ' WHERE is_active = true';
    }
    categoryQuery += ' ORDER BY display_order ASC';

    const categories = await pool.query(categoryQuery);

    // Get specializations for each category
    const grouped = await Promise.all(
      categories.rows.map(async (category) => {
        let specQuery = `
          SELECT * FROM specializations 
          WHERE category_id = $1
        `;
        if (active_only === 'true') {
          specQuery += ' AND is_active = true';
        }
        specQuery += ' ORDER BY display_order ASC';

        const specs = await pool.query(specQuery, [category.id]);

        return {
          ...category,
          specializations: specs.rows
        };
      })
    );

    res.json({
      success: true,
      data: grouped
    });

  } catch (error) {
    console.error('Get grouped specializations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/specializations/:id - Get specific specialization
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        s.*,
        sc.name as category_name, sc.code as category_code
      FROM specializations s
      LEFT JOIN specialization_categories sc ON s.category_id = sc.id
      WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Specialization not found'
      });
    }

    // Get technician count with this specialization
    const techCount = await pool.query(
      `SELECT COUNT(DISTINCT technician_id) as count
       FROM technician_specializations
       WHERE specialization_id = $1 AND is_active = true`,
      [id]
    );

    const data = {
      ...result.rows[0],
      technician_count: parseInt(techCount.rows[0].count)
    };

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Get specialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/specializations - Create specialization (Admin only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.post('/', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const {
      category_id, code, name, description,
      required_skill_level, difficulty_level,
      is_high_demand, is_critical_service,
      icon, color, display_order
    } = req.body;

    // Check if code already exists
    const existing = await pool.query(
      'SELECT id FROM specializations WHERE code = $1',
      [code]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Specialization code already exists'
      });
    }

    const result = await pool.query(
      `INSERT INTO specializations (
        category_id, code, name, description,
        required_skill_level, difficulty_level,
        is_high_demand, is_critical_service,
        icon, color, display_order, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        category_id, code, name, description,
        required_skill_level, difficulty_level,
        is_high_demand, is_critical_service,
        icon, color, display_order, req.user.id
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Specialization created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create specialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUT /api/specializations/:id - Update specialization (Admin only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.put('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id, name, description,
      required_skill_level, difficulty_level,
      is_high_demand, is_critical_service,
      icon, color, display_order, is_active
    } = req.body;

    const result = await pool.query(
      `UPDATE specializations SET
        category_id = COALESCE($1, category_id),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        required_skill_level = COALESCE($4, required_skill_level),
        difficulty_level = COALESCE($5, difficulty_level),
        is_high_demand = COALESCE($6, is_high_demand),
        is_critical_service = COALESCE($7, is_critical_service),
        icon = COALESCE($8, icon),
        color = COALESCE($9, color),
        display_order = COALESCE($10, display_order),
        is_active = COALESCE($11, is_active),
        updated_by = $12
      WHERE id = $13
      RETURNING *`,
      [
        category_id, name, description,
        required_skill_level, difficulty_level,
        is_high_demand, is_critical_service,
        icon, color, display_order, is_active,
        req.user.id, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Specialization not found'
      });
    }

    res.json({
      success: true,
      message: 'Specialization updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update specialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DELETE /api/specializations/:id - Soft delete (Admin only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.delete('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE specializations SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Specialization not found'
      });
    }

    res.json({
      success: true,
      message: 'Specialization deactivated successfully'
    });

  } catch (error) {
    console.error('Delete specialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

