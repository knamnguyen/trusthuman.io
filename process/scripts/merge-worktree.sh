#!/bin/bash
#
# merge-worktree.sh
# Merge current worktree branch into main and clean up
#
# Run from within a worktree (e.g., Conductor workspace):
#   /Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/process/scripts/merge-worktree.sh
#
# What it does:
# 1. Detects current branch and worktree path
# 2. Checks for uncommitted changes (fails if any)
# 3. Switches to main repo
# 4. Pulls latest main
# 5. Merges the feature branch into main
# 6. Removes the worktree
# 7. Deletes the local branch

set -e

# Get current worktree info
WORKTREE_PATH="$(pwd)"
WORKTREE_NAME="$(basename "$WORKTREE_PATH")"
BRANCH_NAME="$(git branch --show-current)"

# Main repo location
MAIN_REPO="/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo"

echo "🔀 Merge Worktree: $WORKTREE_NAME"
echo "   Branch: $BRANCH_NAME"
echo "   Path: $WORKTREE_PATH"
echo ""

# Safety check: Don't run from main repo
if [ "$WORKTREE_PATH" = "$MAIN_REPO" ]; then
  echo "❌ Error: This script should be run from a worktree, not the main repo"
  exit 1
fi

# Safety check: Don't merge main into main
if [ "$BRANCH_NAME" = "main" ] || [ "$BRANCH_NAME" = "master" ]; then
  echo "❌ Error: Cannot merge main/master branch"
  exit 1
fi

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ Error: Uncommitted changes detected in worktree"
  echo ""
  echo "   Please commit or stash your changes first:"
  echo "   git add . && git commit -m 'your message'"
  echo ""
  git status --short
  exit 1
fi

# Check for untracked files (warning only)
UNTRACKED=$(git ls-files --others --exclude-standard)
if [ -n "$UNTRACKED" ]; then
  echo "⚠️  Warning: Untracked files detected (will be left behind):"
  echo "$UNTRACKED" | head -5
  if [ "$(echo "$UNTRACKED" | wc -l)" -gt 5 ]; then
    echo "   ... and more"
  fi
  echo ""
fi

# Step 1: Go to main repo and checkout main
echo "📍 Switching to main repo..."
cd "$MAIN_REPO"

echo "🔄 Checking out main branch..."
git checkout main

# Step 2: Merge the feature branch
echo ""
echo "🔀 Merging $BRANCH_NAME into main..."
if git merge "$BRANCH_NAME" --no-edit; then
  echo "   ✅ Merge successful"
else
  echo ""
  echo "❌ Merge conflicts detected!"
  echo ""
  echo "   Resolve conflicts in: $MAIN_REPO"
  echo "   Then run:"
  echo "     git add . && git commit"
  echo ""
  echo "   To abort the merge:"
  echo "     git merge --abort"
  echo ""
  exit 1
fi

# Step 3: Remove the worktree (DISABLED - keeping worktrees for continued work)
# echo ""
# echo "🗑️  Removing worktree..."
# if git worktree remove "$WORKTREE_PATH" --force; then
#   echo "   ✅ Worktree removed"
# else
#   echo "   ⚠️  Could not remove worktree automatically"
#   echo "   Run manually: git worktree remove \"$WORKTREE_PATH\" --force"
# fi

# Step 4: Delete the local branch (DISABLED - keeping branches for reference)
# echo ""
# echo "🗑️  Deleting local branch..."
# if git branch -d "$BRANCH_NAME" 2>/dev/null; then
#   echo "   ✅ Branch deleted"
# else
#   # Try force delete if safe delete fails
#   if git branch -D "$BRANCH_NAME" 2>/dev/null; then
#     echo "   ✅ Branch force-deleted"
#   else
#     echo "   ⚠️  Could not delete branch (may already be deleted)"
#   fi
# fi

# Step 5: Prune worktree references (DISABLED)
# git worktree prune

echo ""
echo "╭─────────────────────────────────────────────────────────╮"
echo "│ ✨ Merge Complete!                                      │"
echo "╰─────────────────────────────────────────────────────────╯"
echo ""
echo "   Merged: $BRANCH_NAME → main"
echo "   Worktree kept: $WORKTREE_PATH"
echo "   Branch kept: $BRANCH_NAME"
echo ""
echo "   You are now in: $MAIN_REPO (main branch)"
echo ""
echo "   To push to remote:"
echo "     git push"
echo ""
echo "   To manually clean up later:"
echo "     git worktree remove \"$WORKTREE_PATH\" --force"
echo "     git branch -d $BRANCH_NAME"
echo ""
