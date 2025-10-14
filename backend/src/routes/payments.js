// ═══════════════════════════════════════════════════════════════
// 💳 PAYMENT ROUTES
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');

// ───────────────────────────────────────────────────────────────
// GET /api/payments - Get all payments with filters
// ───────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await paymentService.getAll(req.query);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments',
      error: error.message
    });
  }
});

// ───────────────────────────────────────────────────────────────
// GET /api/payments/statistics - Get payment statistics
// ───────────────────────────────────────────────────────────────
router.get('/statistics', async (req, res) => {
  try {
    const stats = await paymentService.getStatistics(req.query);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get payment statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

// ───────────────────────────────────────────────────────────────
// GET /api/payments/:id - Get payment by ID
// ───────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const payment = await paymentService.getById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment',
      error: error.message
    });
  }
});

// ───────────────────────────────────────────────────────────────
// POST /api/payments - Create new payment (record manual payment)
// ───────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const payment = await paymentService.create(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  }
});

// ───────────────────────────────────────────────────────────────
// PUT /api/payments/:id - Update payment
// ───────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const payment = await paymentService.update(req.params.id, req.body);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    res.json({
      success: true,
      data: payment,
      message: 'Payment updated successfully'
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment',
      error: error.message
    });
  }
});

// ───────────────────────────────────────────────────────────────
// DELETE /api/payments/:id - Delete payment (soft delete)
// ───────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const payment = await paymentService.delete(req.params.id, req.user.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment',
      error: error.message
    });
  }
});

// ───────────────────────────────────────────────────────────────
// POST /api/payments/:id/verify - Verify payment
// ───────────────────────────────────────────────────────────────
router.post('/:id/verify', async (req, res) => {
  try {
    const payment = await paymentService.verify(req.params.id, req.user.id);
    
    res.json({
      success: true,
      data: payment,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

// ───────────────────────────────────────────────────────────────
// POST /api/payments/:id/refund - Refund payment
// ───────────────────────────────────────────────────────────────
router.post('/:id/refund', async (req, res) => {
  try {
    const payment = await paymentService.refund(req.params.id, req.body, req.user.id);
    
    res.json({
      success: true,
      data: payment,
      message: 'Payment refunded successfully'
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refund payment',
      error: error.message
    });
  }
});

module.exports = router;

