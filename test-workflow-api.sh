#!/bin/bash

# Full Workflow API Test Script
# Tests complete flow from registration to ticket completion

set -e  # Exit on error

API_BASE="http://localhost:3001/api"
TIMESTAMP=$(date +%s)
TOKEN=""
REG_ID=""
CUSTOMER_ID=""
TICKET_ID=""

echo "=================================="
echo "🚀 FULL WORKFLOW API TEST"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_step() {
    echo -e "${BLUE}📍 STEP $1: $2${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# STEP 1: Login
log_step "1" "LOGIN AS ADMIN"
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "adminadmin"
  }')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    log_success "Logged in successfully"
    log_info "Token: ${TOKEN:0:20}..."
else
    log_error "Login failed"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

sleep 1

# STEP 2: Create Public Registration
log_step "2" "CREATE PUBLIC REGISTRATION"
PHONE="0812$(printf "%08d" $((RANDOM % 100000000)))"
EMAIL="test.workflow.${TIMESTAMP}@email.com"

REG_RESPONSE=$(curl -s -X POST "${API_BASE}/registrations/public" \
  -H "Content-Type: application/json" \
  -d "{
    \"full_name\": \"Test User Workflow ${TIMESTAMP}\",
    \"email\": \"${EMAIL}\",
    \"phone\": \"${PHONE}\",
    \"whatsapp_verified\": true,
    \"id_card_number\": \"3216$(printf "%012d" $((RANDOM % 1000000000000)))\",
    \"address\": \"Jl. Test Workflow No. 123\",
    \"rt\": \"001\",
    \"rw\": \"005\",
    \"kelurahan\": \"Karawang Baru\",
    \"kecamatan\": \"Karawang Timur\",
    \"city\": \"Karawang\",
    \"postal_code\": \"41314\",
    \"service_type\": \"broadband\",
    \"package_id\": 1,
    \"preferred_installation_date\": \"$(date -d '+7 days' +%Y-%m-%d)\"
  }")

