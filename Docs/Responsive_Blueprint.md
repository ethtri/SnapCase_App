# Design & Order Responsive Blueprint

This blueprint combines the mobile delta docs with design system tokens to explain how the Design & Order flow scales from phones through large desktops. Breakpoints follow the Tailwind defaults already active in the mockup code exports: base (<640px), `sm` (>=640px), `md` (>=768px), `lg` (>=1024px), `xl` (>=1280px), and `2xl` (>=1536px). Spacing references use `--space-*` tokens, primary actions stay on `--snap-violet`, and cards keep the shared `--radius-xl`/`--shadow-md` profile unless noted.

**Source references**
- Stitch exports (PNG, HTML) per screen: `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Mobile/Screen-*/`
- Delta notes aligned with the design system:
  - `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Mobile/Screen-1-Pick-your-device/snapcase-notes-delta-screen-1.md`
  - `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Mobile/Screen-2-Design-your-case/snapcase-notes-delta-screen-2.md`
  - `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Mobile/Screen-3-Review-and-Shipping/snapcase-notes-delta-screen-3.md`
  - `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Mobile/Screen-4-Order-Placed/snapcase-notes-delta-screen-4.md`
- Core specs: `Docs/SnapCase_App_Prototype.MD`, `Docs/DESIGN_SYSTEM.md`, `Docs/VISUAL_CONSISTENCY_GUIDE.md`, `Docs/Storyboard_EDM.md`

## Shared Responsive Patterns
- **Header & footer** reuse `AppHeader`/global footer with `--space-4` vertical padding and blur divider; they stay full-width on mobile and clamp to `container-lg` on `lg+`.
- **Cards & surfaces** keep `--radius-xl`, `--shadow-md`, and `--space-5`-`--space-6` padding; cards stack vertically on base/sm and flow into grids (two-up or more) once there is >=`md` width.
- **Bottom action bar** uses the shared `ActionBar`: sticky with safe-area padding on base/sm, becomes right-column `CheckoutStickyPanel` with `--space-6` gutter on `lg+`.
- **Primary CTAs** stay full-width buttons at smaller widths (height `--space-12`), then cap at 320-360px with auto width on `md+`; tertiary/outline buttons follow the same height and `--space-4` internal padding for parity.
- **Typography scaling** follows design tokens (`--text-lg` headers, `--text-base` body) until `lg`, where key headings step up one size (`--text-xl` or `--text-2xl`) to balance wider whitespace.
- **Interactive affordances** (segmented controls, radio cards, copy buttons) widen hit targets with `--space-4` horizontal padding at base and switch to inline arrangements on `lg+` while keeping >=44px taps.

## Screen 1 - Pick Your Device
- **Base (<640px phones)**: The device grid stays two columns with `--space-4` gutters; cards keep fixed aspect ratio and `--space-3` image padding. Search, segmented brand control, and "Detect my phone" stack with `--space-4` spacing. The sticky `ActionBar` spans edge-to-edge with safe-area inset and keeps "Back-only print" text + primary CTA.
- **sm (>=640px narrow tablets)**: Maintain two-column grid but increase horizontal padding to `--space-6` and shift helper text ("From $34.99") into a single line above the grid to reduce repetition. Segmented control and detect CTA sit side-by-side with shared `--space-3` gap while remaining 44px tall.
- **md (>=768px landscape tablet / small laptop)**: Increase grid to three columns using `grid-3` utility and expand the search input width to align with the grid's outer edges. The helper copy and filters sit on one row: search left, segmented middle, detect right, each constrained to a min-width of 200px for balance.
- **lg (>=1024px desktop)**: Grid grows to four columns with consistent `--space-5` gutters. Filter row locks to a 12-column layout, allowing search to stretch across four columns (~400px) while brand control and detection share the remaining width. The sticky CTA becomes a floating action button anchored bottom-right (width 280px, `--space-4` inset) per delta note, freeing vertical space for scroll.
- **xl+ (>=1280px large desktop)**: Grid extends to five columns; introduce a left rail area (max 320px) for future merchandising or help content without pushing cards below the fold. Maintain max grid width at `container-lg` (1400px) to preserve focus; ensure empty columns collapse gracefully when inventory is low.

