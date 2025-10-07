-- Enhanced Customer Management System
-- Migration 007: Create comprehensive customer tables

-- 1. Packages Master Table
CREATE TABLE IF NOT EXISTS packages_master (
    id SERIAL PRIMARY KEY,
    package_name VARCHAR(100) NOT NULL,
    package_type VARCHAR(50) NOT NULL, -- broadband/dedicated/corporate/mitra
    bandwidth_up INTEGER NOT NULL, -- in Mbps
    bandwidth_down INTEGER NOT NULL, -- in Mbps
    monthly_price DECIMAL(12,2) NOT NULL,
    setup_fee DECIMAL(12,2) DEFAULT 0,
    sla_level VARCHAR(20) DEFAULT 'silver', -- gold/silver/bronze
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Enhanced Customers Table (replace existing)
DROP TABLE IF EXISTS customers CASCADE;
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    
    -- Customer ID (manual input)
    customer_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Personal Information
    name VARCHAR(255) NOT NULL,
    ktp VARCHAR(20),
    phone VARCHAR(20) NOT NULL,
    phone_alt VARCHAR(20), -- alternative phone
    email VARCHAR(255),
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    odp VARCHAR(100),
    
    -- Contact Person Info
    pic_name VARCHAR(255),
    pic_position VARCHAR(100),
    pic_phone VARCHAR(20),
    
    -- Business Info
    business_type VARCHAR(50) DEFAULT 'residential', -- residential/office/shop/factory/etc
    operating_hours VARCHAR(100), -- for technician visits
    
    -- Account Information
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    client_area_password VARCHAR(255) NOT NULL,
    
    -- Service Information
    customer_type VARCHAR(20) DEFAULT 'regular', -- regular/non-regular
    payment_type VARCHAR(20) DEFAULT 'postpaid', -- prepaid/postpaid
    payment_status VARCHAR(20) DEFAULT 'unpaid', -- paid/unpaid/pending
    account_status VARCHAR(20) DEFAULT 'active', -- active/inactive/suspended
    service_type VARCHAR(30) DEFAULT 'broadband', -- broadband/dedicated/corporate/mitra
    
    -- Package Information
    package_id INTEGER REFERENCES packages_master(id),
    subscription_start_date DATE,
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly/quarterly/yearly
    due_date DATE,
    last_payment_date DATE,
    outstanding_balance DECIMAL(12,2) DEFAULT 0,
    
    -- Technical Information
    ip_address INET,
    ip_type VARCHAR(20) DEFAULT 'dynamic', -- static/dynamic
    installation_date DATE,
    assigned_technician_id INTEGER REFERENCES technicians(id),
    signal_strength INTEGER, -- percentage
    signal_quality VARCHAR(20), -- excellent/good/fair/poor
    
    -- Service History
    total_tickets INTEGER DEFAULT 0,
    last_service_date DATE,
    customer_rating DECIMAL(3,2) DEFAULT 0, -- average rating
    service_quality_score INTEGER DEFAULT 0,
    
    -- Notes and Timestamps
    notes TEXT,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    account_activation_date TIMESTAMP,
    last_login_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Customer Equipment Table
CREATE TABLE IF NOT EXISTS customer_equipment (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    equipment_type VARCHAR(50) NOT NULL, -- modem/router/switch/cable/etc
    brand VARCHAR(50),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    mac_address VARCHAR(17),
    installation_date DATE,
    warranty_expiry DATE,
    status VARCHAR(20) DEFAULT 'active', -- active/inactive/damaged/replaced
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Customer Payment History Table
CREATE TABLE IF NOT EXISTS customer_payments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE,
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50), -- cash/transfer/card/ewallet
    payment_reference VARCHAR(100), -- transaction reference
    billing_period_start DATE,
    billing_period_end DATE,
    payment_status VARCHAR(20) DEFAULT 'completed', -- pending/completed/failed/refunded
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Customer Service History Table
CREATE TABLE IF NOT EXISTS customer_service_history (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    ticket_id INTEGER REFERENCES tickets(id),
    service_date DATE NOT NULL,
    service_type VARCHAR(50), -- installation/repair/maintenance/upgrade
    technician_id INTEGER REFERENCES technicians(id),
    service_duration INTEGER, -- in minutes
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_feedback TEXT,
    service_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Customer Complaints Table
CREATE TABLE IF NOT EXISTS customer_complaints (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    complaint_date DATE NOT NULL,
    complaint_type VARCHAR(50), -- service/billing/technical/other
    complaint_description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- low/medium/high/critical
    status VARCHAR(20) DEFAULT 'open', -- open/in_progress/resolved/closed
    resolution TEXT,
    resolved_date DATE,
    resolved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_package_id ON customers(package_id);
CREATE INDEX IF NOT EXISTS idx_customers_service_type ON customers(service_type);
CREATE INDEX IF NOT EXISTS idx_customers_account_status ON customers(account_status);
CREATE INDEX IF NOT EXISTS idx_customer_equipment_customer_id ON customer_equipment(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id ON customer_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_date ON customer_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_customer_service_history_customer_id ON customer_service_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_complaints_customer_id ON customer_complaints(customer_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_master_updated_at BEFORE UPDATE ON packages_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_equipment_updated_at BEFORE UPDATE ON customer_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_payments_updated_at BEFORE UPDATE ON customer_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_complaints_updated_at BEFORE UPDATE ON customer_complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
