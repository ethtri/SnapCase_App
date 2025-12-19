# Sprint04-Task22 - summary card polish + CTA tone

## Scope & Files
- Polished the `/design` summary card: removed the finish row, tightened spacing, and kept only status chip/helper, device, and price while preserving picker, shell layout, and CTA gating.
- Softened the not-ready CTA copy to “Add your design to continue”; all other CTA states unchanged.
- Touched: `src/app/design/page.tsx`.
- Baseline: `origin/task/Sprint04-Task21-summary-hotfix`.

## Verification
- `npm run lint`
- `npm run build`
- Manual `/design` smoke (preview): picker intact; designer loads; summary shows status + device + price (no finish row); not-ready CTA shows “Add your design to continue”; gating unchanged.

## Diagnostics
- Preview captures:  
  - `Images/diagnostics/20251219T023220Z-design-picker-desktop.png`  
  - `Images/diagnostics/20251219T023220Z-design-shell-desktop.png`  
  - `Images/diagnostics/20251219T023220Z-design-picker-mobile.png`  
  - `Images/diagnostics/20251219T023220Z-design-shell-mobile.png`

## Deployments
- Preview: https://snapcase-ikedc1s8f-snapcase.vercel.app
- Dev alias: unchanged (rollback target retained) https://snapcase-hwbcudj5f-snapcase.vercel.app
- Compare: https://github.com/ethtri/SnapCase_App/compare/task/Sprint04-Task21-summary-hotfix...task/Sprint04-Task22-summary-cta-polish

## Notes / Follow-ups
- Dev alias not updated pending sponsor approval; use the rollback target above if aliasing is requested later.
