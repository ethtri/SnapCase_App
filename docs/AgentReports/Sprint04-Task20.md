# Sprint04-Task20 - summary simplify

## Scope & Files
- Rebased onto `task/Sprint04-Task18-restore-picker` to inherit the approved picker + design shell, then reapplied the simplified summary card (single status chip/helper + only device/variant, finish, price) while keeping CTA gating untouched (`src/app/design/page.tsx`).
- Kept Task17/Task18 shell improvements intact (change-device controls, skeleton/overlay, picker guard) and applied snap cloud border, radius-xl, shadow-md, and space-5/6 padding for the refreshed card layout.

## Verification
- `npm run lint`
- `npm run build`
- Manual smoke: exercised `/design` on desktop + mobile (select device + continue) to confirm the status chip/helper renders with device/finish/price data and CTA states stay aligned; captured diagnostics below.

## Artifacts
- Diagnostics (picker): `Images/diagnostics/20251218T155914-design-picker-desktop.png`, `Images/diagnostics/20251218T155914-design-picker-mobile.png`
- Diagnostics (designer + summary): `Images/diagnostics/20251218T155914-design-shell-desktop.png`, `Images/diagnostics/20251218T155914-design-shell-mobile.png`
- Preview URL (rebased): https://snapcase-pxrwcquta-snapcase.vercel.app
- Compare/PR: https://github.com/ethtri/SnapCase_App/compare/main...task/Sprint04-Task20-summary-simplify
