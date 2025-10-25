# Sprint 1 Self-Test Checklist

Reference sources: `Docs/Storyboard_EDM.md` scenes 1-10, `tests/e2e/design-to-checkout.spec.ts`, `docs/TESTING_STRATEGY.md`.

## Step-by-step walkthrough

1. **Entry & device picker readiness (Scenes 1-3)**
   - Actions: Launch `/design` on a mobile-width viewport; confirm hero promise and device selector load without errors.
   - Expected: Continue button disabled; selection summary reads “No device selected yet.”
   - Notes / Timestamp: ____________________________________

2. **Blocked DPI guardrail (Scene 7)**
   - Actions: Select a known low-DPI/block variant (e.g., Variant ID 642) and trigger the change event.
   - Expected: Guardrail title shows the block copy (“Image too low-resolution”); footnote states continue is disabled; continue button remains disabled.
   - Notes / Timestamp: ____________________________________

3. **Warn + safe-area messaging (Scenes 5-7)**
   - Actions: Switch to a warn-range variant (e.g., Variant ID 631); move the asset toward the camera/safe-area boundary.
   - Expected: Guardrail copy shifts to the warning tone (“Heads up on DPI”); safe-area overlay or chip flags the potential collision while allowing continue.
   - Notes / Timestamp: ____________________________________
   - TODO: Capture exact safe-area warning copy once finalized in UI.

4. **Mock template save & export persistence (Scene 8)**
   - Actions: Click “Mock save template” and then continue.
   - Expected: Toast or confirmation shows template saved; session storage includes `snapcase:design-context` with template/variant data; navigation to `/checkout`.
   - Notes / Timestamp: ____________________________________

5. **Checkout cancel/resume loop (Scenes 9-10)**
   - Actions: Click “Proceed to Stripe,” acknowledge mock secret warning, trigger cancel via `mock-cancel-link`, then resume.
   - Expected: Cancelled URL query (`stripe=cancelled`); cancel banner visible with reassurance copy; resume button clears banner and returns to clean `/checkout`; subsequent Stripe attempt exposes mock checkout link.
   - Notes / Timestamp: ____________________________________

6. **Thank-you summary verification (Scene 11)**
   - Actions: Open `/thank-you` after successful resume attempt (manual nav acceptable if Stripe redirect stubbed).
   - Expected: Thank-you page loads with design summary matching selected variant; session storage context clears post-thank-you.
   - Notes / Timestamp: ____________________________________

## Session feedback log

| Participant | Date / Time | Scenario Focus | Issues / Opportunities | Follow-ups |
|-------------|-------------|----------------|------------------------|------------|
|             |             |                |                        |            |
|             |             |                |                        |            |

