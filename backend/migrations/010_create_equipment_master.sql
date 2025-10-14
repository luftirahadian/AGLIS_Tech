-- Create Equipment Master Tables
-- Migration 010: Create tables untuk equipment & service type management

-- 1. Equipment Master Table
CREATE TABLE IF NOT EXISTS equipment_master (
    id SERIAL PRIMARY KEY,
    equipment_code VARCHAR(50) UNIQUE NOT NULL,
    equipment_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- devices/cables/accessories/tools
    description TEXT,
    unit VARCHAR(20) DEFAULT 'unit', -- unit/meter/pcs/roll/botol
    unit_price DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Service Types Master Table (for tickets & services)
CREATE TABLE IF NOT EXISTS service_types (
    id SERIAL PRIMARY KEY,
    service_code VARCHAR(50) UNIQUE NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- installation/repair/maintenance/upgrade
    description TEXT,
    estimated_duration INTEGER, -- in minutes
    base_price DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Equipment Service Mapping Table
CREATE TABLE IF NOT EXISTS equipment_service_mapping (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipment_master(id) ON DELETE CASCADE,
    service_type_code VARCHAR(50),
    service_category_code VARCHAR(50),
    is_required BOOLEAN DEFAULT false,
    quantity_default INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_master_code ON equipment_master(equipment_code);
CREATE INDEX IF NOT EXISTS idx_equipment_master_category ON equipment_master(category);
CREATE INDEX IF NOT EXISTS idx_equipment_master_active ON equipment_master(is_active);
CREATE INDEX IF NOT EXISTS idx_service_types_code ON service_types(service_code);
CREATE INDEX IF NOT EXISTS idx_service_types_category ON service_types(category);
CREATE INDEX IF NOT EXISTS idx_service_types_active ON service_types(is_active);
CREATE INDEX IF NOT EXISTS idx_equipment_service_mapping_equipment ON equipment_service_mapping(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_service_mapping_service ON equipment_service_mapping(service_type_code);

-- Create triggers for updated_at
CREATE TRIGGER update_equipment_master_updated_at 
    BEFORE UPDATE ON equipment_master 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_types_updated_at 
    BEFORE UPDATE ON service_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

