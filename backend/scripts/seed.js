const bcrypt = require('bcryptjs');
const pool = require('../src/config/database');
require('dotenv').config();

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 12);
    const techPassword = await bcrypt.hash('tech123', 12);
    const supervisorPassword = await bcrypt.hash('super123', 12);
    const csPassword = await bcrypt.hash('cs123', 12);

    // Insert users
    console.log('👥 Creating users...');
    const usersResult = await pool.query(`
      INSERT INTO users (username, email, password_hash, full_name, phone, role) VALUES
      ('admin', 'admin@isptech.com', $1, 'System Administrator', '+62812345678', 'admin'),
      ('supervisor', 'supervisor@isptech.com', $2, 'John Supervisor', '+62812345679', 'supervisor'),
      ('tech1', 'tech1@isptech.com', $3, 'Ahmad Teknisi', '+62812345680', 'technician'),
      ('tech2', 'tech2@isptech.com', $3, 'Budi Teknisi', '+62812345681', 'technician'),
      ('cs1', 'cs1@isptech.com', $4, 'Sari Customer Service', '+62812345682', 'customer_service')
      RETURNING id, username, role
    `, [adminPassword, supervisorPassword, techPassword, csPassword]);

    console.log('✅ Users created:', usersResult.rows.length);

    // Get technician user IDs
    const techUsers = usersResult.rows.filter(user => user.role === 'technician');
    const supervisorUser = usersResult.rows.find(user => user.role === 'supervisor');

    // Insert technicians
    console.log('🔧 Creating technician profiles...');
    const techniciansResult = await pool.query(`
      INSERT INTO technicians (user_id, employee_id, skills, service_areas, supervisor_id, hire_date) VALUES
      ($1, 'TECH001', ARRAY['fiber_optic', 'troubleshooting', 'installation'], ARRAY['Jakarta Selatan', 'Jakarta Timur'], $3, '2023-01-15'),
      ($2, 'TECH002', ARRAY['wireless', 'maintenance', 'troubleshooting'], ARRAY['Jakarta Utara', 'Jakarta Barat'], $3, '2023-03-20')
      RETURNING id, employee_id
    `, [techUsers[0].id, techUsers[1].id, supervisorUser.id]);

    console.log('✅ Technicians created:', techniciansResult.rows.length);

    // Insert customers
    console.log('👥 Creating customers...');
    const customersResult = await pool.query(`
      INSERT INTO customers (customer_code, full_name, email, phone, address, service_area, package_type, status) VALUES
      ('JS-0001', 'PT ABC Technology', 'admin@abctech.com', '+62211234567', 'Jl. Sudirman No. 123, Jakarta Selatan', 'Jakarta Selatan', 'Business 100Mbps', 'active'),
      ('JS-0002', 'CV XYZ Solutions', 'info@xyzsol.com', '+62211234568', 'Jl. Thamrin No. 456, Jakarta Selatan', 'Jakarta Selatan', 'Business 50Mbps', 'active'),
      ('JT-0001', 'Toko Elektronik Jaya', 'jaya@email.com', '+62211234569', 'Jl. Cempaka Putih No. 789, Jakarta Timur', 'Jakarta Timur', 'Home 25Mbps', 'active'),
      ('JU-0001', 'Rumah Sakit Sehat', 'admin@rssehat.com', '+62211234570', 'Jl. Kelapa Gading No. 321, Jakarta Utara', 'Jakarta Utara', 'Business 200Mbps', 'pending')
      RETURNING id, customer_code, full_name
    `);

    console.log('✅ Customers created:', customersResult.rows.length);

    // Insert inventory items
    console.log('📦 Creating inventory items...');
    const inventoryResult = await pool.query(`
      INSERT INTO inventory_items (item_code, name, description, category, unit, unit_price, minimum_stock, current_stock, location, supplier) VALUES
      ('FO-001', 'Fiber Optic Cable SC-SC', 'Single mode fiber optic cable 10 meter', 'Cables', 'pieces', 150000, 10, 25, 'Warehouse A', 'PT Fiber Indonesia'),
      ('RT-001', 'Router TP-Link AC1200', 'Wireless router dual band AC1200', 'Network Equipment', 'pieces', 800000, 5, 12, 'Warehouse A', 'TP-Link Indonesia'),
      ('MD-001', 'Modem ADSL', 'ADSL modem with WiFi capability', 'Network Equipment', 'pieces', 450000, 8, 15, 'Warehouse A', 'PT Modem Nusantara'),
      ('CB-001', 'UTP Cable Cat6', 'UTP cable category 6 per meter', 'Cables', 'meters', 8000, 100, 250, 'Warehouse B', 'PT Kabel Jaya'),
      ('SP-001', 'Splitter 1:8', 'Optical splitter 1 to 8 ports', 'Network Equipment', 'pieces', 200000, 5, 8, 'Warehouse A', 'PT Optical Solutions')
      RETURNING id, item_code, name
    `);

    console.log('✅ Inventory items created:', inventoryResult.rows.length);

    // Insert sample tickets
    console.log('🎫 Creating sample tickets...');
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const ticketsResult = await pool.query(`
      INSERT INTO tickets (ticket_number, customer_id, assigned_technician_id, created_by, type, priority, title, description, status, sla_due_date) VALUES
      ('TKT-${today}-0001', $1, $2, $3, 'installation', 'high', 'New Internet Installation', 'Install new fiber internet connection for PT ABC Technology', 'assigned', NOW() + INTERVAL '4 hours'),
      ('TKT-${today}-0002', $4, $5, $3, 'repair', 'critical', 'Internet Connection Down', 'Customer reports complete internet outage since morning', 'in_progress', NOW() + INTERVAL '2 hours'),
      ('TKT-${today}-0003', $6, NULL, $7, 'maintenance', 'normal', 'Scheduled Maintenance', 'Monthly maintenance check for network equipment', 'open', NOW() + INTERVAL '24 hours')
      RETURNING id, ticket_number, title
    `, [
      customersResult.rows[0].id, // PT ABC Technology
      techniciansResult.rows[0].id, // Ahmad Teknisi
      supervisorUser.id, // Created by supervisor
      customersResult.rows[1].id, // CV XYZ Solutions
      techniciansResult.rows[1].id, // Budi Teknisi
      customersResult.rows[2].id, // Toko Elektronik Jaya
      usersResult.rows.find(u => u.role === 'customer_service').id // Created by CS
    ]);

    console.log('✅ Tickets created:', ticketsResult.rows.length);

    // Insert ticket status history
    console.log('📝 Creating ticket status history...');
    for (let i = 0; i < ticketsResult.rows.length; i++) {
      const ticket = ticketsResult.rows[i];
      await pool.query(`
        INSERT INTO ticket_status_history (ticket_id, new_status, changed_by, notes) VALUES
        ($1, 'open', $2, 'Ticket created')
      `, [ticket.id, supervisorUser.id]);
    }

    // Insert initial inventory transactions
    console.log('📊 Creating inventory transactions...');
    for (const item of inventoryResult.rows) {
      await pool.query(`
        INSERT INTO inventory_transactions (item_id, transaction_type, quantity, reference_type, notes, created_by) VALUES
        ($1, 'in', (SELECT current_stock FROM inventory_items WHERE id = $1), 'initial', 'Initial stock', $2)
      `, [item.id, usersResult.rows[0].id]);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('Admin: admin / admin123');
    console.log('Supervisor: supervisor / super123');
    console.log('Technician 1: tech1 / tech123');
    console.log('Technician 2: tech2 / tech123');
    console.log('Customer Service: cs1 / cs123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
