-- Add Downgrade Service Type
INSERT INTO service_types (type_code, type_name, description, icon, default_duration, display_order) VALUES
('downgrade', 'Downgrade', 'Service plan downgrade or speed reduction', 'trending-down', 15, 5)
ON CONFLICT (type_code) DO UPDATE SET
  type_name = EXCLUDED.type_name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  default_duration = EXCLUDED.default_duration,
  display_order = EXCLUDED.display_order,
  updated_at = CURRENT_TIMESTAMP;

-- Insert default Service Categories for Downgrade
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('downgrade', 'speed_downgrade', 'Speed Downgrade', 'Reduce internet speed to lower plan', 15, 1),
('downgrade', 'plan_downgrade', 'Service Plan Downgrade', 'Change to lower service plan', 10, 2),
('downgrade', 'bandwidth_reduction', 'Bandwidth Reduction', 'Reduce bandwidth allocation', 15, 3),
('downgrade', 'feature_removal', 'Feature Removal', 'Remove additional features from service', 10, 4)
ON CONFLICT (service_type_code, category_code) DO NOTHING;

