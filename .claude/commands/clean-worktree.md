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

5. **Prompt for cleanup options**
   - Ask the user: "Do you want to:
     1. Prune the worktree only (default - removes worktree but keeps branch)
     2. Prune the worktree AND delete the associated branch

   Enter '1' for worktree only, '2' for worktree and branch, or press Enter for default (worktree only)"
   - Wait for user input.
   - Default to option 1 (worktree only) if user presses Enter or provides no input.

6. **Execute cleanup**
   - By default, always clean up the worktree:
     ```bash
     git worktree remove "$WORKTREE_PATH"
     ```
   - If user selected option 2 (worktree and branch):
     ```bash
     git worktree remove "$WORKTREE_PATH"
     git branch -D "$BRANCH_NAME"
     ```
   - If the command fails (e.g., worktree doesn't exist, branch is protected), report the error and stop.

7. **Report completion**
   - Confirm what was cleaned up (worktree, and branch if applicable).
   - Display the branch name that was associated with the worktree.
   - If branch was deleted, confirm deletion.

## Safety Notes

- By default, this command will always clean up the worktree (remove it).
- The branch deletion is optional and requires explicit user confirmation.
- If a branch is the current branch in another worktree or is protected, deletion will fail with an error.
- This command does not automatically prune stale worktree references - use `git worktree prune` separately if needed.

## Example Usage

If your project is located at `/Users/knamnguyen/Documents/0-Programming/my-project`:

- Worktrees directory will be: `/Users/knamnguyen/Documents/0-Programming/worktrees-my-project`
- If user provides "feat/browser-automation" as input:
  - Finds worktree at: `/Users/knamnguyen/Documents/0-Programming/worktrees-my-project/feat/browser-automation`
  - Removes the worktree
  - Optionally deletes the branch `feat/browser-automation` if user selects option 2
