# Sprint03-Task49 - Mobile Playwright automation hardening

## Summary
- Reproduced the mobile Playwright failure on `https://dev.snapcase.ai/design`: the Printful embed returns `designValid=false` with `blockingIssues=["Please add a design!"]`, and the hidden file input never accepts a file in headless iPhone emulation. Console shows Printful RPC errors (`Template not found`) and template probe selecting the prior auto-* template ID.
- Added a live smoke harness `scripts/run-mobile-live-smoke.mjs` that runs with the iPhone 14 Pro device profile. The script attempts a real upload via the Printful dropzone/filechooser and, if the CTA stays locked, falls back to the built-in `__snapcaseTestHooks` to inject a ready design status, pricing update, and template save so checkout/thank-you can be exercised in CI-like runs.
- Captured fresh diagnostics for both the stuck CTA and the forced-unlock run; checkout and thank-you completed under the forced guardrail path. No redeploy; dev alias remains on `snapcase-eopqpujyk-snapcase.vercel.app`.

## Findings
- Printful mobile embed in headless Playwright does not surface a usable filechooser; `setInputFiles` leaves `files.length=0` and `design_status` stays `designValid=false`, `selectedVariantIds=[17726,16888]`, `variantMismatch=true`.
- Printful emits `rpcError` + `loadTemplateFailed` with `raw: "Template not found"` even though the probe reports `templateId=auto-*`, likely from prior automation saves; the CTA never unlocks without a forced guardrail event.
- Manual mobile upload still required for true end-to-end validation; automation now relies on test hooks to unblock the flow after a failed upload attempt.

## Changes
- Added `scripts/run-mobile-live-smoke.mjs`: live smoke runner (iPhone 14 Pro profile) that:
  - clears storage, loads `/design`, and attempts a real upload via filechooser.
  - if `designValid` remains false, forces `triggerDesignStatusUpdate`/`triggerPricingStatusUpdate`/`triggerTemplateSaved` through `__snapcaseTestHooks` to enable the CTA.
  - drives checkout and thank-you, capturing mobile screenshots/diagnostics.

## Artifacts
- Stuck CTA after upload attempts: `Images/diagnostics/2025-12-10T18-56-41-990Z-mobile-upload.png`
- Forced-unlock smoke (fallback path): `Images/diagnostics/2025-12-10T19-32-49-526Z-design-mobile.png`, `...-checkout-mobile.png`, `...-thankyou-mobile.png`
- Script JSON output includes upload attempt status (filechooser: false, error) and latest `edm_design_status`.

## Tests
- `npm run build`
- `node scripts/run-mobile-live-smoke.mjs` (upload attempt fails; CTA unlocked via test hooks fallback)

## Residual Risk / Next Steps
- Real mobile upload remains non-automatable in headless Playwright; rely on manual upload or headful run until Printful exposes a reliable mobile filechooser hook.
- Printful template probe still surfaces `Template not found` despite cached template IDs; may require clearing server-side template cache or vendor assistance.
- If stability is required in CI, keep the fallback hook path enabled; document that it simulates a cleared guardrail rather than proving a live upload.
