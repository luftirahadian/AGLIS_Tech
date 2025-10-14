// ═══════════════════════════════════════════════════════════════
// ⏰ BILLING CRON JOBS
// ═══════════════════════════════════════════════════════════════
// Scheduled jobs for automatic billing processes
// ═══════════════════════════════════════════════════════════════

const cron = require('node-cron');
const recurringBillingService = require('../services/recurringBillingService');

class BillingCronJobs {
  
  // ───────────────────────────────────────────────────────────────
  // START ALL BILLING CRON JOBS
  // ───────────────────────────────────────────────────────────────
  startAll() {
    console.log('⏰ Starting billing cron jobs...');
    
    // Job 1: Generate monthly invoices (runs on 1st of every month at 00:01)
    this.monthlyInvoiceGeneration();
    
    // Job 2: Check overdue invoices (runs daily at 08:00)
    this.dailyOverdueCheck();
    
    console.log('✅ All billing cron jobs started successfully');
  }
  
  // ───────────────────────────────────────────────────────────────
  // MONTHLY INVOICE GENERATION
  // ───────────────────────────────────────────────────────────────
  monthlyInvoiceGeneration() {
    // Run on 1st of every month at 00:01 (UTC+7 = 07:01 server time if UTC)
    const schedule = '1 0 1 * *'; // minute hour day-of-month month day-of-week
    
    cron.schedule(schedule, async () => {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('🔄 CRON JOB: Monthly Invoice Generation');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`⏰ Triggered at: ${new Date().toISOString()}`);
      
      try {
        const result = await recurringBillingService.generateMonthlyInvoices({
          billing_day: 1,
          auto_send: true,
          dry_run: false
        });
        
        console.log('✅ Monthly invoice generation completed');
        console.log(`   Success: ${result.success}`);
        console.log(`   Failed: ${result.failed}`);
        console.log(`   Skipped: ${result.skipped}`);
        
        if (result.errors && result.errors.length > 0) {
          console.log('⚠️  Errors:');
          result.errors.forEach(err => {
            console.log(`   - ${err.customer_name}: ${err.error}`);
          });
        }
        
      } catch (error) {
        console.error('❌ Monthly invoice generation failed:', error.message);
      }
      
      console.log('═══════════════════════════════════════════════════════\n');
    }, {
      scheduled: true,
      timezone: 'Asia/Jakarta' // Indonesia timezone
    });
    
    console.log(`   ✓ Monthly Invoice Generation: Every 1st of month at 00:01 WIB`);
  }
  
  // ───────────────────────────────────────────────────────────────
  // DAILY OVERDUE CHECK
  // ───────────────────────────────────────────────────────────────
  dailyOverdueCheck() {
    // Run every day at 08:00 WIB
    const schedule = '0 8 * * *'; // minute hour day-of-month month day-of-week
    
    cron.schedule(schedule, async () => {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('📬 CRON JOB: Daily Overdue Check & Reminders');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`⏰ Triggered at: ${new Date().toISOString()}`);
      
      try {
        const result = await recurringBillingService.checkOverdueAndRemind();
        
        console.log('✅ Overdue check completed');
        console.log(`   Overdue Invoices: ${result.overdue_count}`);
        console.log(`   Reminders Sent: ${result.reminders_sent}`);
        
      } catch (error) {
        console.error('❌ Overdue check failed:', error.message);
      }
      
      console.log('═══════════════════════════════════════════════════════\n');
    }, {
      scheduled: true,
      timezone: 'Asia/Jakarta'
    });
    
    console.log(`   ✓ Daily Overdue Check: Every day at 08:00 WIB`);
  }
  
  // ───────────────────────────────────────────────────────────────
  // MANUAL TRIGGER (for testing)
  // ───────────────────────────────────────────────────────────────
  async triggerMonthlyInvoices(dry_run = false) {
    console.log('🔧 MANUAL TRIGGER: Monthly Invoice Generation');
    
    const result = await recurringBillingService.generateMonthlyInvoices({
      billing_day: 1,
      auto_send: true,
      dry_run: dry_run
    });
    
    return result;
  }
  
  async triggerOverdueCheck() {
    console.log('🔧 MANUAL TRIGGER: Overdue Check');
    
    const result = await recurringBillingService.checkOverdueAndRemind();
    
    return result;
  }
}

module.exports = new BillingCronJobs();

