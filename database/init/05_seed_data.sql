-- Insert default system settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
('company_name', 'ISP Management System', 'Company name displayed in the application', true),
('company_address', 'Jl. Teknologi No. 123, Jakarta', 'Company address', true),
('company_phone', '+62-21-1234-5678', 'Company phone number', true),
('company_email', 'info@isp-management.com', 'Company email address', true),
('default_sla_emergency', '2', 'Default SLA for emergency tickets (hours)', false),
('default_sla_critical', '4', 'Default SLA for critical tickets (hours)', false),
('default_sla_high', '8', 'Default SLA for high priority tickets (hours)', false),
('default_sla_normal', '24', 'Default SLA for normal tickets (hours)', false),
('default_sla_low', '48', 'Default SLA for low priority tickets (hours)', false),
('max_file_upload_size', '10485760', 'Maximum file upload size in bytes (10MB)', false),
('allowed_file_types', 'jpg,jpeg,png,pdf,doc,docx', 'Allowed file types for uploads', false),
('auto_assign_tickets', 'true', 'Enable automatic ticket assignment', false),
('notification_email_enabled', 'true', 'Enable email notifications', false),
('notification_sms_enabled', 'false', 'Enable SMS notifications', false);

-- Create default admin user
INSERT INTO users (id, email, password_hash, role, is_active, email_verified_at) VALUES
(uuid_generate_v4(), 'admin@isp-management.com', crypt('admin123', gen_salt('bf')), 'super_admin', true, CURRENT_TIMESTAMP);

-- Create sample service areas
INSERT INTO system_settings (key, value, description, is_public) VALUES
('service_areas', '["Jakarta Pusat", "Jakarta Selatan", "Jakarta Utara", "Jakarta Barat", "Jakarta Timur", "Tangerang", "Bekasi", "Depok", "Bogor"]', 'Available service areas', true);

-- Create sample technician skills
INSERT INTO system_settings (key, value, description, is_public) VALUES
('technician_skills', '["Fiber Optic Installation", "Cable Installation", "Router Configuration", "Network Troubleshooting", "WiFi Setup", "CCTV Installation", "Maintenance", "Customer Support"]', 'Available technician skills', true);

-- Create sample inventory categories
INSERT INTO system_settings (key, value, description, is_public) VALUES
('inventory_categories', '["Modem", "Router", "Cable", "Splitter", "Connector", "Tools", "Accessories"]', 'Inventory item categories', true);

-- Insert sample inventory items
INSERT INTO inventory_items (name, category, sku, description, unit_price, stock_quantity, min_stock_level, is_serialized) VALUES
('TP-Link Archer C6 Router', 'Router', 'RTR-TPC6-001', 'Dual-band WiFi router AC1200', 450000, 25, 5, true),
('Huawei HG8245H5 ONT', 'Modem', 'ONT-HG8245-001', 'GPON ONT with 4 LAN ports', 350000, 30, 10, true),
('Fiber Optic Cable SC-SC 3m', 'Cable', 'FOC-SC3M-001', 'Single mode fiber optic patch cord', 25000, 100, 20, false),
('Fiber Optic Cable SC-SC 5m', 'Cable', 'FOC-SC5M-001', 'Single mode fiber optic patch cord', 35000, 80, 15, false),
('RJ45 Connector Cat6', 'Connector', 'RJ45-C6-001', 'Category 6 RJ45 connector', 2000, 500, 100, false),
('UTP Cable Cat6 305m', 'Cable', 'UTP-C6-305-001', 'Category 6 UTP cable roll', 850000, 10, 2, false),
('Fiber Splitter 1:8', 'Splitter', 'SPL-18-001', '1x8 PLC fiber optic splitter', 125000, 15, 3, false),
('Crimping Tool RJ45', 'Tools', 'TOOL-CRIMP-001', 'Professional RJ45 crimping tool', 75000, 8, 2, false),
('Fiber Cleaver', 'Tools', 'TOOL-CLEAVE-001', 'Precision fiber optic cleaver', 450000, 5, 1, true),
('OTDR Tester', 'Tools', 'TOOL-OTDR-001', 'Optical Time Domain Reflectometer', 15000000, 2, 1, true);

-- Insert sample customers (for testing)
DO $$
DECLARE
    user_id_1 UUID;
    user_id_2 UUID;
    user_id_3 UUID;
