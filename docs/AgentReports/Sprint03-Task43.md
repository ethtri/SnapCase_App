# Sprint03-Task43 - Live masked `/design` smoke (Printful)

**Date:** 2025-12-08  
**Owner:** Codex (AI)  
**Scope:** Run a live Printful session against masked `/design` to ensure the overlay + SnapCase-first copy do not break the embedded designer; capture diagnostics/screenshots.

## PO decision (2025-12-08)
- Product Owner chose the simplified MVP path: Printful owns variant selection and pricing, CTA gates only on `designValid`, and the Printful price passes through checkout/Stripe. Details live in `docs/AgentReports/Sprint03-Task43-PO-Review.md`; this supersedes prior allowlist/curated-pricing assumptions.

## What happened
- Initial live smoke (2025-11-23T05:13Z): Loaded `/design` on `https://dev.snapcase.ai` (desktop + iPhone 14 Pro emulation). Printful iframe rendered with live nonces; CTA stayed locked on "Select a supported device" because no variant selection was completed. Guardrail cards stayed null in diagnostics.
- Rerun live smoke with explicit variant selection (2025-11-23T07:12Z & 07:14Z): Pre-seeded SnapCase with iPhone 15 Pro and attempted to click supported variants (iPhone 15/14, Galaxy S24 family) inside the masked Printful picker. Printful acknowledged `setStyleOK/setFeatureConfigOK/setProductOK` but emitted `design_status` payloads with large `selectedVariantIds` lists outside our catalog plus error `Please add a design!`. Guardrail copy surfaced "This device is not in the beta catalog yet" and the CTA remained disabled ("Select a supported device") on both desktop and mobile.
- Rerun with longer waits (2025-12-08T17:52Z): Updated `tmp/task43-capture.js` (120s timeouts, longer pauses). Live `/design` still reports `design_status` with non-catalog `selectedVariantIds` (starts `[16888, 16890, 16892, 16894, 16898, ...]`), no supported-variant buttons were found (`button-not-found`), and the CTA stayed disabled.

## Artifacts
- Desktop screenshot (initial): `Images/diagnostics/task43-design-desktop-2025-11-23T05-13-27-262Z.png`
- Mobile screenshot (initial): `Images/diagnostics/task43-design-mobile-2025-11-23T05-13-27-262Z.png`
- Diagnostics JSON (initial): `Images/diagnostics/task43-edm-live-2025-11-23T05-13-27-262Z.json`
- Desktop screenshot (rerun 1): `Images/diagnostics/task43-design-desktop-2025-11-23T07-12-41-975Z.png`
- Mobile screenshot (rerun 1): `Images/diagnostics/task43-design-mobile-2025-11-23T07-12-41-975Z.png`
- Diagnostics JSON (rerun 1): `Images/diagnostics/task43-edm-live-2025-11-23T07-12-41-975Z.json`
- Desktop screenshot (rerun 2): `Images/diagnostics/task43-design-desktop-2025-11-23T07-14-48-942Z.png`
- Mobile screenshot (rerun 2): `Images/diagnostics/task43-design-mobile-2025-11-23T07-14-48-942Z.png`
- Diagnostics JSON (rerun 2): `Images/diagnostics/task43-edm-live-2025-11-23T07-14-48-942Z.json`
- Desktop screenshot (rerun 3): `Images/diagnostics/task43-design-desktop-2025-12-08T17-52-14-609Z.png`
- Mobile screenshot (rerun 3): `Images/diagnostics/task43-design-mobile-2025-12-08T17-52-14-609Z.png`
- Diagnostics JSON (rerun 3): `Images/diagnostics/task43-edm-live-2025-12-08T17-52-14-609Z.json`

## Verification
- Manual Playwright harness (`tmp/task43-capture.js`) in headless Chromium against live `/design`; no automated Jest/Playwright test suite executed.
- PostMessage capture shows Printful config acknowledgments followed by `design_status` events that include non-catalog `selectedVariantIds` and blocking error `Please add a design!`, leaving CTA disabled. Latest run still lacks supported-variant buttons in the Printful frame.

## Notes / next steps
- Investigate why live `design_status` events report unsupported variant IDs despite SnapCase mask; ensure Printful picker is constrained to catalog variants (632/631/642/641/712/711/710) and emits a single supported ID so CTA can unlock.
- Once variant lock works in live mode, rerun to capture "Printful-ready" CTA state plus new screenshots/diagnostics, then update `PROGRESS.md` and ensure the task branch `task/Sprint03-Task43-edm-live-smoke` is clean.
