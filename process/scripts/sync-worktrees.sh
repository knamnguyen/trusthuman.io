#!/bin/bash
#
# sync-worktrees.sh
# Setup script for Conductor workspaces
#
# Paste this in Conductor's "Setup script" field:
#   /Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/process/scripts/sync-worktrees.sh
#
# Or run manually from worktree root:
#   ./process/scripts/sync-worktrees.sh
#
# Port Assignment Strategy:
# - If .env exists with PORT != 3000, keep that port (stable)
# - If new worktree, find next available port by scanning all .env files
# - Ports are never reassigned once set
# - Directly modifies .env (no .env.local needed)

set -e

# Get the worktree directory (where this script is running)
WORKTREE_PATH="$(pwd)"
WORKTREE_NAME="$(basename "$WORKTREE_PATH")"

# Main repo location (source of .env)
MAIN_REPO="/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo"

# All worktree locations to scan for port assignment
WORKTREE_LOCATIONS=(
  "$(dirname "$MAIN_REPO")/worktrees-engagekit-turborepo"
  "/Users/knamnguyen/conductor/workspaces/engagekit-turborepo"
)

echo "🔧 Setting up worktree: $WORKTREE_NAME"
echo "   Path: $WORKTREE_PATH"
echo ""

# Check if .env exists in main repo
if [ ! -f "$MAIN_REPO/.env" ]; then
  echo "❌ Error: .env not found in main repo ($MAIN_REPO)"
  exit 1
fi

# Check if this worktree already has a port assigned (not 3000)
EXISTING_PORT=""
if [ -f "$WORKTREE_PATH/.env" ]; then
  EXISTING_PORT=$(grep "^PORT=" "$WORKTREE_PATH/.env" 2>/dev/null | sed 's/PORT=//' | tr -d ' ')
fi

if [ -n "$EXISTING_PORT" ] && [ "$EXISTING_PORT" != "3000" ]; then
  # Keep existing port assignment
  NEXT_PORT="$EXISTING_PORT"
  API_PORT=$((8000 + (NEXT_PORT - 3000)))
  echo "�� Keeping existing port assignment: $NEXT_PORT"
else
  # New worktree - find next available port
  echo "📂 Scanning for used ports..."

  # Collect all used ports from .env files in worktrees
  declare -a USED_PORTS
  USED_PORTS+=(3000)  # Main repo always uses 3000

  for location in "${WORKTREE_LOCATIONS[@]}"; do
    if [ -d "$location" ]; then
      for dir in "$location"/*/; do
        if [ -d "$dir" ]; then
          env_file="$dir/.env"
          if [ -f "$env_file" ]; then
            port=$(grep "^PORT=" "$env_file" 2>/dev/null | sed 's/PORT=//' | tr -d ' ')
            if [ -n "$port" ] && [ "$port" != "3000" ]; then
              USED_PORTS+=("$port")
              wt_name=$(basename "${dir%/}")
              echo "   Found: $wt_name → PORT=$port"
            fi
          fi
        fi
      done
    fi
  done

  # Find next available port (start at 3010, increment by 10)
  NEXT_PORT=3010
  while [[ " ${USED_PORTS[*]} " =~ " ${NEXT_PORT} " ]]; do
    NEXT_PORT=$((NEXT_PORT + 10))
  done

  API_PORT=$((8000 + (NEXT_PORT - 3000)))
  echo "   Next available port: $NEXT_PORT"
fi

echo ""
echo "   Assigned ports: Next.js=$NEXT_PORT, API=$API_PORT"
echo ""

# 1. Copy .env from main repo
echo "📋 Copying .env from main repo..."
cp "$MAIN_REPO/.env" "$WORKTREE_PATH/.env"
echo "   ✅ .env copied"

# 2. Replace port values directly in .env
echo "📝 Updating ports in .env..."

# Use sed to replace the values (macOS compatible)
sed -i '' "s|^PORT=.*|PORT=$NEXT_PORT|" "$WORKTREE_PATH/.env"
sed -i '' "s|^VITE_APP_URL=.*|VITE_APP_URL=\"http://localhost:$API_PORT\"|" "$WORKTREE_PATH/.env"
sed -i '' "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=\"http://localhost:$API_PORT\"|" "$WORKTREE_PATH/.env"
sed -i '' "s|^NEXTJS_URL=.*|NEXTJS_URL=\"http://localhost:$NEXT_PORT\"|" "$WORKTREE_PATH/.env"
sed -i '' "s|^VITE_NEXTJS_URL=.*|VITE_NEXTJS_URL=\"http://localhost:$NEXT_PORT\"|" "$WORKTREE_PATH/.env"

echo "   ✅ Ports updated (PORT=$NEXT_PORT, API=$API_PORT)"

# 3. Remove .env.local if it exists (no longer needed)
if [ -f "$WORKTREE_PATH/.env.local" ]; then
  rm "$WORKTREE_PATH/.env.local"
  echo "   🗑️  Removed old .env.local"
fi

# 4. Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo "   ✅ Dependencies installed"

echo ""
echo "╭─────────────────────────────────────────────────────────╮"
echo "│ ✨ Worktree Ready!                                      │"
echo "╰─────────────────────────────────────────────────────────╯"
echo ""
echo "   Worktree: $WORKTREE_NAME"
echo "   Next.js:  http://localhost:$NEXT_PORT"
echo "   API:      http://localhost:$API_PORT"
echo ""
echo "   Run: pnpm dev"
echo ""
