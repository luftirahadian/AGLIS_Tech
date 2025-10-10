const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// Get all inventory stock with equipment details
router.get('/', async (req, res) => {
  try {
    const { category, low_stock, search, sort_by, sort_order, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT 
        ist.id,
        ist.equipment_id,
        em.equipment_code,
        em.equipment_name,
        em.category,
        em.unit,
        ist.warehouse_location,
        ist.current_stock,
        ist.minimum_stock,
        ist.maximum_stock,
        ist.unit_cost,
        ist.total_value,
        ist.supplier_name,
        ist.supplier_contact,
        ist.last_restock_date,
        ist.last_restock_quantity,
        ist.notes,
        CASE 
          WHEN ist.current_stock <= ist.minimum_stock THEN true 
          ELSE false 
        END as is_low_stock,
        ist.created_at,
        ist.updated_at
      FROM inventory_stock ist
      JOIN equipment_master em ON ist.equipment_id = em.id
      WHERE em.is_active = true
    `;
    
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND em.category = $${paramCount}`;
      params.push(category);
    }

    if (low_stock === 'true') {
      query += ` AND ist.current_stock <= ist.minimum_stock`;
    }

    if (search) {
      paramCount++;
      query += ` AND (em.equipment_name ILIKE $${paramCount} OR em.equipment_code ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Sorting
    const allowedSortColumns = {
      'equipment_name': 'em.equipment_name',
      'category': 'em.category',
      'current_stock': 'ist.current_stock',
      'unit_cost': 'ist.unit_cost',
      'total_value': 'ist.total_value',
      'supplier_name': 'ist.supplier_name'
    };
    
    const sortColumn = allowedSortColumns[sort_by] || 'em.equipment_name';
    const sortDirection = sort_order === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortColumn} ${sortDirection}`;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM inventory_stock ist
      JOIN equipment_master em ON ist.equipment_id = em.id
      WHERE em.is_active = true
    `;
    
    const countParams = [];
    let countParamCount = 0;
    
    if (category) {
      countParamCount++;
      countQuery += ` AND em.category = $${countParamCount}`;
      countParams.push(category);
    }

    if (low_stock === 'true') {
      countQuery += ` AND ist.current_stock <= ist.minimum_stock`;
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (em.equipment_name ILIKE $${countParamCount} OR em.equipment_code ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalRecords = parseInt(countResult.rows[0].total);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_items,
        SUM(total_value) as total_inventory_value,
        COUNT(CASE WHEN current_stock <= minimum_stock THEN 1 END) as low_stock_items,
        em.category,
        COUNT(*) as items_in_category
      FROM inventory_stock ist
      JOIN equipment_master em ON ist.equipment_id = em.id
      GROUP BY em.category
    `;
    
    const summaryResult = await pool.query(summaryQuery);

    res.json({
      success: true,
      data: result.rows,
      summary: summaryResult.rows,
      total: totalRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalRecords / parseInt(limit)),
        totalRecords: totalRecords
      }
    });
  } catch (error) {
    console.error('Error fetching inventory stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory stock',
      error: error.message
    });
  }
});

// Get single inventory stock item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        ist.*,
        em.equipment_code,
        em.equipment_name,
        em.category,
        em.description as equipment_description,
        em.unit
      FROM inventory_stock ist
      JOIN equipment_master em ON ist.equipment_id = em.id
      WHERE ist.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory stock item not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching inventory stock item:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory stock item',
      error: error.message
    });
  }
});

// Update inventory stock (restock or adjust)
router.put('/:id', authorize(['admin', 'supervisor']), [
  body('current_stock').optional().isInt({ min: 0 }),
  body('minimum_stock').optional().isInt({ min: 0 }),
  body('unit_cost').optional().isFloat({ min: 0 }),
  body('supplier_name').optional().trim(),
  body('notes').optional().trim()
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
      current_stock,
      minimum_stock,
      maximum_stock,
      unit_cost,
      supplier_name,
      supplier_contact,
      last_restock_quantity,
      notes
    } = req.body;

    let updateFields = [];
    let params = [];
    let paramCount = 0;

    if (current_stock !== undefined) {
      paramCount++;
      updateFields.push(`current_stock = $${paramCount}`);
      params.push(current_stock);
    }

    if (minimum_stock !== undefined) {
      paramCount++;
      updateFields.push(`minimum_stock = $${paramCount}`);
      params.push(minimum_stock);
    }

    if (maximum_stock !== undefined) {
      paramCount++;
      updateFields.push(`maximum_stock = $${paramCount}`);
      params.push(maximum_stock);
    }

    if (unit_cost !== undefined) {
      paramCount++;
      updateFields.push(`unit_cost = $${paramCount}`);
      params.push(unit_cost);
    }

    if (supplier_name) {
      paramCount++;
      updateFields.push(`supplier_name = $${paramCount}`);
      params.push(supplier_name);
    }

    if (supplier_contact) {
      paramCount++;
      updateFields.push(`supplier_contact = $${paramCount}`);
      params.push(supplier_contact);
    }

    if (last_restock_quantity !== undefined) {
      paramCount++;
      updateFields.push(`last_restock_quantity = $${paramCount}`);
      params.push(last_restock_quantity);
      
      paramCount++;
      updateFields.push(`last_restock_date = CURRENT_DATE`);
    }

    if (notes) {
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
      UPDATE inventory_stock 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Inventory stock updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating inventory stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating inventory stock',
      error: error.message
    });
  }
});

// Get low stock items (for alerts)
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const query = `
      SELECT 
        ist.id,
        em.equipment_name,
        em.category,
        em.unit,
        ist.current_stock,
        ist.minimum_stock,
        ist.warehouse_location,
        (ist.minimum_stock - ist.current_stock) as shortage
      FROM inventory_stock ist
      JOIN equipment_master em ON ist.equipment_id = em.id
      WHERE ist.current_stock <= ist.minimum_stock
      ORDER BY (ist.minimum_stock - ist.current_stock) DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock alerts',
      error: error.message
    });
  }
});

// Get inventory value by category
router.get('/reports/value-by-category', async (req, res) => {
  try {
    const query = `
      SELECT 
        em.category,
        COUNT(*) as total_items,
        SUM(ist.current_stock) as total_quantity,
        SUM(ist.total_value) as total_value
      FROM inventory_stock ist
      JOIN equipment_master em ON ist.equipment_id = em.id
      GROUP BY em.category
      ORDER BY total_value DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching inventory value report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory value report',
      error: error.message
    });
  }
});

module.exports = router;

