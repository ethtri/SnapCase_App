# Sprint03-Task62 – CX/UX Plan for Design/Checkout/Thank-You

## Summary
- Audit ran on `https://dev.snapcase.ai` (desktop + mobile) to address sponsor feedback around dead space/clipping, busy helper copy, cluttered device selector, review/shipping duplication, and desire for proof/streamlined flow.
- Captured fresh diagnostics plus annotated screenshots and quick wireframes to illustrate current gaps and recommended layout changes.
- No code changes; plan only.

## Findings vs Sponsor Pain Points
- **Dead space / clipping / overlays**: Checkout preview floats top-right on design, creating unused gutter; EDM iframe shows large blank area with white overlay/loader and can be clipped. Thank-you has an empty “Saved design” block when context is missing.
- **Helper copy too busy**: Design surface shows multiple helper pills (lock, status, editor running) with verbose text; checkout/payment handoff repeats reassurance and CTA.
- **Device selector clutter**: Long grid with full labels pushes content down (especially on mobile); search/filter is narrow and chips are not emphasized; detection/brand chips not visible.
- **Review/shipping duplication**: Checkout repeats shipping info across “Design summary”, “Shipping speed”, “Ship to”, cost summary, and payment handoff; no proof thumbnail shown.
- **Proof / streamlined flow**: Design context missing in checkout and thank-you; no proof or edit affordance; CTA duplication between rail and handoff block.

## Recommendations
- **Design step (desktop)**: Move checkout preview/proof into a sticky right rail adjacent to CTA; expand EDM iframe to a fixed 16:10 frame with visible bounds to prevent clipping; collapse helper copy into a single status line. Use a compact stepper (1. Device, 2. Design, 3. Review) with brand chips + search bar + “detect device” pill above the list.
- **Design step (mobile)**: Add sticky action bar with thumbnail + CTA; collapse device list into search + brand chips + quick picks; keep lock/helper copy to one line. Reserve a fixed aspect ratio frame for the embed with a soft border to avoid the white overlay feel.
- **Checkout / review**: Lead with a proof card (thumbnail, device, finish, edit link) so “Design summary” is meaningful. Combine shipping method + address into one review step; remove duplicate payment handoff block and keep a single primary CTA with short reassurance. Keep the cost rail sticky and trim gutters.
- **Thank-you**: When no design context is available, hide the “Saved design” placeholder and instead show a proof recap or a “Start new design” CTA with guidance.
- **Copy simplification**: Replace multi-line helper pills with concise statuses (e.g., “Locked to iPhone 17 Pro · Change in Step 1”, “Designer ready · Upload to continue”). Keep payment reassurance to a single line under the CTA.
- **Constraints to note**: Variant lock + Printful embed remain required; iframe sizing must avoid clipping the EDM mask; proof card can only show what the embed returns (no template ID leaks).

## Artifacts
- Raw captures: `Images/diagnostics/2025-12-15T18-05-56-847Z-design-desktop.png`, `...checkout-desktop.png`, `...thank-you-desktop.png`, `...design-mobile.png`, `...checkout-mobile.png`, `...thank-you-mobile.png`.
- Annotated captures: `Images/diagnostics/2025-12-15T18-07-53-204Z-design-desktop-annotated.png`, `...design-mobile-annotated.png`, `...checkout-desktop-annotated.png`.
- Wireframes: `Images/diagnostics/2025-12-15T18-07-53-204Z-wireframe-design.png` (design layout recommendation), `Images/diagnostics/2025-12-15T18-07-53-204Z-wireframe-review.png` (checkout/review flow).

## Next Steps (Suggested)
1) Align design/checkout layouts to the wireframes (sticky preview rail, proof card, consolidated shipping/review step).  
2) Implement compact stepper + brand chips + detection for device selection; simplify helper/status copy.  
3) Add proof thumbnail + edit link to checkout and thank-you; hide empty saved-design placeholders.

## Tests
- Not run (documentation-only task).
