# Sprint03-Task61 - CX hotfix (picker search/detect restore)

## Summary
- Restored the device picker search/typeahead with Apple/Samsung/Google brand chips (Apple glyph included) while keeping the compact text-first card layout and existing variant lock/CTA gating.
- Added a mobile-only “Detect my phone” helper that seeds filters from user-agent hints and announces status without changing checkout/thank-you or the CTA guardrails.
- Deployed the refreshed picker to `dev.snapcase.ai` to unblock design flow parity after the previous regression.

## Verification
- `npm run build`
- Manually spot-checked `https://dev.snapcase.ai/design` on desktop + mobile (search + brand chips visible; Detect button mobile-only; CTA/lock intact).

## Deployment
- `https://snapcase-fp908m66x-snapcase.vercel.app` (aliased to `https://dev.snapcase.ai`)

## Artifacts
- Before: `Images/diagnostics/design-before-desktop-2025-12-15T17-12-01.png`, `Images/diagnostics/design-before-mobile-2025-12-15T17-12-01.png`
- After: `Images/diagnostics/design-after-desktop-2025-12-15T17-20-37.png`, `Images/diagnostics/design-after-mobile-2025-12-15T17-20-37.png`

## Sponsor Feedback (to triage with PM)
- Desktop layout has dead space: Checkout preview sits in the right rail leaving empty space beneath; request to move the preview below the EDM iframe to tighten the vertical stack.
- EDM iframe clipped: Bottom of the iframe is cut off on desktop; needs more height or layout breathing room.
- Duplicate guardrails: “Designer needs changes” card duplicates the “Designer status” field in Checkout preview; recommendation to remove the redundant card.
- Confusing helper copy: Phrases like “We keep the designer locked to your pick so checkout can’t drift.”, “Checkout mirrors everything you see here so the handoff stays locked.”, and “locked to this pick” are viewed as confusing; sponsor asks to streamline/remove unnecessary copy so UI explains itself.
- Picker clutter: Device selector occupies too much space; mocks assumed a next-step flow before entering the EDM. Request a cleaner, less busy UX (could be separate step or streamlined inline); sponsor wants a UX/CX agent to propose simplification.
- Iframe overlay: The white blocker overlay on the EDM iframe looks incorrect; sponsor wants it removed.
