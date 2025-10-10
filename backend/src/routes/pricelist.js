const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// Get all price list items
router.get('/', async (req, res) => {
  try {
    const { service_type, package_type, is_free, is_active = 'true', search, sort_by, sort_order, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT 
        spl.id,
        spl.service_type_code,
        st.type_name,
        st.icon,
        spl.service_category_code,
        sc.category_name,
        spl.price_name,
        spl.description,
        spl.base_price,
        spl.is_free,
        spl.is_active,
        spl.applies_to_package,
        spl.notes,
        spl.created_at,
        spl.updated_at
      FROM service_pricelist spl
      JOIN service_types st ON spl.service_type_code = st.type_code
      LEFT JOIN service_categories sc ON spl.service_type_code = sc.service_type_code 
        AND spl.service_category_code = sc.category_code
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (is_active !== undefined) {
      paramCount++;
      query += ` AND spl.is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }

    if (service_type) {
      paramCount++;
      query += ` AND spl.service_type_code = $${paramCount}`;
      params.push(service_type);
    }

    if (package_type) {
      paramCount++;
      query += ` AND (spl.applies_to_package = $${paramCount} OR spl.applies_to_package = 'all')`;
      params.push(package_type);
    }

    if (is_free !== undefined) {
      paramCount++;
      query += ` AND spl.is_free = $${paramCount}`;
      params.push(is_free === 'true');
    }

    if (search) {
      paramCount++;
      query += ` AND (spl.price_name ILIKE $${paramCount} OR spl.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Sorting
    const allowedSortColumns = {
      'price_name': 'spl.price_name',
      'base_price': 'spl.base_price',
      'service_type_code': 'spl.service_type_code',
      'category_name': 'sc.category_name'
    };
    
    const sortColumn = allowedSortColumns[sort_by] || 'st.display_order, spl.base_price';
    const sortDirection = sort_order === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortColumn} ${sortDirection}`;

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM service_pricelist spl WHERE 1=1`;
    let countParams = [];
    let countParamCount = 0;
    
    if (is_active !== undefined) {
      countParamCount++;
      countQuery += ` AND spl.is_active = $${countParamCount}`;
      countParams.push(is_active === 'true');
    }
    
    if (service_type) {
      countParamCount++;
      countQuery += ` AND spl.service_type_code = $${countParamCount}`;
      countParams.push(service_type);
    }
    
    if (package_type) {
      countParamCount++;
      countQuery += ` AND (spl.applies_to_package = $${countParamCount} OR spl.applies_to_package = 'all')`;
      countParams.push(package_type);
    }
    
    if (is_free !== undefined) {
      countParamCount++;
      countQuery += ` AND spl.is_free = $${countParamCount}`;
      countParams.push(is_free === 'true');
    }
    
    if (search) {
      countParamCount++;
      countQuery += ` AND (spl.price_name ILIKE $${countParamCount} OR spl.description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalRecords = parseInt(countResult.rows[0].total);
    
    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);

    // Get summary
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN is_free = true THEN 1 END) as free_items,
        COUNT(CASE WHEN is_free = false THEN 1 END) as paid_items,
        service_type_code,
        COUNT(*) as items_per_type
      FROM service_pricelist
      WHERE is_active = true
      GROUP BY service_type_code
    `;
    
    const summaryResult = await pool.query(summaryQuery);

    res.json({
      success: true,
      data: result.rows,
      summary: summaryResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRecords,
        pages: Math.ceil(totalRecords / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching price list:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching price list',
      error: error.message
    });
  }
});

// Get price list by service type
router.get('/by-service/:service_type_code', async (req, res) => {
  try {
    const { service_type_code } = req.params;
    const { package_type } = req.query;

    let query = `
      SELECT 
        spl.id,
        spl.service_type_code,
        st.type_name,
        spl.service_category_code,
        sc.category_name,
        spl.price_name,
        spl.description,
        spl.base_price,
        spl.is_free,
        spl.applies_to_package,
        spl.notes
      FROM service_pricelist spl
      JOIN service_types st ON spl.service_type_code = st.type_code
      LEFT JOIN service_categories sc ON spl.service_type_code = sc.service_type_code 
        AND spl.service_category_code = sc.category_code
      WHERE spl.service_type_code = $1
        AND spl.is_active = true
    `;
    
    const params = [service_type_code];

    if (package_type) {
      query += ` AND (spl.applies_to_package = $2 OR spl.applies_to_package = 'all')`;
      params.push(package_type);
    }

    query += ` ORDER BY spl.base_price DESC`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No price list found for this service type'
      });
    }

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching price list by service:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching price list by service',
      error: error.message
    });
  }
});

