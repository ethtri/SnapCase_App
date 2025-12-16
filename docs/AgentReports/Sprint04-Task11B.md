# Sprint04-Task11B — SOP controls rollout

## Scope & Files
- Applied Sprint04-Task11A audit controls across process docs.
- Updated `docs/PROJECT_MANAGEMENT.md` with worktree cap/stale retirement, stash review discipline, lint-config preflight guard, clean tree + branch enforcement, compare/PR URL logging, and doc-integrity gate.
- Updated `docs/TaskPipeline.md` preflight/DoD for worktree cap, 48h stash review/logging in `PROGRESS.md`, lint-config pull-only rule, clean-branch enforcement, diagnostics + compare URL logging, and doc-integrity checks.
- Updated `docs/PROMPT_TEMPLATE.md` preflight/guardrails/deliverables to match the new controls.
- Logged rollout in `PROGRESS.md` (Latest Updates).

## Verification
- Docs-only changes; no tests run.

## Follow-ups / Notes
- Repo currently lists more than three worktrees (one detached); follow the new cap/stale retirement rule before the next task.
- Stash created to keep the tree clean: `git stash push -m "Sprint04-Task11B preexisting PM_AGENT_PROMPT.md"` for pre-existing `docs/PM_AGENT_PROMPT.md`.
- Stash backlog is older than 48 hours; schedule an audit/retirement pass to meet the updated control.
- Push the branch and log the compare/PR URL in both this report and `PROGRESS.md` per the new control (compare URL to be added after push).
