-- ═══════════════════════════════════════════════════════════════
-- 🔄 MIGRATION: Existing Technician Specializations
-- ═══════════════════════════════════════════════════════════════
-- Purpose: Map existing text[] specializations to master data
-- Author: AGLIS Tech
-- Date: 2025-10-15
-- ═══════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MAPPING TABLE: Old text values → New specialization codes
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TEMP TABLE spec_mapping AS
SELECT * FROM (VALUES
  -- FTTH Installation
  ('ftth_installation', 'ftth_basic_install'),
  ('installation', 'ftth_basic_install'),
  ('basic_install', 'ftth_basic_install'),
  
  -- Fiber Work
  ('fiber_splicing', 'fiber_splicing'),
  ('splicing', 'fiber_splicing'),
  ('fusion_splicing', 'fiber_splicing'),
  
  -- Testing & Troubleshooting
  ('otdr_testing', 'fiber_testing'),
  ('fiber_testing', 'fiber_testing'),
  ('troubleshooting', 'fiber_troubleshooting'),
  ('network_troubleshooting', 'fiber_troubleshooting'),
  
  -- Repair & Maintenance
  ('repair', 'drop_cable_repair'),
  ('maintenance', 'drop_cable_repair'),
  ('drop_cable_repair', 'drop_cable_repair'),
  
  -- ONT & CPE
  ('ont_configuration', 'ont_configuration'),
  ('ont_setup', 'ont_configuration'),
  ('cpe_setup', 'cpe_setup'),
  ('wifi_setup', 'cpe_setup'),
  
  -- NOC
  ('noc_monitoring', 'noc_monitoring'),
  ('monitoring', 'noc_monitoring'),
  ('olt_management', 'olt_management'),
  ('remote_troubleshooting', 'remote_troubleshooting'),
  
  -- Infrastructure
  ('odp_management', 'odp_installation'),
  ('odp_installation', 'odp_installation'),
  ('network_design', 'network_equipment'),
  ('core_network', 'backbone_fiber'),
  
  -- Support
  ('customer_service', 'technical_support'),
  ('technical_support', 'technical_support'),
  ('team_management', 'technical_support')
) AS t(old_value, new_code);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION: Insert into technician_specializations
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Clear existing entries (if any)
TRUNCATE technician_specializations;

-- Insert mapped specializations
INSERT INTO technician_specializations (technician_id, specialization_id, proficiency_level, years_experience, is_active)
SELECT DISTINCT
  t.id as technician_id,
  s.id as specialization_id,
  CASE 
    WHEN t.skill_level = 'specialist' THEN 'expert'
    WHEN t.skill_level = 'expert' THEN 'expert'
    WHEN t.skill_level = 'senior' THEN 'intermediate'
    ELSE 'beginner'
  END as proficiency_level,
  CASE 
    WHEN t.skill_level = 'specialist' THEN 7.0
    WHEN t.skill_level = 'expert' THEN 5.0
    WHEN t.skill_level = 'senior' THEN 3.0
    ELSE 1.0
  END as years_experience,
  true as is_active
FROM technicians t
CROSS JOIN LATERAL unnest(t.specializations) AS spec(value)
INNER JOIN spec_mapping sm ON LOWER(spec.value) = sm.old_value
INNER JOIN specializations s ON s.code = sm.new_code
WHERE t.specializations IS NOT NULL 
  AND array_length(t.specializations, 1) > 0
ON CONFLICT (technician_id, specialization_id) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VERIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Show migration results
SELECT 
  'Technicians with specs' as metric,
  COUNT(DISTINCT t.id) as count
FROM technicians t
WHERE EXISTS (
  SELECT 1 FROM technician_specializations ts WHERE ts.technician_id = t.id
)
UNION ALL
SELECT 
  'Total spec assignments' as metric,
  COUNT(*) as count
FROM technician_specializations
UNION ALL
SELECT 
  'Unique specializations used' as metric,
  COUNT(DISTINCT specialization_id) as count
FROM technician_specializations;

-- Show sample results
SELECT 
  t.id,
  t.full_name,
  t.skill_level,
  array_agg(s.name ORDER BY s.name) as new_specializations,
  COUNT(*) as spec_count
FROM technicians t
JOIN technician_specializations ts ON ts.technician_id = t.id
JOIN specializations s ON s.id = ts.specialization_id
GROUP BY t.id, t.full_name, t.skill_level
ORDER BY t.id
LIMIT 5;

