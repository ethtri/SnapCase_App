# Sprint03-Task43 - Live masked `/design` smoke (Printful)

**Date:** 2025-12-09  
**Owner:** Codex (AI)  
**Scope:** Run a live Printful session against masked `/design` to ensure the overlay + SnapCase-first copy do not break the embedded designer; capture diagnostics/screenshots.

## What happened
- 2025-12-09 (rerun with live design attempt): Uploaded a local PNG into the Printful embed on `https://dev.snapcase.ai/design` (deployment `snapcase-nb0bhjauq-snapcase.vercel.app`). Printful accepted the file upload (PFUploader logs processed) but immediately returned `designValid=false` with the guardrail “Please add a design!” and a 27-item `selectedVariantIds` array of non-catalog variants; CTA stayed locked on both desktop and mobile. Console captured PFUploader initialization errors and CSP blocks for `cdn.segment.com` (expected).
- 2025-12-09 (headless retry with GPU flags): Attempted another upload in Playwright (desktop + mobile) with WebGL/GPU flags; upload succeeded but Printful still returned `designValid=false` and the CTA remained locked (“Please add a design!”). Captured fresh diagnostics under the `03-36-42-931Z` timestamp.
- 2025-12-09: Rehydrated the Printful catalog/config/template registry helpers into the branch, rebuilt successfully, and deployed `snapcase-nb0bhjauq-snapcase.vercel.app` (aliased to `https://dev.snapcase.ai`). Live smoke now loads the Printful embed but keeps the CTA locked with the Printful guardrail message “Please add a design!” (designValid=false); captured desktop/mobile screenshots and diagnostics JSON plus console logs (Segment CSP warnings, Printful status events).
- 2025-12-08: Fixed the `/design` max-update-depth loop by only persisting design context when variant/pricing change, moved EDM callbacks to stable refs, and let `/api/checkout` fall back to `templateId` when `templateStoreId` cache entries are missing. CTA gating now mirrors Printful `designValid` only while carrying variant/pricing/template into checkout/order.
- 2025-12-08: `npm run build` and `npx playwright test tests/e2e/design-to-checkout.spec.ts` (via `scripts/run-playwright-server.mjs`) pass; new e2e captures land under the `23-04-14-215Z` timestamp set.
- 2025-12-08 live dev smoke (`https://dev.snapcase.ai/design`): Dev alias still serves the legacy build. Even after injecting test-hook design/pricing/template events, the guardrail shows the unsupported-variant copy and the CTA stays locked. Captured desktop/mobile screenshots plus diagnostics JSON for the legacy state.

## Artifacts
- Live dev (2025-12-09 redeploy + design upload attempt; CTA locked on Printful “Please add a design!”):
  - `Images/diagnostics/task43-design-desktop-2025-12-09T01-41-41-880Z.png`
  - `Images/diagnostics/task43-design-mobile-2025-12-09T01-41-41-880Z.png`
  - `Images/diagnostics/task43-edm-live-2025-12-09T01-41-41-880Z.json` (actions include PNG upload; Printful designStatus: `designValid=false`, errors `["Please add a design!"]`, `selectedVariantIds` length 27; PFUploader init errors + Segment CSP warnings)
- Live dev (2025-12-09 headless retry with GPU flags; still locked):
  - `Images/diagnostics/task43-design-desktop-2025-12-09T03-36-42-931Z.png`
  - `Images/diagnostics/task43-design-mobile-2025-12-09T03-36-42-931Z.png`
  - `Images/diagnostics/task43-edm-live-2025-12-09T03-36-42-931Z.json` (upload attempted; CTA locked, guardrail “Please add a design!”, `designValid=false`)
- Live dev manual evidence (user upload in real browser):
  - `Images/diagnostics/task43-design-desktop-2025-12-09T20-08-25-user.png` (user-reported: image upload succeeded and rendering looks correct; CTA state not captured in this asset)
  - `Images/diagnostics/task43-checkout-desktop-2025-12-09T20-08-25-user.png` (user walked through to checkout with variant 16888 / SNAP_IP15PRO_SNAP; CTA unlocked in browser, price $34.99 + $4.99 shipping)
- Live dev (2025-12-09 redeploy: `https://snapcase-nb0bhjauq-snapcase.vercel.app` via `dev.snapcase.ai`; CTA locked on Printful “Please add a design!”):
  - `Images/diagnostics/task43-design-desktop-2025-12-09T00-25-44-907Z.png`
  - `Images/diagnostics/task43-design-mobile-2025-12-09T00-25-44-907Z.png`
  - `Images/diagnostics/task43-edm-live-2025-12-09T00-25-44-907Z.json`
- Live dev (legacy build still locked):
  - `Images/diagnostics/task43-design-desktop-2025-12-08T23-15-05-385Z.png`
  - `Images/diagnostics/task43-design-mobile-2025-12-08T23-15-05-385Z.png`
  - `Images/diagnostics/task43-edm-live-2025-12-08T23-15-05-385Z.json`
- Latest e2e pass (guardrail/checkout/thank-you):
  - `Images/diagnostics/design-messaging-2025-12-08T23-04-14-215Z.png`
  - `Images/diagnostics/design-messaging-mobile-2025-12-08T23-04-14-215Z.png`
  - `Images/diagnostics/checkout-cancel-banner-2025-12-08T23-04-14-215Z.png`
  - `Images/diagnostics/checkout-desktop-review-2025-12-08T23-04-14-215Z.png`
  - `Images/diagnostics/checkout-mobile-review-2025-12-08T23-04-14-215Z.png`
  - `Images/diagnostics/thank-you-desktop-2025-12-08T23-04-14-215Z.png`
  - `Images/diagnostics/thank-you-mobile-2025-12-08T23-04-14-215Z.png`
- Prior live runs (CTA locked on non-catalog variants):
  - `Images/diagnostics/task43-design-desktop-2025-12-08T17-52-14-609Z.png`
  - `Images/diagnostics/task43-design-mobile-2025-12-08T17-52-14-609Z.png`
  - `Images/diagnostics/task43-edm-live-2025-12-08T17-52-14-609Z.json`
  - Earlier 07-12Z/07-14Z/05-13Z captures remain in the diagnostics folder for reference.

## Verification
- `npm run build`
- Playwright e2e remained green from the 2025-12-08 run; not re-run during this smoke.
- Live dev snapshots (including the Playwright upload attempts) show CTA locked with `designValid=false`; manual browser run (user) successfully placed a design and reached checkout with CTA unlocked, but we lack a diagnostics JSON from that unlocked session.

## Notes / next steps
- Diagnose why Printful returns `designValid=false` after uploads in automation (PFUploader init errors, 27 non-catalog variants) and how to force a valid placement/template save; capture diagnostics JSON from an unlocked session to close DoD.
- Segment CSP is blocking `cdn.segment.com` in the live capture (expected for this host); no change unless analytics is required for validation.
