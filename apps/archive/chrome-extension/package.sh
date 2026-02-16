#!/bin/bash

# Build Chrome Extension Script
# This script increments version, removes old zip, and creates new build

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="$SCRIPT_DIR"

echo "🚀 Starting Chrome Extension Build Process..."

# Navigate to chrome extension directory
cd "$EXTENSION_DIR"

echo "📦 Current version: $(node -p "require('./package.json').version")"

# Increment patch version
current_version=$(node -p "require('./package.json').version")
IFS='.' read -r major minor patch <<< "$current_version"
new_patch=$((patch + 1))
new_version="$major.$minor.$new_patch"

echo "🔢 Incrementing version to: $new_version"

# Update version in package.json
npm version $new_version --no-git-tag-version


echo "🏗️  Building extension..."
pnpm build

echo "📦 Creating build directory and zip file..."
# Create dist_build directory
mkdir -p "$EXTENSION_DIR/dist_build"

# Check if dist_chrome exists and zip it
if [ -d "$EXTENSION_DIR/dist_chrome" ]; then
    cd "$EXTENSION_DIR/dist_chrome"
    zip -r "$EXTENSION_DIR/dist_build/engagekit-extension.zip" ./*
    cd "$EXTENSION_DIR"
    echo "✅ Created new engagekit-extension.zip in dist_build/"
else
    echo "❌ dist_chrome directory not found after build"
    exit 1
fi

echo "🎉 Build process completed successfully!"
echo "📋 New version: $new_version"
echo "📁 Zip file: $EXTENSION_DIR/dist_build/engagekit-extension.zip"
