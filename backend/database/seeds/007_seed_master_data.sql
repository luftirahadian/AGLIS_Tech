-- ═══════════════════════════════════════════════════════════════
-- 🌱 SEED DATA: SKILL LEVELS & SPECIALIZATIONS
-- ═══════════════════════════════════════════════════════════════
-- Purpose: Initial data for FTTH & NOC operations
-- Author: AGLIS Tech
-- Date: 2025-10-15
-- ═══════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. SKILL LEVELS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO skill_levels (code, name, display_order, description, min_experience_months, min_completed_tickets, min_avg_rating, daily_ticket_capacity, expected_resolution_time_hours, can_handle_critical_tickets, can_mentor_others, requires_supervision, icon, color, badge_text) VALUES

('junior', 'Junior Technician', 1, 
'Entry-level technician with basic technical skills. Handles routine installations and maintenance under supervision. Still learning advanced troubleshooting techniques.',
0, 0, 3.5, 5, 48, false, false, true, 
'🌱', '#10b981', 'JUNIOR'),

('senior', 'Senior Technician', 2,
'Experienced technician capable of handling complex issues independently. Can perform advanced installations and troubleshooting. Provides guidance to junior technicians.',
12, 100, 4.0, 8, 24, false, true, false,
'⭐', '#3b82f6', 'SENIOR'),

('expert', 'Expert Technician', 3,
'Highly skilled technician with deep technical expertise. Handles critical and escalated issues. Can work on NOC operations and network infrastructure. Trains and mentors other technicians.',
36, 500, 4.5, 10, 12, true, true, false,
'🏆', '#f59e0b', 'EXPERT'),

('specialist', 'Technical Specialist', 4,
'Master-level technician with specialized expertise in specific areas. Handles the most complex and critical issues. Leads technical projects and provides strategic technical guidance.',
60, 1000, 4.7, 12, 6, true, true, false,
'💎', '#8b5cf6', 'SPECIALIST')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. SPECIALIZATION CATEGORIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO specialization_categories (code, name, description, display_order, icon, color) VALUES

('ftth_installation', 'FTTH Installation & Activation', 
'Fiber To The Home installation, activation, and customer premises equipment setup',
1, '🏠', '#3b82f6'),

('ftth_maintenance', 'FTTH Maintenance & Repair',
'Fiber optic maintenance, troubleshooting, and repair services',
2, '🔧', '#10b981'),

('network_infrastructure', 'Network Infrastructure',
'Core network equipment, ODP/ODC, and backbone infrastructure',
3, '🌐', '#f59e0b'),

('noc_operations', 'NOC Operations',
'Network Operations Center monitoring, troubleshooting, and management',
4, '📡', '#8b5cf6'),

('customer_support', 'Customer Support & Service',
'Technical support, customer service, and issue resolution',
5, '👥', '#06b6d4'),

('wireless_services', 'Wireless Services',
'Wireless network setup, point-to-point links, and radio equipment',
6, '📶', '#ec4899')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. SPECIALIZATIONS - FTTH Installation & Activation
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO specializations (category_id, code, name, description, required_skill_level, difficulty_level, is_high_demand, is_critical_service, display_order) VALUES

((SELECT id FROM specialization_categories WHERE code = 'ftth_installation'), 
'ftth_basic_install', 'FTTH Basic Installation',
'Basic fiber installation for residential customers including drop cable, rosette, and ONT setup',
'junior', 2, true, false, 1),

((SELECT id FROM specialization_categories WHERE code = 'ftth_installation'), 
'ftth_aerial_install', 'FTTH Aerial Installation',
'Overhead fiber installation using poles and aerial cables',
'senior', 3, true, false, 2),

((SELECT id FROM specialization_categories WHERE code = 'ftth_installation'), 
'ftth_underground_install', 'FTTH Underground Installation',
'Underground fiber installation through conduits and trenching',
'senior', 4, false, false, 3),

((SELECT id FROM specialization_categories WHERE code = 'ftth_installation'), 
'ftth_building_install', 'FTTH Multi-Story Building',
'Fiber installation in apartments and multi-story buildings with vertical cabling',
'senior', 4, true, false, 4),

((SELECT id FROM specialization_categories WHERE code = 'ftth_installation'), 
'ont_configuration', 'ONT Configuration & Activation',
'ONT device configuration, VLAN setup, WiFi configuration, and service activation',
'junior', 2, true, false, 5),

((SELECT id FROM specialization_categories WHERE code = 'ftth_installation'), 
'cpe_setup', 'Customer Premises Equipment Setup',
'Router, WiFi extender, mesh system, and customer device configuration',
'junior', 1, true, false, 6);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. SPECIALIZATIONS - FTTH Maintenance & Repair
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO specializations (category_id, code, name, description, required_skill_level, difficulty_level, is_high_demand, is_critical_service, display_order) VALUES

((SELECT id FROM specialization_categories WHERE code = 'ftth_maintenance'), 
'fiber_troubleshooting', 'Fiber Optic Troubleshooting',
'Diagnose fiber issues using OTDR, power meter, and visual fault locator',
'senior', 3, true, true, 1),

((SELECT id FROM specialization_categories WHERE code = 'ftth_maintenance'), 
'fiber_splicing', 'Fiber Optic Splicing',
'Fusion splicing and mechanical splicing of fiber optic cables',
'expert', 4, true, true, 2),

((SELECT id FROM specialization_categories WHERE code = 'ftth_maintenance'), 
'fiber_testing', 'Fiber Testing & Measurement',
'OTDR testing, power measurement, insertion loss testing, and documentation',
'senior', 3, true, false, 3),

