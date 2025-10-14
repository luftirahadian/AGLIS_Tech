-- ═══════════════════════════════════════════════════════════════
-- 💰 BILLING & PAYMENT MODULE - DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════
-- Migration: 040_create_billing_system.sql
-- Description: Complete billing and payment management system
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. INVOICES TABLE
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Invoice Dates
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  billing_period_start DATE,
  billing_period_end DATE,
  
  -- Amounts
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_percentage DECIMAL(5,2) DEFAULT 11.00, -- PPN 11%
  discount_amount DECIMAL(15,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  outstanding_amount DECIMAL(15,2) NOT NULL,
  
  -- Status & Type
  status VARCHAR(20) NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled', 'refunded')),
  invoice_type VARCHAR(20) DEFAULT 'recurring' 
    CHECK (invoice_type IN ('recurring', 'one_time', 'installation', 'additional')),
  
  -- Payment Terms
  payment_terms TEXT,
  payment_method_preferred VARCHAR(50),
  
  -- Notes & Metadata
  notes TEXT,
  internal_notes TEXT,
  terms_conditions TEXT,
  
  -- Tracking
  sent_at TIMESTAMP,
  viewed_at TIMESTAMP,
  paid_at TIMESTAMP,
  last_reminder_sent TIMESTAMP,
  reminder_count INTEGER DEFAULT 0,
  
  -- Audit
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Soft Delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  deleted_by INTEGER REFERENCES users(id)
);

-- Invoice Number Sequence for Auto-generation
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

COMMENT ON TABLE invoices IS 'Customer invoices for billing management';
COMMENT ON COLUMN invoices.invoice_number IS 'Unique invoice number (e.g., INV-2025-001234)';
COMMENT ON COLUMN invoices.outstanding_amount IS 'Remaining amount to be paid (total - paid)';
COMMENT ON COLUMN invoices.status IS 'Invoice status: draft, sent, viewed, paid, partial, overdue, cancelled, refunded';

-- ───────────────────────────────────────────────────────────────
-- 2. INVOICE LINE ITEMS TABLE
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Item Details
  item_type VARCHAR(50) NOT NULL 
    CHECK (item_type IN ('package', 'service', 'equipment', 'installation', 'addon', 'other')),
  item_reference_id INTEGER, -- Reference to packages_master, service_pricelist, equipment_master
  
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  
  -- Discounts
  discount_amount DECIMAL(15,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Calculated
  line_total DECIMAL(15,2) NOT NULL, -- (quantity * unit_price) - discount
  
  -- Metadata
  metadata JSONB, -- Store additional info like package details, service period, etc.
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE invoice_line_items IS 'Line items for each invoice (services, packages, equipment, etc.)';
COMMENT ON COLUMN invoice_line_items.item_reference_id IS 'FK to source table (packages, services, equipment)';

-- ───────────────────────────────────────────────────────────────
-- 3. PAYMENTS TABLE
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Payment Details
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(15,2) NOT NULL,
  
  -- Payment Method
  payment_method VARCHAR(50) NOT NULL 
    CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'debit_card', 'e_wallet', 'virtual_account', 'qris', 'other')),
  payment_channel VARCHAR(100), -- e.g., 'BCA', 'Mandiri', 'GoPay', 'OVO'
  
  -- Transaction Details
  transaction_id VARCHAR(100), -- External payment gateway transaction ID
  reference_number VARCHAR(100), -- Bank reference, receipt number, etc.
  
  -- Payment Gateway Integration
  payment_gateway VARCHAR(50), -- 'midtrans', 'xendit', 'manual'
  gateway_response JSONB, -- Store full gateway response
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'verified', 'completed', 'failed', 'cancelled', 'refunded')),
  
  -- Verification
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  -- Refund Info (if applicable)
  refund_amount DECIMAL(15,2) DEFAULT 0,
  refund_reason TEXT,
  refunded_at TIMESTAMP,
  refunded_by INTEGER REFERENCES users(id),
  
  -- Audit
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Soft Delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  deleted_by INTEGER REFERENCES users(id)
);

-- Payment Number Sequence
CREATE SEQUENCE IF NOT EXISTS payment_number_seq START 1000;

COMMENT ON TABLE payments IS 'Payment records for invoices';
COMMENT ON COLUMN payments.payment_gateway IS 'Payment gateway used: midtrans, xendit, manual';
COMMENT ON COLUMN payments.gateway_response IS 'Full JSON response from payment gateway';

-- ───────────────────────────────────────────────────────────────
-- 4. PAYMENT METHODS (Customer Saved Payment Methods)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_payment_methods (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Method Details
  method_type VARCHAR(50) NOT NULL 
    CHECK (method_type IN ('bank_account', 'credit_card', 'e_wallet', 'auto_debit')),
  provider VARCHAR(100), -- 'BCA', 'Mandiri', 'GoPay', etc.
  
  -- Account Details (masked/tokenized)
  account_number_masked VARCHAR(50), -- e.g., '****1234'
  account_holder_name VARCHAR(200),
  
  -- Tokenization (for recurring payments)
  payment_token VARCHAR(255), -- Gateway token for saved cards
  token_expires_at TIMESTAMP,
  
  -- Settings
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  auto_debit_enabled BOOLEAN DEFAULT FALSE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Soft Delete
  is_deleted BOOLEAN DEFAULT FALSE
);

