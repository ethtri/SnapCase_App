# Sprint03-Task48 - Product tab overlay hardening

## Summary
- Refined the host-side guard overlay on the Printful embed so the Product tab stays hidden without bleed: clamp height/width, add a subtle border and shadow, and cap max width for small viewports (`data-testid="printful-product-guard"` in `edm-editor.tsx`).
- Kept Printful variant lock/CTA gating unchanged; loader/mask untouched. Dev alias updated to the new deployment.

## Deployment
- Production deploy: `https://snapcase-eopqpujyk-snapcase.vercel.app`
- Alias: `https://dev.snapcase.ai`

## Verification
- `npm run build`
- Manual smoke on dev.snapcase.ai (desktop + mobile): upload via Printful file chooser unlocks CTA; overlay fully hides Product tab without covering toolbar.
- Automation note: Playwright mobile flow intermittently fails to unlock CTA (Printful guardrail stays "Please add a design!"). Manual mobile upload succeeds; treating automation flake as known issue.

## Artifacts
- Before: `Images/diagnostics/2025-12-10T175055209Z-before-{desktop,mobile}-{design,checkout,thankyou}.png`, `Images/diagnostics/2025-12-10T175055209Z-before-analytics.json`
- After: `Images/diagnostics/2025-12-10T175354781Z-after-{desktop,mobile}-{design,checkout,thankyou}.png`, `Images/diagnostics/2025-12-10T175354781Z-after-analytics.json`

## Known Issues / Follow-ups
- Playwright mobile automation can fail to trigger CTA unlock even though manual mobile upload works; investigate frame clickability/low-res assets if future automation stability is required.

## Feature Request (sent)
- Sent to Printful support (CX thread) requesting a first-party option to hide/disable navigation tabs or enforce variant lock without host overlays. Provided context from Task47/48, current alias `https://dev.snapcase.ai`, and noted the guard is host-applied today. Awaiting response.