BEGIN
    -- Create customer users
    INSERT INTO users (email, password_hash, role, is_active, email_verified_at) VALUES
    ('customer1@example.com', crypt('password123', gen_salt('bf')), 'customer', true, CURRENT_TIMESTAMP)
    RETURNING id INTO user_id_1;
    
    INSERT INTO users (email, password_hash, role, is_active, email_verified_at) VALUES
    ('customer2@example.com', crypt('password123', gen_salt('bf')), 'customer', true, CURRENT_TIMESTAMP)
    RETURNING id INTO user_id_2;
    
    INSERT INTO users (email, password_hash, role, is_active, email_verified_at) VALUES
    ('customer3@example.com', crypt('password123', gen_salt('bf')), 'customer', true, CURRENT_TIMESTAMP)
    RETURNING id INTO user_id_3;
    
    -- Create customer profiles
    INSERT INTO customers (user_id, full_name, phone, nik, address, latitude, longitude, service_area) VALUES
    (user_id_1, 'Budi Santoso', '+62812-3456-7890', '3171234567890001', 'Jl. Sudirman No. 123, Jakarta Pusat', -6.2088, 106.8456, 'Jakarta Pusat'),
    (user_id_2, 'Siti Nurhaliza', '+62813-4567-8901', '3172345678901002', 'Jl. Gatot Subroto No. 456, Jakarta Selatan', -6.2297, 106.8253, 'Jakarta Selatan'),
    (user_id_3, 'Ahmad Rahman', '+62814-5678-9012', '3173456789012003', 'Jl. Thamrin No. 789, Jakarta Pusat', -6.1944, 106.8229, 'Jakarta Pusat');
END $$;

-- Insert sample technicians
DO $$
DECLARE
    user_id_tech1 UUID;
    user_id_tech2 UUID;
    user_id_tech3 UUID;
BEGIN
    -- Create technician users
    INSERT INTO users (email, password_hash, role, is_active, email_verified_at) VALUES
    ('tech1@isp-management.com', crypt('tech123', gen_salt('bf')), 'technician', true, CURRENT_TIMESTAMP)
    RETURNING id INTO user_id_tech1;
    
    INSERT INTO users (email, password_hash, role, is_active, email_verified_at) VALUES
    ('tech2@isp-management.com', crypt('tech123', gen_salt('bf')), 'technician', true, CURRENT_TIMESTAMP)
    RETURNING id INTO user_id_tech2;
    
    INSERT INTO users (email, password_hash, role, is_active, email_verified_at) VALUES
    ('tech3@isp-management.com', crypt('tech123', gen_salt('bf')), 'technician', true, CURRENT_TIMESTAMP)
    RETURNING id INTO user_id_tech3;
    
    -- Create technician profiles
    INSERT INTO technicians (user_id, employee_id, full_name, phone, skills, service_areas, current_latitude, current_longitude) VALUES
    (user_id_tech1, 'TECH001', 'Andi Wijaya', '+62815-1111-2222', 
     ARRAY['Fiber Optic Installation', 'Router Configuration', 'Network Troubleshooting'], 
     ARRAY['Jakarta Pusat', 'Jakarta Selatan'], -6.2088, 106.8456),
    (user_id_tech2, 'TECH002', 'Rini Susanti', '+62816-3333-4444', 
     ARRAY['Cable Installation', 'WiFi Setup', 'Customer Support'], 
     ARRAY['Jakarta Utara', 'Jakarta Barat'], -6.1588, 106.8228),
    (user_id_tech3, 'TECH003', 'Dedi Kurniawan', '+62817-5555-6666', 
     ARRAY['Fiber Optic Installation', 'CCTV Installation', 'Maintenance'], 
     ARRAY['Tangerang', 'Jakarta Barat'], -6.1783, 106.6319);
END $$;

-- Insert sample supervisor/manager users
DO $$
DECLARE
    user_id_supervisor UUID;
    user_id_manager UUID;
BEGIN
    INSERT INTO users (email, password_hash, role, is_active, email_verified_at) VALUES
    ('supervisor@isp-management.com', crypt('super123', gen_salt('bf')), 'supervisor', true, CURRENT_TIMESTAMP)
    RETURNING id INTO user_id_supervisor;
    
    INSERT INTO users (email, password_hash, role, is_active, email_verified_at) VALUES
    ('manager@isp-management.com', crypt('manager123', gen_salt('bf')), 'manager', true, CURRENT_TIMESTAMP)
    RETURNING id INTO user_id_manager;
END $$;