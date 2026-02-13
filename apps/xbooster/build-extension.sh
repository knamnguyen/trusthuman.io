#!/bin/bash

# Build xBooster Chrome Extension
# Increments version, removes old zip, builds, and creates new zip

set -e

echo "Starting xBooster build..."

# Navigate to script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "Current version: $(node -p "require('./package.json').version")"

# Increment patch version
current_version=$(node -p "require('./package.json').version")
IFS='.' read -r major minor patch <<< "$current_version"
new_patch=$((patch + 1))
new_version="$major.$minor.$new_patch"

echo "Incrementing version to: $new_version"
npm version $new_version --no-git-tag-version

# Also update manifest version to match
# (WXT reads from manifest config, but we keep them in sync)

# Remove old zip
if [ -f "xbooster.zip" ]; then
    rm xbooster.zip
    echo "Removed old xbooster.zip"
else
    echo "No existing zip file found"
fi

echo "Building extension..."
NODE_OPTIONS="--max-old-space-size=8192" pnpm build

echo "Creating zip..."
if [ -d "dist/chrome-mv3" ]; then
    cd dist/chrome-mv3
    zip -r ../../xbooster.zip ./*
    cd ../..
    echo "Created xbooster.zip"
else
    echo "ERROR: dist/chrome-mv3 not found after build"
    exit 1
fi

echo "Build complete!"
echo "Version: $new_version"
echo "Zip: apps/xbooster/xbooster.zip"
