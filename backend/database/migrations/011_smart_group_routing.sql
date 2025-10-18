-- ===============================================
-- Smart Group Routing Enhancement
-- Add coverage_area and service_types for intelligent routing
-- ===============================================

-- Add columns
ALTER TABLE whatsapp_groups 
ADD COLUMN IF NOT EXISTS coverage_area VARCHAR(255),
ADD COLUMN IF NOT EXISTS service_types JSONB DEFAULT '["all"]'::jsonb;

-- Add comments
COMMENT ON COLUMN whatsapp_groups.coverage_area IS 'Geographic coverage area (e.g. Karawang, Bekasi, all)';
COMMENT ON COLUMN whatsapp_groups.service_types IS 'Service types handled by this group (e.g. ["installation", "repair"])';

-- Update existing groups dengan coverage area based on name
UPDATE whatsapp_groups SET coverage_area = 'Karawang' WHERE name LIKE '%Karawang%';
UPDATE whatsapp_groups SET coverage_area = 'Bekasi' WHERE name LIKE '%Bekasi%';
UPDATE whatsapp_groups SET coverage_area = 'Cikampek' WHERE name LIKE '%Cikampek%';
UPDATE whatsapp_groups SET coverage_area = 'all' WHERE name IN ('Developer', 'Management', 'NOC Team', 'Supervisor Team', 'Customer Service Team');

-- Set service_types untuk specialized groups
UPDATE whatsapp_groups 
SET service_types = '["installation", "repair", "maintenance"]'::jsonb 
WHERE name LIKE '%Teknisi%';

UPDATE whatsapp_groups 
SET service_types = '["all"]'::jsonb 
WHERE name IN ('Developer', 'Management', 'Supervisor Team', 'Customer Service Team');

UPDATE whatsapp_groups 
SET service_types = '["system_alert", "critical_incident"]'::jsonb 
WHERE name = 'NOC Team';

-- Ensure all groups have values
UPDATE whatsapp_groups SET coverage_area = 'all' WHERE coverage_area IS NULL OR coverage_area = '';
UPDATE whatsapp_groups SET service_types = '["all"]'::jsonb WHERE service_types IS NULL;

-- Create index untuk smart routing queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_coverage ON whatsapp_groups(coverage_area) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_service_types ON whatsapp_groups USING gin(service_types) WHERE is_active = TRUE;

-- Verify hasil
SELECT 
  id,
  name,
  coverage_area,
  service_types,
  is_active
FROM whatsapp_groups
ORDER BY coverage_area, name;

