#!/bin/bash
#
# clean-worktree.sh
# Cleans up a git worktree (fast method by default)
#
# Usage:
#   ./process/scripts/clean-worktree.sh <worktree-name> [--delete-branch]
#
# Examples:
#   ./process/scripts/clean-worktree.sh landing-page
#   ./process/scripts/clean-worktree.sh landing-page --delete-branch

set -e

# Get the main repo root (where this script lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_REPO="$(dirname "$(dirname "$SCRIPT_DIR")")"
PROJECT_NAME="$(basename "$MAIN_REPO")"

# Worktree locations
WORKTREE_LOCATIONS=(
  "$(dirname "$MAIN_REPO")/worktrees-$PROJECT_NAME"
  "/Users/knamnguyen/conductor/workspaces/engagekit-turborepo"
)

# Parse arguments
WORKTREE_NAME=""
DELETE_BRANCH=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --delete-branch)
      DELETE_BRANCH=true
      shift
      ;;
    *)
      WORKTREE_NAME="$1"
      shift
      ;;
  esac
done

# If no worktree name provided, show usage
if [ -z "$WORKTREE_NAME" ]; then
  echo "Usage: $0 <worktree-name> [--delete-branch]"
  echo ""
  echo "Available worktrees:"
  git worktree list
  exit 1
fi

# Find the worktree path
WORKTREE_PATH=""
for location in "${WORKTREE_LOCATIONS[@]}"; do
  if [ -d "$location/$WORKTREE_NAME" ]; then
    WORKTREE_PATH="$location/$WORKTREE_NAME"
    break
  fi
done

if [ -z "$WORKTREE_PATH" ]; then
  echo "❌ Worktree '$WORKTREE_NAME' not found in:"
  for location in "${WORKTREE_LOCATIONS[@]}"; do
    echo "   - $location"
  done
  exit 1
fi

# Get the branch name before deletion
BRANCH_NAME=""
if [ -d "$WORKTREE_PATH/.git" ] || [ -f "$WORKTREE_PATH/.git" ]; then
  BRANCH_NAME=$(git -C "$WORKTREE_PATH" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
fi

echo "🧹 Cleaning worktree: $WORKTREE_NAME"
echo "   Path: $WORKTREE_PATH"
[ -n "$BRANCH_NAME" ] && echo "   Branch: $BRANCH_NAME"
echo ""

# Fast cleanup (rm -rf + prune)
echo "🗑️  Removing worktree directory..."
rm -rf "$WORKTREE_PATH"
echo "   ✅ Directory removed"

echo "🔧 Pruning git worktree references..."
git worktree prune
echo "   ✅ Git references pruned"

# Optionally delete branch
if [ "$DELETE_BRANCH" = true ] && [ -n "$BRANCH_NAME" ] && [ "$BRANCH_NAME" != "main" ] && [ "$BRANCH_NAME" != "master" ]; then
  echo "🌿 Deleting branch '$BRANCH_NAME'..."
  if git branch -D "$BRANCH_NAME" 2>/dev/null; then
    echo "   ✅ Branch deleted"
  else
    echo "   ⚠️  Could not delete branch (may not exist locally)"
  fi
fi

echo ""
echo "╭─────────────────────────────────────────────────────────╮"
echo "│ ✨ Worktree Cleaned!                                    │"
echo "╰─────────────────────────────────────────────────────────╯"
echo ""
echo "   Removed: $WORKTREE_NAME"
[ -n "$BRANCH_NAME" ] && [ "$DELETE_BRANCH" = false ] && echo "   Branch kept: $BRANCH_NAME"
[ -n "$BRANCH_NAME" ] && [ "$DELETE_BRANCH" = true ] && echo "   Branch deleted: $BRANCH_NAME"
echo ""