## Screen 2 - Design Your Case
- **Base (<640px)**: Canvas centers with max width 320px and `--space-4` margin; toggles stack above it with `--space-4` vertical rhythm. DPI chip stays anchored top-right within the canvas bounds. Tool row sits immediately above the sticky CTA bar (non-sticky) and uses equal-width buttons sized via `--space-3` padding.
- **sm (>=640px)**: Increase canvas max width to 360-380px while keeping 16px (`--radius-xl`) corner rounding and dashed border. Safe area and camera toggles sit in a single row with `--space-4` gap, aligning icons/text on the same baseline. Bottom tool row gains horizontal padding (`--space-5`) to reduce edge crowding.
- **md (>=768px)**: Canvas can grow to 420px while preserving aspect ratio; introduce side breathing room by capping the content column at `container-sm` (640px) and centering it. Sticky CTA widens to 360px and detaches from edges (auto width with `--space-5` margin) to feel less cramped on tablets.
- **lg (>=1024px)**: Maintain single-column stack but widen canvas up to 540px and place toggles/tool row in a fixed-width left rail (260px) when horizontal space allows, so the canvas remains centered. The primary CTA floats bottom-right like Screen 1, while a persistent helper panel (future-proof for properties or guidance) can occupy the spare right column; until populated, keep generous whitespace.
- **xl+ (>=1280px)**: Cap canvas at 620px to avoid overextension; allow optional preview/live guidelines to appear as a secondary column (using `grid-2`) without exceeding `container-lg`. Ensure DPI chip and overlays scale proportionally and remain within the dashed frame. Consider raising type scale for the header to `--text-2xl`.

## Screen 3 - Review & Shipping
- **Base (<640px)**: Single-column stack: design summary, shipping radios, address card, cost breakdown, promise banner, then sticky `ActionBar`. Each card keeps `--space-5` padding and `--space-4` gaps. Skeleton shimmers overlay cards full-width during pricing refresh, and the cancel info bar (when returned from Stripe) appears above totals.
- **sm (>=640px)**: Increase horizontal padding to `--space-6` and bump card max width to 540px; promise banner stretches full width but keeps interior padding at `--space-5`. CTA remains sticky bottom but detaches slightly from screen edges (`--space-5` margin) where safe area allows.
- **md (>=768px)**: Introduce two-column layout: left column (~60%) for design summary + shipping radios + promise banner; right column (~40%) for address, cost summary, and CTA panel stacked vertically. Use `grid` with `gap: --space-6`. CTA transitions into `CheckoutStickyPanel` with `position: sticky; top: 96px`, mirroring design system guidance.
- **lg (>=1024px)**: Tighten grid to 12 columns: left spans eight, right spans four. Totals card and CTA share the right column, with CTA panel maintaining `--space-6` padding and height auto. Promise banner can slide below totals if right column height becomes unwieldy. Ensure radio cards display in two columns when Express is available (width >=340px each).
- **xl+ (>=1280px)**: Constrain layout to `container-lg` (max 1400px). Allow promise banner to stretch across both columns when messaging length grows. Introduce supporting imagery or trust badges in the right column if needed, keeping components aligned to existing `--space` grid. Large desktop should still keep the CTA in view by clamping sticky top to 120px max.

## Screen 4 - Order Placed
- **Base (<640px)**: Hero confirmation remains centered with `--text-2xl` heading and `--space-4` stack spacing. Timeline runs horizontally with three nodes spanning full width; connectors use `--snap-gray-200` by default and fill to `--snap-violet` for completed steps. Cards (order summary, ship-to, payment) stack with `--space-4` gaps, followed by primary/secondary CTA buttons stacked full-width and the support link beneath.
- **sm (>=640px)**: Increase hero max width to 520px, align supporting copy left while keeping hero badge centered. Timeline stays horizontal but gains breathing room with `--space-6` gutter margins. CTAs remain stacked but clamp width to 360px and center.
- **md (>=768px)**: Shift layout to left-aligned hero inside a 8-column grid; timeline switches to vertical presentation using container queries from Tailwind's plugin (connectors run top-to-bottom with nodes 56px apart). Cards arrange in two columns where width permits (order summary + shipping on left, payment + reassurance on right) while respecting `--space-5` interior padding.
- **lg (>=1024px)**: Maintain vertical timeline pinned left with `position: sticky; top: 96px` so progress remains visible while scrolling cards. CTAs move into a horizontal pair (primary left, secondary right) with `justify-content: flex-start`, each 300-320px wide and 48px tall. Estimated delivery chip sits inline under CTAs, left-aligned.
- **xl+ (>=1280px)**: Constrain content to `container-lg` and allow timeline to expand to a four-step version when future states arrive, ensuring connectors stay aligned with `--space-6` increments. Optional celebration illustration can occupy the right column while cards stay in a two-up grid. Confetti animation bounds should not exceed the hero container to prevent scroll jumps.

## Open Questions & Follow-Ups
- Desktop and large-desktop mockups are not yet provided for Screens 1-4; confirm whether new Stitch exports are planned before engineering starts on `lg+` refinements.
- Screen 2's future right-rail or property panel needs confirmation before finalizing `lg+/xl` layout; currently treated as open whitespace.
- Provide the approved Stripe button lockup asset referenced in Screen 3 to avoid placeholder SVG usage.
- Confirm animation specs (confetti, timeline fills, floating CTA transitions) for reduced-motion states so devs can match motion tokens.
- Verify whether additional timeline steps (Out for delivery, Delivered) are part of the near-term roadmap to account for spacing in Screen 4's desktop layout.




