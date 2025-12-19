# Sprint04-Task21 - summary card hotfix

## Scope & Files
- Simplified the Screen 2 design summary card on `/design` to only show the status chip + helper, device/finish, and price while keeping the Task18 shell/picker and CTA gating unchanged.
- Kept the picker/ActionBar/FAB logic and the Printful shell intact; no changes to APIs, deps, or env.
- Touched: `src/app/design/page.tsx`.

Deploy (preview): https://snapcase-pgz7j4zcj-snapcase.vercel.app
Branch: `task/Sprint04-Task21-summary-hotfix` (baseline `origin/task/Sprint04-Task18-restore-picker`)

## Verification
- `npm run lint`
- `npm run build`
- Manual smoke: `/design` picker renders with brand tabs/search/suggest + CTA gating; selecting a device moves to the designer view with the simplified summary (status chip, device, finish, price). Printful iframe still returns the existing load/availability state; CTA remains gated on designValid.

## Diagnostics
- Images/diagnostics/20251218T163146-design-picker-desktop.png
- Images/diagnostics/20251218T163146-design-shell-desktop.png
- Images/diagnostics/20251218T163146-design-picker-mobile.png
- Images/diagnostics/20251218T163146-design-shell-mobile.png

## Notes / Follow-ups
- Dev alias untouched (no alias change requested). Preview only.
- Printful iframe continues to surface the prior load state; CTA gating unchanged. If a new Printful session is required, rerun against the preview.
