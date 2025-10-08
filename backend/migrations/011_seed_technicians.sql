-- Seed sample technician data
-- Insert sample technicians
INSERT INTO technicians (
    user_id, employee_id, full_name, phone, phone_alt, email, address,
    emergency_contact_name, emergency_contact_phone, hire_date, employment_status,
    position, department, skill_level, specializations, work_zone,
    max_daily_tickets, preferred_shift, total_tickets_completed,
    average_completion_time, customer_rating, sla_compliance_rate,
    current_latitude, current_longitude, is_available, availability_status
) VALUES 
-- Senior Technician - Fiber Specialist (using existing tech1 user)
(3, 'TECH001', 'Ahmad Teknisi', '081234567890', '0217654321', 'ahmad.tech@company.com',
 'Jl. Sudirman No. 45, Jakarta Pusat 10220', 'Siti Ahmad', '081987654321',
 '2022-01-15', 'active', 'Senior Technician', 'field_operations', 'senior',
 ARRAY['fiber_optic', 'networking', 'troubleshooting'], 'Jakarta_Pusat',
 10, 'day', 245, 2.3, 4.7, 94.5,
 -6.2088, 106.8456, true, 'available'),

-- Junior Technician - Wireless Specialist (using existing tech2 user)
(4, 'TECH002', 'Budi Teknisi', '082345678901', '0218765432', 'budi.tech@company.com',
 'Jl. Gatot Subroto No. 123, Jakarta Selatan 12950', 'Ani Budi', '082876543210',
 '2023-03-20', 'active', 'Technician', 'field_operations', 'junior',
 ARRAY['wireless', 'installation', 'customer_service'], 'Jakarta_Selatan',
 8, 'day', 156, 3.1, 4.4, 89.2,
 -6.2297, 106.8175, true, 'busy'),

-- Supervisor as Lead Technician (using existing supervisor user)
(2, 'TECH003', 'Candra Supervisor', '083456789012', '0219876543', 'candra.supervisor@company.com',
 'Jl. Thamrin No. 67, Jakarta Pusat 10340', 'Dewi Candra', '083765432109',
 '2021-06-10', 'active', 'Lead Technician', 'field_operations', 'expert',
 ARRAY['networking', 'enterprise', 'security', 'troubleshooting'], 'Jakarta_Utara',
 12, 'flexible', 389, 1.8, 4.9, 97.8,
 -6.1751, 106.8650, true, 'available');

-- Insert technician skills
INSERT INTO technician_skills (
    technician_id, skill_name, skill_category, proficiency_level, 
    acquired_date, verified_by, verification_date, notes
) VALUES 
-- Ahmad's skills
(1, 'Fiber Optic Installation', 'technical', 5, '2022-02-01', 1, '2022-02-15', 'Certified fiber optic specialist'),
(1, 'Network Troubleshooting', 'technical', 5, '2022-01-20', 1, '2022-02-01', 'Expert level troubleshooting'),
(1, 'Customer Communication', 'soft', 4, '2022-01-15', 1, '2022-03-01', 'Excellent customer service skills'),
(1, 'OTDR Testing', 'certification', 5, '2022-03-10', 1, '2022-03-15', 'Certified OTDR operator'),

-- Budi's skills
(2, 'WiFi Configuration', 'technical', 4, '2023-04-01', 1, '2023-04-15', 'Proficient in wireless setup'),
(2, 'Basic Installation', 'technical', 3, '2023-03-20', 1, '2023-04-01', 'Learning installation procedures'),
(2, 'Customer Service', 'soft', 4, '2023-03-20', 1, '2023-05-01', 'Good communication skills'),

-- Candra's skills
(3, 'Enterprise Networking', 'technical', 5, '2021-07-01', 1, '2021-07-15', 'Expert in enterprise solutions'),
(3, 'Network Security', 'technical', 5, '2021-08-01', 1, '2021-08-15', 'Security specialist'),
(3, 'Project Management', 'soft', 4, '2021-09-01', 1, '2021-09-15', 'Leads complex projects'),
(3, 'CCNA Certification', 'certification', 5, '2021-06-15', 1, '2021-06-20', 'Cisco certified'),

