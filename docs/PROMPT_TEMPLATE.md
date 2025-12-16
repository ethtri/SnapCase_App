# Prompt Template

Use this boilerplate at the top of each prompt to keep worktree discipline and deliverables consistent.

```
Context
- Worktree: <absolute path>
- Branch: task/SprintNN-TaskXX-<slug>

Preflight
- Run `git worktree list` then `git status -sb`. If dirty or rebase/merge is active, stop and report (do not clean unless the prompt says so).
- Copy `.vercel` from the main worktree if missing; run `vercel whoami`.
- Confirm you will not touch other worktrees or stashes.

Guardrails
- One worktree per task; no duplicate worktrees or resets.
- Do not touch others' stashes; new stashes use `git stash push -m "<TaskID> context"` and are logged in `PROGRESS.md`.
- No secrets committed to the repo; keep secrets in env only.
- Lint/config: if ESLint config is missing or mismatched, restore from `origin/main` (e.g., `git checkout origin/main -- .eslintrc* package.json package-lock.json`) and stop if still missing. Do not scaffold new configs.

Tasks / DoD
- [list scoped tasks and Definition of Done for this prompt]

Deliverables
- AgentReport path: docs/AgentReports/<TaskID>.md
- `PROGRESS.md` entry updated
- `docs/TaskPipeline.md` updated if status changes
- Tests to run/report: [...]
- Artifacts saved (e.g., Images/diagnostics/... or state "N/A (docs-only)")
- Record start/end `git status -sb` in the AgentReport; exit with `git status` clean
```
