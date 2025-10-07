-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Note: PostGIS extension akan ditambahkan nanti untuk GPS features
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE user_role AS ENUM (
    'super_admin', 
    'manager', 
    'supervisor', 
    'customer_service', 
    'technician', 
    'customer'
);

CREATE TYPE ticket_type AS ENUM (
    'new_installation', 
    'repair', 
    'maintenance', 
    'upgrade', 
    'disconnection'
);

CREATE TYPE priority_level AS ENUM (
    'low', 
    'normal', 
    'high', 
    'critical', 
    'emergency'
);

CREATE TYPE ticket_status AS ENUM (
    'new', 
    'assigned', 
    'in_progress', 
    'pending', 
    'resolved', 
    'closed', 
    'cancelled'
);

CREATE TYPE equipment_condition AS ENUM (
    'new', 
    'good', 
    'used', 
    'damaged', 
    'lost', 
    'retired'
);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';