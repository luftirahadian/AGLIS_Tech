-- Create Inventory Stock Master
-- Migration 015: Buat master data inventory stock untuk equipment

-- Cek apakah tabel inventory sudah ada, jika belum buat
CREATE TABLE IF NOT EXISTS inventory_stock (
    id SERIAL PRIMARY KEY,
    equipment_id INT NOT NULL REFERENCES equipment_master(id) ON DELETE CASCADE,
    warehouse_location VARCHAR(100) DEFAULT 'Warehouse Karawang',
    current_stock INT NOT NULL DEFAULT 0,
    minimum_stock INT NOT NULL DEFAULT 5,
    maximum_stock INT NOT NULL DEFAULT 100,
    unit_cost DECIMAL(12,2) DEFAULT 0,
    total_value DECIMAL(15,2) GENERATED ALWAYS AS (current_stock * unit_cost) STORED,
    supplier_name VARCHAR(100),
    supplier_contact VARCHAR(50),
    last_restock_date DATE,
    last_restock_quantity INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_equipment ON inventory_stock(equipment_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_level ON inventory_stock(current_stock, minimum_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory_stock(warehouse_location);

-- Insert inventory stock data untuk equipment FTTH/Broadband
INSERT INTO inventory_stock (
    equipment_id, warehouse_location, current_stock, minimum_stock, maximum_stock,
    unit_cost, supplier_name, supplier_contact, last_restock_date, last_restock_quantity, notes
) VALUES
-- Devices/Modem untuk Customer
((SELECT id FROM equipment_master WHERE equipment_code = 'ont_huawei_hg8245h'), 'Warehouse Karawang', 45, 10, 100, 450000, 'PT Huawei Indonesia', '021-12345678', '2025-01-15', 50, 'Stock untuk paket Silver/Gold'),
((SELECT id FROM equipment_master WHERE equipment_code = 'ont_zte_f670l'), 'Warehouse Karawang', 35, 8, 80, 480000, 'PT ZTE Indonesia', '021-23456789', '2025-01-15', 40, 'Stock untuk paket Gold/Platinum'),
((SELECT id FROM equipment_master WHERE equipment_code = 'ont_fiberhome_hg6245d'), 'Warehouse Karawang', 25, 5, 60, 520000, 'PT Fiberhome Indonesia', '021-34567890', '2025-01-10', 30, 'Stock untuk paket Platinum'),
((SELECT id FROM equipment_master WHERE equipment_code = 'modem_tplink_c6'), 'Warehouse Karawang', 50, 15, 120, 350000, 'PT TP-Link Indonesia', '021-45678901', '2025-01-20', 60, 'Stock untuk paket Bronze/Silver'),
((SELECT id FROM equipment_master WHERE equipment_code = 'modem_tplink_c50'), 'Warehouse Karawang', 40, 10, 100, 280000, 'PT TP-Link Indonesia', '021-45678901', '2025-01-20', 50, 'Stock untuk paket Bronze'),
((SELECT id FROM equipment_master WHERE equipment_code = 'access_point'), 'Warehouse Karawang', 20, 5, 50, 650000, 'PT Ubiquiti Indonesia', '021-56789012', '2025-01-12', 25, 'Untuk WiFi extension'),
((SELECT id FROM equipment_master WHERE equipment_code = 'mesh_node'), 'Warehouse Karawang', 15, 3, 40, 850000, 'PT TP-Link Indonesia', '021-45678901', '2025-01-18', 20, 'Untuk mesh network setup'),

-- Kabel & Fiber
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_fiber_sm'), 'Warehouse Karawang', 5000, 500, 10000, 3500, 'PT Belden Indonesia', '021-67890123', '2025-01-05', 8000, 'Dalam meter, stock utama'),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_utp_cat6'), 'Warehouse Karawang', 3000, 300, 8000, 4500, 'PT Belden Indonesia', '021-67890123', '2025-01-05', 5000, 'Dalam meter'),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_drop_ftth'), 'Warehouse Karawang', 8000, 1000, 15000, 2800, 'PT Supreme Cable', '021-78901234', '2025-01-08', 10000, 'Drop cable dari ODP ke rumah (meter)'),
((SELECT id FROM equipment_master WHERE equipment_code = 'patch_cord_sc_sc'), 'Warehouse Karawang', 200, 30, 500, 25000, 'PT Supreme Cable', '021-78901234', '2025-01-08', 250, 'Patch cord untuk ONT'),
((SELECT id FROM equipment_master WHERE equipment_code = 'patch_cord_sc_upc'), 'Warehouse Karawang', 180, 25, 400, 28000, 'PT Supreme Cable', '021-78901234', '2025-01-08', 200, 'Patch cord SC-UPC'),
((SELECT id FROM equipment_master WHERE equipment_code = 'pigtail_sc'), 'Warehouse Karawang', 150, 20, 350, 15000, 'PT Supreme Cable', '021-78901234', '2025-01-08', 180, 'Pigtail untuk splicing'),

-- Accessories
((SELECT id FROM equipment_master WHERE equipment_code = 'connector_rj45'), 'Warehouse Karawang', 500, 100, 1000, 1500, 'Toko Elektronik Karawang', '0267-123456', '2025-01-10', 600, 'Konektor RJ45'),
((SELECT id FROM equipment_master WHERE equipment_code = 'splitter_1x2'), 'Warehouse Karawang', 80, 15, 200, 75000, 'PT Optic Network', '021-89012345', '2025-01-12', 100, 'Splitter 1:2'),
((SELECT id FROM equipment_master WHERE equipment_code = 'splitter_1x4'), 'Warehouse Karawang', 60, 10, 150, 125000, 'PT Optic Network', '021-89012345', '2025-01-12', 80, 'Splitter 1:4'),
((SELECT id FROM equipment_master WHERE equipment_code = 'splitter_1x8'), 'Warehouse Karawang', 40, 8, 100, 185000, 'PT Optic Network', '021-89012345', '2025-01-12', 50, 'Splitter 1:8'),
((SELECT id FROM equipment_master WHERE equipment_code = 'closure_box'), 'Warehouse Karawang', 50, 10, 120, 150000, 'PT Fiber Tech', '021-90123456', '2025-01-14', 60, 'Closure box outdoor'),
((SELECT id FROM equipment_master WHERE equipment_code = 'rosette_box'), 'Warehouse Karawang', 100, 20, 250, 35000, 'PT Fiber Tech', '021-90123456', '2025-01-14', 120, 'Terminal box indoor'),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_clip'), 'Warehouse Karawang', 800, 100, 2000, 500, 'Toko Elektronik Karawang', '0267-123456', '2025-01-10', 1000, 'Klip kabel'),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_tie'), 'Warehouse Karawang', 1000, 150, 2500, 200, 'Toko Elektronik Karawang', '0267-123456', '2025-01-10', 1200, 'Pengikat kabel'),

