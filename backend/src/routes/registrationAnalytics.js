const express = require('express');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get registration analytics overview
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const { timeframe = 30 } = req.query; // days

    // Registration funnel metrics
    const funnelQuery = `
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN status = 'pending_verification' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified,
        COUNT(CASE WHEN status = 'survey_scheduled' THEN 1 END) as survey_scheduled,
        COUNT(CASE WHEN status = 'survey_completed' THEN 1 END) as survey_completed,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as converted_to_customer,
        ROUND(
          (COUNT(CASE WHEN status = 'approved' THEN 1 END)::NUMERIC / 
           NULLIF(COUNT(*), 0) * 100), 
          2
        ) as approval_rate,
        ROUND(
          (COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END)::NUMERIC / 
           NULLIF(COUNT(CASE WHEN status = 'approved' THEN 1 END), 0) * 100), 
          2
        ) as conversion_rate
      FROM customer_registrations
      WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(timeframe)} days'
    `;

    const funnelResult = await pool.query(funnelQuery);

    // Time-based metrics
    const timeMetricsQuery = `
      SELECT 
        ROUND(
          AVG(EXTRACT(EPOCH FROM (verified_at - created_at)) / 3600)::NUMERIC,
          1
        ) as avg_verification_time_hours,
        ROUND(
          AVG(EXTRACT(EPOCH FROM (approved_at - created_at)) / 3600)::NUMERIC,
          1
        ) as avg_approval_time_hours
      FROM customer_registrations
      WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(timeframe)} days'
        AND verified_at IS NOT NULL
    `;

    const timeResult = await pool.query(timeMetricsQuery);

    res.json({
      success: true,
      data: {
        funnel: funnelResult.rows[0],
        time_metrics: timeResult.rows[0],
        timeframe: parseInt(timeframe)
      }
    });

  } catch (error) {
    console.error('Registration analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get registration trends (daily)
router.get('/trends', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const trendsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
      FROM customer_registrations
      WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `;

    const result = await pool.query(trendsQuery);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Registration trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get package popularity from registrations
router.get('/package-popularity', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        pm.package_name,
        pm.package_type,
        pm.bandwidth_down,
        pm.monthly_price,
        COUNT(r.id) as registration_count,
        COUNT(CASE WHEN r.status = 'approved' THEN 1 END) as approved_count,
        ROUND(
          (COUNT(CASE WHEN r.status = 'approved' THEN 1 END)::NUMERIC / 
           NULLIF(COUNT(r.id), 0) * 100), 
          2
        ) as approval_rate
      FROM packages_master pm
      LEFT JOIN customer_registrations r ON pm.id = r.package_id
      WHERE pm.package_type = 'broadband'
      GROUP BY pm.id, pm.package_name, pm.package_type, pm.bandwidth_down, pm.monthly_price
      ORDER BY registration_count DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Package popularity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get rejection reasons analysis
router.get('/rejection-analysis', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        rejection_reason,
        COUNT(*) as count,
        ROUND(
          (COUNT(*)::NUMERIC / 
           NULLIF((SELECT COUNT(*) FROM customer_registrations WHERE status = 'rejected'), 0) * 100), 
          2
        ) as percentage
      FROM customer_registrations
      WHERE status = 'rejected' AND rejection_reason IS NOT NULL
      GROUP BY rejection_reason
      ORDER BY count DESC
      LIMIT 10
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Rejection analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get geographic distribution
router.get('/geographic-distribution', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        city,
        COUNT(*) as registration_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as converted_count
      FROM customer_registrations
      GROUP BY city
      ORDER BY registration_count DESC
      LIMIT 20
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Geographic distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get conversion funnel data
router.get('/funnel', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        'Total Registrations' as stage,
        COUNT(*) as count,
        100 as percentage,
        1 as step_order
      FROM customer_registrations
      
      UNION ALL
      
      SELECT 
        'Verified' as stage,
        COUNT(*) as count,
        ROUND((COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM customer_registrations), 0) * 100), 2) as percentage,
        2 as step_order
      FROM customer_registrations
      WHERE status IN ('verified', 'survey_scheduled', 'survey_completed', 'approved')
      
      UNION ALL
      
      SELECT 
        'Survey Completed' as stage,
        COUNT(*) as count,
        ROUND((COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM customer_registrations), 0) * 100), 2) as percentage,
        3 as step_order
      FROM customer_registrations
      WHERE status IN ('survey_completed', 'approved')
      
      UNION ALL
      
      SELECT 
        'Approved' as stage,
        COUNT(*) as count,
        ROUND((COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM customer_registrations), 0) * 100), 2) as percentage,
        4 as step_order
      FROM customer_registrations
      WHERE status = 'approved'
      
      UNION ALL
      
      SELECT 
        'Converted to Customer' as stage,
        COUNT(*) as count,
        ROUND((COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM customer_registrations), 0) * 100), 2) as percentage,
        5 as step_order
      FROM customer_registrations
      WHERE customer_id IS NOT NULL
      
      ORDER BY step_order
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Funnel analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

