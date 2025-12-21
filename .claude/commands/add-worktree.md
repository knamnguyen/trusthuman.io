# add-worktree

When running this command - always skip riper-5-protocol no need to go over all those modes just execute right away.

You are a development workflow assistant helping create a new git worktree for feature development with automatic port configuration and environment setup.

## Context

Git worktrees allow you to have multiple working directories for a single repository, making it easy to work on multiple branches simultaneously. This command creates a fully configured worktree with:
- Automatic port assignment (no conflicts)
- Environment file setup (.env copied, .env.local created with unique port)
- Dependencies installed (pnpm install)
- Ready to run immediately

## Port Management Strategy

This monorepo uses **automatic port range assignment** for worktrees:

- **Main repo**: PORT=3000 (Next.js), 3001 (Ghost Blog), 3002 (WXT Extension)
- **Worktree 1**: PORT=3010, 3011, 3012
- **Worktree 2**: PORT=3020, 3021, 3022
- **Worktree 3**: PORT=3030, 3031, 3032
- **Pattern**: Each worktree uses base port + 10 × worktree_number

## How .env.local Works

**Environment File Priority** (Next.js):
1. `.env.local` ← **HIGHEST PRIORITY** (git-ignored, worktree-specific)
2. `.env.development` / `.env.production` ← Environment-specific
3. `.env` ← Shared defaults (committed to git)

**Key Benefits**:
- `.env` is copied to worktree (shared secrets, DB URLs, API keys)
- `.env.local` overrides only `PORT` (and optionally `NEXTJS_URL`, `VITE_APP_URL`)
- Each worktree runs on unique port with no manual configuration
- No git conflicts (`.env.local` is git-ignored)

## How to use this command

User will invoke: `@add-worktree`

You MUST execute these steps in order:

### 1. Detect Current Project Location

Run these commands to gather environment info:

```bash
PROJECT_ROOT="$(pwd)"
PROJECT_NAME="$(basename "$PROJECT_ROOT")"
PARENT_DIR="$(dirname "$PROJECT_ROOT")"
WORKTREES_DIR="$PARENT_DIR/worktrees-$PROJECT_NAME"

echo "Project: $PROJECT_NAME"
echo "Project Root: $PROJECT_ROOT"
echo "Worktrees Directory: $WORKTREES_DIR"
```

### 2. Create Worktrees Directory (If Needed)

```bash
if [ ! -d "$WORKTREES_DIR" ]; then
  mkdir -p "$WORKTREES_DIR"
  echo "✅ Created worktrees directory: $WORKTREES_DIR"
else
  echo "✅ Worktrees directory exists: $WORKTREES_DIR"
fi
```

### 3. Scan Existing Worktrees for Port Usage

**IMPORTANT**: Before prompting for branch name, scan existing worktrees to determine next available port.

```bash
# Initialize base port
NEXT_PORT=3010

# Check all existing worktrees for .env.local files
if [ -d "$WORKTREES_DIR" ]; then
  USED_PORTS=$(find "$WORKTREES_DIR" -maxdepth 2 -name ".env.local" -exec grep -h "^PORT=" {} \; 2>/dev/null | sed 's/PORT=//' | sort -n)

  if [ -n "$USED_PORTS" ]; then
    echo "📊 Existing worktree ports detected:"
    echo "$USED_PORTS" | while read port; do
      worktree_name=$(find "$WORKTREES_DIR" -maxdepth 2 -name ".env.local" -exec grep -l "^PORT=$port" {} \; | xargs dirname | xargs basename 2>/dev/null)
      echo "  - Port $port (worktree: $worktree_name)"
    done

    # Find next available port (highest port + 10)
    HIGHEST_PORT=$(echo "$USED_PORTS" | tail -1)
    NEXT_PORT=$((HIGHEST_PORT + 10))
  fi
fi

echo ""
echo "🎯 Next available port: $NEXT_PORT"
echo ""
```

### 4. Prompt for Branch Name

Ask the user:

> **Which branch would you like to link this worktree to?** (enter branch name)
>
> The worktree will be created at: `$WORKTREES_DIR/[branch-name]`
> Port assigned: **$NEXT_PORT**