-- Dian's skills
(4, 'Corporate Solutions', 'technical', 5, '2022-10-01', 1, '2022-10-15', 'Specialist in corporate deployments'),
(4, 'Security Implementation', 'technical', 4, '2022-09-15', 1, '2022-10-01', 'Security focused solutions'),
(4, 'Client Management', 'soft', 5, '2022-09-05', 1, '2022-10-01', 'Excellent client relationships'),

-- Eka's skills
(5, 'Basic Installation', 'technical', 2, '2023-11-20', 1, '2023-12-01', 'New technician, learning basics'),
(5, 'Fiber Splicing', 'technical', 2, '2023-12-01', 1, '2023-12-15', 'Basic fiber splicing skills'),
(5, 'Safety Procedures', 'technical', 4, '2023-11-12', 1, '2023-11-15', 'Strong safety awareness');

-- Insert work schedules for current week
INSERT INTO technician_schedule (
    technician_id, schedule_date, shift_start, shift_end, 
    break_start, break_end, is_working_day, schedule_type
) VALUES 
-- Ahmad's schedule (Monday to Friday)
(1, CURRENT_DATE, '08:00', '17:00', '12:00', '13:00', true, 'regular'),
(1, CURRENT_DATE + 1, '08:00', '17:00', '12:00', '13:00', true, 'regular'),
(1, CURRENT_DATE + 2, '08:00', '17:00', '12:00', '13:00', true, 'regular'),
(1, CURRENT_DATE + 3, '08:00', '17:00', '12:00', '13:00', true, 'regular'),
(1, CURRENT_DATE + 4, '08:00', '17:00', '12:00', '13:00', true, 'regular'),

-- Budi's schedule
(2, CURRENT_DATE, '09:00', '18:00', '13:00', '14:00', true, 'regular'),
(2, CURRENT_DATE + 1, '09:00', '18:00', '13:00', '14:00', true, 'regular'),
(2, CURRENT_DATE + 2, '09:00', '18:00', '13:00', '14:00', true, 'regular'),
(2, CURRENT_DATE + 3, '09:00', '18:00', '13:00', '14:00', true, 'regular'),
(2, CURRENT_DATE + 4, '09:00', '18:00', '13:00', '14:00', true, 'regular'),

-- Candra's flexible schedule
(3, CURRENT_DATE, '07:00', '19:00', '12:00', '13:00', true, 'overtime'),
(3, CURRENT_DATE + 1, '08:00', '17:00', '12:00', '13:00', true, 'regular'),
(3, CURRENT_DATE + 2, '08:00', '17:00', '12:00', '13:00', true, 'regular'),
(3, CURRENT_DATE + 3, '08:00', '17:00', '12:00', '13:00', true, 'regular'),
(3, CURRENT_DATE + 4, '10:00', '22:00', '15:00', '16:00', true, 'on_call');

-- Insert performance records
INSERT INTO technician_performance (
    technician_id, period_start, period_end, tickets_assigned, tickets_completed,
    tickets_cancelled, average_resolution_time, customer_satisfaction_avg,
    first_time_fix_rate, sla_compliance_rate, travel_time_avg, utilization_rate,
    supervisor_rating, supervisor_notes, achievements
) VALUES 
-- Ahmad's performance (last month)
(1, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '1 day',
 52, 50, 2, 2.3, 4.7, 92.3, 94.5, 0.8, 87.5,
 4.8, 'Excellent performance, consistently meets targets', 
 ARRAY['Completed fiber installation project ahead of schedule', 'Received customer excellence award']),

-- Budi's performance
(2, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '1 day',
 35, 32, 3, 3.1, 4.4, 85.7, 89.2, 1.2, 78.3,
 4.2, 'Good progress, improving troubleshooting skills',
 ARRAY['Completed wireless certification', 'Zero safety incidents']),

