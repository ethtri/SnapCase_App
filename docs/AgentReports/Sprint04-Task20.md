# Sprint04-Task20 - summary simplify

## Scope & Files
- Simplified the `/design` summary card to merge status + helper into a single chip row and surface only device/variant, finish (when available), and price. Removed design-state timestamps and other secondary fields while keeping CTA gating untouched (`src/app/design/page.tsx`).
- Kept prior shell improvements intact (change-device controls, skeleton/overlay) and applied snap cloud border, radius-xl, shadow-md, and space-5/6 padding for the refreshed card layout.

## Verification
- `npm run lint`
- `npm run build`
- Manual smoke: exercised `/design` on desktop + mobile (select device → continue) to confirm the status chip/helper renders with device/finish/price data and CTA states stay aligned; captured diagnostics below.

## Artifacts
- Diagnostics: Images/diagnostics/20251218T153607-design-summary-desktop.png
- Diagnostics: Images/diagnostics/20251218T153607-design-summary-mobile.png
- Compare/PR: https://github.com/ethtri/SnapCase_App/compare/main...task/Sprint04-Task20-summary-simplify
