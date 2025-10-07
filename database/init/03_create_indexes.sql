-- Create indexes for better performance

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Customers table indexes
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_service_area ON customers(service_area);
CREATE INDEX idx_customers_location ON customers(latitude, longitude);

-- Technicians table indexes
CREATE INDEX idx_technicians_user_id ON technicians(user_id);
CREATE INDEX idx_technicians_employee_id ON technicians(employee_id);
CREATE INDEX idx_technicians_is_available ON technicians(is_available);
CREATE INDEX idx_technicians_service_areas ON technicians USING GIN(service_areas);
CREATE INDEX idx_technicians_skills ON technicians USING GIN(skills);
CREATE INDEX idx_technicians_location ON technicians(current_latitude, current_longitude);

-- Tickets table indexes
CREATE INDEX idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX idx_tickets_technician_id ON tickets(technician_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_type ON tickets(type);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_tickets_scheduled_at ON tickets(scheduled_at);
CREATE INDEX idx_tickets_sla_deadline ON tickets(sla_deadline);
CREATE INDEX idx_tickets_location ON tickets(location_latitude, location_longitude);
CREATE INDEX idx_tickets_ticket_number ON tickets(ticket_number);

-- Composite indexes for common queries
CREATE INDEX idx_tickets_status_priority ON tickets(status, priority);
CREATE INDEX idx_tickets_technician_status ON tickets(technician_id, status);
CREATE INDEX idx_tickets_customer_status ON tickets(customer_id, status);

-- Ticket comments indexes
CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_user_id ON ticket_comments(user_id);
CREATE INDEX idx_ticket_comments_created_at ON ticket_comments(created_at);

-- Ticket attachments indexes
CREATE INDEX idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX idx_ticket_attachments_uploaded_by ON ticket_attachments(uploaded_by);

-- Inventory items indexes
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_items_is_active ON inventory_items(is_active);
CREATE INDEX idx_inventory_items_stock_quantity ON inventory_items(stock_quantity);

-- Equipment assignments indexes
CREATE INDEX idx_equipment_assignments_item_id ON equipment_assignments(item_id);
CREATE INDEX idx_equipment_assignments_technician_id ON equipment_assignments(technician_id);
CREATE INDEX idx_equipment_assignments_ticket_id ON equipment_assignments(ticket_id);
CREATE INDEX idx_equipment_assignments_assigned_at ON equipment_assignments(assigned_at);
CREATE INDEX idx_equipment_assignments_returned_at ON equipment_assignments(returned_at);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- System settings indexes
CREATE INDEX idx_system_settings_key ON system_settings(key);
CREATE INDEX idx_system_settings_is_public ON system_settings(is_public);