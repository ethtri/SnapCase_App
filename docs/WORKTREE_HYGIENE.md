# Worktree Hygiene (Lightweight Controls)

- **Check before you add:** Run `git worktree list` before starting. If a worktree already exists for the branch, reuse it. If it is dirty, stop and summarize the diffs instead of creating a duplicate.
- **Naming convention:** When a new worktree is required, name it predictably (e.g., `SnapCase_App_task45`) so others can find it.
- **No silent resets:** Do not delete, reset, or overwrite an existing worktree without explicit approval. If you need to park changes, use `git stash push -m "<TaskID> context"` and log the stash in `PROGRESS.md`.
- **Preflight ritual:** Every prompt should state the branch and expected worktree path, and require `git status` both before and after. If the worktree is dirty, report it and wait for guidance.
- **Handoff note:** At the end of a run, note in `PROGRESS.md` the active worktree path (if any), any stashes created, and whether the tree is clean. This keeps the next agent from guessing or cloning duplicate worktrees.
