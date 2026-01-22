# clean-worktree

When running this command - always skip riper-5-protocol no need to go over all those modes just execute right away.

You are a development workflow assistant helping clean up git worktrees.

## Context

Git worktrees allow you to have multiple working directories for a single repository. This command helps you remove worktrees and optionally delete their associated branches.

## How to use this command

User will invoke: `@clean-worktree`

You MUST execute these steps in order:

### 1. List Available Worktrees

```bash
echo "📂 Current worktrees:"
git worktree list
echo ""
```

### 2. Prompt for Worktree to Clean

Ask the user:

> **Which worktree would you like to clean?** (enter worktree name)

Wait for user input. Store as `WORKTREE_NAME`.

### 3. Prompt for Branch Deletion

Ask the user:

> **Do you also want to delete the branch?**
> 1. No (default - keep the branch)
> 2. Yes (delete the branch)

Default to option 1 (keep branch) if user presses Enter.

### 4. Run Clean Script

```bash
# If keeping branch:
./process/scripts/clean-worktree.sh "$WORKTREE_NAME"

# If deleting branch:
./process/scripts/clean-worktree.sh "$WORKTREE_NAME" --delete-branch
```

The script handles:
- Finding the worktree in both locations (worktrees-engagekit-turborepo and conductor/workspaces)
- Fast cleanup via `rm -rf` + `git worktree prune`
- Optional branch deletion

### 5. Report Completion

The script will output the completion summary.

## Example Usage

```
$ @clean-worktree

📂 Current worktrees:
/Users/.../engagekit-turborepo           b96073b [main]
/Users/.../worktrees-.../landing-page    b96073b [landing-page]
/Users/.../worktrees-.../ai-comment      cbc3cfa [ai-comment-detect]

Which worktree would you like to clean?
> landing-page

Do you also want to delete the branch?
1. No (default)
2. Yes
> 1

🧹 Cleaning worktree: landing-page
   Path: /Users/.../worktrees-.../landing-page
   Branch: landing-page

🗑️  Removing worktree directory...
   ✅ Directory removed
🔧 Pruning git worktree references...
   ✅ Git references pruned

╭─────────────────────────────────────────────────────────╮
│ ✨ Worktree Cleaned!                                    │
╰─────────────────────────────────────────────────────────╯

   Removed: landing-page
   Branch kept: landing-page
```

## Direct Script Usage

You can also run the script directly:

```bash
# Clean worktree, keep branch
./process/scripts/clean-worktree.sh landing-page

# Clean worktree and delete branch
./process/scripts/clean-worktree.sh landing-page --delete-branch
```

## Related

- **Sync script**: `process/scripts/sync-worktrees.sh` - sets up worktree environment
- **Add worktree**: `@add-worktree` - creates a new worktree
