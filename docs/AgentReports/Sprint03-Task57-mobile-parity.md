# Sprint03-Task57 - Mobile UX parity to mockups

## Findings
- Mobile design page diverged from mockup: tall padding, desktop device grid, helper/guardrail blocks visible on small screens, CTA pinned in desktop aside only.
- Needed compact device picker, trimmed helper copy, mobile guardrail chip, and sticky bottom CTA to mirror the mock while keeping variant lock/CTA gating.

## Changes
- Added mobile header (back + step) and compressed page spacing to reduce chrome height.
- Replaced device grid with mobile-first picker (search, brand chips, detect button, compact cards) mirroring the mock; kept desktop grid intact.
- Hid desktop helper/guardrail blocks on mobile; added light mobile guardrail pill and CTA helper.
- Added sticky bottom CTA bar on mobile to keep flow consistent; preserved existing variant lock/CTA wiring.
- Reduced EDM frame min height on small screens to fit within the mock layout.

## Artifacts
- Before: Images/diagnostics/20251211-171021-mobile-before-design.png, .-171025-mobile-before-checkout.png, .-171028-mobile-before-thankyou.png
- After (first pass): Images/diagnostics/20251211-172125-mobile-after-design.png, .-172131-mobile-after-checkout.png, .-172135-mobile-after-thank-you.png
- After (mock-aligned picker): Images/diagnostics/20251211-181130-mobile-after-design.png, .-181133-mobile-after-checkout.png, .-181135-mobile-after-thankyou.png

## Tests
- npm run build (pass)

## Sponsor feedback / next steps
- Flow still feels busy/clunky: device selection, designer, and checkout preview live together. Sponsor wants a modern stepped flow: (1) Pick your case → Next; (2) Design your case (show selected model/case type in header, minimal helper, simple “design valid” banner) → Next; (3) Review order (proof/price/model) → Continue to checkout/Stripe. If proof isn’t possible, position review near/below the EDM iframe.
- Reduce helper copy: remove “Locked to …” helper and similar busy text; rely on clearer UI cues for selection/lock.
- Desktop: hide “Detect my phone”; brand chips should include Google (done).
- Checkout preview placement: avoid dead space; consider stacking or situating review closer to the designer instead of a right-hand aside.
- Overall ask: make the flow cleaner and more modern for MVP, with clearer navigation and less clutter.
