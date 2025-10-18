const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get dashboard overview statistics
router.get('/dashboard/overview', async (req, res) => {
  try {
    const { timeframe = '30' } = req.query; // days
    
    // Get current date ranges
    const now = new Date();
    const startDate = new Date(now.getTime() - (parseInt(timeframe) * 24 * 60 * 60 * 1000));
    
    // Parallel queries for better performance
    const [
      totalTicketsResult,
      todayTicketsResult,
      allTicketsByStatusResult,
      slaComplianceResult,
      avgResolutionResult,
      customerSatisfactionResult,
      activeTechniciansResult,
      revenueResult
    ] = await Promise.all([
      // Total tickets in timeframe
      pool.query(`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today,
               COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week,
               COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as month
        FROM tickets 
        WHERE created_at >= $1
      `, [startDate]),
      
      // Today's tickets by status
      pool.query(`
        SELECT status, COUNT(*) as count
        FROM tickets 
        WHERE created_at >= CURRENT_DATE
        GROUP BY status
      `),
      
      // All tickets by status (in timeframe)
      pool.query(`
        SELECT status, COUNT(*) as count
        FROM tickets 
        WHERE created_at >= $1
        GROUP BY status
      `, [startDate]),
      
      // SLA Compliance Rate
      pool.query(`
        SELECT 
          COUNT(*) as total_completed,
          COUNT(CASE WHEN completed_at <= sla_due_date THEN 1 END) as within_sla,
          ROUND(
            (COUNT(CASE WHEN completed_at <= sla_due_date THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 2
          ) as compliance_rate
        FROM tickets 
        WHERE status = 'completed' 
        AND created_at >= $1
      `, [startDate]),
      
      // Average Resolution Time
      pool.query(`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) as avg_hours,
          COUNT(*) as completed_tickets
        FROM tickets 
        WHERE status = 'completed' 
        AND created_at >= $1
      `, [startDate]),
      
      // Customer Satisfaction (mock data for now)
      pool.query(`
        SELECT 
          AVG(CASE 
            WHEN priority = 'critical' THEN 4.2
            WHEN priority = 'high' THEN 4.5
            WHEN priority = 'normal' THEN 4.7
            ELSE 4.8
          END) as avg_rating,
          COUNT(*) as total_reviews
        FROM tickets 
        WHERE status = 'completed' 
        AND created_at >= $1
      `, [startDate]),
      
      // Active Technicians
      pool.query(`
        SELECT 
          COUNT(DISTINCT t.id) as total_technicians,
          COUNT(DISTINCT CASE WHEN t.availability_status = 'available' THEN t.id END) as available,
          COUNT(DISTINCT CASE WHEN t.availability_status = 'busy' THEN t.id END) as busy,
          COUNT(DISTINCT CASE WHEN t.availability_status = 'offline' THEN t.id END) as offline
        FROM technicians t
        WHERE t.employment_status = 'active'
      `),
      
      // Revenue estimation (based on completed tickets and package prices)
      pool.query(`
        SELECT 
          SUM(pm.monthly_price) as estimated_monthly_revenue,
          COUNT(DISTINCT c.id) as active_customers
        FROM customers c
        JOIN packages_master pm ON c.package_id = pm.id
        WHERE c.account_status = 'active'
      `)
    ]);

    const overview = {
      tickets: {
        total: parseInt(totalTicketsResult.rows[0].total),
        today: parseInt(totalTicketsResult.rows[0].today),
        week: parseInt(totalTicketsResult.rows[0].week),
        month: parseInt(totalTicketsResult.rows[0].month),
        byStatus: allTicketsByStatusResult.rows.reduce((acc, row) => {
          acc[row.status] = parseInt(row.count);
          return acc;
        }, {}),
        todayByStatus: todayTicketsResult.rows.reduce((acc, row) => {
          acc[row.status] = parseInt(row.count);
          return acc;
        }, {})
      },
      sla: {
        complianceRate: parseFloat(slaComplianceResult.rows[0]?.compliance_rate || 0),
        totalCompleted: parseInt(slaComplianceResult.rows[0]?.total_completed || 0),
        withinSLA: parseInt(slaComplianceResult.rows[0]?.within_sla || 0)
      },
      resolution: {
        averageHours: parseFloat(avgResolutionResult.rows[0]?.avg_hours || 0),
        completedTickets: parseInt(avgResolutionResult.rows[0]?.completed_tickets || 0)
      },
      satisfaction: {
        averageRating: parseFloat(customerSatisfactionResult.rows[0]?.avg_rating || 0),
        totalReviews: parseInt(customerSatisfactionResult.rows[0]?.total_reviews || 0)
      },
      technicians: {
        total: parseInt(activeTechniciansResult.rows[0]?.total_technicians || 0),
        available: parseInt(activeTechniciansResult.rows[0]?.available || 0),
        busy: parseInt(activeTechniciansResult.rows[0]?.busy || 0),
        offline: parseInt(activeTechniciansResult.rows[0]?.offline || 0)
      },
      revenue: {
        estimatedMonthly: parseFloat(revenueResult.rows[0]?.estimated_monthly_revenue || 0),
        activeCustomers: parseInt(revenueResult.rows[0]?.active_customers || 0)
      }
    };

    res.json({
      success: true,
      data: overview,
      timeframe: parseInt(timeframe),
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard overview' 
    });
  }
});

