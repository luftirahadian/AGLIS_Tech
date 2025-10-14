// ═══════════════════════════════════════════════════════════════
// 👷 TECHNICIAN SPECIALIZATIONS API
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, authorize } = require('../middleware/auth');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/technicians/:techId/specializations - Get technician's specializations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.get('/:techId/specializations', authMiddleware, async (req, res) => {
  try {
    const { techId } = req.params;

    const result = await pool.query(
      `SELECT 
        ts.id, ts.proficiency_level, ts.years_experience, ts.acquired_date, ts.is_active,
        s.id as specialization_id, s.code, s.name as specialization_name, 
        s.description, s.difficulty_level, s.is_high_demand, s.is_critical_service,
        sc.name as category_name, sc.code as category_code, sc.color as category_color
      FROM technician_specializations ts
      JOIN specializations s ON ts.specialization_id = s.id
      JOIN specialization_categories sc ON s.category_id = sc.id
      WHERE ts.technician_id = $1
      ORDER BY sc.display_order, s.display_order`,
      [techId]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get technician specializations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/technicians/:techId/specializations - Add specialization
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.post('/:techId/specializations', authMiddleware, authorize('admin', 'supervisor'), async (req, res) => {
  try {
    const { techId } = req.params;
    const { specialization_id, proficiency_level, years_experience } = req.body;

    // Check if technician exists
    const techCheck = await pool.query(
      'SELECT id FROM technicians WHERE id = $1',
      [techId]
    );

    if (techCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    // Check if specialization exists
    const specCheck = await pool.query(
      'SELECT id, name FROM specializations WHERE id = $1 AND is_active = true',
      [specialization_id]
    );

    if (specCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Specialization not found or inactive'
      });
    }

    // Check if already assigned
    const existing = await pool.query(
      'SELECT id FROM technician_specializations WHERE technician_id = $1 AND specialization_id = $2',
      [techId, specialization_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Technician already has this specialization'
      });
    }

    // Insert new assignment
    const result = await pool.query(
      `INSERT INTO technician_specializations (
        technician_id, specialization_id, proficiency_level, years_experience
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [techId, specialization_id, proficiency_level || 'beginner', years_experience || 0]
    );

    // Get complete info for response
    const complete = await pool.query(
      `SELECT 
        ts.*, s.name as specialization_name, s.code,
        sc.name as category_name, sc.color as category_color
      FROM technician_specializations ts
      JOIN specializations s ON ts.specialization_id = s.id
      JOIN specialization_categories sc ON s.category_id = sc.id
      WHERE ts.id = $1`,
      [result.rows[0].id]
    );

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.emit('technician-specialization-added', {
        technician_id: parseInt(techId),
        specialization: complete.rows[0]
      });
    }

    res.status(201).json({
      success: true,
      message: `Specialization "${specCheck.rows[0].name}" added successfully`,
      data: complete.rows[0]
    });

  } catch (error) {
    console.error('Add technician specialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUT /api/technicians/:techId/specializations/:specId - Update assignment
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.put('/:techId/specializations/:specId', authMiddleware, authorize('admin', 'supervisor'), async (req, res) => {
  try {
    const { techId, specId } = req.params;
    const { proficiency_level, years_experience, is_active } = req.body;

    const result = await pool.query(
      `UPDATE technician_specializations SET
        proficiency_level = COALESCE($1, proficiency_level),
        years_experience = COALESCE($2, years_experience),
        is_active = COALESCE($3, is_active)
      WHERE id = $4 AND technician_id = $5
      RETURNING *`,
      [proficiency_level, years_experience, is_active, specId, techId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Specialization assignment not found'
      });
    }

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.emit('technician-specialization-updated', {
        technician_id: parseInt(techId),
        assignment_id: parseInt(specId)
      });
    }

    res.json({
      success: true,
      message: 'Specialization updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update technician specialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DELETE /api/technicians/:techId/specializations/:specId - Remove assignment
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.delete('/:techId/specializations/:specId', authMiddleware, authorize('admin', 'supervisor'), async (req, res) => {
  try {
    const { techId, specId } = req.params;

    const result = await pool.query(
      'DELETE FROM technician_specializations WHERE id = $1 AND technician_id = $2 RETURNING *',
      [specId, techId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Specialization assignment not found'
      });
    }

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.emit('technician-specialization-removed', {
        technician_id: parseInt(techId),
        assignment_id: parseInt(specId)
      });
    }

    res.json({
      success: true,
      message: 'Specialization removed successfully'
    });

  } catch (error) {
    console.error('Delete technician specialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