-- Candra's performance
(3, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '1 day',
 68, 66, 2, 1.8, 4.9, 97.1, 97.8, 0.6, 92.1,
 5.0, 'Outstanding performance, team leader',
 ARRAY['Led successful enterprise deployment', 'Mentored 3 junior technicians', 'Perfect SLA compliance']);

-- Insert equipment assignments
INSERT INTO technician_equipment (
    technician_id, equipment_type, equipment_name, brand, model, 
    serial_number, condition, assigned_date, notes
) VALUES 
-- Ahmad's equipment
(1, 'vehicle', 'Service Van', 'Toyota', 'Hiace 2022', 'TV001', 'excellent', '2022-01-15', 'Primary service vehicle'),
(1, 'tool', 'Fiber Fusion Splicer', 'Fujikura', 'FSM-70S', 'FS001', 'good', '2022-02-01', 'High-precision splicer'),
(1, 'tool', 'OTDR Tester', 'EXFO', 'FTB-1v2', 'OT001', 'good', '2022-02-01', 'Optical time domain reflectometer'),
(1, 'device', 'Tablet', 'Samsung', 'Galaxy Tab S8', 'TB001', 'excellent', '2022-01-15', 'Field work tablet'),
(1, 'safety', 'Safety Helmet', 'MSA', 'V-Gard', 'SH001', 'good', '2022-01-15', 'Standard safety equipment'),

-- Budi's equipment
(2, 'vehicle', 'Motorcycle', 'Honda', 'Vario 160', 'MC001', 'good', '2023-03-20', 'Urban mobility'),
(2, 'tool', 'WiFi Analyzer', 'Fluke', 'AirCheck G2', 'WA001', 'excellent', '2023-04-01', 'Wireless network analyzer'),
(2, 'tool', 'Cable Tester', 'Klein Tools', 'VDV501-851', 'CT001', 'good', '2023-03-20', 'Network cable tester'),
(2, 'device', 'Smartphone', 'Samsung', 'Galaxy S23', 'SP001', 'excellent', '2023-03-20', 'Communication device'),

-- Candra's equipment
(3, 'vehicle', 'Service Truck', 'Isuzu', 'ELF 2023', 'ST001', 'excellent', '2021-06-10', 'Large equipment transport'),
(3, 'tool', 'Network Analyzer', 'Fluke', 'OptiView XG', 'NA001', 'excellent', '2021-07-01', 'Enterprise network analyzer'),
(3, 'tool', 'Fiber Cleaver', 'Sumitomo', 'FC-6S', 'FC001', 'good', '2021-07-01', 'Precision fiber cleaver'),
(3, 'device', 'Laptop', 'Lenovo', 'ThinkPad X1', 'LP001', 'good', '2021-06-10', 'Configuration and diagnostics');

-- Insert recent location history (last 24 hours)
INSERT INTO technician_location_history (
    technician_id, latitude, longitude, accuracy, speed, heading, 
    activity_type, battery_level, recorded_at
) VALUES 
-- Ahmad's recent locations
(1, -6.2088, 106.8456, 5.2, 0.0, 0.0, 'stationary', 85, CURRENT_TIMESTAMP - INTERVAL '1 hour'),
(1, -6.2095, 106.8463, 4.8, 25.5, 45.2, 'driving', 82, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(1, -6.2102, 106.8471, 6.1, 0.0, 0.0, 'stationary', 78, CURRENT_TIMESTAMP - INTERVAL '3 hours'),

-- Budi's recent locations (currently busy)
(2, -6.2297, 106.8175, 3.9, 0.0, 0.0, 'stationary', 92, CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
(2, -6.2289, 106.8168, 4.2, 15.3, 120.8, 'driving', 89, CURRENT_TIMESTAMP - INTERVAL '1 hour'),

-- Candra's recent locations
(3, -6.1751, 106.8650, 2.8, 0.0, 0.0, 'stationary', 76, CURRENT_TIMESTAMP - INTERVAL '45 minutes'),
(3, -6.1758, 106.8657, 3.5, 35.7, 230.1, 'driving', 73, CURRENT_TIMESTAMP - INTERVAL '1.5 hours');
