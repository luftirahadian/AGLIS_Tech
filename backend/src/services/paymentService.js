// ═══════════════════════════════════════════════════════════════
// 💳 PAYMENT SERVICE
// ═══════════════════════════════════════════════════════════════

const pool = require('../config/database');
const invoiceService = require('./invoiceService');

class PaymentService {
  
  // ───────────────────────────────────────────────────────────────
  // GENERATE PAYMENT NUMBER
  // ───────────────────────────────────────────────────────────────
  async generatePaymentNumber() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const result = await pool.query(
      `SELECT nextval('payment_number_seq') as seq`
    );
    
    const seq = String(result.rows[0].seq).padStart(6, '0');
    return `PAY-${year}${month}-${seq}`;
  }
  
  // ───────────────────────────────────────────────────────────────
  // GET ALL PAYMENTS (with filters, pagination)
  // ───────────────────────────────────────────────────────────────
  async getAll(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      status,
      payment_method,
      customer_id,
      invoice_id,
      date_from,
      date_to,
      sort_by = 'payment_date',
      sort_order = 'DESC'
    } = filters;
    
    const offset = (page - 1) * limit;
    
    let whereConditions = ['p.is_deleted = FALSE'];
    const queryParams = [];
    let paramIndex = 1;
    
    // Search
    if (search) {
      whereConditions.push(`(
        p.payment_number ILIKE $${paramIndex} OR 
        p.reference_number ILIKE $${paramIndex} OR
        c.name ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    // Filters
    if (status) {
      whereConditions.push(`p.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }
    
    if (payment_method) {
      whereConditions.push(`p.payment_method = $${paramIndex}`);
      queryParams.push(payment_method);
      paramIndex++;
    }
    
    if (customer_id) {
      whereConditions.push(`p.customer_id = $${paramIndex}`);
      queryParams.push(customer_id);
      paramIndex++;
    }
    
    if (invoice_id) {
      whereConditions.push(`p.invoice_id = $${paramIndex}`);
      queryParams.push(invoice_id);
      paramIndex++;
    }
    
    if (date_from) {
      whereConditions.push(`p.payment_date >= $${paramIndex}`);
      queryParams.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereConditions.push(`p.payment_date <= $${paramIndex}`);
      queryParams.push(date_to);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Get payments
    const query = `
      SELECT 
        p.*,
        c.name as customer_name,
        c.email as customer_email,
        i.invoice_number,
        i.total_amount as invoice_total,
        u1.full_name as created_by_name,
        u2.full_name as verified_by_name
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.verified_by = u2.id
      ${whereClause}
      ORDER BY ${sort_by} ${sort_order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    const result = await pool.query(query, queryParams);
    
    return {
      payments: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    };
  }
  
  // ───────────────────────────────────────────────────────────────
  // GET PAYMENT BY ID
  // ───────────────────────────────────────────────────────────────
  async getById(id) {
    const query = `
      SELECT 
        p.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        i.invoice_number,
        i.total_amount as invoice_total,
        i.outstanding_amount as invoice_outstanding,
        u1.full_name as created_by_name,
        u2.full_name as verified_by_name,
        u3.full_name as refunded_by_name
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.verified_by = u2.id
      LEFT JOIN users u3 ON p.refunded_by = u3.id
      WHERE p.id = $1 AND p.is_deleted = FALSE
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
  
  // ───────────────────────────────────────────────────────────────
  // CREATE PAYMENT (Record Manual Payment)
  // ───────────────────────────────────────────────────────────────
  async create(paymentData, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const {
        invoice_id,
        customer_id,
        amount,
        payment_date = new Date(),
        payment_method,
        payment_channel,
        reference_number,
        transaction_id,
        notes,
        internal_notes,
        auto_verify = false
      } = paymentData;
      
      // Generate payment number
      const payment_number = await this.generatePaymentNumber();
      
      // Insert payment
      const paymentQuery = `
        INSERT INTO payments (
          payment_number, invoice_id, customer_id,
          payment_date, amount, payment_method, payment_channel,
          reference_number, transaction_id,
          payment_gateway, status, notes, internal_notes,
          created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
        RETURNING *
      `;
      
      const paymentResult = await client.query(paymentQuery, [
        payment_number, invoice_id, customer_id,
        payment_date, amount, payment_method, payment_channel,
        reference_number, transaction_id,
        'manual', // payment_gateway
        auto_verify ? 'completed' : 'pending', // status
        notes, internal_notes,
        userId
      ]);
      
      const payment = paymentResult.rows[0];
      
      // If auto_verify, mark as verified and update invoice
      if (auto_verify && invoice_id) {
        await client.query(`
          UPDATE payments
          SET verified_by = $1, verified_at = CURRENT_TIMESTAMP, status = 'completed'
          WHERE id = $2
        `, [userId, payment.id]);
        
        // Update invoice paid amount
        await client.query(`
          UPDATE invoices
          SET paid_amount = paid_amount + $1
          WHERE id = $2
        `, [amount, invoice_id]);
      }
      
      await client.query('COMMIT');
      
      return await this.getById(payment.id);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ───────────────────────────────────────────────────────────────
  // VERIFY PAYMENT
  // ───────────────────────────────────────────────────────────────
  async verify(id, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get payment
      const paymentResult = await client.query(
        'SELECT * FROM payments WHERE id = $1 AND is_deleted = FALSE',
        [id]
      );
      
      if (paymentResult.rows.length === 0) {
        throw new Error('Payment not found');
      }
      
      const payment = paymentResult.rows[0];
      
      if (payment.status === 'completed') {
        throw new Error('Payment already verified');
      }
      
      // Update payment status
      await client.query(`
        UPDATE payments
        SET status = 'completed', verified_by = $1, verified_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [userId, id]);
      
      // Update invoice paid amount if invoice_id exists
      if (payment.invoice_id) {
        await client.query(`
          UPDATE invoices
          SET paid_amount = paid_amount + $1
          WHERE id = $2
        `, [payment.amount, payment.invoice_id]);
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
  // REFUND PAYMENT
  // ───────────────────────────────────────────────────────────────
  async refund(id, refundData, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { refund_amount, refund_reason } = refundData;
      
      // Get payment
      const paymentResult = await client.query(
        'SELECT * FROM payments WHERE id = $1 AND is_deleted = FALSE',
        [id]
      );
      
      if (paymentResult.rows.length === 0) {
        throw new Error('Payment not found');
      }
      
      const payment = paymentResult.rows[0];
      
      if (payment.status === 'refunded') {
        throw new Error('Payment already refunded');
      }
      
      // Update payment
      await client.query(`
        UPDATE payments
        SET status = 'refunded',
            refund_amount = $1,
            refund_reason = $2,
            refunded_by = $3,
            refunded_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [refund_amount, refund_reason, userId, id]);
      
      // If payment was for an invoice, reduce invoice paid amount
      if (payment.invoice_id) {
        await client.query(`
          UPDATE invoices
          SET paid_amount = GREATEST(0, paid_amount - $1)
          WHERE id = $2
        `, [refund_amount, payment.invoice_id]);
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
  // UPDATE PAYMENT
  // ───────────────────────────────────────────────────────────────
  async update(id, paymentData) {
    const {
      payment_date,
      reference_number,
      notes,
      internal_notes
    } = paymentData;
    
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    if (payment_date !== undefined) {
      updateFields.push(`payment_date = $${paramIndex}`);
      updateValues.push(payment_date);
      paramIndex++;
    }
    
    if (reference_number !== undefined) {
      updateFields.push(`reference_number = $${paramIndex}`);
      updateValues.push(reference_number);
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
    
    if (updateFields.length === 0) {
      return await this.getById(id);
    }
    
    updateValues.push(id);
    const query = `
      UPDATE payments
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND is_deleted = FALSE
      RETURNING *
    `;
    
    await pool.query(query, updateValues);
    
    return await this.getById(id);
  }
  
  // ───────────────────────────────────────────────────────────────
  // DELETE PAYMENT (Soft Delete)
  // ───────────────────────────────────────────────────────────────
  async delete(id, userId) {
    const query = `
      UPDATE payments
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = $2
      WHERE id = $1 AND is_deleted = FALSE
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }
  
  // ───────────────────────────────────────────────────────────────
  // GET PAYMENT STATISTICS
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
      whereConditions.push(`payment_date >= $${paramIndex}`);
      queryParams.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereConditions.push(`payment_date <= $${paramIndex}`);
      queryParams.push(date_to);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    const query = `
      SELECT
        COUNT(*) as total_payments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_count,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_collected,
        COALESCE(SUM(CASE WHEN status = 'refunded' THEN refund_amount ELSE 0 END), 0) as total_refunded,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN amount END), 0) as average_payment
      FROM payments
      ${whereClause}
    `;
    
    const result = await pool.query(query, queryParams);
    return result.rows[0];
  }
  
  // ───────────────────────────────────────────────────────────────
  // GET PAYMENTS BY INVOICE
  // ───────────────────────────────────────────────────────────────
  async getByInvoice(invoiceId) {
    const query = `
      SELECT 
        p.*,
        u1.full_name as created_by_name,
        u2.full_name as verified_by_name
      FROM payments p
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.verified_by = u2.id
      WHERE p.invoice_id = $1 AND p.is_deleted = FALSE
      ORDER BY p.payment_date DESC
    `;
    
    const result = await pool.query(query, [invoiceId]);
    return result.rows;
  }
}

module.exports = new PaymentService();

