-- Create Technicians Table
CREATE TABLE IF NOT EXISTS technicians (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    skills TEXT[], -- Array of skills like ['fiber_optic', 'troubleshooting', 'installation']
    service_areas TEXT[], -- Array of service areas
    current_location POINT, -- Current GPS coordinates
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'off_duty', 'on_break')),
    max_daily_tickets INTEGER DEFAULT 8,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_completed_tickets INTEGER DEFAULT 0,
    hire_date DATE,
    supervisor_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_technicians_user_id ON technicians(user_id);
CREATE INDEX idx_technicians_employee_id ON technicians(employee_id);
CREATE INDEX idx_technicians_availability ON technicians(availability_status);
CREATE INDEX idx_technicians_skills ON technicians USING GIN(skills);
CREATE INDEX idx_technicians_service_areas ON technicians USING GIN(service_areas);
CREATE INDEX idx_technicians_location ON technicians USING GIST(current_location);

-- Create trigger for updated_at
CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