((SELECT id FROM specialization_categories WHERE code = 'ftth_maintenance'), 
'drop_cable_repair', 'Drop Cable Repair',
'Repair and replacement of damaged drop cables from ODP to customer',
'junior', 2, true, false, 4),

((SELECT id FROM specialization_categories WHERE code = 'ftth_maintenance'), 
'ont_replacement', 'ONT Troubleshooting & Replacement',
'ONT device troubleshooting, replacement, and reconfiguration',
'junior', 2, true, false, 5);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. SPECIALIZATIONS - Network Infrastructure
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO specializations (category_id, code, name, description, required_skill_level, difficulty_level, is_high_demand, is_critical_service, display_order) VALUES

((SELECT id FROM specialization_categories WHERE code = 'network_infrastructure'), 
'odp_installation', 'ODP/ODC Installation & Maintenance',
'Optical Distribution Point/Cabinet installation, splitter configuration, and port management',
'senior', 3, true, true, 1),

((SELECT id FROM specialization_categories WHERE code = 'network_infrastructure'), 
'fdt_installation', 'FDT/FAT Installation',
'Fiber Distribution Terminal and Fiber Access Terminal setup and management',
'senior', 3, false, true, 2),

((SELECT id FROM specialization_categories WHERE code = 'network_infrastructure'), 
'backbone_fiber', 'Backbone Fiber Installation',
'Core fiber network installation and backbone connectivity',
'expert', 5, false, true, 3),

((SELECT id FROM specialization_categories WHERE code = 'network_infrastructure'), 
'network_equipment', 'Network Equipment Installation',
'OLT, switches, routers, and core network equipment installation',
'expert', 4, false, true, 4),

((SELECT id FROM specialization_categories WHERE code = 'network_infrastructure'), 
'power_systems', 'Power Systems & UPS',
'Power supply, battery backup, and UPS systems for network equipment',
'senior', 3, false, true, 5);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. SPECIALIZATIONS - NOC Operations
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO specializations (category_id, code, name, description, required_skill_level, difficulty_level, is_high_demand, is_critical_service, display_order) VALUES

((SELECT id FROM specialization_categories WHERE code = 'noc_operations'), 
'noc_monitoring', 'Network Monitoring & Analysis',
'24/7 network monitoring, alarm analysis, and proactive issue detection',
'senior', 3, true, true, 1),

((SELECT id FROM specialization_categories WHERE code = 'noc_operations'), 
'olt_management', 'OLT Management & Configuration',
'OLT provisioning, ONT registration, VLAN configuration, and bandwidth management',
'expert', 4, true, true, 2),

((SELECT id FROM specialization_categories WHERE code = 'noc_operations'), 
'remote_troubleshooting', 'Remote Troubleshooting',
'Remote diagnosis and resolution of customer and network issues',
'senior', 3, true, true, 3),

((SELECT id FROM specialization_categories WHERE code = 'noc_operations'), 
'network_optimization', 'Network Performance Optimization',
'Network analysis, optimization, and capacity planning',
'expert', 4, false, true, 4),

((SELECT id FROM specialization_categories WHERE code = 'noc_operations'), 
'incident_management', 'Incident Management & Escalation',
'Incident handling, escalation procedures, and crisis management',
'expert', 4, true, true, 5);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 7. SPECIALIZATIONS - Customer Support
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO specializations (category_id, code, name, description, required_skill_level, difficulty_level, is_high_demand, is_critical_service, display_order) VALUES

((SELECT id FROM specialization_categories WHERE code = 'customer_support'), 
'technical_support', 'Technical Support Level 1',
'Basic customer technical support, issue diagnosis, and resolution',
'junior', 1, true, false, 1),

((SELECT id FROM specialization_categories WHERE code = 'customer_support'), 
'wifi_optimization', 'WiFi Optimization & Troubleshooting',
'WiFi signal optimization, channel selection, and coverage improvement',
'junior', 2, true, false, 2),

((SELECT id FROM specialization_categories WHERE code = 'customer_support'), 
'speed_testing', 'Speed Test & Quality Assurance',
'Internet speed testing, quality verification, and SLA compliance check',
'junior', 1, true, false, 3),

((SELECT id FROM specialization_categories WHERE code = 'customer_support'), 
'customer_education', 'Customer Education & Training',
'Educate customers on service usage, equipment, and troubleshooting',
'junior', 1, false, false, 4);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 8. SPECIALIZATIONS - Wireless Services
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO specializations (category_id, code, name, description, required_skill_level, difficulty_level, is_high_demand, is_critical_service, display_order) VALUES

((SELECT id FROM specialization_categories WHERE code = 'wireless_services'), 
'ptp_installation', 'Point-to-Point Link Installation',
'Wireless point-to-point link setup and alignment',
'senior', 3, false, false, 1),

((SELECT id FROM specialization_categories WHERE code = 'wireless_services'), 
'radio_equipment', 'Radio Equipment Configuration',
'Mikrotik, Ubiquiti, and other wireless equipment configuration',
'senior', 3, false, false, 2),

((SELECT id FROM specialization_categories WHERE code = 'wireless_services'), 
'tower_climbing', 'Tower Climbing & Installation',
'Tower climbing safety and equipment installation at height',
'expert', 5, false, true, 3);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SUMMARY
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Total seeded:
-- - 4 Skill Levels
-- - 6 Specialization Categories  
-- - 34 Specializations (FTTH & NOC focused)

