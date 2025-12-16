# Prompt Template

Use this boilerplate at the top of each prompt to keep worktree discipline and deliverables consistent.

```
Context
- Worktree: <absolute path>
- Branch: task/SprintNN-TaskXX-<slug>

Preflight
- Run `git worktree list` (cap at 3; retire any worktree older than 7 days or detached) then `git status` (stop if another worktree is dirty or if rebase/merge is in progress).
- Confirm clean tree and correct task branch before editing; stash/commit unrelated files first.
- Copy `.vercel` from the main worktree if missing; run `vercel whoami`.
- Lint-config preflight: pull the config from `origin/main`; if lint prompts to create one or it is missing after pull, stop and report.

Guardrails
- One worktree per task; cap at 3; retire detached or stale (>7 days) worktrees before editing; no duplicate worktrees or resets.
- Stash discipline: do not touch others' stashes; new stashes use `git stash push -m "<TaskID> context"`, are reviewed/retired if older than 48 hours, and are logged in `PROGRESS.md`.
- No secrets committed to the repo; keep secrets in env only.

Tasks / DoD
- [list scoped tasks and Definition of Done for this prompt]

Deliverables
- AgentReport path: docs/AgentReports/<TaskID>.md
- `PROGRESS.md` entry updated
- `docs/TaskPipeline.md` updated if status changes
- Compare/PR URL logged in `PROGRESS.md` and the AgentReport after pushing the branch
- Tests to run/report: [...]
- Artifacts saved (e.g., Images/diagnostics/...): [...]
- Doc integrity check before handoff: AgentReport present, `PROGRESS.md` updated, TaskPipeline status correct, required docs/specs referenced, diagnostics cited
- Exit with `git status` clean
```
