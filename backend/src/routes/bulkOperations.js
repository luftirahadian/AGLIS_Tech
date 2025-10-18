const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const whatsappNotificationService = require('../services/whatsappNotificationService');

// ==================== REGISTRATIONS BULK OPERATIONS ====================

/**
 * Bulk Verify Registrations
 * POST /api/bulk/registrations/verify
 */
router.post('/registrations/verify', authMiddleware, async (req, res) => {
  const { ids, data = {} } = req.body;
  const client = await pool.connect();

  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required and must not be empty'
      });
    }

    // Start transaction
    await client.query('BEGIN');

    const results = [];
    let succeeded = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        // Check if registration exists and current status
        const checkQuery = 'SELECT * FROM registrations WHERE id = $1';
        const checkResult = await client.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
          results.push({
            id,
            success: false,
            error: 'Registration not found'
          });
          failed++;
          continue;
        }

        const registration = checkResult.rows[0];

        // Check if already verified
        if (registration.status === 'verified') {
          results.push({
            id,
            success: false,
            error: 'Already verified'
          });
          failed++;
          continue;
        }

        // Update status to verified
        const updateQuery = `
          UPDATE registrations 
          SET status = 'verified',
              verified_at = NOW(),
              verified_by = $1,
              notes = COALESCE($2, notes),
              updated_at = NOW()
          WHERE id = $3
          RETURNING *
        `;
        
        const updateResult = await client.query(updateQuery, [
          req.user.id,
          data.notes || 'Bulk verified',
          id
        ]);

        // Log audit trail
        await client.query(`
          INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          req.user.id,
          'BULK_VERIFY',
          'registrations',
          id,
          JSON.stringify({ notes: data.notes })
        ]);

        results.push({
          id,
          success: true,
          data: updateResult.rows[0]
        });
        succeeded++;

      } catch (error) {
        console.error(`Failed to verify registration ${id}:`, error);
        results.push({
          id,
          success: false,
          error: error.message
        });
        failed++;
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Bulk verify completed: ${succeeded} succeeded, ${failed} failed`,
      total: ids.length,
      succeeded,
      failed,
      results
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk verify registrations',
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * Bulk Approve Registrations
 * POST /api/bulk/registrations/approve
 */
router.post('/registrations/approve', authMiddleware, async (req, res) => {
  const { ids, data = {} } = req.body;
  const client = await pool.connect();

  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required and must not be empty'
      });
    }

    await client.query('BEGIN');

    const results = [];
    let succeeded = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const checkQuery = 'SELECT * FROM registrations WHERE id = $1';
        const checkResult = await client.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
          results.push({
            id,
            success: false,
            error: 'Registration not found'
          });
          failed++;
          continue;
        }

        const registration = checkResult.rows[0];

        if (registration.status === 'approved') {
          results.push({
            id,
            success: false,
            error: 'Already approved'
          });
          failed++;
          continue;
        }

        // Update status to approved
        const updateQuery = `
          UPDATE registrations 
          SET status = 'approved',
              approved_at = NOW(),
              approved_by = $1,
              notes = COALESCE($2, notes),
              updated_at = NOW()
          WHERE id = $3
          RETURNING *
        `;
        
        const updateResult = await client.query(updateQuery, [
          req.user.id,
          data.notes || 'Bulk approved',
          id
        ]);

        // Log audit trail
        await client.query(`
          INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          req.user.id,
          'BULK_APPROVE',
          'registrations',
          id,
          JSON.stringify({ notes: data.notes })
        ]);

        // Send WhatsApp notification
        try {
          await whatsappNotificationService.sendRegistrationApproved(registration);
        } catch (whatsappError) {
          console.error('WhatsApp notification failed:', whatsappError);
        }

        results.push({
          id,
          success: true,
          data: updateResult.rows[0]
        });
        succeeded++;

      } catch (error) {
        console.error(`Failed to approve registration ${id}:`, error);
        results.push({
          id,
          success: false,
          error: error.message
        });
        failed++;
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Bulk approve completed: ${succeeded} succeeded, ${failed} failed`,
      total: ids.length,
      succeeded,
      failed,
      results
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk approve error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk approve registrations',
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * Bulk Reject Registrations
 * POST /api/bulk/registrations/reject
 */
router.post('/registrations/reject', authMiddleware, async (req, res) => {
  const { ids, data = {} } = req.body;
  const client = await pool.connect();

  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required and must not be empty'
      });
    }

    if (!data.rejection_reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    await client.query('BEGIN');

    const results = [];
    let succeeded = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const checkQuery = 'SELECT * FROM registrations WHERE id = $1';
        const checkResult = await client.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
          results.push({
            id,
            success: false,
            error: 'Registration not found'
          });
          failed++;
          continue;
        }

        const registration = checkResult.rows[0];

        if (registration.status === 'rejected') {
          results.push({
            id,
            success: false,
            error: 'Already rejected'
          });
          failed++;
          continue;
        }

        // Update status to rejected
        const updateQuery = `
          UPDATE registrations 
          SET status = 'rejected',
              rejected_at = NOW(),
              rejected_by = $1,
              rejection_reason = $2,
              notes = COALESCE($3, notes),
              updated_at = NOW()
          WHERE id = $4
          RETURNING *
        `;
        
        const updateResult = await client.query(updateQuery, [
          req.user.id,
          data.rejection_reason,
          data.notes || 'Bulk rejected',
          id
        ]);

        // Log audit trail
        await client.query(`
          INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          req.user.id,
          'BULK_REJECT',
          'registrations',
          id,
          JSON.stringify({ rejection_reason: data.rejection_reason, notes: data.notes })
        ]);

        // Send WhatsApp notification
        try {
          await whatsappNotificationService.sendRegistrationRejected(registration, data.rejection_reason);
        } catch (whatsappError) {
          console.error('WhatsApp notification failed:', whatsappError);
        }

        results.push({
          id,
          success: true,
          data: updateResult.rows[0]
        });
        succeeded++;

      } catch (error) {
        console.error(`Failed to reject registration ${id}:`, error);
        results.push({
          id,
          success: false,
          error: error.message
        });
        failed++;
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Bulk reject completed: ${succeeded} succeeded, ${failed} failed`,
      total: ids.length,
      succeeded,
      failed,
      results
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk reject error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk reject registrations',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// ==================== TICKETS BULK OPERATIONS ====================

/**
 * Bulk Assign Tickets
 * POST /api/bulk/tickets/assign
 */
router.post('/tickets/assign', authMiddleware, async (req, res) => {
  const { ids, data = {} } = req.body;
  const client = await pool.connect();

  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required and must not be empty'
      });
    }

    if (!data.technician_id) {
      return res.status(400).json({
        success: false,
        message: 'Technician ID is required'
      });
    }

    await client.query('BEGIN');

    const results = [];
    let succeeded = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const checkQuery = 'SELECT * FROM tickets WHERE id = $1';
        const checkResult = await client.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
          results.push({
            id,
            success: false,
            error: 'Ticket not found'
          });
          failed++;
          continue;
        }

        const ticket = checkResult.rows[0];

        // Update ticket
        const updateQuery = `
          UPDATE tickets 
          SET technician_id = $1,
              status = 'assigned',
              assigned_at = NOW(),
              updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `;
        
        const updateResult = await client.query(updateQuery, [
          data.technician_id,
          id
        ]);

        // Log audit trail
        await client.query(`
          INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          req.user.id,
          'BULK_ASSIGN',
          'tickets',
          id,
          JSON.stringify({ technician_id: data.technician_id })
        ]);

        results.push({
          id,
          success: true,
          data: updateResult.rows[0]
        });
        succeeded++;

      } catch (error) {
        console.error(`Failed to assign ticket ${id}:`, error);
        results.push({
          id,
          success: false,
          error: error.message
        });
        failed++;
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Bulk assign completed: ${succeeded} succeeded, ${failed} failed`,
      total: ids.length,
      succeeded,
      failed,
      results
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk assign error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk assign tickets',
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * Bulk Update Ticket Status
 * POST /api/bulk/tickets/update-status
 */
router.post('/tickets/update-status', authMiddleware, async (req, res) => {
  const { ids, data = {} } = req.body;
  const client = await pool.connect();

  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required and must not be empty'
      });
    }

    if (!data.status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['open', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'];
    if (!validStatuses.includes(data.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    await client.query('BEGIN');

    const results = [];
    let succeeded = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const checkQuery = 'SELECT * FROM tickets WHERE id = $1';
        const checkResult = await client.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
          results.push({
            id,
            success: false,
            error: 'Ticket not found'
          });
          failed++;
          continue;
        }

        // Update ticket status
        const updateQuery = `
          UPDATE tickets 
          SET status = $1,
              updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `;
        
        const updateResult = await client.query(updateQuery, [
          data.status,
          id
        ]);

        // Log audit trail
        await client.query(`
          INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          req.user.id,
          'BULK_UPDATE_STATUS',
          'tickets',
          id,
          JSON.stringify({ status: data.status })
        ]);

        results.push({
          id,
          success: true,
          data: updateResult.rows[0]
        });
        succeeded++;

      } catch (error) {
        console.error(`Failed to update ticket status ${id}:`, error);
        results.push({
          id,
          success: false,
          error: error.message
        });
        failed++;
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Bulk update status completed: ${succeeded} succeeded, ${failed} failed`,
      total: ids.length,
      succeeded,
      failed,
      results
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update ticket status',
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * Bulk Update Ticket Priority
 * POST /api/bulk/tickets/update-priority
 */
router.post('/tickets/update-priority', authMiddleware, async (req, res) => {
  const { ids, data = {} } = req.body;
  const client = await pool.connect();

  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required and must not be empty'
      });
    }

    if (!data.priority) {
      return res.status(400).json({
        success: false,
        message: 'Priority is required'
      });
    }

    const validPriorities = ['low', 'normal', 'high', 'critical'];
    if (!validPriorities.includes(data.priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
      });
    }

    await client.query('BEGIN');

    const results = [];
    let succeeded = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const checkQuery = 'SELECT * FROM tickets WHERE id = $1';
        const checkResult = await client.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
          results.push({
            id,
            success: false,
            error: 'Ticket not found'
          });
          failed++;
          continue;
        }

        // Update ticket priority
        const updateQuery = `
          UPDATE tickets 
          SET priority = $1,
              updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `;
        
        const updateResult = await client.query(updateQuery, [
          data.priority,
          id
        ]);

        // Log audit trail
        await client.query(`
          INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          req.user.id,
          'BULK_UPDATE_PRIORITY',
          'tickets',
          id,
          JSON.stringify({ priority: data.priority })
        ]);

        results.push({
          id,
          success: true,
          data: updateResult.rows[0]
        });
        succeeded++;

      } catch (error) {
        console.error(`Failed to update ticket priority ${id}:`, error);
        results.push({
          id,
          success: false,
          error: error.message
        });
        failed++;
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Bulk update priority completed: ${succeeded} succeeded, ${failed} failed`,
      total: ids.length,
      succeeded,
      failed,
      results
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk update priority error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update ticket priority',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// ==================== CUSTOMERS BULK OPERATIONS ====================

/**
 * Bulk Update Customer Status
 * POST /api/bulk/customers/update-status
 */
router.post('/customers/update-status', authMiddleware, async (req, res) => {
  const { ids, data = {} } = req.body;
  const client = await pool.connect();

  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required and must not be empty'
      });
    }

    if (!data.account_status) {
      return res.status(400).json({
        success: false,
        message: 'Account status is required'
      });
    }

    const validStatuses = ['active', 'inactive', 'suspended', 'terminated'];
    if (!validStatuses.includes(data.account_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    await client.query('BEGIN');

    const results = [];
    let succeeded = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const checkQuery = 'SELECT * FROM customers WHERE id = $1';
        const checkResult = await client.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
          results.push({
            id,
            success: false,
            error: 'Customer not found'
          });
          failed++;
          continue;
        }

        // Update customer status
        const updateQuery = `
          UPDATE customers 
          SET account_status = $1,
              updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `;
        
        const updateResult = await client.query(updateQuery, [
          data.account_status,
          id
        ]);

        // Log audit trail
        await client.query(`
          INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          req.user.id,
          'BULK_UPDATE_STATUS',
          'customers',
          id,
          JSON.stringify({ account_status: data.account_status })
        ]);

        results.push({
          id,
          success: true,
          data: updateResult.rows[0]
        });
        succeeded++;

      } catch (error) {
        console.error(`Failed to update customer status ${id}:`, error);
        results.push({
          id,
          success: false,
          error: error.message
        });
        failed++;
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Bulk update status completed: ${succeeded} succeeded, ${failed} failed`,
      total: ids.length,
      succeeded,
      failed,
      results
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update customer status',
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * Bulk Delete Customers
 * POST /api/bulk/customers/delete
 */
router.post('/customers/delete', authMiddleware, async (req, res) => {
  const { ids } = req.body;
  const client = await pool.connect();

  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required and must not be empty'
      });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete customers'
      });
    }

    await client.query('BEGIN');

    const results = [];
    let succeeded = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const checkQuery = 'SELECT * FROM customers WHERE id = $1';
        const checkResult = await client.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
          results.push({
            id,
            success: false,
            error: 'Customer not found'
          });
          failed++;
          continue;
        }

        // Log audit trail before deletion
        await client.query(`
          INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          req.user.id,
          'BULK_DELETE',
          'customers',
          id,
          JSON.stringify({ customer: checkResult.rows[0] })
        ]);

        // Delete customer
        const deleteQuery = 'DELETE FROM customers WHERE id = $1';
        await client.query(deleteQuery, [id]);

        results.push({
          id,
          success: true
        });
        succeeded++;

      } catch (error) {
        console.error(`Failed to delete customer ${id}:`, error);
        results.push({
          id,
          success: false,
          error: error.message
        });
        failed++;
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Bulk delete completed: ${succeeded} succeeded, ${failed} failed`,
      total: ids.length,
      succeeded,
      failed,
      results
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk delete customers',
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;

