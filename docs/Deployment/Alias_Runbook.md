# dev.snapcase.ai Alias Runbook

Use this guard when promoting `dev.snapcase.ai`. It keeps the alias on approved builds (main or sponsor-approved branch) and records a rollback path before any change.

## Pre-alias checklist
- Clean git status; no rebase/merge in progress; other worktrees must be clean.
- Branch is `main` or a sponsor-approved branch (pass `--allow-branch <name>` if the approved branch is not `main`).
- Rerun `npm run lint` and `npm run build` on the branch you are promoting.
- Confirm Screens 1/2 match the approved baseline (Task21) and checkout/thank-you still align.
- Fetch the current dev target for rollback: `vercel inspect dev.snapcase.ai --scope snapcase` (note the `url` value), then craft the rollback command `vercel alias set <current-target> dev.snapcase.ai --scope snapcase`.

## Command
- Promote (guarded): `node scripts/alias-dev.mjs --target https://<preview>.vercel.app`
  - Optional: `--dry-run` (exercise all guards but skip alias), `--scope <team>` (default `snapcase`), `--allow-branch <approved-branch>` to permit a sponsor-approved branch, `--yes` to auto-ack the baseline prompt.
- Rollback: use the target reported by `vercel inspect dev.snapcase.ai`, e.g., `vercel alias set snapcase-pgz7j4zcj-snapcase.vercel.app dev.snapcase.ai --scope snapcase`.

## Rules
- Do not point `dev.snapcase.ai` at unapproved previews. Keep the alias on `main` or the last sponsor-approved branch; use previews for initial sponsor tests until approval.
- Always log the compare/PR URL and the current/rollback targets in `PROGRESS.md` and the relevant AgentReport after a promotion.
- If lint/build fails or the baseline check cannot be confirmed, stop and fix before retrying. Do not override the guards to force the alias.
