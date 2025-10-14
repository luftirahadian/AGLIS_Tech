#!/usr/bin/env node

/**
 * Sync Technician Profiles
 * 
 * This script finds users with role='technician' but without a technician profile
 * and creates the missing profiles automatically.
 * 
 * Usage:
 *   node backend/scripts/sync-technician-profiles.js [--dry-run]
 * 
 * Options:
 *   --dry-run    Show what would be created without making changes
 */

const pool = require('../src/config/database');

async function syncTechnicianProfiles(dryRun = false) {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Starting Technician Profile Sync...\n');
    
    // Find users with role='technician' but no technician profile
    const missingProfilesQuery = `
      SELECT u.id, u.username, u.full_name, u.email, u.phone, u.is_active
      FROM users u
      LEFT JOIN technicians t ON u.id = t.user_id
      WHERE u.role = 'technician' 
        AND t.id IS NULL
      ORDER BY u.id
    `;
    
    const result = await client.query(missingProfilesQuery);
    const missingUsers = result.rows;
    
    if (missingUsers.length === 0) {
      console.log('✅ All technician users already have profiles!');
      console.log('   No action needed.\n');
      return { success: true, created: 0, skipped: 0 };
    }
    
    console.log(`📋 Found ${missingUsers.length} technician user(s) without profiles:\n`);
    
    missingUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} (${user.full_name}) - ID: ${user.id}`);
    });
    console.log('');
    
    if (dryRun) {
      console.log('🔶 DRY RUN MODE - No changes will be made');
      console.log(`   Would create ${missingUsers.length} technician profile(s)\n`);
      return { success: true, created: 0, skipped: missingUsers.length };
    }
    
    console.log('🔧 Creating missing technician profiles...\n');
    
    let created = 0;
    let failed = 0;
    
    for (const user of missingUsers) {
      try {
        await client.query('BEGIN');
        
        // Get next employee_id
        const nextIdResult = await client.query(`
          SELECT COALESCE(
            MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0
          ) + 1 as next_num
          FROM technicians 
          WHERE employee_id ~ '^TEC[0-9]+$'
        `);
        
        const nextNum = nextIdResult.rows[0].next_num;
        const employeeId = `TEC${String(nextNum).padStart(4, '0')}`;
        
        // Create technician profile
        const insertResult = await client.query(`
          INSERT INTO technicians (
            user_id, employee_id, full_name, phone, email,
            hire_date, employment_status, position, department,
            skill_level, work_zone, max_daily_tickets,
            availability_status, is_available, created_by, created_at
          ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, 'Field Technician', 
                    'field_operations', 'junior', 'karawang', 8, 'available', true, 1, CURRENT_TIMESTAMP)
          RETURNING id, employee_id
        `, [
          user.id,
          employeeId,
          user.full_name,
          user.phone || null,
          user.email,
          user.is_active ? 'active' : 'inactive'
        ]);
        
        await client.query('COMMIT');
        
        const newProfile = insertResult.rows[0];
        console.log(`   ✅ Created profile for ${user.username}: ${newProfile.employee_id} (ID: ${newProfile.id})`);
        created++;
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`   ❌ Failed to create profile for ${user.username}:`, error.message);
        failed++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${created}`);
    if (failed > 0) {
      console.log(`   ❌ Failed: ${failed}`);
    }
    console.log('');
    
    return { success: true, created, failed };
    
  } catch (error) {
    console.error('❌ Error during sync:', error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

// Main execution
if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run');
  
  syncTechnicianProfiles(dryRun)
    .then((result) => {
      if (result.success) {
        console.log('✅ Sync completed successfully!');
        process.exit(0);
      } else {
        console.error('❌ Sync failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { syncTechnicianProfiles };

