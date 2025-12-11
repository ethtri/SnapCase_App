# Sprint03-Task54 – CX/UX audit + modern device picker proposal

## Summary
- Audited design/checkout/thank-you and confirmed copy stays Snapcase-first with device/price lock messaging intact; no new Printful or variant ID leaks surfaced in checkout/thank-you.
- Design page still exposes raw diagnostics and the static picker grid (Apple-heavy) with no search/filters; Samsung/Pixel coverage remains implicit and the error state is a verbose debug card.
- Proposed a full-catalog, searchable/filterable picker with brand tabs (Apple/Samsung/Pixel/More), MagSafe/stock/template-fit chips, and lock-aware CTA that mirrors checkout.
- Captured fresh screenshots and a wireframe to illustrate the desired picker/flow while keeping CTA/variant lock behaviour unchanged.

## Findings
- Design (/design)
  - Device picker is a static 3-column grid without search/filter; Apple models dominate the fold and Samsung/Pixel options are easy to miss.
  - Error state shows a full diagnostics dump (“Design details” JSON, nonce, reportedVariantIds) that is customer-hostile; helper pill is good but doesn’t explain remediation.
  - CTA helper and checkout preview correctly reference lock/price, but the primary CTA is blocked by the designer failure without a next-step helper.
- Checkout (/checkout)
  - Experience is on-brand and consistent; device/price lock copy is clear and free of Printful/template IDs.
  - Shipping selector and cost summary are accessible; no regressions observed.
- Thank-you (/thank-you)
  - Timeline, CTAs (track/design another), and design snapshot stay clean; no vendor/template leakage. Copy aligns with Quality Promise tone.
- Device picker backlog fit
  - No search/filter, no brand pivots, and no Samsung/Pixel emphasis conflict with the backlog goal captured in PROGRESS.md. Grid expansion will worsen as catalog grows.

## Recommendations
- Modern device picker (full catalog)
  - Add search with typeahead and keyboard focus; filter as you type with empty-state guidance.
  - Introduce brand tabs: Apple | Samsung | Pixel | More. Default to last-used or most popular; surface counts per tab.
  - Filters as chips: MagSafe-ready, Case type (Snap/others), New/Popular, “Fits saved template,” Stock (In/Low). Allow multi-select and quick clear.
  - Card content: brand + model, tags (MagSafe, stock state, template-fit), and a subtle “Selected” badge. Auto-scroll to the selected card; keep CTA locked until a card is chosen.
  - Samsung/Pixel clarity: pre-filter toggles, dedicated tab copy (“Full Samsung & Pixel catalog — same print quality”), and ensure at least one Samsung + one Pixel card are above the fold.
  - Lock/CTA: primary “Continue to design” stays disabled until a selection; helper text mirrors checkout lock so users know the designer/checkout stay synced.
  - Responsive: 2/3/4 columns (xs/sm/md+), sticky bottom bar on mobile, floating CTA on desktop with safe-area padding.
- Flow polish
  - Replace the verbose error/debug block on /design with a compact, empathetic state and a retry CTA; move diagnostics behind a collapsible “Show details” link for internal use.
  - Add a short helper when the designer fails to load (e.g., “Reload or try another device”); keep variant lock messaging visible.
  - Keep checkout/thank-you unchanged; they are already clean and on-brand.

## Artifacts
- Screens (local, seeded context): `Images/diagnostics/2025-12-11T20-43-41-546Z-design-desktop.png`, `Images/diagnostics/2025-12-11T20-43-41-546Z-checkout-desktop.png`, `Images/diagnostics/2025-12-11T20-43-41-546Z-thank-you-desktop.png`
- Wireframe (picker proposal): `Images/diagnostics/2025-12-11T20-43-41-546Z-picker-wireframe.png`

## Verification
- Doc-only; no code changes, no tests run.
