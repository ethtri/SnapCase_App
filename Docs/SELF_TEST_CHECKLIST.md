# Sprint 1 Self-Test Checklist

Reference sources: `Docs/Storyboard_EDM.md` scenes 1-10, `tests/e2e/design-to-checkout.spec.ts`, `docs/TESTING_STRATEGY.md`.

## Step-by-step walkthrough

1. **Entry & device picker readiness (Scenes 1-3)**
   - Actions: Launch `/design` on a mobile-width viewport; confirm hero promise and device selector load without errors.
   - Expected: Continue button disabled; selection summary reads “No device selected yet.”
   - Notes / Timestamp: 2025-10-26 17:15 CT — Page loads, device picker ready; Continue disabled until selection.
   - Notes / Timestamp: 2025-10-28 09:05 CT — Latest Vercel preview renders device picker instantly; redirect from `/` confirmed.

2. **Blocked DPI guardrail (Scene 7)**
   - Actions: Select a known low-DPI/block variant (e.g., Variant ID 642) and trigger the change event.
   - Expected: Guardrail title shows the block copy (“Image too low-resolution”); footnote states continue is disabled; continue button remains disabled.
   - Notes / Timestamp: 2025-10-26 17:18 CT — Variant 642 triggers block copy; Continue remains disabled as expected.

3. **Warn + safe-area messaging (Scenes 5-7)**
   - Actions: Switch to a warn-range variant (e.g., Variant ID 631); move the asset toward the camera/safe-area boundary.
   - Expected: Guardrail copy shifts to the warning tone (“Heads up on DPI”); safe-area overlay or chip flags the potential collision while allowing continue.
   - Notes / Timestamp: 2025-10-26 17:20 CT — Variant 631 shows warning copy; guardrail stub still inline under Scene 1 but Continue enables.
   - Notes / Timestamp: 2025-10-27 09:42 CT - Warn-path retest after handoff fix; Continue remains enabled and session storage persists updated label.
   - Notes / Timestamp: 2025-10-28 09:08 CT — Warn variant still unlocks Continue; guardrail stub slated for EDM integration in Sprint 2.
   - TODO: Capture exact safe-area warning copy once finalized in UI.

4. **Mock template save & export persistence (Scene 8)**
   - Actions: With `NEXT_PUBLIC_USE_EDM=false`, click “Mock export design” and then continue. When testing the Printful flag, set `NEXT_PUBLIC_USE_EDM=true`, wait for the EDM iframe to load (spinner clears), save a template inside the EDM, and then continue.
   - Expected: Toast or confirmation shows template saved; session storage includes `snapcase:design-context` with template/variant data (or exported image for Fabric fallback); navigation to `/checkout`. EDM run should surface spinner/error states gracefully before the iframe renders.
   - Notes / Timestamp: 2025-10-26 17:22 CT — Mock save emits template ID, navigates to /checkout with summary populated.
   - Notes / Timestamp: 2025-10-28 09:11 CT — Mock save continues to issue template handoff token; checkout loads summary without delay.
   - Notes / Timestamp: 2025-10-28 21:10 CT — First-pass EDM iframe mounts behind flag; spinner + retry overlay verified locally while Printful token remains gated for QA.

5. **Checkout cancel/resume loop (Scenes 9-10)**
   - Actions: Click “Proceed to Stripe,” acknowledge mock secret warning, trigger cancel via `mock-cancel-link`, then resume.
   - Expected: Cancelled URL query (`stripe=cancelled`); cancel banner visible with reassurance copy; resume button clears banner and returns to clean `/checkout`; subsequent Stripe attempt exposes mock checkout link.
   - Notes / Timestamp: 2025-10-26 17:24 CT — Cancel banner appears and clears; mock checkout link available after resume.
   - Notes / Timestamp: 2025-10-28 09:14 CT — Cancel/resume banner persists; mock checkout link reachable; design context intact.

6. **Thank-you summary verification (Scene 11)**
   - Actions: Open `/thank-you` after successful resume attempt (manual nav acceptable if Stripe redirect stubbed).
   - Expected: Thank-you page loads with design summary matching selected variant; session storage context clears post-thank-you.
   - Notes / Timestamp: 2025-10-26 17:27 CT — Thank-you page matches variant; design context cleared from storage.
   - Notes / Timestamp: 2025-10-27 09:45 CT - Summary restored via handoff token; context clears after load and matches warn-path variant.
   - Notes / Timestamp: 2025-10-28 09:16 CT — Preview build confirms thank-you summary renders via handoff token and clears after display.

## Session feedback log

| Participant | Date / Time | Scenario Focus | Issues / Opportunities | Follow-ups |
|-------------|-------------|----------------|------------------------|------------|
| Ethan       | 2025-10-26  | Warn-path pass | Guardrail stub sits inline beneath Scene 1; UX polish deferred to Sprint 2 | Track UX tidy-up with EDM integration |
| Ethan       | 2025-10-27  | Warn-path + thank-you regression retest | Handoff token restores summary; next focus is EDM iframe spike | Document EDM spike plan in Sprint 2 log |
| Ethan       | 2025-10-28  | Preview smoke | Full flow loads in Vercel preview; proceed with EDM spike + responsive polish | Ensure Sprint 2 plan reflects latest docs |
|             |             |                |                        |            |
