// ═══════════════════════════════════════════════════════════════
// 💰 INVOICE ROUTES
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const invoiceService = require('../services/invoiceService');

// ───────────────────────────────────────────────────────────────
// GET /api/invoices - Get all invoices with filters
// ───────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await invoiceService.getAll(req.query);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoices',
      error: error.message
    });
  }
});

// ───────────────────────────────────────────────────────────────
// GET /api/invoices/statistics - Get invoice statistics
// ───────────────────────────────────────────────────────────────
router.get('/statistics', async (req, res) => {
  try {
    const stats = await invoiceService.getStatistics(req.query);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get invoice statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

// ───────────────────────────────────────────────────────────────
// GET /api/invoices/:id - Get invoice by ID
// ───────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const invoice = await invoiceService.getById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoice',
      error: error.message
    });
  }
});

// ───────────────────────────────────────────────────────────────
// POST /api/invoices - Create new invoice
// ───────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const invoice = await invoiceService.create(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully'
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message
    });
  }
});

// ───────────────────────────────────────────────────────────────
// PUT /api/invoices/:id - Update invoice
// ───────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const invoice = await invoiceService.update(req.params.id, req.body);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      data: invoice,
      message: 'Invoice updated successfully'
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice',
      error: error.message
    });
  }
});

// ───────────────────────────────────────────────────────────────
// DELETE /api/invoices/:id - Delete invoice (soft delete)
// ───────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await invoiceService.delete(req.params.id, req.user.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invoice',
      error: error.message
    });
  }
});

// ───────────────────────────────────────────────────────────────
// POST /api/invoices/:id/send - Mark invoice as sent
// ───────────────────────────────────────────────────────────────
router.post('/:id/send', async (req, res) => {
  try {
    const invoice = await invoiceService.markAsSent(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      data: invoice,
      message: 'Invoice marked as sent'
    });
  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice',
      error: error.message
    });
  }
});

// ───────────────────────────────────────────────────────────────
// POST /api/invoices/check-overdue - Check and update overdue invoices
// ───────────────────────────────────────────────────────────────
router.post('/check-overdue', async (req, res) => {
  try {
    const overdueInvoices = await invoiceService.checkOverdueInvoices();
    
    res.json({
      success: true,
      data: overdueInvoices,
      message: `${overdueInvoices.length} invoices marked as overdue`
    });
  } catch (error) {
    console.error('Check overdue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check overdue invoices',
      error: error.message
    });
  }
});

module.exports = router;

