const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// All analytics routes require authentication
router.use(authenticate);
router.use(authorize('admin', 'supervisor', 'manager'));

/**
 * GET /api/analytics/ticket-trend
 * Get ticket creation trend
 */
router.get('/ticket-trend', async (req, res) => {
  try {
    const { range = '7days' } = req.query;
    
    let days = 7;
    if (range === 'today') days = 1;
    else if (range === '30days') days = 30;
    else if (range === '90days') days = 90;
    else if (range === 'year') days = 365;
    
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as tickets,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM tickets
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        date: new Date(row.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        tickets: parseInt(row.tickets),
        completed: parseInt(row.completed)
      }))
    });
  } catch (error) {
    console.error('Error fetching ticket trend:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket trend'
    });
  }
});

/**
 * GET /api/analytics/status-distribution
 * Get ticket status distribution
 */
router.get('/status-distribution', async (req, res) => {
  try {
    const query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM tickets
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
        count: parseInt(row.count)
      }))
    });
  } catch (error) {
    console.error('Error fetching status distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch status distribution'
    });
  }
});

/**
 * GET /api/analytics/technician-performance
 * Get technician performance metrics
 */
router.get('/technician-performance', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.full_name as name,
        COUNT(tk.*) as total,
        COUNT(CASE WHEN tk.status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN tk.status != 'completed' THEN 1 END) as pending
      FROM technicians t
      LEFT JOIN tickets tk ON t.id = tk.assigned_technician_id
      WHERE t.status = 'available'
        AND (tk.created_at >= CURRENT_DATE - INTERVAL '30 days' OR tk.created_at IS NULL)
      GROUP BY t.id, t.full_name
      HAVING COUNT(tk.*) > 0
      ORDER BY completed DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        name: row.name,
        total: parseInt(row.total),
        completed: parseInt(row.completed),
        pending: parseInt(row.pending)
      }))
    });
  } catch (error) {
    console.error('Error fetching technician performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch technician performance'
    });
  }
});

/**
 * GET /api/analytics/revenue-trend
 * Get monthly revenue trend
 */
router.get('/revenue-trend', async (req, res) => {
  try {
    const query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', invoice_date), 'Mon YYYY') as month,
        SUM(total_amount) as revenue,
        SUM(total_amount) * 1.1 as target
      FROM invoices
      WHERE invoice_date >= CURRENT_DATE - INTERVAL '12 months'
        AND status IN ('paid', 'partial')
      GROUP BY DATE_TRUNC('month', invoice_date)
      ORDER BY DATE_TRUNC('month', invoice_date) ASC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        month: row.month,
        revenue: parseFloat(row.revenue) || 0,
        target: parseFloat(row.target) || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching revenue trend:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue trend'
    });
  }
});

/**
 * GET /api/analytics/kpi
 * Get KPI metrics
 */
router.get('/kpi', async (req, res) => {
  try {
    // Total tickets (last 30 days)
    const ticketQuery = `
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tickets,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) as avg_response_time
      FROM tickets
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `;
    
    const ticketResult = await pool.query(ticketQuery);
    const tickets = ticketResult.rows[0];
    
    // Revenue this month
    const revenueQuery = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as monthly_revenue,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) as paid_revenue
      FROM invoices
      WHERE DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', CURRENT_DATE)
    `;
    
    const revenueResult = await pool.query(revenueQuery);
    const revenue = revenueResult.rows[0];
    
    // Calculate growth rates (compare with previous period)
    const prevTicketQuery = `
      SELECT COUNT(*) as prev_tickets
      FROM tickets
      WHERE created_at >= CURRENT_DATE - INTERVAL '60 days'
        AND created_at < CURRENT_DATE - INTERVAL '30 days'
    `;
    
    const prevTicketResult = await pool.query(prevTicketQuery);
    const prevTickets = parseInt(prevTicketResult.rows[0].prev_tickets) || 1;
    const currentTickets = parseInt(tickets.total_tickets) || 0;
    const ticketGrowth = ((currentTickets - prevTickets) / prevTickets * 100).toFixed(1);
    
    const completionRate = tickets.total_tickets > 0 
      ? ((tickets.completed_tickets / tickets.total_tickets) * 100).toFixed(1)
      : 0;
    
    res.json({
      success: true,
      data: {
        total_tickets: currentTickets,
        ticket_growth: parseFloat(ticketGrowth),
        completion_rate: parseFloat(completionRate),
        completion_growth: 5.2, // Mock data - implement real calculation
        avg_response_time: parseFloat(tickets.avg_response_time || 0).toFixed(1),
        response_improvement: 12.5, // Mock data
        monthly_revenue: parseFloat(revenue.monthly_revenue),
        revenue_growth: 8.3 // Mock data
      }
    });
  } catch (error) {
    console.error('Error fetching KPI metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch KPI metrics'
    });
  }
});

module.exports = router;
