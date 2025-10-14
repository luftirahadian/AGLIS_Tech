// ═══════════════════════════════════════════════════════════════
// 🎓 SKILL LEVELS API ROUTES
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, authorize } = require('../middleware/auth');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/skill-levels - Get all skill levels
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { active_only = 'true' } = req.query;

    let query = `
      SELECT 
        id, code, name, display_order, description,
        min_experience_months, min_completed_tickets, min_avg_rating,
        daily_ticket_capacity, expected_resolution_time_hours,
        can_handle_critical_tickets, can_mentor_others, requires_supervision,
        icon, color, badge_text, is_active,
        created_at, updated_at
      FROM skill_levels
    `;

    const params = [];

    if (active_only === 'true') {
      query += ' WHERE is_active = true';
    }

    query += ' ORDER BY display_order ASC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get skill levels error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/skill-levels/:code - Get specific skill level by code
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.get('/:code', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      `SELECT 
        id, code, name, display_order, description,
        min_experience_months, min_completed_tickets, min_avg_rating,
        daily_ticket_capacity, expected_resolution_time_hours,
        can_handle_critical_tickets, can_mentor_others, requires_supervision,
        icon, color, badge_text, is_active,
        created_at, updated_at
      FROM skill_levels
      WHERE code = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Skill level not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get skill level error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/skill-levels - Create new skill level (Admin only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.post('/', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const {
      code, name, display_order, description,
      min_experience_months, min_completed_tickets, min_avg_rating,
      daily_ticket_capacity, expected_resolution_time_hours,
      can_handle_critical_tickets, can_mentor_others, requires_supervision,
      icon, color, badge_text
    } = req.body;

    // Check if code already exists
    const existing = await pool.query(
      'SELECT id FROM skill_levels WHERE code = $1',
      [code]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Skill level code already exists'
      });
    }

    const result = await pool.query(
      `INSERT INTO skill_levels (
        code, name, display_order, description,
        min_experience_months, min_completed_tickets, min_avg_rating,
        daily_ticket_capacity, expected_resolution_time_hours,
        can_handle_critical_tickets, can_mentor_others, requires_supervision,
        icon, color, badge_text, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        code, name, display_order, description,
        min_experience_months, min_completed_tickets, min_avg_rating,
        daily_ticket_capacity, expected_resolution_time_hours,
        can_handle_critical_tickets, can_mentor_others, requires_supervision,
        icon, color, badge_text, req.user.id
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Skill level created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create skill level error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUT /api/skill-levels/:id - Update skill level (Admin only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.put('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, display_order, description,
      min_experience_months, min_completed_tickets, min_avg_rating,
      daily_ticket_capacity, expected_resolution_time_hours,
      can_handle_critical_tickets, can_mentor_others, requires_supervision,
      icon, color, badge_text, is_active
    } = req.body;

    const result = await pool.query(
      `UPDATE skill_levels SET
        name = COALESCE($1, name),
        display_order = COALESCE($2, display_order),
        description = COALESCE($3, description),
        min_experience_months = COALESCE($4, min_experience_months),
        min_completed_tickets = COALESCE($5, min_completed_tickets),
        min_avg_rating = COALESCE($6, min_avg_rating),
        daily_ticket_capacity = COALESCE($7, daily_ticket_capacity),
        expected_resolution_time_hours = COALESCE($8, expected_resolution_time_hours),
        can_handle_critical_tickets = COALESCE($9, can_handle_critical_tickets),
        can_mentor_others = COALESCE($10, can_mentor_others),
        requires_supervision = COALESCE($11, requires_supervision),
        icon = COALESCE($12, icon),
        color = COALESCE($13, color),
        badge_text = COALESCE($14, badge_text),
        is_active = COALESCE($15, is_active),
        updated_by = $16
      WHERE id = $17
      RETURNING *`,
      [
        name, display_order, description,
        min_experience_months, min_completed_tickets, min_avg_rating,
        daily_ticket_capacity, expected_resolution_time_hours,
        can_handle_critical_tickets, can_mentor_others, requires_supervision,
        icon, color, badge_text, is_active,
        req.user.id, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Skill level not found'
      });
    }

    res.json({
      success: true,
      message: 'Skill level updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update skill level error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DELETE /api/skill-levels/:id - Soft delete (Admin only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.delete('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE skill_levels SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Skill level not found'
      });
    }

    res.json({
      success: true,
      message: 'Skill level deactivated successfully'
    });

  } catch (error) {
    console.error('Delete skill level error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