// Get single price list item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        spl.*,
        st.type_name,
        st.icon,
        sc.category_name
      FROM service_pricelist spl
      JOIN service_types st ON spl.service_type_code = st.type_code
      LEFT JOIN service_categories sc ON spl.service_type_code = sc.service_type_code 
        AND spl.service_category_code = sc.category_code
      WHERE spl.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Price list item not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching price list item:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching price list item',
      error: error.message
    });
  }
});

// Create new price list item
router.post('/', authorize(['admin']), [
  body('service_type_code').notEmpty(),
  body('price_name').notEmpty().trim(),
  body('base_price').isFloat({ min: 0 }),
  body('is_free').optional().isBoolean(),
  body('applies_to_package').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      service_type_code,
      service_category_code,
      price_name,
      description,
      base_price,
      is_free,
      applies_to_package,
      notes
    } = req.body;

    const query = `
      INSERT INTO service_pricelist (
        service_type_code, service_category_code, price_name, description,
        base_price, is_free, applies_to_package, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      service_type_code,
      service_category_code || null,
      price_name,
      description || null,
      base_price,
      is_free || false,
      applies_to_package || 'all',
      notes || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Price list item created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating price list item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating price list item',
      error: error.message
    });
  }
});

// Update price list item
router.put('/:id', authorize(['admin']), [
  body('price_name').optional().trim(),
  body('base_price').optional().isFloat({ min: 0 }),
  body('is_free').optional().isBoolean(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      price_name,
      description,
      base_price,
      is_free,
      is_active,
      applies_to_package,
      notes
    } = req.body;

    let updateFields = [];
    let params = [];
    let paramCount = 0;

    if (price_name) {
      paramCount++;
      updateFields.push(`price_name = $${paramCount}`);
      params.push(price_name);
    }

    if (description !== undefined) {
      paramCount++;
      updateFields.push(`description = $${paramCount}`);
      params.push(description);
    }

    if (base_price !== undefined) {
      paramCount++;
      updateFields.push(`base_price = $${paramCount}`);
      params.push(base_price);
    }

    if (is_free !== undefined) {
      paramCount++;
      updateFields.push(`is_free = $${paramCount}`);
      params.push(is_free);
    }

    if (is_active !== undefined) {
      paramCount++;
      updateFields.push(`is_active = $${paramCount}`);
      params.push(is_active);
    }

    if (applies_to_package) {
      paramCount++;
      updateFields.push(`applies_to_package = $${paramCount}`);
      params.push(applies_to_package);
    }

    if (notes !== undefined) {
      paramCount++;
      updateFields.push(`notes = $${paramCount}`);
      params.push(notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    paramCount++;
    params.push(id);

    const query = `
      UPDATE service_pricelist 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Price list item not found'
      });
    }

    res.json({
      success: true,
      message: 'Price list item updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating price list item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating price list item',
      error: error.message
    });
  }
});

// Delete price list item (soft delete - set is_active to false)
router.delete('/:id', authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE service_pricelist 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Price list item not found'
      });
    }

    res.json({
      success: true,
      message: 'Price list item deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting price list item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting price list item',
      error: error.message
    });
  }
});

// Get pricing summary/statistics
router.get('/reports/summary', async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN is_free = true THEN 1 END) as free_items,
        COUNT(CASE WHEN is_free = false THEN 1 END) as paid_items,
        AVG(CASE WHEN is_free = false THEN base_price END) as avg_paid_price,
        MIN(CASE WHEN is_free = false THEN base_price END) as min_price,
        MAX(base_price) as max_price
      FROM service_pricelist
      WHERE is_active = true
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching pricing summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pricing summary',
      error: error.message
    });
  }
});

module.exports = router;