// Get ticket trends for charts
router.get('/dashboard/ticket-trends', async (req, res) => {
  try {
    const { days = '30' } = req.query;
    
    const trendsResult = await pool.query(`
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '${parseInt(days)} days',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date as date
      )
      SELECT 
        ds.date,
        COALESCE(COUNT(t.id), 0) as tickets_created,
        COALESCE(COUNT(CASE WHEN t.status = 'completed' THEN 1 END), 0) as tickets_completed,
        COALESCE(COUNT(CASE WHEN t.priority = 'critical' THEN 1 END), 0) as critical_tickets
      FROM date_series ds
      LEFT JOIN tickets t ON DATE(t.created_at) = ds.date
      GROUP BY ds.date
      ORDER BY ds.date
    `);

    const trends = trendsResult.rows.map(row => ({
      date: row.date,
      created: parseInt(row.tickets_created),
      completed: parseInt(row.tickets_completed),
      critical: parseInt(row.critical_tickets)
    }));

    res.json({
      success: true,
      data: trends
    });

  } catch (error) {
    console.error('Ticket trends error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch ticket trends' 
    });
  }
});

// Get service type distribution
router.get('/dashboard/service-distribution', async (req, res) => {
  try {
    const distributionResult = await pool.query(`
      SELECT 
        type,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
      FROM tickets 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY type
      ORDER BY count DESC
    `);

    const distribution = distributionResult.rows.map(row => ({
      type: row.type,
      count: parseInt(row.count),
      percentage: parseFloat(row.percentage)
    }));

    res.json({
      success: true,
      data: distribution
    });

  } catch (error) {
    console.error('Service distribution error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch service distribution' 
    });
  }
});

  // Get technician performance
router.get('/dashboard/technician-performance', async (req, res) => {
  try {
    const performanceResult = await pool.query(`
      SELECT 
        t.full_name,
        t.employee_id,
        COUNT(tk.id) as total_tickets,
        COUNT(CASE WHEN tk.status = 'completed' THEN 1 END) as completed_tickets,
        AVG(CASE 
          WHEN tk.status = 'completed' AND tk.completed_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (tk.completed_at - tk.created_at))/3600 
        END) as avg_resolution_hours,
        COALESCE(t.customer_rating, 0) as customer_rating,
        COUNT(CASE WHEN tk.status = 'completed' AND tk.completed_at <= tk.sla_due_date THEN 1 END) as sla_met
      FROM technicians t
      LEFT JOIN tickets tk ON t.id = tk.assigned_technician_id
      WHERE t.employment_status = 'active'
      AND (tk.created_at >= CURRENT_DATE - INTERVAL '30 days' OR tk.created_at IS NULL)
      GROUP BY t.id, t.full_name, t.employee_id, t.customer_rating
      ORDER BY completed_tickets DESC
      LIMIT 10
    `);

    const performance = performanceResult.rows.map(row => ({
      name: row.full_name,
      employeeId: row.employee_id,
      totalTickets: parseInt(row.total_tickets || 0),
      completedTickets: parseInt(row.completed_tickets || 0),
      avgResolutionHours: parseFloat(row.avg_resolution_hours || 0),
      customerRating: parseFloat(row.customer_rating || 0),
      slaCompliance: row.total_tickets > 0 ? 
        Math.round((parseInt(row.sla_met || 0) / parseInt(row.total_tickets)) * 100) : 0
    }));

    res.json({
      success: true,
      data: performance
    });

  } catch (error) {
    console.error('Technician performance error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch technician performance' 
    });
  }
});

// Get priority analysis
router.get('/dashboard/priority-analysis', async (req, res) => {
  try {
    const analysisResult = await pool.query(`
      SELECT 
        priority,
        COUNT(*) as total_tickets,
        AVG(CASE 
          WHEN status = 'completed' 
          THEN EXTRACT(EPOCH FROM (completed_at - created_at))/3600 
        END) as avg_resolution_hours,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status IN ('open', 'assigned', 'in_progress') THEN 1 END) as pending
      FROM tickets 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY priority
      ORDER BY 
        CASE priority 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'normal' THEN 3 
          WHEN 'low' THEN 4 
        END
    `);

    const analysis = analysisResult.rows.map(row => ({
      priority: row.priority,
      totalTickets: parseInt(row.total_tickets),
      avgResolutionHours: parseFloat(row.avg_resolution_hours || 0),
      completed: parseInt(row.completed || 0),
      pending: parseInt(row.pending || 0),
      completionRate: row.total_tickets > 0 ? 
        Math.round((parseInt(row.completed || 0) / parseInt(row.total_tickets)) * 100) : 0
    }));

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Priority analysis error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch priority analysis' 
    });
  }
});

