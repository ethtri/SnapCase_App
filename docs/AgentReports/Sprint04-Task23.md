# Sprint04-Task23 - dev alias guard

## Scope & Files
- Added guarded alias helper `scripts/alias-dev.mjs` (clean git + branch gate, lint/build rerun, baseline prompt, rollback print, dry-run option).
- New runbook `docs/Deployment/Alias_Runbook.md`; updated guardrails in `docs/PROJECT_MANAGEMENT.md`, `docs/PROMPT_TEMPLATE.md`, `docs/TaskPipeline.md`; logged in `PROGRESS.md`.

## Verification
- Live alias run (temp copy to keep git clean): `node scripts/alias-dev.mjs --target https://snapcase-hwbcudj5f-snapcase.vercel.app --allow-branch task/Sprint04-Task23-dev-alias-guard --yes`
  - Current dev target before swap: `https://snapcase-pgz7j4zcj-snapcase.vercel.app`; rollback: `vercel alias set snapcase-pgz7j4zcj-snapcase.vercel.app dev.snapcase.ai --scope snapcase`.
  - `npm run lint` ✔️; `npm run build` ✔️; baseline prompt acknowledged via `--yes`; alias applied to dev.
- Dry-run also exercised earlier (same target/flags) to prove guards.
- Verification: `curl -I https://dev.snapcase.ai/design` → 200; screenshot `Images/diagnostics/20251218T204958-dev-alias-design.png` (headless Edge).

## Notes / Follow-ups
- OneDrive worktree remains dirty from Task11A2; left untouched during this run (script executed from a clean non-OneDrive worktree via temp copy to satisfy the clean-tree gate).
- Compare: https://github.com/ethtri/SnapCase_App/compare/main...task/Sprint04-Task23-dev-alias-guard
