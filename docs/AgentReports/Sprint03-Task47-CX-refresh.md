# Sprint03-Task47 - CX refresh and Printful tab lock

## Summary
- Hid the Printful Product tab by adding a host-side guard overlay (`data-testid="printful-product-guard"`) inside the EDM shell so the variant picker cannot be reopened while keeping the rest of the embed interactive.
- Reduced the iframe mask height/z-index to keep top controls visible and kept the variant lock enabled; loader/error states remain unchanged.
- Tightened customer-facing copy on `/design`, `/checkout`, and `/thank-you`, removing Flow/Scene labels, Printful/variant IDs, and blueprint callouts; device/price summaries now use Snapcase-first voice.

## Verification
- `npm run build`
- Smoke via local `next start` -> `http://localhost:3000/design` for visual regression and screenshots (embed requests still rely on remote Printful availability).

## Artifacts
- Before (dev alias): `Images/diagnostics/20251210T031700Z-before-design-desktop.png`, `Images/diagnostics/20251210T031700Z-before-design-mobile.png`
- After (local build): `Images/diagnostics/20251210T034229Z-after-design-desktop.png`, `Images/diagnostics/20251210T034229Z-after-design-mobile.png`