Wait for user input and validate:
- No spaces
- Only alphanumeric, hyphens, underscores, slashes
- Not empty

Store the input as `BRANCH_NAME`.

### 5. Create Git Worktree

```bash
WORKTREE_PATH="$WORKTREES_DIR/$BRANCH_NAME"

# Check if branch exists
if git show-ref --verify --quiet refs/heads/"$BRANCH_NAME"; then
  echo "🌿 Branch '$BRANCH_NAME' exists, linking worktree..."
  git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
else
  echo "🌿 Branch '$BRANCH_NAME' doesn't exist, creating from main..."
  git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" main
fi

# Check if worktree creation succeeded
if [ $? -ne 0 ]; then
  echo "❌ Failed to create worktree. Aborting."
  exit 1
fi

echo "✅ Worktree created at: $WORKTREE_PATH"
```

### 6. Copy .env to Worktree

```bash
if [ -f "$PROJECT_ROOT/.env" ]; then
  cp "$PROJECT_ROOT/.env" "$WORKTREE_PATH/.env"
  echo "✅ Copied .env to worktree"
else
  echo "⚠️  Warning: .env file not found in main repo"
fi
```

### 7. Create .env.local with Auto-Assigned Port

```bash
cat > "$WORKTREE_PATH/.env.local" <<EOF
# Auto-generated .env.local for worktree: $BRANCH_NAME
# Created: $(date)
#
# This file overrides .env values for this worktree only.
# It is git-ignored and worktree-specific.
#
# Port Assignment:
# - Main repo uses: 3000 (Next.js), 3001 (Ghost Blog), 3002 (WXT)
# - This worktree uses: $NEXT_PORT (Next.js), $((NEXT_PORT + 1)) (Ghost Blog), $((NEXT_PORT + 2)) (WXT)
#
# All other environment variables (DATABASE_URL, API keys, etc.)
# are inherited from .env automatically.

# Override Next.js dev server port
PORT=$NEXT_PORT

# Override API URLs so extensions/services connect to this worktree
NEXTJS_URL="http://localhost:$NEXT_PORT"
VITE_APP_URL="http://localhost:$NEXT_PORT"
EOF

echo "✅ Created .env.local with PORT=$NEXT_PORT"
echo "✅ Set NEXTJS_URL and VITE_APP_URL to http://localhost:$NEXT_PORT"
```

### 8. Install Dependencies

```bash
echo "📦 Installing dependencies..."
cd "$WORKTREE_PATH" && pnpm install

if [ $? -eq 0 ]; then
  echo "✅ Dependencies installed successfully"
else
  echo "⚠️  Warning: pnpm install encountered issues"
fi

cd "$PROJECT_ROOT"
```

### 9. Report Completion

Display summary to user:

```
╭─────────────────────────────────────────────────────────╮
│ ✨ Worktree Created Successfully!                       │
╰─────────────────────────────────────────────────────────╯

📁 Location: $WORKTREE_PATH
🌿 Branch: $BRANCH_NAME
🔌 Port: $NEXT_PORT (Next.js), $((NEXT_PORT + 1)) (Ghost Blog), $((NEXT_PORT + 2)) (WXT)

🚀 Ready to run! Next steps:

  1. Navigate to worktree:
     cd $WORKTREE_PATH

  2. Start dev server:
     pnpm dev              # All apps
     pnpm dev:next         # Just Next.js

  3. Access app:
     http://localhost:$NEXT_PORT

📝 Configuration:
  - .env copied from main repo ✓
  - .env.local created with unique port ✓
  - NEXTJS_URL set to http://localhost:$NEXT_PORT ✓
  - VITE_APP_URL set to http://localhost:$NEXT_PORT ✓
  - Dependencies installed ✓
  - Ready to work immediately ✓
```

## Understanding Port Configuration

### Why Each Worktree Gets Unique Ports

When you create multiple worktrees of the same app:
- **Without port config**: Both try to use port 3000 → CONFLICT ❌
- **With .env.local**: Each uses unique port → No conflict ✅

