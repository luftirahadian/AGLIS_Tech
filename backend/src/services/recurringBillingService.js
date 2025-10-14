// ═══════════════════════════════════════════════════════════════
// 🔄 RECURRING BILLING SERVICE
// ═══════════════════════════════════════════════════════════════
// Automatic monthly invoice generation for active customers
// ═══════════════════════════════════════════════════════════════

const pool = require('../config/database');
const invoiceService = require('./invoiceService');

class RecurringBillingService {
  
  // ───────────────────────────────────────────────────────────────
  // GENERATE RECURRING INVOICES FOR ALL ACTIVE CUSTOMERS
  // ───────────────────────────────────────────────────────────────
  async generateMonthlyInvoices(options = {}) {
    const {
      billing_day = 1, // Day of month to generate (1-31)
      auto_send = true,
      dry_run = false
    } = options;

    console.log(`🔄 Starting recurring invoice generation (Billing Day: ${billing_day}, Auto Send: ${auto_send}, Dry Run: ${dry_run})`);

    try {
      // Get all active customers with packages
      const customersQuery = `
        SELECT 
          c.id,
          c.name,
          c.email,
          c.phone,
          c.address,
          c.package_id,
          p.package_name,
          p.monthly_price,
          p.package_type,
          c.status
        FROM customers c
        LEFT JOIN packages_master p ON c.package_id = p.id
        WHERE c.status = 'active'
          AND c.package_id IS NOT NULL
          AND p.is_active = TRUE
        ORDER BY c.id
      `;

      const customersResult = await pool.query(customersQuery);
      const customers = customersResult.rows;

      console.log(`📊 Found ${customers.length} active customers with packages`);

      if (dry_run) {
        console.log('🧪 DRY RUN MODE - No invoices will be created');
        return {
          success: true,
          dry_run: true,
          customers_count: customers.length,
          customers: customers.map(c => ({
            id: c.id,
            name: c.name,
            package: c.package_name,
            amount: c.monthly_price
          }))
        };
      }

      const results = {
        success: 0,
        failed: 0,
        skipped: 0,
        total: customers.length,
        errors: []
      };

      // Calculate billing period
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      
      const billing_period_start = new Date(year, month, 1);
      const billing_period_end = new Date(year, month + 1, 0);
      const invoice_date = new Date(year, month, billing_day);
      const due_date = new Date(invoice_date);
      due_date.setDate(due_date.getDate() + 7); // 7 days payment term

      // Generate invoice for each customer
      for (const customer of customers) {
        try {
          // Check if invoice already exists for this period
          const existingQuery = `
            SELECT id FROM invoices
            WHERE customer_id = $1
              AND billing_period_start = $2
              AND billing_period_end = $3
              AND is_deleted = FALSE
            LIMIT 1
          `;

          const existingResult = await pool.query(existingQuery, [
            customer.id,
            billing_period_start,
            billing_period_end
          ]);

          if (existingResult.rows.length > 0) {
            console.log(`⏭️  Skipping customer ${customer.name} - Invoice already exists for this period`);
            results.skipped++;
            continue;
          }

          // Create invoice data
          const invoiceData = {
            customer_id: customer.id,
            invoice_date: invoice_date.toISOString().split('T')[0],
            due_date: due_date.toISOString().split('T')[0],
            billing_period_start: billing_period_start.toISOString().split('T')[0],
            billing_period_end: billing_period_end.toISOString().split('T')[0],
            invoice_type: 'recurring',
            tax_percentage: 11.00,
            line_items: [
              {
                item_type: 'package',
                item_reference_id: customer.package_id,
                description: `${customer.package_name} - ${customer.package_type} (Monthly Subscription)`,
                quantity: 1,
                unit_price: customer.monthly_price,
                discount_amount: 0,
                metadata: {
                  package_id: customer.package_id,
                  package_name: customer.package_name,
                  package_type: customer.package_type,
                  billing_month: billing_period_start.toISOString().split('T')[0]
                }
              }
            ],
            notes: `Monthly subscription invoice for ${billing_period_start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`,
            auto_send: auto_send
          };

          // Create invoice
          const invoice = await invoiceService.create(invoiceData, 1); // System user ID = 1

          console.log(`✅ Created invoice ${invoice.invoice_number} for ${customer.name} - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(invoice.total_amount)}`);

          // Create notification for admin (direct insert)
          try {
            await pool.query(`
              INSERT INTO notifications (
                user_id, type, title, message, data, priority
              ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              1, // Admin user
              'invoice_generated',
              'New Invoice Generated',
              `Invoice ${invoice.invoice_number} created for ${customer.name}`,
              JSON.stringify({
                invoice_id: invoice.id,
                invoice_number: invoice.invoice_number,
                customer_id: customer.id,
                customer_name: customer.name,
                amount: invoice.total_amount
              }),
              'normal'
            ]);
          } catch (notifError) {
            console.warn('⚠️  Failed to create notification:', notifError.message);
          }

          results.success++;

        } catch (error) {
          console.error(`❌ Failed to create invoice for ${customer.name}:`, error.message);
          results.failed++;
          results.errors.push({
            customer_id: customer.id,
            customer_name: customer.name,
            error: error.message
          });
        }
      }

      console.log(`🎉 Recurring billing completed: ${results.success} success, ${results.failed} failed, ${results.skipped} skipped`);

      return results;

    } catch (error) {
      console.error('❌ Recurring billing error:', error);
      throw error;
    }
  }

  // ───────────────────────────────────────────────────────────────
  // GET RECURRING BILLING STATISTICS
  // ───────────────────────────────────────────────────────────────
  async getStatistics() {
    const query = `
      SELECT
        COUNT(*) as total_active_customers,
        COUNT(CASE WHEN c.package_id IS NOT NULL THEN 1 END) as customers_with_package,
        COALESCE(SUM(p.monthly_price), 0) as total_monthly_revenue,
        COALESCE(AVG(p.monthly_price), 0) as average_package_price
      FROM customers c
      LEFT JOIN packages_master p ON c.package_id = p.id
      WHERE c.status = 'active'
        AND c.is_deleted = FALSE
    `;

    const result = await pool.query(query);
    return result.rows[0];
  }

  // ───────────────────────────────────────────────────────────────
  // CHECK OVERDUE INVOICES & SEND REMINDERS
  // ───────────────────────────────────────────────────────────────
  async checkOverdueAndRemind() {
    try {
      // Update overdue invoices
      const overdueInvoices = await invoiceService.checkOverdueInvoices();

      console.log(`📧 Found ${overdueInvoices.length} overdue invoices`);

      // Send reminder for each overdue invoice (max 1 per day)
      for (const invoice of overdueInvoices) {
        // Check if reminder was sent today
        const checkQuery = `
          SELECT last_reminder_sent
          FROM invoices
          WHERE id = $1
        `;

        const checkResult = await pool.query(checkQuery, [invoice.id]);
        const lastSent = checkResult.rows[0]?.last_reminder_sent;

        if (lastSent) {
          const lastSentDate = new Date(lastSent).toDateString();
          const today = new Date().toDateString();

          if (lastSentDate === today) {
            console.log(`⏭️  Skipping reminder for ${invoice.invoice_number} - Already sent today`);
            continue;
          }
        }

        // Create notification/alert
        await pool.query(`
          INSERT INTO billing_alerts (
            invoice_id, customer_id, alert_type, alert_message, sent_via
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          invoice.id,
          invoice.customer_id,
          'overdue',
          `Invoice ${invoice.invoice_number} is overdue. Please make payment as soon as possible.`,
          'system'
        ]);

        // Update reminder count
        await pool.query(`
          UPDATE invoices
          SET last_reminder_sent = CURRENT_TIMESTAMP,
              reminder_count = reminder_count + 1
          WHERE id = $1
        `, [invoice.id]);

        console.log(`📬 Sent overdue reminder for ${invoice.invoice_number}`);
      }

      return {
        success: true,
        overdue_count: overdueInvoices.length,
        reminders_sent: overdueInvoices.length
      };

    } catch (error) {
      console.error('❌ Check overdue error:', error);
      throw error;
    }
  }
}

module.exports = new RecurringBillingService();

