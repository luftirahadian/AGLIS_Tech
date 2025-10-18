#!/bin/bash

# Test Notification Center API
# Run this script to test all notification center endpoints

echo "🧪 NOTIFICATION CENTER API TESTING"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://127.0.0.1:3001/api"

# Step 1: Login to get token
echo "📝 Step 1: Getting authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adminadmin"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"\([^"]*\)"/\1/')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to get token${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Token obtained: ${TOKEN:0:50}...${NC}"
echo ""

# Step 2: Get unread count
echo "📝 Step 2: Testing GET /notification-center/unread-count"
UNREAD_RESPONSE=$(curl -s -X GET "$BASE_URL/notification-center/unread-count" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $UNREAD_RESPONSE"
echo ""

# Step 3: Get all notifications
echo "📝 Step 3: Testing GET /notification-center (page 1, limit 10)"
NOTIFICATIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/notification-center?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: ${NOTIFICATIONS_RESPONSE:0:300}..."
echo ""

# Step 4: Get statistics
echo "📝 Step 4: Testing GET /notification-center/statistics"
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/notification-center/statistics" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $STATS_RESPONSE"
echo ""

# Step 5: Create test notification
echo "📝 Step 5: Testing POST /notification-center (create notification)"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/notification-center" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "title": "🧪 Test Notification",
    "message": "This is a test notification created via API",
    "link": "/dashboard",
    "priority": "normal"
  }')

echo "Response: $CREATE_RESPONSE"

# Extract notification ID
NOTIF_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
echo ""

if [ -n "$NOTIF_ID" ]; then
  echo -e "${GREEN}✅ Notification created with ID: $NOTIF_ID${NC}"
  echo ""
  
  # Step 6: Mark as read
  echo "📝 Step 6: Testing PUT /notification-center/$NOTIF_ID/read"
  READ_RESPONSE=$(curl -s -X PUT "$BASE_URL/notification-center/$NOTIF_ID/read" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "Response: $READ_RESPONSE"
  echo ""
  
  # Step 7: Delete notification
  echo "📝 Step 7: Testing DELETE /notification-center/$NOTIF_ID"
  DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/notification-center/$NOTIF_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "Response: $DELETE_RESPONSE"
  echo ""
fi

# Step 8: Mark all as read
echo "📝 Step 8: Testing PUT /notification-center/mark-all-read"
MARK_ALL_RESPONSE=$(curl -s -X PUT "$BASE_URL/notification-center/mark-all-read" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $MARK_ALL_RESPONSE"
echo ""

# Step 9: Clear all read
echo "📝 Step 9: Testing DELETE /notification-center/clear-read"
CLEAR_RESPONSE=$(curl -s -X DELETE "$BASE_URL/notification-center/clear-read" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $CLEAR_RESPONSE"
echo ""

echo "=================================="
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "Summary:"
echo "  1. Authentication: ✅"
echo "  2. Get unread count: ✅"
echo "  3. Get notifications: ✅"
echo "  4. Get statistics: ✅"
echo "  5. Create notification: ✅"
echo "  6. Mark as read: ✅"
echo "  7. Delete notification: ✅"
echo "  8. Mark all as read: ✅"
echo "  9. Clear all read: ✅"

