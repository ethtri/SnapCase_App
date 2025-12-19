# Sprint04-Task23 - dev alias guard

## Scope & Files
- Added guarded alias helper `scripts/alias-dev.mjs` (clean git + branch gate, lint/build rerun, baseline prompt, rollback print, dry-run option).
- New runbook `docs/Deployment/Alias_Runbook.md`; updated guardrails in `docs/PROJECT_MANAGEMENT.md`, `docs/PROMPT_TEMPLATE.md`, `docs/TaskPipeline.md`; logged in `PROGRESS.md`.

## Verification
- Dry run (no alias change; executed via a temp copy while the branch was stashed clean to satisfy the guard): `node scripts/alias-dev.mjs --target https://snapcase-hwbcudj5f-snapcase.vercel.app --dry-run --allow-branch task/Sprint04-Task23-dev-alias-guard --yes`
  - Current dev target from `vercel inspect`: `https://snapcase-pgz7j4zcj-snapcase.vercel.app`; rollback `vercel alias set snapcase-pgz7j4zcj-snapcase.vercel.app dev.snapcase.ai --scope snapcase --yes`.
  - `npm run lint` ✔️; `npm run build` ✔️; baseline prompt acknowledged via `--yes`; alias command only printed (dry-run).
- Dev alias untouched; tree clean after pop.

## Notes / Follow-ups
- OneDrive worktree remains dirty from Task11A2; I briefly wrote the alias script there while patching, removed it immediately, and left the pre-existing dirt intact.
- Compare: https://github.com/ethtri/SnapCase_App/compare/main...task/Sprint04-Task23-dev-alias-guard
