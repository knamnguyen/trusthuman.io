# merge-worktree

When running this command - always skip riper-5-protocol no need to go over all those modes just execute right away.

You are a development workflow assistant helping merge a git worktree into main and clean up the worktree.

## Context

After completing work in a feature worktree, this command helps you merge the changes back into the main branch and clean up by removing the worktree and deleting the associated branch locally. This keeps your repository organized and prevents accumulation of completed feature branches.

## How to use this command

User will invoke: `@merge-worktree.md`

You MUST:

1. **Detect current project location and name**
   - Run `pwd` to capture the project root directory.
   - Ensure you are in the main project directory (not in a worktree).
   - Extract the project name from the directory path.
   - Calculate the parent directory and determine the worktrees directory name as `worktrees-[project name]`.

2. **List available worktrees**
   - Run `git worktree list` to get all existing worktrees.
   - Filter to show only worktrees in the `worktrees-[project name]` directory.
   - Display them in a numbered list for the user to choose from:
     ```bash
     PROJECT_ROOT="$(pwd)"
     PROJECT_NAME="$(basename "$PROJECT_ROOT")"
     PARENT_DIR="$(dirname "$PROJECT_ROOT")"
     WORKTREES_DIR="$PARENT_DIR/worktrees-$PROJECT_NAME"
     
     git worktree list | grep "$WORKTREES_DIR" || echo "No worktrees found in $WORKTREES_DIR"
     ```
   - Extract branch names associated with each worktree path.

3. **Prompt for worktree selection**
   - Ask the user: "Which worktree would you like to merge? (enter the feature name without 'feat_' prefix, or the full branch name)"
   - Wait for user input.
   - If user provides just the feature name (e.g., "trial-feat"), construct the full branch name as `feat_[name]`.
   - If user provides full branch name, use it as-is.
   - Validate that the branch/worktree exists. If not found, report error and stop.

4. **Ensure we're on main branch**
   - Check current branch: `git branch --show-current`
   - If not on main, switch to main: `git checkout main` or `git switch main`
   - Pull latest changes: `git pull` (optional, but recommended)

5. **Merge the branch into main**
   - Merge the feature branch into main:
     ```bash
     BRANCH_NAME="[full branch name from step 3]"
     git merge "$BRANCH_NAME"
     ```
   - If merge conflicts occur, report them and stop (user must resolve manually).
   - If merge is successful, proceed to next step.

6. **Remove the worktree**
   - Remove the worktree using git worktree remove:
     ```bash
     WORKTREE_PATH="[path to worktree from step 3]"
     git worktree remove "$WORKTREE_PATH"
     ```
   - If removal fails (e.g., worktree has uncommitted changes), report the error and stop.
   - The user may need to commit or stash changes in the worktree before removal.

7. **Delete the branch locally**
   - After successful merge and worktree removal, delete the local branch:
     ```bash
     git branch -d "$BRANCH_NAME"
     ```
   - Use `-d` (safe delete) which prevents deletion of unmerged branches. If user wants to force delete, they can do it manually with `-D`.
   - If deletion fails (branch not fully merged), report the error. User may need to use `-D` to force delete.

8. **Report completion**
   - Confirm the merge was successful.
   - Confirm the worktree was removed.
   - Confirm the branch was deleted.
   - Display summary of what was done.

## Safety Notes

- This command only deletes the local branch, not the remote branch (if it exists).
- If there are merge conflicts, the command stops and requires manual resolution.
- If the worktree has uncommitted changes, removal will fail and require user action.
- The branch deletion uses `-d` (safe delete) which requires the branch to be fully merged.
- Always ensure you're on the main branch before merging.

## Error Handling

- **Worktree not found**: Stop and report "Worktree not found: [path]"
- **Merge conflicts**: Stop and report "Merge conflicts detected. Please resolve manually and run the merge again."
- **Worktree removal failed**: Stop and report the error (likely uncommitted changes).
- **Branch deletion failed**: Report warning but continue (branch may not be fully merged - user can force delete if needed).

## Example Usage

If your project is located at `/Users/knamnguyen/Documents/0-Programming/my-project`:
- Worktrees directory: `/Users/knamnguyen/Documents/0-Programming/worktrees-my-project`
- Available worktrees: `feat_trial-feat`, `feat_new-feature`
- User input: "trial-feat"
- Process:
  1. Merge `feat_trial-feat` into `main`
  2. Remove worktree at `../worktrees-my-project/feat_trial-feat`
  3. Delete local branch `feat_trial-feat`

