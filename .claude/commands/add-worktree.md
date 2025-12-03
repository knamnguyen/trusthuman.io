# add-worktree

When running this command - always skip riper-5-protocol no need to go over all those modes just execute right away.

You are a development workflow assistant helping create a new git worktree for feature development.

## Context

Git worktrees allow you to have multiple working directories for a single repository, making it easy to work on multiple branches simultaneously. This command links a worktree to an existing branch or creates a new branch from main, then creates a corresponding worktree folder in a shared "worktrees" directory at the same level as your project.

## How to use this command

User will invoke: `@add-worktree.md`

You MUST:

1. **Detect current project location and name**
   - Run `pwd` to capture the project root directory.
   - Extract the project name from the directory path (e.g., if path is `/path/to/my-project`, project name is `my-project`).
   - Calculate the parent directory (one level up from project root).
   - Determine the worktrees directory name as `worktrees-[project name]`.

2. **Create worktrees directory if it doesn't exist**
   - Check if `../worktrees-[project name]` directory exists.
   - If it doesn't exist, create it:

     ```bash
     PROJECT_ROOT="$(pwd)"
     PROJECT_NAME="$(basename "$PROJECT_ROOT")"
     PARENT_DIR="$(dirname "$PROJECT_ROOT")"
     WORKTREES_DIR="$PARENT_DIR/worktrees-$PROJECT_NAME"

     if [ ! -d "$WORKTREES_DIR" ]; then
       mkdir -p "$WORKTREES_DIR"
       echo "Created worktrees directory: $WORKTREES_DIR"
     fi
     ```

3. **Prompt for branch name**
   - Ask the user: "Which branch would you like to link this worktree to? (enter branch name)"
   - Wait for user input.
   - Validate that the input is a valid branch name (no spaces, no special characters except hyphens/underscores/slashes).
   - If invalid, ask again with validation rules.

4. **Check if branch exists and create worktree**
   - Check if the branch exists:
     ```bash
     BRANCH_NAME="[user input from step 3]"
     if git show-ref --verify --quiet refs/heads/"$BRANCH_NAME"; then
       echo "Branch $BRANCH_NAME exists"
       BRANCH_EXISTS=true
     else
       echo "Branch $BRANCH_NAME does not exist"
       BRANCH_EXISTS=false
     fi
     ```
   - If branch exists:
     - Link worktree to existing branch:
       ```bash
       WORKTREE_PATH="../worktrees-$PROJECT_NAME/$BRANCH_NAME"
       git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
       ```
   - If branch does not exist:
     - Create new branch from main and link worktree:
       ```bash
       WORKTREE_PATH="../worktrees-$PROJECT_NAME/$BRANCH_NAME"
       git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" main
       ```
   - Note: The worktree folder name will use the exact branch name provided by the user (no prefixing or modification).
   - If the command fails (e.g., worktree path already exists, branch is already checked out elsewhere), report the error and stop.

5. **Report completion**
   - Confirm the worktree was created successfully.
   - Display the path to the new worktree directory.
   - Display which branch it's linked to.
   - Optionally provide instructions on how to navigate to it:
     ```bash
     cd "$WORKTREE_PATH"
     ```

## Safety Notes

- The worktree directory will be created at the same level as your project (sharing the same parent directory).
- The worktree folder name will match the exact branch name provided (no modifications).
- If the branch already exists, the worktree will be linked to that branch.
- If the branch doesn't exist, a new branch will be created from main and the worktree will be linked to it.
- If the worktree path already exists, git will fail with an error message.
- This command does not automatically switch to the new worktree - you'll need to `cd` into it manually if desired.

## Example Usage

If your project is located at `/Users/knamnguyen/Documents/0-Programming/my-project`:

- Worktrees directory will be: `/Users/knamnguyen/Documents/0-Programming/worktrees-my-project`
- If user provides "feat/browser-automation" as input:
  - Branch name: `feat/browser-automation`
  - Worktree path: `/Users/knamnguyen/Documents/0-Programming/worktrees-my-project/feat/browser-automation`
  - If branch exists: links to existing branch
  - If branch doesn't exist: creates new branch from main
