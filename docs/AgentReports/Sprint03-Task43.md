# Sprint03-Task43 - Live masked `/design` smoke (Printful)

**Date:** 2025-12-09  
**Owner:** Codex (AI)  
**Scope:** Run a live Printful session against masked `/design` to ensure the overlay + SnapCase-first copy do not break the embedded designer; capture diagnostics/screenshots.

## What happened
- 2025-12-09: Rehydrated the Printful catalog/config/template registry helpers into the branch, rebuilt successfully, and deployed `snapcase-nb0bhjauq-snapcase.vercel.app` (aliased to `https://dev.snapcase.ai`). Live smoke now loads the Printful embed but keeps the CTA locked with the Printful guardrail message “Please add a design!” (designValid=false); captured desktop/mobile screenshots and diagnostics JSON plus console logs (Segment CSP warnings, Printful status events).
- 2025-12-08: Fixed the `/design` max-update-depth loop by only persisting design context when variant/pricing change, moved EDM callbacks to stable refs, and let `/api/checkout` fall back to `templateId` when `templateStoreId` cache entries are missing. CTA gating now mirrors Printful `designValid` only while carrying variant/pricing/template into checkout/order.
- 2025-12-08: `npm run build` and `npx playwright test tests/e2e/design-to-checkout.spec.ts` (via `scripts/run-playwright-server.mjs`) pass; new e2e captures land under the `23-04-14-215Z` timestamp set.
- 2025-12-08 live dev smoke (`https://dev.snapcase.ai/design`): Dev alias still serves the legacy build. Even after injecting test-hook design/pricing/template events, the guardrail shows the unsupported-variant copy and the CTA stays locked. Captured desktop/mobile screenshots plus diagnostics JSON for the legacy state.

## Artifacts
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
- Live dev snapshot shows CTA locked on the latest deployment because the Printful embed reports `designValid=false` (“Please add a design!”) even after the iframe loads.

## Notes / next steps
- Resolve why the Printful embed is not returning `designValid=true`/a saved template (likely needs a seeded design or picker interaction); re-run smoke to capture an unlocked CTA with real Printful telemetry.
- Segment CSP is blocking `cdn.segment.com` in the live capture; confirm CSP allows loading Analytics.js v2 or intentionally disable if not needed for smoke.
