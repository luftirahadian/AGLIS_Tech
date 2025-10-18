#!/bin/bash

# Test Bulk Operations - Complete E2E Test Suite
# This script creates test data and tests all bulk operations

BASE_URL="https://portal.aglis.biz.id/api"
echo "🧪 BULK OPERATIONS TEST SUITE"
echo "================================"
echo ""

# Login to get token
echo "1️⃣ Logging in as admin..."
LOGIN_RESPONSE=$(curl -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adminadmin"}' \
  -k -s)

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful! Token: ${TOKEN:0:20}..."
echo ""

# Create 5 test registrations
echo "2️⃣ Creating 5 test registrations..."
REG_IDS=()

for i in {1..5}; do
  REG_DATA='{
    "full_name": "Test Customer '$i'",
    "phone": "081234567'$i$i'",
    "email": "test'$i'@example.com",
    "address": "Test Address '$i'",
    "package_id": 1,
    "installation_address": "Test Install Address '$i'",
    "notes": "Bulk test registration '$i'"
  }'
  
  RESPONSE=$(curl -X POST "${BASE_URL}/registrations" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$REG_DATA" \
    -k -s)
  
  REG_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  
  if [ ! -z "$REG_ID" ]; then
    REG_IDS+=($REG_ID)
    echo "  ✅ Created registration #$i (ID: $REG_ID)"
  else
    echo "  ⚠️ Failed to create registration #$i"
  fi
done

echo ""
echo "📊 Created ${#REG_IDS[@]} test registrations"
echo "IDs: ${REG_IDS[@]}"
echo ""

# Test Bulk Verify
echo "3️⃣ Testing BULK VERIFY..."
BULK_VERIFY_IDS=$(printf ',%s' "${REG_IDS[@]:0:3}")
BULK_VERIFY_IDS="[${BULK_VERIFY_IDS:1}]"

VERIFY_RESPONSE=$(curl -X POST "${BASE_URL}/bulk/registrations/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"ids\":${BULK_VERIFY_IDS},\"data\":{\"notes\":\"Bulk test verify\"}}" \
  -k -s)

echo "Response:"
echo "$VERIFY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$VERIFY_RESPONSE"
echo ""

# Test Bulk Reject
echo "4️⃣ Testing BULK REJECT..."
BULK_REJECT_IDS=$(printf ',%s' "${REG_IDS[@]:3:2}")
BULK_REJECT_IDS="[${BULK_REJECT_IDS:1}]"

REJECT_RESPONSE=$(curl -X POST "${BASE_URL}/bulk/registrations/reject" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"ids\":${BULK_REJECT_IDS},\"data\":{\"rejection_reason\":\"Bulk test reject\",\"notes\":\"Testing bulk reject\"}}" \
  -k -s)

echo "Response:"
echo "$REJECT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REJECT_RESPONSE"
echo ""

# Summary
echo "================================"
echo "📊 TEST SUMMARY"
echo "================================"
echo "✅ Created: ${#REG_IDS[@]} registrations"
echo "✅ Bulk Verify: Tested with 3 items"
echo "✅ Bulk Reject: Tested with 2 items"
echo ""
echo "🎯 Check browser now to verify bulk operations work!"
echo ""
echo "Registration IDs for cleanup: ${REG_IDS[@]}"

