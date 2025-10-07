-- Create Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    assigned_technician_id INTEGER REFERENCES technicians(id),
    created_by INTEGER REFERENCES users(id),
    
    -- Ticket Details
    type VARCHAR(20) NOT NULL CHECK (type IN ('installation', 'repair', 'maintenance', 'upgrade')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    category VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- Status and Timeline
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    scheduled_date TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER, -- in minutes
    
    -- SLA and Quality
    sla_due_date TIMESTAMP,
    is_sla_breached BOOLEAN DEFAULT false,
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_feedback TEXT,
    
    -- Technical Details
    equipment_needed TEXT[],
    work_notes TEXT,
    resolution_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_tickets_number ON tickets(ticket_number);
CREATE INDEX idx_tickets_customer ON tickets(customer_id);
CREATE INDEX idx_tickets_technician ON tickets(assigned_technician_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_type ON tickets(type);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_scheduled_date ON tickets(scheduled_date);
CREATE INDEX idx_tickets_sla_due ON tickets(sla_due_date);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
