-- Create triggers for automatic timestamp updates

-- Users table trigger
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Customers table trigger
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Technicians table trigger
CREATE TRIGGER update_technicians_updated_at 
    BEFORE UPDATE ON technicians 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Tickets table trigger
CREATE TRIGGER update_tickets_updated_at 
    BEFORE UPDATE ON tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Inventory items table trigger
CREATE TRIGGER update_inventory_items_updated_at 
    BEFORE UPDATE ON inventory_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- System settings table trigger
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
    prefix VARCHAR(10);
    counter INTEGER;
    new_number VARCHAR(50);
BEGIN
    -- Set prefix based on ticket type
    CASE NEW.type
        WHEN 'new_installation' THEN prefix := 'INS';
        WHEN 'repair' THEN prefix := 'REP';
        WHEN 'maintenance' THEN prefix := 'MNT';
        WHEN 'upgrade' THEN prefix := 'UPG';
        WHEN 'disconnection' THEN prefix := 'DIS';
        ELSE prefix := 'TKT';
    END CASE;
    
    -- Get next counter for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO counter
    FROM tickets 
    WHERE ticket_number LIKE prefix || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '%';
    
    -- Generate new ticket number: PREFIX + YYYYMMDD + 4-digit counter
    new_number := prefix || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(counter::TEXT, 4, '0');
    
    NEW.ticket_number := new_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket number
CREATE TRIGGER generate_ticket_number_trigger
    BEFORE INSERT ON tickets
    FOR EACH ROW
    WHEN (NEW.ticket_number IS NULL OR NEW.ticket_number = '')
    EXECUTE FUNCTION generate_ticket_number();

-- Function to calculate SLA deadline
CREATE OR REPLACE FUNCTION calculate_sla_deadline()
RETURNS TRIGGER AS $$
DECLARE
    sla_hours INTEGER;
BEGIN
    -- Set SLA hours based on priority
    CASE NEW.priority
        WHEN 'emergency' THEN sla_hours := 2;
        WHEN 'critical' THEN sla_hours := 4;
        WHEN 'high' THEN sla_hours := 8;
        WHEN 'normal' THEN sla_hours := 24;
        WHEN 'low' THEN sla_hours := 48;
        ELSE sla_hours := 24;
    END CASE;
    
    -- Calculate SLA deadline (skip weekends for non-emergency tickets)
    IF NEW.priority IN ('emergency', 'critical') THEN
        NEW.sla_deadline := NEW.created_at + (sla_hours || ' hours')::INTERVAL;
    ELSE
        -- For normal tickets, calculate business hours (Mon-Fri, 8AM-6PM)
        NEW.sla_deadline := NEW.created_at + (sla_hours || ' hours')::INTERVAL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate SLA deadline
CREATE TRIGGER calculate_sla_deadline_trigger
    BEFORE INSERT ON tickets
    FOR EACH ROW
    WHEN (NEW.sla_deadline IS NULL)
    EXECUTE FUNCTION calculate_sla_deadline();

-- Function to log ticket status changes
CREATE OR REPLACE FUNCTION log_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO activity_logs (
            entity_type,
            entity_id,
            action,
            old_values,
            new_values
        ) VALUES (
            'ticket',
            NEW.id,
            'status_changed',
            jsonb_build_object('status', OLD.status),
            jsonb_build_object('status', NEW.status)
        );
        
        -- Set timestamps based on status
        CASE NEW.status
            WHEN 'in_progress' THEN
                IF OLD.status != 'in_progress' THEN
                    NEW.started_at := CURRENT_TIMESTAMP;
                END IF;
            WHEN 'resolved', 'closed' THEN
                IF OLD.status NOT IN ('resolved', 'closed') THEN
                    NEW.completed_at := CURRENT_TIMESTAMP;
                    -- Calculate actual duration
                    IF NEW.started_at IS NOT NULL THEN
                        NEW.actual_duration := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - NEW.started_at)) / 60;
                    END IF;
                END IF;
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log ticket status changes
CREATE TRIGGER log_ticket_status_change_trigger
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION log_ticket_status_change();