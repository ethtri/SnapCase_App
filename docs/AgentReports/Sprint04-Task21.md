# Sprint04-Task21 - summary card hotfix

## Scope & Files
- Simplified the Screen 2 design summary card on `/design` to only show the status chip + helper, device/finish, and price while keeping the Task18 shell/picker and CTA gating unchanged.
- Kept the picker/ActionBar/FAB logic and the Printful shell intact; no changes to APIs, deps, or env.
- Touched: `src/app/design/page.tsx`.

Deploy (preview): https://snapcase-pgz7j4zcj-snapcase.vercel.app
Compare: https://github.com/ethtri/SnapCase_App/compare/task/Sprint04-Task18-restore-picker...task/Sprint04-Task21-summary-hotfix
Branch: `task/Sprint04-Task21-summary-hotfix` (baseline `origin/task/Sprint04-Task18-restore-picker`)

## Verification
- `npm run lint`
- `npm run build`
- Manual smoke: `/design` picker renders with brand tabs/search/suggest + CTA gating; selecting a device moves to the designer view with the simplified summary (status chip, device, finish, price). Printful iframe still returns the existing load/availability state; CTA remains gated on designValid.
- Alias updated for sponsor testing: `vercel alias set https://snapcase-pgz7j4zcj-snapcase.vercel.app dev.snapcase.ai --scope snapcase`; rollback target kept on hand: https://snapcase-hwbcudj5f-snapcase.vercel.app.
- Dev verification: `curl -I https://dev.snapcase.ai/design` -> 200; manual desktop/mobile `/design` loads picker (Task18 intact), designer view, simplified summary, CTA gating intact.

## Diagnostics
- Images/diagnostics/20251218T174308-design-picker-desktop.png (dev alias)
- Images/diagnostics/20251218T174308-design-shell-desktop.png (dev alias)
- Images/diagnostics/20251218T174308-design-picker-mobile.png (dev alias)
- Images/diagnostics/20251218T174308-design-shell-mobile.png (dev alias)

## Notes / Follow-ups
- Dev alias now points to the Task21 deploy for sponsor testing (see verification above); rollback URL retained if needed.
- Printful iframe continues to surface the prior load state; CTA gating unchanged. If a new Printful session is required, rerun against the preview/dev alias.