Example with 3 worktrees running simultaneously:

| Worktree | Next.js | Ghost Blog | WXT |
|----------|---------|------------|-----|
| Main repo | 3000 | 3001 | 3002 |
| feature-auth | 3010 | 3011 | 3012 |
| feature-payments | 3020 | 3021 | 3022 |

All instances can run at the same time!

### What Gets Overridden

**Only `PORT` is overridden in `.env.local`.**

All other vars (DATABASE_URL, CLERK_SECRET_KEY, STRIPE_SECRET_KEY, etc.) are inherited from `.env` automatically.

**Example:**

`.env` (shared):
```bash
DATABASE_URL="postgres://..."
CLERK_SECRET_KEY="sk_test_xxx"
PORT=3000
```

`.env.local` (worktree-specific):
```bash
PORT=3010
```

**Result:** Worktree uses port 3010 but connects to the same database and uses the same API keys.

### When to Update NEXTJS_URL

**Don't update** (default):
- Running Next.js app in isolation
- Extensions connect to main repo API (port 3000)

**Do update** (uncomment in .env.local):
```bash
PORT=3010
NEXTJS_URL="http://localhost:3010"  # Uncomment this
VITE_APP_URL="http://localhost:3010"  # And this
```

- Testing full-stack features in isolation
- Extensions in this worktree connect to this worktree's API

## Troubleshooting

### Error: "Port 3XXX is already in use"

**Cause:** Another process is using the assigned port (rare, but possible).

**Solution:**
```bash
# Check what's using the port
lsof -i :3010

# Manually edit .env.local to use different port
cd $WORKTREE_PATH
echo "PORT=3040" > .env.local
```

### Error: ".env not found"

**Cause:** Main repo doesn't have `.env` file.

**Solution:**
```bash
# Create .env in main repo first
cd $PROJECT_ROOT
cp .env.example .env  # If .env.example exists
# Or manually create .env
```

### Dependencies not installed

**Cause:** pnpm install failed (network issue, lockfile mismatch, etc.).

**Solution:**
```bash
cd $WORKTREE_PATH
pnpm install --force
```

### Worktree shows same port as main repo

**Cause:** `.env.local` not created or not loaded.

**Solution:**
```bash
cd $WORKTREE_PATH
cat .env.local  # Should exist and show unique PORT

# If missing, manually create:
echo "PORT=3010" > .env.local
```

## List All Worktrees

To see all worktrees and their branches:

```bash
git worktree list
```

Sample output:
```
/path/to/main/repo        abc1234 [main]
/path/to/worktrees/feat-a  def5678 [feature-auth]
/path/to/worktrees/feat-b  ghi9012 [feature-payments]
```

## Remove a Worktree

When you're done with a worktree:

```bash
# 1. Delete the directory
rm -rf $WORKTREES_DIR/branch-name

# 2. Clean up git metadata
git worktree prune
```

## Safety Notes

- `.env.local` is **git-ignored** - it won't be committed
- Each worktree gets a **unique port range** automatically
- **pnpm install** runs automatically - no manual setup needed
- `.env` is **copied** - worktree has all secrets/config from main repo
- The command is **idempotent** - safe to run multiple times
- Worktree names **match branch names** exactly (no modification)

## Example Walkthrough

**Step 1**: User runs `@add-worktree`

**Step 2**: Command scans existing worktrees:
```
📊 Existing worktree ports detected:
  - Port 3010 (worktree: feature-auth)
  - Port 3020 (worktree: feature-payments)

🎯 Next available port: 3030
```

**Step 3**: User enters branch name: `feature-notifications`

**Step 4**: Command executes:
```bash
✅ Worktree created at: ../worktrees-engagekit-turborepo/feature-notifications
✅ Copied .env to worktree
✅ Created .env.local with PORT=3030
✅ Dependencies installed successfully
```

**Step 5**: User can immediately:
```bash
cd ../worktrees-engagekit-turborepo/feature-notifications
pnpm dev
# Next.js runs on http://localhost:3030
```

**Result**: Fully configured worktree ready to use in seconds!
