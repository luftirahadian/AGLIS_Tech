const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const whatsappNotificationService = require('../services/whatsappNotificationService');

/**
 * Ticket Team Management Routes
 * 
 * Handle multi-technician assignment for tickets
 */

// Get all technicians assigned to a ticket
router.get('/:ticketId/team', async (req, res) => {
  try {
    const { ticketId } = req.params;

    const result = await pool.query(
      `SELECT 
        tt.*,
        t.full_name,
        t.phone,
        t.email,
        t.specializations,
        u.full_name as assigned_by_name
      FROM ticket_technicians tt
      JOIN technicians t ON tt.technician_id = t.id
      LEFT JOIN users u ON tt.assigned_by = u.id
      WHERE tt.ticket_id = $1 AND tt.is_active = TRUE
      ORDER BY 
        CASE tt.role 
          WHEN 'lead' THEN 1
          WHEN 'member' THEN 2
          WHEN 'support' THEN 3
        END,
        tt.assigned_at ASC`,
      [ticketId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get ticket team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ticket team'
    });
  }
});

// Assign team to ticket (replaces all assignments)
router.put('/:ticketId/assign-team', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { ticketId } = req.params;
    const { technicians } = req.body; // Array: [{technician_id, role}, ...]
    
    if (!technicians || !Array.isArray(technicians) || technicians.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one technician is required'
      });
    }

    // Validate that exactly one lead exists
    const leadCount = technicians.filter(t => t.role === 'lead').length;
    if (leadCount !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Exactly one lead technician is required'
      });
    }

    await client.query('BEGIN');

    // Get ticket info
    const ticketResult = await client.query(
      'SELECT * FROM tickets WHERE id = $1',
      [ticketId]
    );

    if (ticketResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const ticket = ticketResult.rows[0];

    // Deactivate existing assignments
    await client.query(
      'UPDATE ticket_technicians SET is_active = FALSE WHERE ticket_id = $1',
      [ticketId]
    );

    // Find the lead technician
    const leadTech = technicians.find(t => t.role === 'lead');

    // Update main ticket table with lead technician (backward compatibility)
    await client.query(
      'UPDATE tickets SET assigned_technician_id = $1, updated_at = NOW() WHERE id = $2',
      [leadTech.technician_id, ticketId]
    );

    // Insert new team assignments
    const insertPromises = technicians.map(tech => 
      client.query(
        `INSERT INTO ticket_technicians (ticket_id, technician_id, role, assigned_by, is_active)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (ticket_id, technician_id) 
         DO UPDATE SET role = $3, is_active = TRUE, updated_at = NOW()`,
        [ticketId, tech.technician_id, tech.role || 'member', req.user.id]
      )
    );

    await Promise.all(insertPromises);

    // Get full team info for response
    const teamResult = await client.query(
      `SELECT 
        tt.*,
        t.full_name,
        t.phone,
        t.email
      FROM ticket_technicians tt
      JOIN technicians t ON tt.technician_id = t.id
      WHERE tt.ticket_id = $1 AND tt.is_active = TRUE
      ORDER BY 
        CASE tt.role 
          WHEN 'lead' THEN 1
          WHEN 'member' THEN 2
          WHEN 'support' THEN 3
        END`,
      [ticketId]
    );

    await client.query('COMMIT');

    // Send WhatsApp notifications to all team members
    teamResult.rows.forEach(member => {
      whatsappNotificationService.notifyTechnicianTeamAssignment(
        ticketId,
        member.technician_id,
        member.role,
        teamResult.rows
      ).catch(err => {
        console.error(`Failed to send team notification to ${member.full_name}:`, err);
      });
    });

    res.json({
      success: true,
      message: 'Team assigned successfully',
      data: {
        ticket_id: ticketId,
        team: teamResult.rows
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Assign team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign team'
    });
  } finally {
    client.release();
  }
});

// Add technician to existing team
router.post('/:ticketId/add-technician', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { technician_id, role = 'member', notes } = req.body;

    if (!technician_id) {
      return res.status(400).json({
        success: false,
        message: 'Technician ID is required'
      });
    }

    const result = await pool.query(
      `INSERT INTO ticket_technicians (ticket_id, technician_id, role, assigned_by, notes, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       ON CONFLICT (ticket_id, technician_id) 
       DO UPDATE SET role = $3, is_active = TRUE, notes = $5, updated_at = NOW()
       RETURNING *`,
      [ticketId, technician_id, role, req.user.id, notes]
    );

    // Get technician info
    const techResult = await pool.query(
      'SELECT full_name, phone FROM technicians WHERE id = $1',
      [technician_id]
    );

    // Send notification
    if (techResult.rows.length > 0) {
      whatsappNotificationService.notifyTechnicianAdded(ticketId, technician_id, role)
        .catch(err => console.error('Failed to send notification:', err));
    }

    res.json({
      success: true,
      message: 'Technician added to team',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Add technician error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add technician'
    });
  }
});

// Remove technician from team
router.delete('/:ticketId/remove-technician/:technicianId', async (req, res) => {
  try {
    const { ticketId, technicianId } = req.params;

    // Check if this is the lead (cannot remove lead)
    const checkLead = await pool.query(
      'SELECT role FROM ticket_technicians WHERE ticket_id = $1 AND technician_id = $2 AND is_active = TRUE',
      [ticketId, technicianId]
    );

    if (checkLead.rows.length > 0 && checkLead.rows[0].role === 'lead') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove lead technician. Assign new lead first.'
      });
    }

    await pool.query(
      'UPDATE ticket_technicians SET is_active = FALSE, updated_at = NOW() WHERE ticket_id = $1 AND technician_id = $2',
      [ticketId, technicianId]
    );

    res.json({
      success: true,
      message: 'Technician removed from team'
    });

  } catch (error) {
    console.error('Remove technician error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove technician'
    });
  }
});

// Update technician role
router.patch('/:ticketId/update-technician/:technicianId', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { ticketId, technicianId } = req.params;
    const { role } = req.body;

    if (!['lead', 'member', 'support'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be: lead, member, or support'
      });
    }

    await client.query('BEGIN');

    // If changing to lead, demote current lead to member
    if (role === 'lead') {
      await client.query(
        `UPDATE ticket_technicians 
         SET role = 'member', updated_at = NOW() 
         WHERE ticket_id = $1 AND role = 'lead' AND is_active = TRUE`,
        [ticketId]
      );

      // Update main ticket table
      await client.query(
        'UPDATE tickets SET assigned_technician_id = $1, updated_at = NOW() WHERE id = $2',
        [technicianId, ticketId]
      );
    }

    // Update the technician's role
    await client.query(
      'UPDATE ticket_technicians SET role = $1, updated_at = NOW() WHERE ticket_id = $2 AND technician_id = $3',
      [role, ticketId, technicianId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Technician role updated'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update technician role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update technician role'
    });
  } finally {
    client.release();
  }
});

module.exports = router;