// Get recent activities for dashboard feed
router.get('/dashboard/recent-activities', async (req, res) => {
  try {
    const { limit = '50' } = req.query;
    
    // Get today's date at midnight (start of day)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const activitiesResult = await pool.query(`
      SELECT 
        'ticket' as type,
        t.id,
        t.ticket_number,
        t.title,
        t.status,
        t.priority,
        t.created_at as timestamp,
        'Customer' as customer_name,
        'Technician' as technician_name,
        'Admin' as created_by_name
      FROM tickets t
      WHERE t.created_at >= $1
      ORDER BY t.created_at DESC
      LIMIT $2
    `, [todayStart, parseInt(limit)]);

    const activities = activitiesResult.rows.map(row => ({
      type: row.type,
      id: row.id,
      ticketNumber: row.ticket_number,
      title: row.title,
      status: row.status,
      priority: row.priority,
      timestamp: row.timestamp,
      customerName: row.customer_name,
      technicianName: row.technician_name,
      createdByName: row.created_by_name
    }));

    res.json({
      success: true,
      data: activities
    });

  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch recent activities' 
    });
  }
});

// ============= LEGACY ENDPOINTS (for backward compatibility) =============

// Get ticket trend (legacy)
router.get('/ticket-trend', async (req, res) => {
  try {
    const { range = '7days' } = req.query;
    
    // Convert range to days
    const daysMap = {
      '7days': 7,
      '30days': 30,
      '90days': 90
    };
    const days = daysMap[range] || 7;
    
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open
      FROM tickets
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Ticket trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket trend'
    });
  }
});

// Get status distribution (legacy)
router.get('/status-distribution', async (req, res) => {
  try {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
      FROM tickets
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Status distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch status distribution'
    });
  }
});

// Get revenue trend (legacy)
router.get('/revenue-trend', async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE(i.created_at) as date,
        SUM(i.total_amount) as revenue,
        COUNT(i.id) as invoice_count,
        COUNT(CASE WHEN i.status = 'paid' THEN 1 END) as paid_count
      FROM invoices i
      WHERE i.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(i.created_at)
      ORDER BY date ASC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Revenue trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue trend'
    });
  }
});

// Get KPI metrics (legacy)
router.get('/kpi', async (req, res) => {
  try {
    const [
      ticketsResult,
      revenueResult,
      customersResult,
      slaResult
    ] = await Promise.all([
      // Total tickets
      pool.query(`
        SELECT 
          COUNT(*) as total_tickets,
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_tickets,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tickets
        FROM tickets
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      `),
      
      // Revenue
      pool.query(`
        SELECT 
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE THEN total_amount END), 0) as today_revenue,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices
        FROM invoices
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      `),
      
      // Customers
      pool.query(`
        SELECT 
          COUNT(*) as total_customers,
          COUNT(CASE WHEN registration_date >= CURRENT_DATE THEN 1 END) as today_customers,
          COUNT(CASE WHEN account_status = 'active' THEN 1 END) as active_customers
        FROM customers
      `),
      
      // SLA Compliance
      pool.query(`
        SELECT 
          COUNT(*) as total_completed,
          COUNT(CASE WHEN completed_at <= sla_due_date THEN 1 END) as within_sla,
          ROUND(
            (COUNT(CASE WHEN completed_at <= sla_due_date THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 2
          ) as compliance_rate
        FROM tickets
        WHERE status = 'completed'
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      `)
    ]);
    
    res.json({
      success: true,
      data: {
        tickets: ticketsResult.rows[0],
        revenue: revenueResult.rows[0],
        customers: customersResult.rows[0],
        sla: slaResult.rows[0]
      }
    });
  } catch (error) {
    console.error('KPI metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch KPI metrics'
    });
  }
});

// Get response time metrics (legacy)
router.get('/response-time', async (req, res) => {
  try {
    const query = `
      SELECT 
        AVG(EXTRACT(EPOCH FROM (first_response_at - created_at))/60) as avg_first_response_minutes,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) as avg_resolution_hours,
        COUNT(*) as total_tickets
      FROM tickets
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      AND status = 'completed'
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Response time metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch response time metrics'
    });
  }
});

// Get SLA compliance (legacy)
router.get('/sla-compliance', async (req, res) => {
  try {
    const query = `
      SELECT 
        status,
        COUNT(*) as total,
        COUNT(CASE WHEN completed_at <= sla_due_date THEN 1 END) as within_sla,
        COUNT(CASE WHEN completed_at > sla_due_date THEN 1 END) as breached,
        ROUND(
          (COUNT(CASE WHEN completed_at <= sla_due_date THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 2
        ) as compliance_rate
      FROM tickets
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      AND status IN ('completed', 'closed')
      GROUP BY status
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('SLA compliance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SLA compliance'
    });
  }
});

module.exports = router;
