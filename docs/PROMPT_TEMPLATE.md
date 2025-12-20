# Prompt Template

Use this boilerplate at the top of each prompt to keep worktree discipline and deliverables consistent.

```
Context
- Worktree: C:\Repos\SnapCase_App (no OneDrive)
- Branch: task/SprintNN-TaskXX-<slug>
- Role: Senior <domain> (e.g., Senior UX Engineer, Senior Frontend Engineer)

Preflight (MANDATORY - FAIL FAST IF ANY CHECK FAILS)
- Run `git worktree list` (cap at 3) then `git status`; **STOP IMMEDIATELY** if any worktree is dirty or if rebase/merge is in progress. If dirty: restore `Snapcase-Flow-Mockups/*` deletions from `origin/main`, delete or stash stray diagnostics/unrelated files, rerun `git status` before proceeding.
- **REQUIRED:** Run `npm run preflight` before editing. **IF PREFLIGHT FAILS, STOP AND FIX ISSUES BEFORE PROCEEDING.** Do not bypass or skip preflight checks.
- Treat `Snapcase-Flow-Mockups/*` as read-only; restore any deletions before editing.
- Copy `.vercel` from the main worktree if missing; run `vercel whoami`.
- Lint-config preflight: pull the config from `origin/main`; if lint prompts to create one or it is missing after pull, stop and report.
- Dev alias guard: do not repoint `dev.snapcase.ai` unless approved. Follow `docs/Deployment/Alias_Runbook.md` and use `node scripts/alias-dev.mjs` (dry-run if verifying) so rollback/compare links are logged.
- Diagnostics hygiene: keep only the final captures; commit relevant `Images/diagnostics/*` or clean them before exit.

Guardrails
- One worktree per task; no duplicate worktrees or resets; do not touch other worktrees.
- Do not touch others' stashes; new stashes use `git stash push -m "<TaskID> context"` and are logged in `PROGRESS.md`.
- No secrets committed to the repo; keep secrets in env only.
- Do not move `dev.snapcase.ai` without approval + runbook logging; use `scripts/alias-dev.mjs` with rollback noted.

Tasks / DoD
- [list scoped tasks and Definition of Done for this prompt]

Deliverables
- AgentReport path: docs/AgentReports/<TaskID>.md
- `PROGRESS.md` entry updated
- `docs/TaskPipeline.md` updated if status changes
- Compare/PR URL logged in `PROGRESS.md` and the AgentReport after pushing the branch
- Tests to run/report: [...]
- Artifacts saved (e.g., Images/diagnostics/...): [...]
- Exit with `git status` clean
```

