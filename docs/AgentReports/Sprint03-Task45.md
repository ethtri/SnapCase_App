# Sprint03-Task45 - Sponsor refresh and live Printful flow

## Summary
- Enforced variant locking in the Printful embed (`lockVariant=true`, `isVariantSelectionDisabled=true`) and reordered `design_status` normalization so catalog variants surface first (CTA now unlocks on the Printful-valid state even when the raw payload lists extra IDs).
- Relaxed `/api/checkout` validation to log-but-allow requests that lack `templateId`/`templateStoreId`/`designImage` when Printful withholds template metadata, preventing false 400s once the design is guardrail-clean.
- Updated CSP connect directives to include Segment hosts (`cdn.segment.com`, `api.segment.io`, `cdn-settings.segment.com`) to keep telemetry unblocked.
- Deployed to `snapcase-qnb2d99br-snapcase.vercel.app` and re-aliased `https://dev.snapcase.ai` (Vercel whoami scope `snapcase` confirmed).

## Verification
- `npm run build`
- Live run on `https://dev.snapcase.ai/design` with a real upload (`tmp/task45-design.png`), CTA unlocked on Printful designValid=true, Checkout mock succeeded despite missing template metadata, and thank-you page rendered with persisted order snapshot (`order_id` `cs_live_b1A5dzZVYWR0OVUTkl0A8msXkgzm21KLKJPWJncI0Fh9WBujhUCaujp0D2`).

## Artifacts
- Screenshots: `Images/diagnostics/20251210T012645-design-desktop.png`, `Images/diagnostics/20251210T012645-checkout-desktop.png`, `Images/diagnostics/20251210T012645-thankyou-desktop.png`, `Images/diagnostics/20251210T012645-design-mobile.png`, `Images/diagnostics/20251210T012645-checkout-mobile.png`, `Images/diagnostics/20251210T012645-thankyou-mobile.png`.
- Analytics/Segment evidence: `Images/diagnostics/20251210T012645-analytics.json` (designValid=true on variant 17726; Segment preview empty because sink remains console but CSP now allows Segment hosts).

## Notes
- Prior WIP in `SnapCase_App_task45_run2` is stashed as `Task45 WIP stub editor + diagnostics`; leave intact. `tmp/task45-design.png` retained as the upload fixture for reruns.
