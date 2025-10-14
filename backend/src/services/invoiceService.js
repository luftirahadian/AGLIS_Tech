// ═══════════════════════════════════════════════════════════════
// 💰 INVOICE SERVICE
// ═══════════════════════════════════════════════════════════════

const pool = require('../config/database');
const { format } = require('date-fns');

class InvoiceService {
  
  // ───────────────────────────────────────────────────────────────
  // GENERATE INVOICE NUMBER
  // ───────────────────────────────────────────────────────────────
  async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const result = await pool.query(
      `SELECT nextval('invoice_number_seq') as seq`
    );
    
    const seq = String(result.rows[0].seq).padStart(6, '0');
    return `INV-${year}${month}-${seq}`;
  }
  
  // ───────────────────────────────────────────────────────────────
  // GET ALL INVOICES (with filters, pagination, search)
  // ───────────────────────────────────────────────────────────────
  async getAll(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      status,
      customer_id,
      date_from,
      date_to,
      overdue_only = false,
      sort_by = 'invoice_date',
      sort_order = 'DESC'
    } = filters;
    
    const offset = (page - 1) * limit;
    
    let whereConditions = ['i.is_deleted = FALSE'];
    const queryParams = [];
    let paramIndex = 1;
    
    // Search by invoice number or customer name
    if (search) {
      whereConditions.push(`(
        i.invoice_number ILIKE $${paramIndex} OR 
        c.name ILIKE $${paramIndex} OR 
        c.email ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    // Filter by status
    if (status) {
      whereConditions.push(`i.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }
    
    // Filter by customer
    if (customer_id) {
      whereConditions.push(`i.customer_id = $${paramIndex}`);
      queryParams.push(customer_id);
      paramIndex++;
    }
    
    // Filter by date range
    if (date_from) {
      whereConditions.push(`i.invoice_date >= $${paramIndex}`);
      queryParams.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereConditions.push(`i.invoice_date <= $${paramIndex}`);
      queryParams.push(date_to);
      paramIndex++;
    }
    
    // Overdue only
    if (overdue_only === true || overdue_only === 'true') {
      whereConditions.push(`i.due_date < CURRENT_DATE AND i.status IN ('sent', 'viewed', 'partial')`);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Get invoices
    const query = `
      SELECT 
        i.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        u.full_name as created_by_name,
        (
          SELECT COUNT(*)
          FROM invoice_line_items
          WHERE invoice_id = i.id
        ) as line_items_count
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN users u ON i.created_by = u.id
      ${whereClause}
      ORDER BY ${sort_by} ${sort_order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    const result = await pool.query(query, queryParams);
    
    return {
      invoices: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    };
  }
  
  // ───────────────────────────────────────────────────────────────
  // GET INVOICE BY ID (with line items)
  // ───────────────────────────────────────────────────────────────
  async getById(id) {
    const query = `
      SELECT 
        i.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        c.package_id,
        p.package_name,
        u.full_name as created_by_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN packages_master p ON c.package_id = p.id
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.id = $1 AND i.is_deleted = FALSE
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const invoice = result.rows[0];
    
    // Get line items
    const itemsQuery = `
      SELECT * FROM invoice_line_items
      WHERE invoice_id = $1
      ORDER BY id ASC
    `;
    
    const itemsResult = await pool.query(itemsQuery, [id]);
    invoice.line_items = itemsResult.rows;
    
    // Get payments
    const paymentsQuery = `
      SELECT 
        p.*,
        u.full_name as verified_by_name
      FROM payments p
      LEFT JOIN users u ON p.verified_by = u.id
      WHERE p.invoice_id = $1 AND p.is_deleted = FALSE
      ORDER BY p.payment_date DESC
    `;
    
    const paymentsResult = await pool.query(paymentsQuery, [id]);
    invoice.payments = paymentsResult.rows;
    
    return invoice;
  }
  
  // ───────────────────────────────────────────────────────────────
  // CREATE INVOICE
  // ───────────────────────────────────────────────────────────────
  async create(invoiceData, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const {
        customer_id,
        invoice_date = new Date(),
        due_date,
        billing_period_start,
        billing_period_end,
        line_items = [],
        tax_percentage = 11.00,
        discount_amount = 0,
        discount_percentage = 0,
        notes,
        internal_notes,
        invoice_type = 'recurring',
        auto_send = false
      } = invoiceData;
      
      // Generate invoice number
      const invoice_number = await this.generateInvoiceNumber();
      
      // Calculate totals from line items
      let subtotal = 0;
      for (const item of line_items) {
        const item_discount = item.discount_amount || 0;
        const line_total = (item.quantity * item.unit_price) - item_discount;
        subtotal += line_total;
      }
      
      // Apply invoice-level discount
      const invoice_discount = discount_amount || (subtotal * (discount_percentage / 100));
      const subtotal_after_discount = subtotal - invoice_discount;
      
      // Calculate tax
      const tax_amount = subtotal_after_discount * (tax_percentage / 100);
      
      // Total amount
      const total_amount = subtotal_after_discount + tax_amount;
      
      // Insert invoice
      const invoiceQuery = `
        INSERT INTO invoices (
          invoice_number, customer_id, invoice_date, due_date,
          billing_period_start, billing_period_end,
          subtotal, tax_amount, tax_percentage,
          discount_amount, discount_percentage,
          total_amount, outstanding_amount,
          status, invoice_type, notes, internal_notes,
          created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12, $13, $14, $15, $16, $17
        )
        RETURNING *
      `;
      
      const invoiceResult = await client.query(invoiceQuery, [
        invoice_number, customer_id, invoice_date, due_date,
        billing_period_start, billing_period_end,
        subtotal, tax_amount, tax_percentage,
        invoice_discount, discount_percentage,
        total_amount,
        auto_send ? 'sent' : 'draft',
        invoice_type, notes, internal_notes,
        userId
      ]);
      
      const invoice = invoiceResult.rows[0];
      
      // Insert line items
      for (const item of line_items) {
        const item_discount = item.discount_amount || 0;
        const item_discount_pct = item.discount_percentage || 0;
        const line_total = (item.quantity * item.unit_price) - item_discount;
        
        const itemQuery = `
          INSERT INTO invoice_line_items (
            invoice_id, item_type, item_reference_id,
            description, quantity, unit_price,
            discount_amount, discount_percentage,
            line_total, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;
        
        await client.query(itemQuery, [
          invoice.id, item.item_type, item.item_reference_id,
          item.description, item.quantity, item.unit_price,
          item_discount, item_discount_pct,
          line_total, JSON.stringify(item.metadata || {})
        ]);
      }
      
      // If auto_send, mark as sent
      if (auto_send) {
        await client.query(
          `UPDATE invoices SET sent_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [invoice.id]
        );
      }
      
      await client.query('COMMIT');
      
      return await this.getById(invoice.id);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ───────────────────────────────────────────────────────────────
  // UPDATE INVOICE
  // ───────────────────────────────────────────────────────────────
  async update(id, invoiceData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const {
        due_date,
        notes,
        internal_notes,
        status,
        line_items
      } = invoiceData;
      
      // Update invoice header
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      if (due_date !== undefined) {
        updateFields.push(`due_date = $${paramIndex}`);
        updateValues.push(due_date);
        paramIndex++;
      }
      
      if (notes !== undefined) {
        updateFields.push(`notes = $${paramIndex}`);
        updateValues.push(notes);
        paramIndex++;
      }
      
      if (internal_notes !== undefined) {
        updateFields.push(`internal_notes = $${paramIndex}`);
        updateValues.push(internal_notes);
        paramIndex++;
      }
      
      if (status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        updateValues.push(status);
        paramIndex++;
        
        if (status === 'sent') {
          updateFields.push(`sent_at = CURRENT_TIMESTAMP`);
        }
      }
      
      if (updateFields.length > 0) {
        updateValues.push(id);
        const updateQuery = `
          UPDATE invoices
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex} AND is_deleted = FALSE
        `;
        
        await client.query(updateQuery, updateValues);
      }
      
      // Update line items if provided
      if (line_items && Array.isArray(line_items)) {
        // Delete existing line items
        await client.query('DELETE FROM invoice_line_items WHERE invoice_id = $1', [id]);
        
        // Insert new line items
        let subtotal = 0;
        for (const item of line_items) {
          const item_discount = item.discount_amount || 0;
          const line_total = (item.quantity * item.unit_price) - item_discount;
          subtotal += line_total;
          
          const itemQuery = `
            INSERT INTO invoice_line_items (
              invoice_id, item_type, item_reference_id,
              description, quantity, unit_price,
              discount_amount, discount_percentage,
              line_total, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `;
          
          await client.query(itemQuery, [
            id, item.item_type, item.item_reference_id,
            item.description, item.quantity, item.unit_price,
            item_discount, item.discount_percentage || 0,
            line_total, JSON.stringify(item.metadata || {})
          ]);
        }
        
        // Recalculate invoice totals
        const invoice = await client.query('SELECT * FROM invoices WHERE id = $1', [id]);
        const tax_percentage = invoice.rows[0].tax_percentage || 11;
        const discount_amount = invoice.rows[0].discount_amount || 0;
        const discount_percentage = invoice.rows[0].discount_percentage || 0;
        
        const invoice_discount = discount_amount || (subtotal * (discount_percentage / 100));
        const subtotal_after_discount = subtotal - invoice_discount;
        const tax_amount = subtotal_after_discount * (tax_percentage / 100);
        const total_amount = subtotal_after_discount + tax_amount;
        
        await client.query(`
          UPDATE invoices
          SET subtotal = $1, tax_amount = $2, total_amount = $3
          WHERE id = $4
        `, [subtotal, tax_amount, total_amount, id]);
      }
      
      await client.query('COMMIT');
      
      return await this.getById(id);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ───────────────────────────────────────────────────────────────
  // DELETE INVOICE (Soft Delete)
  // ───────────────────────────────────────────────────────────────
  async delete(id, userId) {
    const query = `
      UPDATE invoices
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = $2
      WHERE id = $1 AND is_deleted = FALSE
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }
  
  // ───────────────────────────────────────────────────────────────
  // RECORD PAYMENT FOR INVOICE
  // ───────────────────────────────────────────────────────────────
  async recordPayment(invoiceId, amount) {
    const query = `
      UPDATE invoices
      SET paid_amount = paid_amount + $2
      WHERE id = $1 AND is_deleted = FALSE
      RETURNING *
    `;
    
    const result = await pool.query(query, [invoiceId, amount]);
    return result.rows[0];
  }
  
  // ───────────────────────────────────────────────────────────────
  // GET INVOICE STATISTICS
  // ───────────────────────────────────────────────────────────────
  async getStatistics(filters = {}) {
    const { customer_id, date_from, date_to } = filters;
    
    let whereConditions = ['is_deleted = FALSE'];
    const queryParams = [];
    let paramIndex = 1;
    
    if (customer_id) {
      whereConditions.push(`customer_id = $${paramIndex}`);
      queryParams.push(customer_id);
      paramIndex++;
    }
    
    if (date_from) {
      whereConditions.push(`invoice_date >= $${paramIndex}`);
      queryParams.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereConditions.push(`invoice_date <= $${paramIndex}`);
      queryParams.push(date_to);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    const query = `
      SELECT
        COUNT(*) as total_invoices,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
        COUNT(CASE WHEN status IN ('sent', 'viewed') THEN 1 END) as pending_count,
        COALESCE(SUM(total_amount), 0) as total_billed,
        COALESCE(SUM(paid_amount), 0) as total_paid,
        COALESCE(SUM(outstanding_amount), 0) as total_outstanding,
        COALESCE(AVG(total_amount), 0) as average_invoice_value
      FROM invoices
      ${whereClause}
    `;
    
    const result = await pool.query(query, queryParams);
    return result.rows[0];
  }
  
  // ───────────────────────────────────────────────────────────────
  // MARK AS SENT
  // ───────────────────────────────────────────────────────────────
  async markAsSent(id) {
    const query = `
      UPDATE invoices
      SET status = 'sent', sent_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_deleted = FALSE
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
  
  // ───────────────────────────────────────────────────────────────
  // CHECK AND UPDATE OVERDUE INVOICES
  // ───────────────────────────────────────────────────────────────
  async checkOverdueInvoices() {
    const query = `
      UPDATE invoices
      SET status = 'overdue'
      WHERE due_date < CURRENT_DATE
        AND status IN ('sent', 'viewed', 'partial')
        AND is_deleted = FALSE
      RETURNING id, invoice_number, customer_id
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = new InvoiceService();

