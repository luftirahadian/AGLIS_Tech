#!/bin/bash
echo "🧪 Testing Queue Monitor API Endpoints"
echo "======================================"

# Get token
TOKEN=$(curl -X POST https://portal.aglis.biz.id/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adminadmin"}' \
  -k -s | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token"
  exit 1
fi

echo "✅ Auth token obtained"
echo ""

# Test 1: Stats
echo "1️⃣ GET /api/queue/stats"
curl -X GET "https://portal.aglis.biz.id/api/queue/stats" \
  -H "Authorization: Bearer $TOKEN" -k -s | python3 -m json.tool
echo ""

# Test 2: Completed Jobs
echo "2️⃣ GET /api/queue/jobs/completed"
curl -X GET "https://portal.aglis.biz.id/api/queue/jobs/completed?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" -k -s | python3 -m json.tool
echo ""

# Test 3: Failed Jobs
echo "3️⃣ GET /api/queue/jobs/failed"
curl -X GET "https://portal.aglis.biz.id/api/queue/jobs/failed?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" -k -s | python3 -m json.tool
echo ""

echo "✅ All API tests completed!"
