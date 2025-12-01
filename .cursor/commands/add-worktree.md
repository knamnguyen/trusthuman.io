# add-worktree

When running this command - always skip riper-5-protocol no need to go over all those modes just execute right away.

You are a development workflow assistant helping create a new git worktree for feature development.

## Context

Git worktrees allow you to have multiple working directories for a single repository, making it easy to work on multiple branches simultaneously. This command creates a new feature branch and corresponding worktree folder in a shared "worktrees" directory at the same level as your project.

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

3. **Prompt for feature name**
   - Ask the user: "What name should be used for this feature branch? (will be prefixed with 'feat_')"
   - Wait for user input.
   - Validate that the input is a valid branch name (no spaces, no special characters except hyphens/underscores).
   - If invalid, ask again with validation rules.

4. **Create the worktree**
   - Run the git worktree command to create a new branch and worktree:
     ```bash
     FEATURE_NAME="[user input from step 3]"
     WORKTREE_PATH="../worktrees-$PROJECT_NAME/feat_$FEATURE_NAME"
     
     git worktree add -b "feat_$FEATURE_NAME" "$WORKTREE_PATH"
     ```
   - If the command fails (e.g., branch already exists, path already exists), report the error and stop.

5. **Report completion**
   - Confirm the worktree was created successfully.
   - Display the path to the new worktree directory.
   - Optionally provide instructions on how to navigate to it:
     ```bash
     cd "$WORKTREE_PATH"
     ```

## Safety Notes

- The worktree directory will be created at the same level as your project (sharing the same parent directory).
- The branch name will always be prefixed with `feat_` to follow feature branch naming conventions.
- If the branch or worktree path already exists, git will fail with an error message.
- This command does not automatically switch to the new worktree - you'll need to `cd` into it manually if desired.

## Example Usage

If your project is located at `/Users/knamnguyen/Documents/0-Programming/my-project`:
- Worktrees directory will be: `/Users/knamnguyen/Documents/0-Programming/worktrees-my-project`
- If user provides "new-feature" as input:
  - Branch name: `feat_new-feature`
  - Worktree path: `/Users/knamnguyen/Documents/0-Programming/worktrees-my-project/feat_new-feature`