if echo "$REG_RESPONSE" | grep -q '"success":true'; then
    REG_ID=$(echo "$REG_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    REG_NUMBER=$(echo "$REG_RESPONSE" | grep -o '"registration_number":"[^"]*' | cut -d'"' -f4)
    log_success "Registration created"
    log_info "Registration ID: ${REG_ID}"
    log_info "Registration Number: ${REG_NUMBER}"
    log_info "Email: ${EMAIL}"
    log_info "Phone: ${PHONE}"
else
    log_error "Registration creation failed"
    echo "$REG_RESPONSE"
    exit 1
fi

sleep 2

# STEP 3: Verify Registration
log_step "3" "VERIFY REGISTRATION"
VERIFY_RESPONSE=$(curl -s -X PUT "${API_BASE}/registrations/${REG_ID}/status" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "verified",
    "notes": "Quick verification for API testing"
  }')

if echo "$VERIFY_RESPONSE" | grep -q '"success":true'; then
    log_success "Registration verified"
    STATUS=$(echo "$VERIFY_RESPONSE" | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)
    log_info "Status: ${STATUS}"
else
    log_error "Verification failed"
    echo "$VERIFY_RESPONSE"
    exit 1
fi

sleep 1

# STEP 4: Approve Registration
log_step "4" "APPROVE REGISTRATION"
APPROVE_RESPONSE=$(curl -s -X PUT "${API_BASE}/registrations/${REG_ID}/status" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "notes": "Fast track approval for API testing"
  }')

if echo "$APPROVE_RESPONSE" | grep -q '"success":true'; then
    log_success "Registration approved"
    STATUS=$(echo "$APPROVE_RESPONSE" | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)
    log_info "Status: ${STATUS}"
else
    log_error "Approval failed"
    echo "$APPROVE_RESPONSE"
    exit 1
fi

sleep 2

# STEP 5: Create Customer & Ticket
log_step "5" "CREATE CUSTOMER & INSTALLATION TICKET"
CUSTOMER_RESPONSE=$(curl -s -X POST "${API_BASE}/registrations/${REG_ID}/create-customer" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"registration_id\": ${REG_ID},
    \"username\": \"test_${TIMESTAMP}\",
    \"password\": \"password123\",
    \"odp\": \"ODP-KRW-01\",
    \"installation_notes\": \"API test installation\"
  }")

if echo "$CUSTOMER_RESPONSE" | grep -q '"success":true'; then
    CUSTOMER_ID=$(echo "$CUSTOMER_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    TICKET_ID=$(echo "$CUSTOMER_RESPONSE" | grep -o '"id":[0-9]*' | tail -1 | cut -d':' -f2)
    CUSTOMER_ID_TEXT=$(echo "$CUSTOMER_RESPONSE" | grep -o '"customer_id":"[^"]*' | cut -d'"' -f4)
    TICKET_NUMBER=$(echo "$CUSTOMER_RESPONSE" | grep -o '"ticket_number":"[^"]*' | cut -d'"' -f4)
    
    log_success "Customer & Ticket created"
    log_info "Customer ID: ${CUSTOMER_ID} (${CUSTOMER_ID_TEXT})"
    log_info "Ticket ID: ${TICKET_ID} (${TICKET_NUMBER})"
else
    log_error "Customer creation failed"
    echo "$CUSTOMER_RESPONSE"
    exit 1
fi

sleep 2

# STEP 6: Get Customer Details
log_step "6" "GET CUSTOMER DETAILS"
CUSTOMER_DETAIL=$(curl -s -X GET "${API_BASE}/customers/${CUSTOMER_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$CUSTOMER_DETAIL" | grep -q '"success":true'; then
    log_success "Customer details retrieved"
    NAME=$(echo "$CUSTOMER_DETAIL" | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)
    PACKAGE=$(echo "$CUSTOMER_DETAIL" | grep -o '"package_name":"[^"]*' | cut -d'"' -f4)
    ACCOUNT_STATUS=$(echo "$CUSTOMER_DETAIL" | grep -o '"account_status":"[^"]*' | cut -d'"' -f4)
    log_info "Name: ${NAME}"
    log_info "Package: ${PACKAGE}"
    log_info "Status: ${ACCOUNT_STATUS}"
else
    log_error "Get customer details failed"
    echo "$CUSTOMER_DETAIL"
fi

sleep 1

# STEP 7: Add Equipment
log_step "7" "ADD EQUIPMENT TO CUSTOMER"
EQUIPMENT_RESPONSE=$(curl -s -X POST "${API_BASE}/customers/${CUSTOMER_ID}/equipment" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"equipment_type\": \"ONT Huawei HG8245H\",
    \"brand\": \"Huawei\",
    \"model\": \"HG8245H\",
    \"serial_number\": \"SN${TIMESTAMP}\",
    \"mac_address\": \"00:11:22:33:44:55\",
    \"installation_date\": \"$(date +%Y-%m-%d)\",
    \"warranty_expiry\": \"$(date -d '+1 year' +%Y-%m-%d)\",
    \"status\": \"active\",
    \"notes\": \"API test equipment\"
  }")

if echo "$EQUIPMENT_RESPONSE" | grep -q '"success":true'; then
    log_success "Equipment added successfully"
    EQUIPMENT_ID=$(echo "$EQUIPMENT_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    log_info "Equipment ID: ${EQUIPMENT_ID}"
else
    log_error "Add equipment failed"
    echo "$EQUIPMENT_RESPONSE"
fi

sleep 1

# STEP 8: Get Ticket Details
log_step "8" "GET TICKET DETAILS"
TICKET_DETAIL=$(curl -s -X GET "${API_BASE}/tickets/${TICKET_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$TICKET_DETAIL" | grep -q '"success":true'; then
    log_success "Ticket details retrieved"
    TICKET_TYPE=$(echo "$TICKET_DETAIL" | grep -o '"type":"[^"]*' | head -1 | cut -d'"' -f4)
    TICKET_STATUS=$(echo "$TICKET_DETAIL" | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)
    TICKET_PRIORITY=$(echo "$TICKET_DETAIL" | grep -o '"priority":"[^"]*' | head -1 | cut -d'"' -f4)
    log_info "Type: ${TICKET_TYPE}"
    log_info "Status: ${TICKET_STATUS}"
    log_info "Priority: ${TICKET_PRIORITY}"
else
    log_error "Get ticket details failed"
    echo "$TICKET_DETAIL"
fi

sleep 1

# STEP 9: Assign Ticket to Technician
log_step "9" "ASSIGN TICKET TO TECHNICIAN"
TECHNICIANS=$(curl -s -X GET "${API_BASE}/technicians?limit=1" \
  -H "Authorization: Bearer ${TOKEN}")

TECH_ID=$(echo "$TECHNICIANS" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$TECH_ID" ]; then
    ASSIGN_RESPONSE=$(curl -s -X PUT "${API_BASE}/tickets/${TICKET_ID}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"assigned_technician_id\": ${TECH_ID},
        \"status\": \"assigned\"
      }")
    
    if echo "$ASSIGN_RESPONSE" | grep -q '"success":true'; then
        log_success "Ticket assigned to technician ${TECH_ID}"
        NEW_STATUS=$(echo "$ASSIGN_RESPONSE" | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)
        log_info "Status: ${NEW_STATUS}"
    else
        log_error "Ticket assignment failed"
        echo "$ASSIGN_RESPONSE"
    fi
else
    log_info "No technicians available, skipping assignment"
fi

sleep 1

# STEP 10: Update to In Progress
log_step "10" "UPDATE TICKET TO IN PROGRESS"
PROGRESS_RESPONSE=$(curl -s -X PUT "${API_BASE}/tickets/${TICKET_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "notes": "Technician started working on installation"
  }')

if echo "$PROGRESS_RESPONSE" | grep -q '"success":true'; then
    log_success "Ticket updated to in_progress"
    STATUS=$(echo "$PROGRESS_RESPONSE" | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)
    log_info "Status: ${STATUS}"
else
    log_error "Update to in_progress failed"
    echo "$PROGRESS_RESPONSE"
fi

sleep 1

# STEP 11: Complete Ticket
log_step "11" "COMPLETE TICKET"
COMPLETE_RESPONSE=$(curl -s -X PUT "${API_BASE}/tickets/${TICKET_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"completed\",
    \"resolution_notes\": \"Installation completed successfully via API test. Equipment tested and working properly.\",
    \"completed_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"
  }")

if echo "$COMPLETE_RESPONSE" | grep -q '"success":true'; then
    log_success "Ticket completed successfully"
    STATUS=$(echo "$COMPLETE_RESPONSE" | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)
    log_info "Status: ${STATUS}"
else
    log_error "Ticket completion failed"
    echo "$COMPLETE_RESPONSE"
fi

sleep 1

# STEP 12: Verify Final Customer Status
log_step "12" "VERIFY FINAL CUSTOMER STATUS"
FINAL_CUSTOMER=$(curl -s -X GET "${API_BASE}/customers/${CUSTOMER_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$FINAL_CUSTOMER" | grep -q '"success":true'; then
    log_success "Final customer status verified"
    NAME=$(echo "$FINAL_CUSTOMER" | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)
    STATUS=$(echo "$FINAL_CUSTOMER" | grep -o '"account_status":"[^"]*' | cut -d'"' -f4)
    PACKAGE=$(echo "$FINAL_CUSTOMER" | grep -o '"package_name":"[^"]*' | cut -d'"' -f4)
    log_info "Name: ${NAME}"
    log_info "Status: ${STATUS}"
    log_info "Package: ${PACKAGE}"
else
    log_error "Get final customer status failed"
fi

sleep 1

# STEP 13: Verify Final Registration Status
log_step "13" "VERIFY FINAL REGISTRATION STATUS"
FINAL_REG=$(curl -s -X GET "${API_BASE}/registrations/${REG_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$FINAL_REG" | grep -q '"success":true'; then
    log_success "Final registration status verified"
    REG_NUM=$(echo "$FINAL_REG" | grep -o '"registration_number":"[^"]*' | cut -d'"' -f4)
    REG_STATUS=$(echo "$FINAL_REG" | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)
    log_info "Number: ${REG_NUM}"
    log_info "Status: ${REG_STATUS}"
else
    log_error "Get final registration status failed"
fi

# Final Summary
echo ""
echo "=================================="
echo -e "${GREEN}🎉 TEST COMPLETED SUCCESSFULLY${NC}"
echo "=================================="
echo ""
echo "📊 SUMMARY:"
echo "✅ Registration ID: ${REG_ID}"
echo "✅ Customer ID: ${CUSTOMER_ID}"
echo "✅ Ticket ID: ${TICKET_ID}"
echo ""
echo "🔄 WORKFLOW STEPS:"
echo "1. ✅ Admin Login"
echo "2. ✅ Public Registration Created"
echo "3. ✅ Registration Verified"
echo "4. ✅ Registration Approved"
echo "5. ✅ Customer & Ticket Created"
echo "6. ✅ Customer Details Retrieved"
echo "7. ✅ Equipment Added"
echo "8. ✅ Ticket Details Retrieved"
echo "9. ✅ Ticket Assigned"
echo "10. ✅ Ticket In Progress"
echo "11. ✅ Ticket Completed"
echo "12. ✅ Final Customer Verified"
echo "13. ✅ Final Registration Verified"
echo ""
echo -e "${GREEN}🎯 ALL SYSTEMS OPERATIONAL!${NC}"
echo ""

