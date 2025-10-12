#!/bin/bash

echo "🔄 Stopping all Node.js backend processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true

echo "⏳ Waiting for ports to be released..."
sleep 3

echo "✅ Starting fresh backend instance..."
cd /Users/luftirahadian/AGLIS_Tech/backend
node src/server.js > backend_debug.log 2>&1 &

echo "⏳ Waiting for backend to start..."
sleep 5

echo "🧪 Testing backend..."
if curl -s http://localhost:3001/api/packages > /dev/null 2>&1; then
  echo "✅ Backend is running successfully!"
  echo "📋 Backend PID: $(lsof -ti:3001)"
else
  echo "❌ Backend failed to start!"
  echo "📋 Check logs: tail backend_debug.log"
fi