COMMENT ON TABLE customer_payment_methods IS 'Saved payment methods for customers (auto-debit, cards, etc.)';

-- ───────────────────────────────────────────────────────────────
-- 5. BILLING SCHEDULES (Recurring Invoice Generation)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS billing_schedules (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Schedule Details
  schedule_name VARCHAR(200),
  billing_frequency VARCHAR(20) NOT NULL DEFAULT 'monthly' 
    CHECK (billing_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  
  -- Timing
  billing_day INTEGER DEFAULT 1, -- Day of month to generate invoice (1-31)
  due_days INTEGER DEFAULT 7, -- Days until due date
  
  -- Invoice Details
  invoice_template_items JSONB, -- Store line items to be used in recurring invoices
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  next_billing_date DATE,
  last_billing_date DATE,
  
  -- Auto-actions
  auto_send BOOLEAN DEFAULT FALSE,
  auto_reminder BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE billing_schedules IS 'Recurring billing schedules for automatic invoice generation';
COMMENT ON COLUMN billing_schedules.invoice_template_items IS 'JSON array of line items to include in recurring invoices';

-- ───────────────────────────────────────────────────────────────
-- 6. BILLING ALERTS (Overdue, Reminders, etc.)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS billing_alerts (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Alert Details
  alert_type VARCHAR(50) NOT NULL 
    CHECK (alert_type IN ('overdue', 'due_soon', 'payment_received', 'payment_failed', 'reminder')),
  alert_message TEXT NOT NULL,
  
  -- Notification
  sent_via VARCHAR(50), -- 'email', 'whatsapp', 'sms', 'system'
  sent_at TIMESTAMP,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE billing_alerts IS 'Billing alerts and reminders for customers and admins';

-- ───────────────────────────────────────────────────────────────
-- 7. INDEXES FOR PERFORMANCE
-- ───────────────────────────────────────────────────────────────

-- Invoices Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_outstanding ON invoices(outstanding_amount) WHERE outstanding_amount > 0 AND is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_overdue ON invoices(due_date, status) WHERE status != 'paid' AND is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- Invoice Line Items Indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_type ON invoice_line_items(item_type);

-- Payments Indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_payments_number ON payments(payment_number);

-- Payment Methods Indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_customer ON customer_payment_methods(customer_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON customer_payment_methods(is_active) WHERE is_deleted = FALSE;

-- Billing Schedules Indexes
CREATE INDEX IF NOT EXISTS idx_billing_schedules_customer ON billing_schedules(customer_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_billing_schedules_next_date ON billing_schedules(next_billing_date) WHERE is_active = TRUE;

-- Billing Alerts Indexes
CREATE INDEX IF NOT EXISTS idx_billing_alerts_invoice ON billing_alerts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_alerts_customer ON billing_alerts(customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_alerts_unread ON billing_alerts(is_read, created_at DESC) WHERE is_read = FALSE;

-- ───────────────────────────────────────────────────────────────
-- 8. FUNCTIONS & TRIGGERS
-- ───────────────────────────────────────────────────────────────

-- Update outstanding amount automatically
CREATE OR REPLACE FUNCTION update_invoice_outstanding()
RETURNS TRIGGER AS $$
BEGIN
  NEW.outstanding_amount := NEW.total_amount - NEW.paid_amount;
  
  -- Auto-update status based on payment
  IF NEW.outstanding_amount <= 0 THEN
    NEW.status := 'paid';
    NEW.paid_at := CURRENT_TIMESTAMP;
  ELSIF NEW.paid_amount > 0 AND NEW.outstanding_amount > 0 THEN
    NEW.status := 'partial';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_outstanding
BEFORE INSERT OR UPDATE OF total_amount, paid_amount ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_invoice_outstanding();

-- Auto-update invoice status to overdue
CREATE OR REPLACE FUNCTION check_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE due_date < CURRENT_DATE
    AND status IN ('sent', 'viewed', 'partial')
    AND is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_invoice_items_updated_at
BEFORE UPDATE ON invoice_line_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────────
-- 9. INITIAL DATA / DEFAULTS
-- ───────────────────────────────────────────────────────────────

-- Default payment terms
INSERT INTO system_settings (setting_key, setting_value, description, created_at)
VALUES 
  ('invoice_payment_terms', 'Payment due within 7 days. Late payments may incur additional charges.', 'Default payment terms for invoices', CURRENT_TIMESTAMP),
  ('invoice_tax_percentage', '11.00', 'Default tax percentage (PPN)', CURRENT_TIMESTAMP),
  ('invoice_due_days', '7', 'Default days until invoice due date', CURRENT_TIMESTAMP),
  ('billing_day_of_month', '1', 'Default day of month for recurring billing', CURRENT_TIMESTAMP),
  ('overdue_reminder_days', '3', 'Days after due date to send overdue reminder', CURRENT_TIMESTAMP)
ON CONFLICT (setting_key) DO NOTHING;

-- ───────────────────────────────────────────────────────────────
-- 10. ANALYZE TABLES
-- ───────────────────────────────────────────────────────────────
ANALYZE invoices;
ANALYZE invoice_line_items;
ANALYZE payments;
ANALYZE customer_payment_methods;
ANALYZE billing_schedules;
ANALYZE billing_alerts;

-- ═══════════════════════════════════════════════════════════════
-- ✅ BILLING SYSTEM DATABASE SCHEMA CREATED
-- ═══════════════════════════════════════════════════════════════

