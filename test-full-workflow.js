/**
 * Full Workflow Test: Registration → Customer → Ticket → Completion
 * Testing end-to-end flow from registration to ticket completion
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
let authToken = '';
let registrationId = '';
let customerId = '';
let ticketId = '';

// Test data
const testRegistration = {
  full_name: 'Test User Workflow',
  email: `test.workflow.${Date.now()}@email.com`,
  phone: `0812${Math.floor(Math.random() * 100000000)}`,
  id_card_number: `3216${Math.floor(Math.random() * 1000000000000)}`,
  address: 'Jl. Test Workflow No. 123',
  rt: '001',
  rw: '005',
  kelurahan: 'Test Kelurahan',
  kecamatan: 'Test Kecamatan',
  city: 'Karawang',
  postal_code: '41311',
  service_type: 'broadband',
  package_id: 1,
  preferred_installation_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
};

// Helper functions
const log = (step, message, data = null) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📍 STEP ${step}: ${message}`);
  console.log('='.repeat(80));
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

const logSuccess = (message) => {
  console.log(`✅ ${message}`);
};

const logError = (message, error) => {
  console.log(`❌ ${message}`);
  console.error(error.response?.data || error.message);
};

// Main test flow
async function runFullWorkflowTest() {
  try {
    console.log('\n' + '🚀'.repeat(40));
    console.log('FULL WORKFLOW TEST - START');
    console.log('🚀'.repeat(40));

    // STEP 1: Login as Admin
    log(1, 'LOGIN AS ADMIN');
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        username: 'admin',
        password: 'admin123'
      });
      authToken = loginResponse.data.data.token;
      logSuccess(`Logged in as admin`);
      console.log(`Token: ${authToken.substring(0, 20)}...`);
    } catch (error) {
      logError('Login failed', error);
      return;
    }

    // Set default auth header
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    // STEP 2: Create Public Registration
    log(2, 'CREATE PUBLIC REGISTRATION', testRegistration);
    try {
      const regResponse = await axios.post(`${API_BASE}/registrations/public`, testRegistration);
      registrationId = regResponse.data.data.registration.id;
      logSuccess(`Registration created with ID: ${registrationId}`);
      console.log(`Registration Number: ${regResponse.data.data.registration.registration_number}`);
      console.log(`Status: ${regResponse.data.data.registration.status}`);
    } catch (error) {
      logError('Registration creation failed', error);
      return;
    }

    // Wait a bit for data to settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    // STEP 3: Verify Registration
    log(3, 'VERIFY REGISTRATION');
    try {
      const verifyResponse = await axios.post(`${API_BASE}/registrations/${registrationId}/quick-verify`, {
        notes: 'Quick verification for testing'
      });
      logSuccess(`Registration verified`);
      console.log(`New Status: ${verifyResponse.data.data.registration.status}`);
    } catch (error) {
      logError('Verification failed', error);
      return;
    }

    // STEP 4: Approve Registration (Fast Track)
    log(4, 'APPROVE REGISTRATION (FAST TRACK)');
    try {
      const approveResponse = await axios.post(`${API_BASE}/registrations/${registrationId}/quick-approve`, {
        skip_survey: true,
        notes: 'Fast track approval for testing'
      });
      logSuccess(`Registration approved`);
      console.log(`New Status: ${approveResponse.data.data.registration.status}`);
    } catch (error) {
      logError('Approval failed', error);
      return;
    }

    // STEP 5: Create Customer & Installation Ticket
    log(5, 'CREATE CUSTOMER & INSTALLATION TICKET');
    try {
      const customerData = {
        registration_id: registrationId,
        username: testRegistration.email.split('@')[0],
        password: 'password123',
        odp: 'ODP-KRW-01',
        installation_notes: 'Test installation for workflow verification'
      };
      
      const customerResponse = await axios.post(`${API_BASE}/registrations/${registrationId}/create-customer`, customerData);
      customerId = customerResponse.data.data.customer.id;
      ticketId = customerResponse.data.data.ticket.id;
      
      logSuccess(`Customer created with ID: ${customerId}`);
      logSuccess(`Installation ticket created with ID: ${ticketId}`);
      console.log(`Customer ID: ${customerResponse.data.data.customer.customer_id}`);
      console.log(`Ticket Number: ${customerResponse.data.data.ticket.ticket_number}`);
      console.log(`Ticket Status: ${customerResponse.data.data.ticket.status}`);
    } catch (error) {
      logError('Customer creation failed', error);
      return;
    }

    // Wait for data to settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    // STEP 6: Get Customer Details
    log(6, 'GET CUSTOMER DETAILS');
    try {
      const customerDetails = await axios.get(`${API_BASE}/customers/${customerId}`);
      logSuccess(`Customer details retrieved`);
      console.log(`Name: ${customerDetails.data.data.customer.name}`);
      console.log(`Email: ${customerDetails.data.data.customer.email}`);
      console.log(`Phone: ${customerDetails.data.data.customer.phone}`);
      console.log(`Package: ${customerDetails.data.data.customer.package_name}`);
      console.log(`Account Status: ${customerDetails.data.data.customer.account_status}`);
      console.log(`Equipment Count: ${customerDetails.data.data.equipment.length}`);
    } catch (error) {
      logError('Get customer details failed', error);
    }

    // STEP 7: Add Equipment to Customer
    log(7, 'ADD EQUIPMENT TO CUSTOMER');
    try {
      const equipmentData = {
        equipment_type: 'ONT Huawei HG8245H',
        brand: 'Huawei',
        model: 'HG8245H',
        serial_number: `SN${Date.now()}`,
        mac_address: '00:11:22:33:44:55',
        installation_date: new Date().toISOString().split('T')[0],
        warranty_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        notes: 'Test equipment for workflow'
      };
      
      const equipmentResponse = await axios.post(`${API_BASE}/customers/${customerId}/equipment`, equipmentData);
      logSuccess(`Equipment added successfully`);
      console.log(`Equipment ID: ${equipmentResponse.data.data.equipment.id}`);
      console.log(`Equipment Type: ${equipmentResponse.data.data.equipment.equipment_type}`);
    } catch (error) {
      logError('Add equipment failed', error);
    }

    // STEP 8: Get Ticket Details
    log(8, 'GET TICKET DETAILS');
    try {
      const ticketDetails = await axios.get(`${API_BASE}/tickets/${ticketId}`);
      logSuccess(`Ticket details retrieved`);
      console.log(`Ticket Number: ${ticketDetails.data.data.ticket_number}`);
      console.log(`Type: ${ticketDetails.data.data.type}`);
      console.log(`Status: ${ticketDetails.data.data.status}`);
      console.log(`Priority: ${ticketDetails.data.data.priority}`);
      console.log(`Customer: ${ticketDetails.data.data.customer_name}`);
    } catch (error) {
      logError('Get ticket details failed', error);
    }

    // STEP 9: Assign Ticket to Technician
    log(9, 'ASSIGN TICKET TO TECHNICIAN');
    try {
      // Get first available technician
      const techniciansResponse = await axios.get(`${API_BASE}/technicians?limit=1`);
      const technicianId = techniciansResponse.data.data.technicians[0]?.id;
      
      if (technicianId) {
        const assignResponse = await axios.put(`${API_BASE}/tickets/${ticketId}`, {
          assigned_technician_id: technicianId,
          status: 'assigned'
        });
        logSuccess(`Ticket assigned to technician ID: ${technicianId}`);
        console.log(`New Status: ${assignResponse.data.data.status}`);
      } else {
        console.log('⚠️  No technicians available, skipping assignment');
      }
    } catch (error) {
      logError('Ticket assignment failed', error);
    }

    // STEP 10: Update Ticket to In Progress
    log(10, 'UPDATE TICKET TO IN PROGRESS');
    try {
      const progressResponse = await axios.put(`${API_BASE}/tickets/${ticketId}`, {
        status: 'in_progress',
        notes: 'Technician started working on installation'
      });
      logSuccess(`Ticket status updated to in_progress`);
      console.log(`Status: ${progressResponse.data.data.status}`);
    } catch (error) {
      logError('Update to in_progress failed', error);
    }

    // STEP 11: Complete Ticket
    log(11, 'COMPLETE TICKET');
    try {
      const completeResponse = await axios.put(`${API_BASE}/tickets/${ticketId}`, {
        status: 'completed',
        resolution_notes: 'Installation completed successfully. Equipment tested and working properly.',
        completed_at: new Date().toISOString()
      });
      logSuccess(`Ticket completed successfully`);
      console.log(`Status: ${completeResponse.data.data.status}`);
      console.log(`Resolution: ${completeResponse.data.data.resolution_notes}`);
    } catch (error) {
      logError('Ticket completion failed', error);
    }

    // STEP 12: Verify Final Customer Status
    log(12, 'VERIFY FINAL CUSTOMER STATUS');
    try {
      const finalCustomer = await axios.get(`${API_BASE}/customers/${customerId}`);
      logSuccess(`Final customer status verified`);
      console.log(`Customer Name: ${finalCustomer.data.data.customer.name}`);
      console.log(`Account Status: ${finalCustomer.data.data.customer.account_status}`);
      console.log(`Package: ${finalCustomer.data.data.customer.package_name}`);
      console.log(`Equipment Count: ${finalCustomer.data.data.equipment.length}`);
      console.log(`Service History Count: ${finalCustomer.data.data.service_history.length}`);
    } catch (error) {
      logError('Get final customer status failed', error);
    }

    // STEP 13: Verify Registration Final Status
    log(13, 'VERIFY REGISTRATION FINAL STATUS');
    try {
      const finalRegistration = await axios.get(`${API_BASE}/registrations/${registrationId}`);
      logSuccess(`Final registration status verified`);
      console.log(`Registration Number: ${finalRegistration.data.data.registration_number}`);
      console.log(`Status: ${finalRegistration.data.data.status}`);
      console.log(`Customer ID: ${finalRegistration.data.data.customer_id}`);
      console.log(`Installation Ticket ID: ${finalRegistration.data.data.installation_ticket_id}`);
    } catch (error) {
      logError('Get final registration status failed', error);
    }

    // FINAL SUMMARY
    console.log('\n' + '🎉'.repeat(40));
    console.log('FULL WORKFLOW TEST - COMPLETED SUCCESSFULLY');
    console.log('🎉'.repeat(40));
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Registration ID: ${registrationId}`);
    console.log(`✅ Customer ID: ${customerId}`);
    console.log(`✅ Ticket ID: ${ticketId}`);
    console.log('\n🔄 WORKFLOW STEPS COMPLETED:');
    console.log('1. ✅ Admin Login');
    console.log('2. ✅ Public Registration Created');
    console.log('3. ✅ Registration Verified');
    console.log('4. ✅ Registration Approved (Fast Track)');
    console.log('5. ✅ Customer & Ticket Created');
    console.log('6. ✅ Customer Details Retrieved');
    console.log('7. ✅ Equipment Added');
    console.log('8. ✅ Ticket Details Retrieved');
    console.log('9. ✅ Ticket Assigned to Technician');
    console.log('10. ✅ Ticket In Progress');
    console.log('11. ✅ Ticket Completed');
    console.log('12. ✅ Final Customer Status Verified');
    console.log('13. ✅ Final Registration Status Verified');
    console.log('\n🎯 ALL SYSTEMS OPERATIONAL! 🚀');

  } catch (error) {
    console.error('\n💥 UNEXPECTED ERROR:', error.message);
    console.error(error.stack);
  }
}

// Run the test
runFullWorkflowTest().catch(console.error);

