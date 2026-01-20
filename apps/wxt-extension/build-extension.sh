#!/bin/bash

# Build Chrome Extension Script
# This script increments version, removes old zip, and creates new build

set -e

echo "🚀 Starting Chrome Extension Build Process..."

# Navigate to chrome extension directory (script directory)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

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
if [ -f "engagekit-extension.zip" ]; then
    rm engagekit-extension.zip
    echo "✅ Removed old engagekit-extension.zip"
else
    echo "ℹ️  No existing zip file found"
fi

echo "🏗️  Building extension..."
NODE_OPTIONS="--max-old-space-size=8192" pnpm build

echo "📦 Creating new zip file..."
# Check if dist_chrome exists and zip it
if [ -d "dist" ]; then
    cd dist
    zip -r ../engagekit-extension.zip ./*
    cd ..
    echo "✅ Created new engagekit-extension.zip"
else
    echo "❌ dist_chrome directory not found after build"
    exit 1
fi

echo "🎉 Build process completed successfully!"
echo "📋 New version: $new_version"
echo "📁 Zip file: apps/wxt-extension/engagekit-extension.zip"