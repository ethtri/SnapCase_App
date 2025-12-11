# Sprint03-Task52 – Variant sync bugfix

## Summary
- Ensured the Printful embed locks to the chosen device by handing the catalog model name into `preselectedSizes` (with variant-id fallback) and passing it through `buildPrintfulConfig`.
- Captured the variant ids reported by Printful in design status, surfaced them in diagnostics/analytics, and kept the CTA/guardrails aligned with the expected variant.

## Changes
- `src/components/editor/printful-config.ts`: accept `variantName`, derive it from the catalog, and feed it into the lock flags (`preselectedSizes` now uses model name or variant id); diagnostics unchanged otherwise.
- `src/components/editor/edm-editor.tsx`: pass the catalog model into the config builder, record `reportedVariantIds` from Printful design status, propagate them to guardrail snapshots/analytics, and show them in the diagnostics panel.

## Tests
- `npm run build`
- `node scripts/run-mobile-live-smoke.mjs` (BASE_URL=dev.snapcase.ai). Printful mobile file chooser did not open in automation; used test hooks to force ready. CTA unlocked, reached checkout/thank-you. Design status reported `selectedVariantIds=[17726]`, `variantMismatch=false`.
- Deployed `https://snapcase-jag5wpacy-snapcase.vercel.app` and aliased to `https://dev.snapcase.ai`

## Artifacts
- `Images/diagnostics/2025-12-10T20-55-32-493Z-design-mobile.png`
- `Images/diagnostics/2025-12-10T20-55-32-493Z-checkout-mobile.png`
- `Images/diagnostics/2025-12-10T20-55-32-493Z-thankyou-mobile.png`

## Follow-ups / Risks
- Mobile automation still cannot open the Printful file chooser; manual mobile upload should be rechecked to confirm lock behavior with real interaction. Monitor for cases where Printful expects a size label rather than the model/variant id.
- Samsung selections on dev.snapcase.ai still render an iPhone mockup; locking was not honored. Issue remains open and needs a later investigation with live diagnostics and Printful support.