-- Tools (tidak dikonsumsi, tapi perlu tracking)
((SELECT id FROM equipment_master WHERE equipment_code = 'otdr'), 'Warehouse Karawang', 2, 1, 5, 45000000, 'PT Test Equipment', '021-01234567', '2024-12-01', 2, 'OTDR untuk testing - High Value'),
((SELECT id FROM equipment_master WHERE equipment_code = 'power_meter'), 'Warehouse Karawang', 8, 2, 15, 3500000, 'PT Test Equipment', '021-01234567', '2024-12-15', 8, 'Optical Power Meter'),
((SELECT id FROM equipment_master WHERE equipment_code = 'vfl'), 'Warehouse Karawang', 10, 3, 20, 850000, 'PT Test Equipment', '021-01234567', '2025-01-05', 10, 'Visual Fault Locator'),
((SELECT id FROM equipment_master WHERE equipment_code = 'cleaver'), 'Warehouse Karawang', 5, 2, 10, 2500000, 'PT Fiber Tools', '021-11223344', '2024-11-20', 5, 'Fiber Cleaver'),
((SELECT id FROM equipment_master WHERE equipment_code = 'stripping_tool'), 'Warehouse Karawang', 12, 3, 25, 450000, 'PT Fiber Tools', '021-11223344', '2025-01-08', 15, 'Fiber Stripping Tool'),
((SELECT id FROM equipment_master WHERE equipment_code = 'crimping_tool'), 'Warehouse Karawang', 15, 5, 30, 250000, 'Toko Elektronik Karawang', '0267-123456', '2025-01-10', 20, 'Crimping Tool RJ45'),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_tester'), 'Warehouse Karawang', 10, 3, 20, 350000, 'Toko Elektronik Karawang', '0267-123456', '2025-01-10', 12, 'LAN Cable Tester'),
((SELECT id FROM equipment_master WHERE equipment_code = 'multimeter'), 'Warehouse Karawang', 12, 4, 25, 450000, 'Toko Elektronik Karawang', '0267-123456', '2025-01-10', 15, 'Multimeter Digital'),
((SELECT id FROM equipment_master WHERE equipment_code = 'fusion_splicer'), 'Warehouse Karawang', 1, 1, 3, 85000000, 'PT Fiber Tools', '021-11223344', '2024-10-15', 1, 'Fusion Splicer - High Value'),

-- Consumables
((SELECT id FROM equipment_master WHERE equipment_code = 'alcohol_cleaner'), 'Warehouse Karawang', 50, 10, 100, 35000, 'Toko Kimia Karawang', '0267-234567', '2025-01-15', 60, 'Alkohol pembersih fiber (botol)'),
((SELECT id FROM equipment_master WHERE equipment_code = 'tape_isolasi'), 'Warehouse Karawang', 80, 15, 200, 15000, 'Toko Elektronik Karawang', '0267-123456', '2025-01-10', 100, 'Isolasi listrik (roll)'),
((SELECT id FROM equipment_master WHERE equipment_code = 'label_cable'), 'Warehouse Karawang', 300, 50, 800, 500, 'Toko Elektronik Karawang', '0267-123456', '2025-01-10', 400, 'Label identifikasi kabel (pcs)');

-- Update timestamps
UPDATE inventory_stock SET updated_at = CURRENT_TIMESTAMP;

-- Tampilkan ringkasan
SELECT '=== INVENTORY STOCK SUMMARY ===' as info;
SELECT 
    em.equipment_name,
    em.category,
    ist.current_stock,
    ist.minimum_stock,
    em.unit,
    CONCAT('Rp ', TO_CHAR(ist.unit_cost, 'FM999,999,999')) as unit_cost,
    CONCAT('Rp ', TO_CHAR(ist.total_value, 'FM999,999,999')) as total_value,
    CASE 
        WHEN ist.current_stock <= ist.minimum_stock THEN '⚠️ LOW STOCK'
        ELSE '✅ OK'
    END as status
FROM inventory_stock ist
JOIN equipment_master em ON ist.equipment_id = em.id
ORDER BY 
    CASE em.category
        WHEN 'devices' THEN 1
        WHEN 'cables' THEN 2
        WHEN 'accessories' THEN 3
        WHEN 'tools' THEN 4
        ELSE 5
    END,
    em.equipment_name;

-- Total nilai inventory
SELECT '=== TOTAL INVENTORY VALUE ===' as info;
SELECT 
    CONCAT('Rp ', TO_CHAR(SUM(total_value), 'FM999,999,999,999')) as total_inventory_value
FROM inventory_stock;

