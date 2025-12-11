# clean-worktree

When running this command - always skip riper-5-protocol no need to go over all those modes just execute right away.

You are a development workflow assistant helping clean up git worktrees.

## Context

Git worktrees allow you to have multiple working directories for a single repository. This command helps you remove worktrees and optionally delete their associated branches. By default, this command will always clean up the worktree.

## How to use this command

User will invoke: `@clean-worktree.md`

You MUST:

1. **Detect current project location and name**
   - Run `pwd` to capture the project root directory.
   - Extract the project name from the directory path (e.g., if path is `/path/to/my-project`, project name is `my-project`).
   - Calculate the parent directory (one level up from project root).
   - Determine the worktrees directory name as `worktrees-[project name]`.

2. **List available worktrees**
   - Run `git worktree list` to show all existing worktrees.
   - Display the list to the user for reference.

3. **Prompt for worktree to clean**
   - Ask the user: "Which worktree would you like to clean? (enter worktree path or branch name)"
   - Wait for user input.
   - Validate the input:
     - If user provides a path, check if it's a valid worktree path.
     - If user provides a branch name, find the worktree associated with that branch.
     - If invalid, ask again with validation rules.

4. **Identify the worktree and branch**
   - Determine the full worktree path:
     ```bash
     WORKTREE_INPUT="[user input from step 3]"
     # If input is a path, use it directly
     # If input is a branch name, find the worktree path from git worktree list
     ```
   - Identify the branch associated with the worktree:
     ```bash
     BRANCH_NAME=$(git -C "$WORKTREE_PATH" rev-parse --abbrev-ref HEAD)
     ```

5. **Prompt for cleanup method**
   - Ask the user: "How do you want to clean up the worktree?
     1. Careful (git worktree remove) - Git validates, checks for modifications, safer but slower
     2. Fast (rm -rf + prune) - Direct deletion, no checks, much faster (recommended for worktrees with node_modules)

   Enter '1' for careful, '2' for fast, or press Enter for default (fast)"
   - Wait for user input.
   - Default to option 2 (fast) if user presses Enter or provides no input.

6. **Prompt for branch deletion**
   - Ask the user: "Do you also want to delete the associated branch '$BRANCH_NAME'?
     1. No (default - keep the branch)
     2. Yes (delete the branch)

   Enter '1' to keep branch, '2' to delete branch, or press Enter for default (keep branch)"
   - Wait for user input.
   - Default to option 1 (keep branch) if user presses Enter or provides no input.

7. **Execute cleanup**
   - **If careful cleanup (option 1):**

     ```bash
     git worktree remove "$WORKTREE_PATH"
     # If fails with "contains modified files", try with --force:
     git worktree remove --force "$WORKTREE_PATH"
     # If still fails, inform user and suggest fast cleanup instead
     ```

   - **If fast cleanup (option 2 - RECOMMENDED):**

     ```bash
     rm -rf "$WORKTREE_PATH" && git worktree prune
     ```

   - **If user also wants to delete the branch:**

     ```bash
     git branch -D "$BRANCH_NAME"
     ```

   - If the command fails (e.g., worktree doesn't exist, branch is protected), report the error and stop.

8. **Report completion**
   - Confirm what was cleaned up (worktree, and branch if applicable).
   - Display the branch name that was associated with the worktree.
   - If branch was deleted, confirm deletion.

## Safety Notes

- By default, this command uses **fast cleanup** (rm -rf + prune) for better performance.
- The branch deletion is optional and requires explicit user confirmation.
- If a branch is the current branch in another worktree or is protected, deletion will fail with an error.

## Cleanup Methods Comparison

### Fast Cleanup (rm -rf + prune) - RECOMMENDED

**Advantages:**

- ⚡ **Much faster** (1-2 seconds vs 10-30 seconds with node_modules)
- Works even when worktree has modifications
- No Git validation overhead
- Direct filesystem deletion

**Use when:**

- Worktree has node_modules or many files
- You're sure you want to delete everything
- `git worktree remove` is too slow or failing

**Command:**

```bash
rm -rf "$WORKTREE_PATH" && git worktree prune
```

### Careful Cleanup (git worktree remove)

**Advantages:**

- ✅ Git validates the worktree state
- Safer if you're unsure about modifications
- Follows Git's official cleanup process

**Use when:**

- You want safety checks before deletion
- Worktree has few files (no node_modules)
- You want Git to handle everything

**Command:**

```bash
git worktree remove "$WORKTREE_PATH"  # or --force if needed
```

## Example Usage

If your project is located at `/Users/knamnguyen/Documents/0-Programming/my-project`:

**Example 1: Fast cleanup, keep branch (most common)**

1. User runs `@clean-worktree`
2. Selects worktree: `clerk-wxt`
3. Cleanup method: `2` (fast) or just press Enter
4. Delete branch: `1` (no) or just press Enter
5. Result:
   - Worktree deleted via `rm -rf` (~1-2 seconds)
   - Branch `clerk-wxt` kept for future use

**Example 2: Careful cleanup, delete branch**

1. User runs `@clean-worktree`
2. Selects worktree: `feat/temp-experiment`
3. Cleanup method: `1` (careful)
4. Delete branch: `2` (yes)
5. Result:
   - Worktree removed via `git worktree remove`
   - Branch `feat/temp-experiment` permanently deleted

**Example 3: Cleanup multiple worktrees (fast)**
If you want to clean multiple worktrees at once, you can manually run:

```bash
# Fast cleanup of multiple worktrees
rm -rf worktrees-my-project/{clerk-wxt,ai-comment-detect,stripe-multi-acc} && git worktree prune

# Then optionally delete branches
git branch -D clerk-wxt ai-comment-detect stripe-multi-acc
```
