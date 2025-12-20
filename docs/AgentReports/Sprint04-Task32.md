# Sprint04-Task32 - Task08 recovery

## Scope & Files
- Worked from `C:\Repos\SnapCase_App_task32` on branch `task/Sprint04-Task32-task08-recovery`.
- Restored Task08 save/resume pricing context from `wip/dirty-backup-20251219` (commit `c988d88`) scoped to:
  - `src/lib/design-context.ts`
  - `src/app/design/page.tsx`
  - `src/app/checkout/page.tsx`

## Verification
- `npm run preflight` (pass).
- `npm run lint` (pass).
- `npm run build` (pass).

## Deployment
- Preview: https://snapcase-m33zfqs65-snapcase.vercel.app
- Dev alias: https://dev.snapcase.ai -> https://snapcase-m33zfqs65-snapcase.vercel.app
- Rollback: `vercel alias set snapcase-ikedc1s8f-snapcase.vercel.app dev.snapcase.ai --scope snapcase`
- Alias verification: `vercel alias ls --scope snapcase --limit 100 | rg dev.snapcase.ai`
- HTTP check: `curl -I https://dev.snapcase.ai/design` (200).

## Diagnostics
- `Images/diagnostics/2025-12-20T02-12-34-390Z-dev-design-cachebust.png`
- `Images/diagnostics/task32-dev-head.txt`
- `Images/diagnostics/task32-dev-diagnostics.json`
- `Images/diagnostics/task32-dev-smoke.log` (run-mobile-live-smoke.mjs timed out waiting for design-helper-pill)
