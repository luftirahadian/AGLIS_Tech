-- Fix duplicate display_order in service_types
-- wifi_setup and downgrade both have order 5

UPDATE service_types 
SET display_order = 6, updated_at = CURRENT_TIMESTAMP
WHERE type_code = 'downgrade';

UPDATE service_types 
SET display_order = 7, updated_at = CURRENT_TIMESTAMP
WHERE type_code = 'dismantle';

