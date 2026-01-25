#!/bin/bash
set -e  # Exit on any error

# Navigate to repo root
cd "$(dirname "$0")/../.."

echo "🚀 Starting deployment from $(pwd)"

# Ensure we're using Node 22
echo "📦 Switching to Node 22..."
fnm use 22

# Pull latest code
echo "📥 Pulling latest code from main..."
git fetch
git checkout origin/main

# Install dependencies (triggers postinstall: db:generate + prisma engine copy)
echo "📦 Installing dependencies (runs db:generate via postinstall)..."
pnpm install

# Restart the server
echo "🔄 Restarting PM2 process..."
pm2 restart 0

# Show logs
echo "✅ Deployment complete! Showing logs (Ctrl+C to exit)..."
pm2 logs 0
