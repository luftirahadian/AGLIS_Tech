-- Enhanced Technician Management Schema
-- Drop existing technicians table if exists
DROP TABLE IF EXISTS technicians CASCADE;

-- Create enhanced technicians table
CREATE TABLE technicians (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    
    -- Personal Information
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    phone_alt VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    
    -- Employment Details
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    employment_status VARCHAR(20) DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'suspended', 'terminated')),
    position VARCHAR(50) DEFAULT 'technician',
    department VARCHAR(50) DEFAULT 'field_operations',
    supervisor_id INTEGER REFERENCES technicians(id),
    
    -- Skills and Certifications
    skill_level VARCHAR(20) DEFAULT 'junior' CHECK (skill_level IN ('junior', 'senior', 'expert', 'specialist')),
    specializations TEXT[], -- Array of specializations like ['fiber_optic', 'wireless', 'networking']
    certifications JSONB DEFAULT '[]', -- JSON array of certifications with details
    
    -- Work Configuration
    work_zone VARCHAR(50), -- Geographic area assigned
    max_daily_tickets INTEGER DEFAULT 8,
    preferred_shift VARCHAR(20) DEFAULT 'day' CHECK (preferred_shift IN ('day', 'night', 'flexible')),
    
    -- Performance Metrics
    total_tickets_completed INTEGER DEFAULT 0,
    average_completion_time DECIMAL(5,2), -- in hours
    customer_rating DECIMAL(3,2) DEFAULT 0.00,
    sla_compliance_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Location and Availability
    current_latitude DECIMAL(10,8),
    current_longitude DECIMAL(11,8),
    last_location_update TIMESTAMP,
    is_available BOOLEAN DEFAULT true,
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'break', 'offline')),
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- Create technician_skills table for detailed skill management
CREATE TABLE technician_skills (
    id SERIAL PRIMARY KEY,
    technician_id INTEGER REFERENCES technicians(id) ON DELETE CASCADE,
    skill_name VARCHAR(50) NOT NULL,
    skill_category VARCHAR(30) NOT NULL, -- 'technical', 'soft', 'certification'
    proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5), -- 1=Beginner, 5=Expert
    acquired_date DATE DEFAULT CURRENT_DATE,
    verified_by INTEGER REFERENCES users(id),
    verification_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create technician_schedule table for work schedule management
CREATE TABLE technician_schedule (
    id SERIAL PRIMARY KEY,
    technician_id INTEGER REFERENCES technicians(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    is_working_day BOOLEAN DEFAULT true,
    schedule_type VARCHAR(20) DEFAULT 'regular' CHECK (schedule_type IN ('regular', 'overtime', 'on_call', 'leave')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(technician_id, schedule_date)
);

-- Create technician_performance table for detailed performance tracking
CREATE TABLE technician_performance (
    id SERIAL PRIMARY KEY,
    technician_id INTEGER REFERENCES technicians(id) ON DELETE CASCADE,
    
    -- Performance Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Ticket Metrics
    tickets_assigned INTEGER DEFAULT 0,
    tickets_completed INTEGER DEFAULT 0,
    tickets_cancelled INTEGER DEFAULT 0,
    average_resolution_time DECIMAL(5,2), -- in hours
    
    -- Quality Metrics
    customer_satisfaction_avg DECIMAL(3,2) DEFAULT 0.00,
    first_time_fix_rate DECIMAL(5,2) DEFAULT 0.00,
    sla_compliance_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Efficiency Metrics
    travel_time_avg DECIMAL(5,2), -- average travel time between tickets
    utilization_rate DECIMAL(5,2), -- percentage of working hours utilized
    
    -- Feedback and Notes
    supervisor_rating DECIMAL(3,2),
    supervisor_notes TEXT,
    improvement_areas TEXT[],
    achievements TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Create technician_location_history for GPS tracking
CREATE TABLE technician_location_history (
    id SERIAL PRIMARY KEY,
    technician_id INTEGER REFERENCES technicians(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy DECIMAL(6,2), -- GPS accuracy in meters
    speed DECIMAL(5,2), -- speed in km/h
    heading DECIMAL(5,2), -- direction in degrees
    activity_type VARCHAR(20) DEFAULT 'unknown' CHECK (activity_type IN ('stationary', 'walking', 'driving', 'unknown')),
    battery_level INTEGER, -- device battery level
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create technician_equipment table for equipment assignment
CREATE TABLE technician_equipment (
    id SERIAL PRIMARY KEY,
    technician_id INTEGER REFERENCES technicians(id) ON DELETE CASCADE,
    equipment_type VARCHAR(50) NOT NULL, -- 'vehicle', 'tool', 'device', 'safety'
    equipment_name VARCHAR(100) NOT NULL,
    brand VARCHAR(50),
    model VARCHAR(50),
    serial_number VARCHAR(100),
    condition VARCHAR(20) DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
    assigned_date DATE DEFAULT CURRENT_DATE,
    return_date DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX idx_technicians_employee_id ON technicians(employee_id);
CREATE INDEX idx_technicians_user_id ON technicians(user_id);
CREATE INDEX idx_technicians_status ON technicians(employment_status, availability_status);
CREATE INDEX idx_technicians_zone ON technicians(work_zone);
CREATE INDEX idx_technician_skills_tech_id ON technician_skills(technician_id);
CREATE INDEX idx_technician_schedule_date ON technician_schedule(technician_id, schedule_date);
CREATE INDEX idx_technician_performance_period ON technician_performance(technician_id, period_start, period_end);
CREATE INDEX idx_technician_location_time ON technician_location_history(technician_id, recorded_at);
CREATE INDEX idx_location_coords ON technician_location_history(latitude, longitude);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE technicians IS 'Enhanced technician profiles with comprehensive tracking';
COMMENT ON TABLE technician_skills IS 'Detailed skill tracking and proficiency levels';
COMMENT ON TABLE technician_schedule IS 'Work schedule and availability management';
COMMENT ON TABLE technician_performance IS 'Performance metrics and KPI tracking';
COMMENT ON TABLE technician_location_history IS 'GPS location tracking for field technicians';
COMMENT ON TABLE technician_equipment IS 'Equipment assignment and tracking';
