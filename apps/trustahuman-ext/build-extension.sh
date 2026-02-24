#!/bin/bash

# Build Chrome Extension Script
# This script increments version, removes old zip, and creates new build

set -e

echo "🚀 Starting TrustHuman Extension Build Process..."

# Navigate to extension directory (script directory)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if .env.prod exists at repo root
if [ ! -f "../../.env.prod" ]; then
    echo "❌ ERROR: .env.prod not found at repo root!"
    echo "Create ../../.env.prod with production values:"
    echo "  VITE_CLERK_PUBLISHABLE_KEY=pk_live_..."
    echo "  VITE_SYNC_HOST_URL=https://trusthuman.io"
    exit 1
fi

echo "📦 Current version: $(node -p "require('./package.json').version")"

# Increment patch version
current_version=$(node -p "require('./package.json').version")
IFS='.' read -r major minor patch <<< "$current_version"
new_patch=$((patch + 1))
new_version="$major.$minor.$new_patch"

echo "🔢 Incrementing version to: $new_version"

# Update version in package.json
npm version $new_version --no-git-tag-version

echo "🗑️  Removing existing zip file..."
if [ -f "trusthuman-extension.zip" ]; then
    rm trusthuman-extension.zip
    echo "✅ Removed old trusthuman-extension.zip"
else
    echo "ℹ️  No existing zip file found"
fi

echo "🏗️  Building extension with production environment..."
NODE_OPTIONS="--max-old-space-size=8192" pnpm with-env:prod wxt build

echo "🔧 Removing 'key' field from manifest (not allowed for new Chrome Store submissions)..."
# Chrome Web Store doesn't allow 'key' field for new submissions
if [ -f "dist/chrome-mv3/manifest.json" ]; then
    if command -v jq &> /dev/null; then
        jq 'del(.key)' dist/chrome-mv3/manifest.json > dist/chrome-mv3/manifest.json.tmp
        mv dist/chrome-mv3/manifest.json.tmp dist/chrome-mv3/manifest.json
        echo "✅ Removed 'key' field from manifest"
    else
        echo "⚠️  jq not installed - please manually remove 'key' from manifest.json"
        echo "   Install jq: brew install jq"
    fi
fi

echo "📦 Creating new zip file..."
# Check if dist/chrome-mv3 exists and zip it
if [ -d "dist/chrome-mv3" ]; then
    cd dist/chrome-mv3
    zip -r ../../trusthuman-extension.zip ./*
    cd ../..
    echo "✅ Created new trusthuman-extension.zip"
else
    echo "❌ dist/chrome-mv3 directory not found after build"
    exit 1
fi

echo ""
echo "🎉 Build process completed successfully!"
echo "📋 New version: $new_version"
echo "📁 Zip file: trusthuman-extension.zip"
echo ""
echo "Next steps:"
echo "1. Upload trusthuman-extension.zip to Chrome Web Store"
echo "2. After approval, note the Extension ID"
echo "3. Add to Clerk 'Allowed Origins': chrome-extension://[ID]"
