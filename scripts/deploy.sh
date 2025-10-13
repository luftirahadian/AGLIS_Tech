#!/bin/bash
set -e

echo "🚀 Starting AGLIS Production Deployment..."

# Navigate to app directory
cd /home/aglis/AGLIS_Tech

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm ci --production

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm ci --production

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
cd ../backend
npm run migrate

# Restart PM2 processes
echo "🔄 Restarting application..."
pm2 restart ecosystem.config.js

# Show PM2 status
pm2 status

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running at: https://yourdomain.com"
