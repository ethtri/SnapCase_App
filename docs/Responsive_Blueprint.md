# Design & Order Responsive Blueprint

This blueprint fuses the Stitch delta docs with the design system so engineers can translate mobile intent into responsive implementations without guessing. Breakpoints follow the Tailwind defaults already wired into the app: base (<640px), `sm` (>=640px), `md` (>=768px), `lg` (>=1024px), `xl` (>=1280px), `2xl` (>=1536px). All measurements reference tokens-colors `var(--snap-*)`, spacing `--space-*`, typography `--text-*`, radii `--radius-*`, controls `var(--control-height)`, shadows `--shadow-*`.

> **Section Status**
>
> | Section | Status | Notes |
> | --- | --- | --- |
> | Source References | Authoritative | Live set of specs; keep Stitch + delta docs paired with this blueprint. |
> | Responsive Delivery Strategy | Authoritative | Reflects EDM-first constraints and helper copy limits (Ref: docs/Printful_EDM_KeyFacts.md:85-165). |
> | Desktop Layout & Guardrail Ownership | Authoritative | Matches current two-column approach and Printful-only guardrails (Ref: docs/Printful_EDM_KeyFacts.md:141-165). |
> | Screen 1 – Select Your Device | Authoritative | Device picker/UI tokens match current implementation; no Printful conflicts. |
> | Screen 2 – Layout & Guardrails | Needs Rewrite | Added EDM-first guidance below, but Fabric toggle content remains archived until rewritten (Ref: docs/Printful_EDM_KeyFacts.md:85-165). |
> | Guardrail Banners & Safe-Area Overlays | Deprecated – Fabric-only | Printful owns guardrails; this section is retained only for Fabric fallback (Ref: docs/Printful_EDM_KeyFacts.md:141-165). |
> | Flow-wide Accessibility Checklist | Authoritative | Applies to both EDM + Fabric shells. |
> | Open UX Decisions | Authoritative | Decisions pending stakeholder review; note EDM constraints when resolving. |
> | Live Gap Analysis | Needs Rewrite | Some remediation steps referenced hidden pickers; see updated note tying to read-only reality (Ref: docs/Printful_EDM_KeyFacts.md:85-101). |

## Source References
- Stitch exports per screen (`Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Mobile/Screen-*/`)
- Delta notes for Screens 1-4 (`snapcase-notes-delta-screen-*.md`)
- System specs: `docs/SnapCase_App_Prototype.MD`, `docs/DESIGN_SYSTEM.md`, `docs/VISUAL_CONSISTENCY_GUIDE.md`, `docs/Storyboard_EDM.md`

### Desktop References (Screens 1–2)
- Desktop commentary for Screen 1 lives in `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Desktop/Screen-1-Pick-your-device/snapcase-notes-delta-screen-1.md`.
- Desktop commentary for Screen 2 lives in `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Desktop/Screen-2-Design-your-case/snapcase-notes-delta-screen-2.md`.

## Responsive Delivery Strategy
- **Mobile-first source of truth**: All flows originate from the mobile Stitch exports plus their delta docs. Desktop/tablet implementations extrapolate from those specs using the breakpoints below—no separate mock is required before engineering begins.
- **Desktop deltas as commentary**: When desktop-specific callouts exist (layout shifts, Printful constraints, marketing rails), capture them in the `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Desktop/*/snapcase-notes-delta-screen-*.md` files. Treat them as commentary layered on top of the mobile intent, not replacement requirements.
- **Guardrail single ownership**: Printful’s embedded banner + DPI/safe-area states own the warning experience (per `docs/Printful_EDM_KeyFacts.md` §Critical Gotchas and `docs/Printful_EDM_Risk_Analysis.md` §1). SnapCase only mirrors `onDesignStatusUpdate` inside a diagnostics card and suppresses our safe-area overlay + DPI chips whenever EDM is active. The overlay/toggles now render **only** in Fabric fallback.
- **Picker handling**: SnapCase now masks Printful’s variant picker row with a host overlay while still locking it via `isVariantSelectionDisabled` + `preselectedSizes` (`docs/Printful_EDM_KeyFacts.md` §Variant Selection & Data Flow). Helper copy still calls out the lock so any flicker during load is contextualized, and the SnapCase picker remains the only actionable control.
- **Optional left rail**: The only always-on left rail is Printful’s native toolbar. SnapCase-specific content should *not* introduce another rail until we have real utility (e.g., multi-pane editing). If/when we add curated content, cap it at 320px and verify the Printful column still clears 960px width.
- **Breakpoint spacing**: Base/sm use `--space-4` gutters, `md` promotes to `--space-5`, and `lg+` clamps to `container-lg` (~1400px) with `--space-6` gutters so the EDM toolbar never feels cramped (`Images/diagnostics/11.4.25_badCXUX.png`).
- **Editor integration posture**: Prefer Printful EDM for both mobile and desktop, but keep Fabric fallback ready if an experience cannot meet blueprint standards via documented Printful hooks. Note escalations in `docs/Printful_EDM_InvalidOrigin.md`.
- **Documentation cadence**: Every responsive change (layout experiment, UX tweak, vendor limitation) must update this blueprint plus the relevant desktop/mobile delta doc before code merges. This keeps agents aligned on the current strategy without needing bespoke prompts.

### Desktop Layout & Guardrail Ownership (2025-11-06 reset)
- **Purpose:** Honor the Stitch intent where Printful’s left column already houses the EDM toolbar. SnapCase will not add a separate guardrail rail or card; focus on giving the Printful canvas enough width and keeping our order summary/CTA column tidy.
- **Layout guidance:** On `lg+`, target two primary columns—Printful editor stack (~960px min) and SnapCase order summary column (~320px). Avoid clamping the entire view to `max-w-5xl`; stretch toward `container-lg` so the toolbar never feels cramped (`Images/diagnostics/11.4.25_badCXUX.png`). Optional left-rail content (merch, tips) may dock to the far left but must collapse entirely on `md-` to avoid pushing the iframe downscreen.
- **Guardrail voice:** Printful’s banner and validation states are the only warnings users see (per `docs/Printful_EDM_KeyFacts.md` §Guardrails). SnapCase now limits itself to a summary card that repeats Printful’s `designValid`/`errors[]` payload, variant drift notes, and back-only print reminders; no duplicate DPI/safe-area overlays ship on EDM.
- **Helper text:** Since Printful’s variant picker is read-only, add inline copy above it—“Locked to your SnapCase selection”—to prevent users from trying to edit it. All actionable changes still flow through SnapCase’s own picker upstream of the editor, and we link to diagnostics if IDs diverge (`docs/Printful_EDM_Risk_Analysis.md` §2).
- **Instrumentation:** We still log `logAnalyticsEvent('guardrail_warning', {...})` and `edm_design_status` when Printful emits new errors so funnel analysis remains intact, even though no separate UI is rendered.
- **Before/after reference (2025-11-06):** Prior builds stacked the SnapCase safe-area overlay + guardrail panel beside the EDM canvas. Current builds suppress those elements when Printful is active and show the new summary card instead; capture fresh screenshots once staging redeploys to illustrate the delta for stakeholders.

### Mockup vs Reality (Screen 2 focus)
| Stitch component / spec | Live implementation | Status / Limitation |
| --- | --- | --- |
| Variant picker hidden inside toolbar | SnapCase masks Printful’s picker row with a host overlay while keeping `isVariantSelectionDisabled` + `preselectedSizes` in the config and surfacing the helper pill (“Device locked — change in Step 1”), per `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Mobile/Screen-2-Design-your-case/snapcase-notes-delta-screen-2.md:23-27` and `.../Desktop/Screen-2-Design-your-case/snapcase-notes-delta-screen-2.md:18-22`. Diagnostics now rely on `Images/diagnostics/design-messaging-*.png` instead of showing the picker chrome. | **Shipped (masked)** – picker is visually suppressed; Printful still receives the lock flags underneath. Monitor for flicker if the iframe races the overlay. |
| SnapCase safe-area & DPI overlay stacked over canvas | Safe-area overlays/DPI chips now render **only** in Fabric fallback, per `Snapcase-Flow-Mockups/.../Mobile/Screen-2-Design-your-case/snapcase-notes-delta-screen-2.md:25` and `.../Desktop/Screen-2-Design-your-case/snapcase-notes-delta-screen-2.md:20`. EDM relies on Printful’s overlay/banners while SnapCase mirrors the payload in the summary card. | **Deferred Fabric-only** – redundant overlays removed per `docs/Printful_EDM_Risk_Analysis.md` §1. |
| Dedicated SnapCase guardrail rail with dismissible banners | Guardrail rail replaced by the compact summary tied to `onDesignStatusUpdate`, per `Snapcase-Flow-Mockups/.../Mobile/Screen-2-Design-your-case/snapcase-notes-delta-screen-2.md:24` and `.../Desktop/Screen-2-Design-your-case/snapcase-notes-delta-screen-2.md:19`, with diagnostics evidence in `Images/diagnostics/edm-diagnostics-2025-11-04T21-12-24-222Z.png`. | **Shipped** – aligns with `docs/Printful_EDM_KeyFacts.md` §Guardrails. |
| Multi-pane canvas + preview strip | Still a single Printful column with an optional left-rail placeholder; multi-pane UI remains future scope (`Snapcase-Flow-Mockups/.../Mobile/Screen-2-Design-your-case/snapcase-notes-delta-screen-2.md:27`, `.../Desktop/.../snapcase-notes-delta-screen-2.md:22`). | **Not Started** – wait for multi-pane API or Fabric fallback. |
| CTA row anchored below canvas with SnapCase-only messaging | Sticky ActionBar/floating CTA and the desktop summary column mirror Printful validity + “Back-only print” helper copy (`Snapcase-Flow-Mockups/.../Desktop/Screen-2-Design-your-case/snapcase-notes-delta-screen-2.md:21`; `.../Mobile/Screen-1-Pick-your-device/snapcase-notes-delta-screen-1.md:19-27`). Diagnostics: `Images/diagnostics/design-desktop-2025-11-05T15-47-53-583Z.png` (desktop) and `Images/diagnostics/design-mobile-2025-11-05T15-49-00-368Z.png` (mobile). | **Shipped** – blueprint + `/design` live code match. |

## Shared Responsive + Token Rules
- **Shell**: `AppHeader` plus the safe-area `ActionBar` stay full width on base/sm and clamp to `container-lg` with `--space-6` gutters on `lg+`. Footers use `--space-4` vertical padding and a blur divider `calc(var(--space-1)/4)`.
- **Surfaces**: Cards default to `--radius-xl`, `--shadow-md`, and `--space-5` padding on base, stepping to `--space-6` on `lg+`. Use `var(--snap-gray-50)` page background and `var(--snap-white)` surfaces unless a banner tint is called out.
- **CTA sizing**: Primary buttons stay full width at smaller widths (height `--space-12`, min-width `calc(var(--space-4) * 18)`), then cap near 320-360px (`--space-16 * 5`) on larger breakpoints. Outline and tertiary buttons keep the same height, `var(--control-height)`, and `--space-4` horizontal padding.
- **Typography**: Headers scale from `--text-lg` or `--text-xl` on base to `--text-2xl` at `lg+`; body copy holds `--text-base`, helper copy `--text-sm`. Always reference `var(--font-display)` for titles and `var(--font-body)` for everything else.
- **Interaction affordances**: Segmented controls, radio cards, switches, and tool buttons maintain touch area >=`var(--control-height)` with `--space-3` horizontal padding. On `lg+`, controls sit inline but keep arrow-key and focus affordances defined in the delta docs.
- **Safe-area handling**: Bottom bars, floating CTAs, and modals add `env(safe-area-inset-*)` padding and keep overlays clear of rounded corners by at least `--space-3`.

## Screen 1 - Pick Your Device

### Layout by Breakpoint
- **Base (<640px)**: Two-column grid (`gap: var(--space-4)`) with cards sized to maintain the silhouette aspect ratio and `--space-3` internal padding. Search, segmented brand tabs, and Detect stack with `--space-4` rhythm. `ActionBar` spans edge to edge with safe-area padding and shows guardrail text "Back-only print".
- **sm (>=640px)**: Retain two columns but widen page padding to `--space-6`. Brand segmented control and Detect align horizontally with `--space-3` between them while staying `var(--control-height)` tall. Helper copy "From $34.99" sits as a single line above the grid.
- **md (>=768px)**: Grid promotes to three columns; filters sit on one row inside a 12-column structure: search left (min-width `calc(var(--space-4) * 12.5)`), segmented center, Detect right. `ActionBar` still spans the full width.
- **lg (>=1024px)**: Four-column grid with `--space-5` gutters. Filters distribute across the top row with search spanning four columns (~400px), tabs two columns, Detect two columns. Sticky CTA converts into a floating action button (FAB) pinned bottom-right with width about `5 * var(--space-14)` and `--space-4` inset shadow `--shadow-lg`.
- **xl+ (>=1280px)**: Five-column grid constrained to `container-lg` (~1400px). Optional left rail (max width `5 * --space-16`) can host educational or merchandising blocks without forcing extra scroll; cards auto-flow when fewer models are available.

### Behavioral Guardrails
- Search maintains instant filtering and keeps the FAB visible by adding scroll padding to the body. Detect surfaces inline helper text "We only read your device info; no personal data" and a toast for success/failure. Persisted selections ensure `Next: Design` stays enabled after returning from the editor.
- Skeleton loaders cover grid items while models fetch; the FAB disables (`var(--snap-cloud)` fill) until a model is selected. Guardrail analytics (`device_picker_viewed`, `model_selected`, etc.) fire regardless of breakpoint.

### Content & CTA Notes (Nov 5 reality)
- Pricing remains a single helper line — “From $34.99” — above the grid instead of per-card prices so Stitch back catalog references stay authoritative. Diagnostics still focus on Screen 2; capture a new Screen 1 set once the Printful type error is resolved.
- Sticky ActionBar (base/sm) and the lg+ floating CTA pod keep the “Back-only print” helper copy tied to `model_selected`. Both controls share the guardrail gating that now sources `designContext`, so Continue stays disabled until a model is picked (see Live Gap Analysis – Resolved, 2025-11-05). Screen 1 CTA screenshots are pending the same Printful fix.

### Accessibility and Messaging
- Focus order: Back -> Title -> Search -> Segmented control (tabs) -> Detect -> Grid (row traversal) -> FAB CTA. Segmented control uses `role="tablist"` and `role="tab"` with `aria-selected`; grid uses `role="grid"` and `role="gridcell"`.
- All states maintain AA contrast (Snap Violet on white, violet outline on white, disabled state `var(--snap-gray-800)` at 60 percent). Live regions announce Detect outcomes via `aria-live="polite"`.

## Screen 2 - Design Your Case and Guardrails

### Layout by Breakpoint
- **Base (<640px)**: Printful iframe spans the full width with `--space-4` gutters. SnapCase safe-area overlays and DPI chips stay hidden because EDM owns the canvas (`docs/Printful_EDM_KeyFacts.md` §Guardrails). A helper block above the iframe reiterates the selected device, notes that the Printful picker is locked, and links to diagnostics (`Images/diagnostics/edm-diagnostics-2025-11-04T19-17-46-144Z.png`).
- **sm (>=640px)**: Maintain the single column but increase horizontal padding to `--space-5`. Guardrail summary card anchors directly below the iframe so screen readers encounter Printful status immediately after the embed.
- **md (>=768px)**: Introduce a split stack: iframe + summary card on the left (min 720px) and the SnapCase order summary card right-aligned when space allows. Optional left-rail content remains collapsed.
- **lg (>=1024px)**: Activate the full two-column layout: Printful column (~960px) paired with the SnapCase order/CTA column (~320px) with `--space-8` gaps. Optional left rail (max 320px) may host education or merchandising, but only if the iframe can remain ≥900px wide.
- **xl+ (>=1280px)**: Stretch container to ~1400px so Printful’s picker, toolbar, and guardrail banner breathe; keep `--space-10` between columns to avoid the cramped desktop layout captured in `Images/diagnostics/11.4.25_badCXUX.png`. Capture a fresh `/design` screenshot once the Printful type issue unblocks builds.

### Guardrail, Picker, and State Behaviors
- **Guardrail ownership:** SnapCase listens to `onDesignStatusUpdate` and mirrors the latest `designValid`, `errors[]`, `warnings[]`, and `selectedVariantIds[]` inside the summary card plus analytics events (`docs/Printful_EDM_KeyFacts.md` §Variant Selection & Data Flow). Printful banners remain inside the iframe; SnapCase never duplicates the copy (`docs/Printful_EDM_Risk_Analysis.md` §1).
- **CTA gating:** Continue/Checkout buttons disable whenever Printful reports `designValid=false`, variant mismatches, pending uploads, or printfile errors. Summary copy leads with “Resolve the Printful banner above” before any SnapCase-specific reminder so ownership stays clear.
- **Safe-area & DPI visuals:** Safe-area overlay, camera cutout outline, and DPI chip render **only** during Fabric fallback or diagnostics mode. When EDM is active we rely on Printful’s overlays and log the payload for support.
- **Variant picker messaging:** A pill (“Device locked — change in Step 1”) sits above the iframe and a host-side overlay masks Printful’s picker row while the config keeps it read-only. If `selectedVariantIds[0]` diverges from the SnapCase picker, show an inline error with a Restart Design link so the embed re-locks to the chosen variant.
- **Uploads & telemetry:** Upload spinners and moderation toasts remain SnapCase-owned but appear outside the iframe next to the helper block. All events emit `edm_file_upload` / `edm_guardrail_warning` analytics for diagnostics consistency (see `docs/Printful_EDM_KeyFacts.md` §Diagnostics).

### Fabric fallback exception
- If `USE_EDM=false` or Printful fails to load, revert to the Fabric canvas: re-enable safe-area/camera toggles, show the DPI chip with Great/OK/Low states, and clamp the canvas width per the original Stitch spec. Label the state “Fabric fallback” above the canvas so QA screenshots remain traceable, and auto-remove these controls once EDM reconnects.

### Accessibility and Messaging
- Focus order: Back -> Helper block (“Device locked”) -> Printful iframe -> Guardrail summary -> Upload controls -> CTA column. When Fabric fallback is active, include safe-area + DPI controls in the order and ensure `role="switch"` plus `aria-checked` are present.
- Toasts, guardrail summaries, and CTA busy states use `aria-live="polite"`. The iframe receives `title="Printful Embedded Design Maker"` and the helper block includes instructions referencing Printful ownership so screen readers understand the split responsibilities.

## Screen 3 - Review and Checkout

### Layout by Breakpoint
- **Base (<640px)**: Single-column stack: AppHeader, design summary card, shipping options, address block, cost summary, quality promise, sticky ActionBar (Back to design plus Pay with Stripe). Page background `var(--snap-gray-50)` with `--space-5` horizontal padding.
- **sm (>=640px)**: Increase padding to `--space-6`; shipping cards stretch to full width but align labels and prices on one row. Promise banner widens to align with cards and uses `var(--snap-violet-50)` tint.
- **md (>=768px)**: Introduce two-column layout: column A (design summary plus shipping plus address) spans eight columns; column B (cost summary plus promise plus CTA) spans four columns and becomes sticky within the viewport (`top: var(--space-8)`). ActionBar remains for tablets that still rely on bottom actions.
- **lg (>=1024px)**: Two columns lock; ActionBar transforms into `CheckoutStickyPanel` pinned within column B with `--space-6` padding and `--radius-xl`. Cancel/resume info bar positions above the totals block and spans both columns for emphasis.
- **xl+ (>=1280px)**: Maintain content width at `container-lg`; promise banner can sit beside the cost summary if space allows, but keep reading order intact. Optional help/chat rails must not interfere with the sticky column.

### Guardrails, Cancel/Resume, Pending States
- Shipping cards form a `role="radiogroup"`; Standard is preselected, Express hidden when `SHOW_EXPRESS_SHIPPING` is false. When toggled, the pricing API recalculates subtotal, shipping, and tax; show shimmer skeleton (three lines) while pending and disable the Stripe CTA with `aria-busy="true"` plus spinner.
- Guardrail messaging covers Printful rate failures (toast "We couldn't refresh shipping. Try again?"), Express unavailability (inline helper "Express is currently unavailable for your address."), and address validation errors (inline red helper under Address block). When the address is incomplete, Stripe CTA stays disabled.
- Cancel/resume flow: If returning with `?canceled=1`, show an info banner above totals saying "No worries-your design is saved. Pick up where you left off." Banner colors use `var(--snap-blue-50)` background, `var(--snap-blue-700)` text, and optional dismiss button sized to `--space-5`. Ensure banner persists until the user completes payment or navigates away.
- Stripe handoff: CTA copy "Pay with Stripe" uses the approved Stripe lockup asset in `public/stripe/lockup.svg`. Disable CTA while `/api/checkout` is pending; on failure, re-enable and announce toast "Payment couldn't start. Please retry." Persist `shippingSpeed`, `templateId`, and pricing metadata for Printful order creation.
- **Quality Promise banner shipped (2025-11-05, Sprint02-Task05):** `/checkout` now renders the violet reassurance card at the top of column A with the canonical copy “Snapcase Quality Promise — If anything’s off, we remake it on us.” Fresh captures live at `Images/diagnostics/checkout-desktop-2025-11-05T16-48-23-099Z.png` (desktop) and `Images/diagnostics/checkout-mobile-2025-11-05T16-48-23-099Z.png` so reviewers can see the banner + CTA helper text in situ.
- **Pricing live regions implemented:** Cost summary rows, shipping helpers, and CTA busy states now use `aria-live="polite"` via the `pricing-live-region`/`shipping-live-region` announcers in `src/app/checkout/page.tsx`. Every shipping toggle logs `checkout_shipping_selected`, and totals recalculations emit `checkout_pricing_update` so accessibility + analytics stay in sync.

### Accessibility and Messaging
- Focus order: Back -> Title -> Design summary -> Edit link -> Shipping card Standard -> Shipping card Express -> Address block -> Change action -> Totals rows -> Promise banner -> Back to design -> Pay with Stripe. Column reflow on `lg+` must not change order.
- Totals updates, pricing skeleton completion, cancel/resume banner, and CTA busy state each use `aria-live="polite"`. Stripe CTA uses `aria-describedby` referencing any guardrail helper text (tax uncertainty, express unavailable). All banners meet 4.5:1 contrast; promise banner uses `var(--snap-gray-800)` text on violet tint.

## Desktop Checkout & Confirmation
- Desktop checkout commentary now lives alongside the mocks (`Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Desktop/*/snapcase-notes-delta-screen-*.md`) so engineers do not need new mockups to unblock implementation; treat those notes as deltas layered on top of the mobile specs.
- Sticky rails and CTA placements must follow the `CheckoutStickyPanel` pattern on `lg+` while retaining the ActionBar on smaller breakpoints so Stripe remains discoverable for every viewport.

### Screen 3 (Review & Shipping)
- Two-column layout (`8/4` split) kicks in at `md` with the left column covering the design summary, shipping radios, address block, and the Quality Promise banner, and the right column housing the sticky totals/Stripe CTA. Details live in `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Desktop/Screen-3-Review-and-Shipping/snapcase-notes-delta-screen-3.md`.
- Diagnostics: `Images/diagnostics/checkout-desktop-2025-11-05T16-48-23-099Z.png` (desktop) and `Images/diagnostics/checkout-mobile-2025-11-05T16-48-23-099Z.png` show the shipped promise banner, express toggle, and aria-live totals piping highlighted by the helper text under the Stripe CTA.
- Cancel/resume messaging sits above the totals rail on desktop, while Express gating helpers and shipping guardrails remain inline with the cards. CTA helper text can live under the Stripe button instead of inside the label on `lg+`.
- Sticky rails dim as a whole during Stripe handoff, but guardrail banners and marketing nav remain interactive unless Product decides to suppress them (see open question in the desktop delta doc).
- **11/05 QA gap:** The current dev preview still renders the placeholder “Review and complete your order” blurb, `Proceed to Stripe` CTA, and lacks the Quality Promise card per the accessibility snapshot (`Images/diagnostics/checkout-accessibility-2025-11-05T18-45-00Z.json:6-103`). Treat this as evidence that Sprint02-Task05 hasn’t landed in preview yet even though docs reference the updated UI.

### Screen 4 (Order Placed / Confirmation)
- Thank-you hero now mirrors the Violet badge + confetti intent: the confirmation badge, heading, reassurance copy, and order ID callout ship as shown in `Images/diagnostics/thank-you-desktop-2025-11-05T16-41-30-616Z.png` (desktop) and `Images/diagnostics/thank-you-mobile-2025-11-05T16-41-30-616Z.png` (mobile). The badge sits inside a rounded gradient card on `lg+` and collapses into a single stack on smaller breakpoints.
- The right rail carries the order summary card (order ID copy affordance, fulfillment status, shipping method) plus the design summary snapshot. Dual CTAs now match the spec: Track order (primary) deep-links to `/order/preview?from=thank-you` until the real `/order/[id]` timeline lands, while Design another rehydrates the saved template and routes back to `/design`. A delivery ETA chip and `Need help? Contact support` link sit directly beneath the buttons.
- Fulfillment timeline is live: steps map directly to Printful status guidance (`draft`→Submitted, `on_hold`→Print files, `in_progress`→In production, `shipped`→Shipped) and flip orientation using the documented breakpoint rule (vertical stacks `<lg`, horizontal rail `lg+`). Timeline state pulls from the persisted `snapcase:order-confirmation` snapshot or (for QA) a `?status=` query override until Printful order creation + webhook polling feed the real status.
- CTA clicks, copy-to-clipboard, and each timeline milestone now log analytics (`track_order_clicked`, `design_another_clicked`, `copy_order_id`, `timeline_step_revealed`) alongside `thank_you_viewed` payloads so diagnostics capture viewport + timeline orientation. Delivery ETA chips currently derive from the shipping option selected on `/checkout`; Express routing will auto-update once the Stripe shipping toggle is production-ready.
- Remaining Printful-dependent work: Track Order still points to the placeholder `/order/preview` page, and timeline state defaults to **Submitted** until `/api/order/create` issues real Printful IDs + webhook updates. Document these assumptions in diagnostics and future tickets so CX understands why live tracking isn’t wired yet.
- **11/05 QA gap:** Preview builds still show the minimal “Your case is officially in the works” stub with a single `Start another design` link (see `Images/diagnostics/thank-you-accessibility-2025-11-05T18-45-00Z.json:6-46`). The hero gradient, dual CTAs, and four-step timeline documented above are absent, so testers cannot validate Screen 4 copy without shipping the updated build.

## Guardrail Banners and Safe-Area Overlays (Deprecated – Fabric-only)
> Printful owns guardrail banners, overlays, and DPI states whenever EDM is active, so the guidance below applies only to the Fabric fallback/diagnostics path (Ref: docs/Printful_EDM_KeyFacts.md:141-165).
- **DPI toast plus modal**: Toast sits bottom-center above the ActionBar, width up to `calc(var(--space-16) * 12)` (~384px) with `--radius-lg`. On `lg+`, toast aligns with the canvas column to avoid covering the preview. Blocking modal uses `--radius-2xl`, `--space-6` padding, and centers on screen with max-width 420px.
- **Safe-area overlay indicators**: Use `var(--snap-warning)` dashed outlines and small corner badges referencing the toggle states. On `lg+`, overlays should respect device notch/camera placements even when the canvas shifts left.
- **Cancel/resume banner**: Spans the full width of the checkout content area; on base it sits directly above the totals stack with `--space-4` padding. On `lg+`, it docks to the top of column B but can span both columns if we need parity messaging. Include optional dismiss button sized to `var(--control-height)` if product wants manual dismissal (pending decision below).
- **Content policy toast**: Shares the toast container with DPI warnings; include persistent link to the policy modal for accessibility (link text `See policy`, `aria-label="See Snapcase content policy"`).

## Flow-wide Accessibility Checklist
- Maintain consistent focus order despite breakpoint rearrangements; use `tabindex` only when semantically necessary.
- Provide `aria-live="polite"` regions for detect results, DPI state changes, pricing recalculations, and guardrail banners so screen-reader users hear status changes without losing focus.
- Enforce AA contrast for all token pairings; default to `var(--snap-gray-900)` text on tinted backgrounds and ensure disabled states never drop below 3:1.
- Keep hit areas >=`var(--control-height)` and at least 44px on all axes. FABs and sticky buttons should include visible focus outlines using `var(--snap-focus-ring)`.
- Respect `prefers-reduced-motion`: disable hover lifts on cards and replace blur transitions with opacity fades <=150ms.

## UX Decision Log (2025-11-07)
1. **Desktop editor “extra” rail** — *Outcome:* No additional SnapCase rail. The rail visible in mocks is Printful’s native toolbar; SnapCase will not build a competing column until multi-pane tooling ships. Keep the current two-column layout (Printful column + order column) and reserve any future third rail for well-defined content that doesn’t shrink the iframe (Ref: `docs/Printful_EDM_KeyFacts.md` §Variant Selection & Data Flow).
2. **Cancel/resume banner dismissal** — *Outcome:* Banner stays pinned until checkout succeeds. Persistent messaging keeps CX/support history clear and avoids data gaps. If we later add a dismiss affordance it must emit analytics and leave a secondary indicator (chip/badge) in place.
3. **Guardrail toast stacking** — *Outcome:* Single queue, no stacking. DPI/content-policy/pricing toasts display sequentially in one region; critical blockers may interrupt with a modal, but simultaneous toasts are prohibited so the Printful banner remains the primary warning surface.

## Live Gap Analysis – 2025-11-04

**Inputs sampled:** `https://dev.snapcase.ai` (Desktop Chrome + iPhone 12 emulation), `Images/diagnostics/11.4.25_badCXUX.png`, `design-desktop-selected.png`, `design-mobile-selected.png`.

### Mismatches

- **High – Duplicate variant pickers (Screen 1 + Printful EDM chrome).** After a device is selected in the Snapcase grid, the Printful embed still renders its own phone/style selector (see `design-desktop-selected.png`). This contradicts the single-selection flow defined in `docs/Responsive_Blueprint.md:18-34` and the Flow 1 Screen 1 mockups (`Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Mobile/Screen-1-Pick-your-device/screen-1-img.png`). Users must reconcile two selection states and risk snapping back to the wrong variant when the EDM saves, which also violates the “one source of truth” guidance in `docs/UXCX_Guidelines.MD:26-31`. *Remediation:* Pass the already-selected `variantId/externalProductId` into the EDM via `initProduct`, accept that Printful’s picker remains visible-but-locked (Ref: docs/Printful_EDM_KeyFacts.md:85-101), surface helper copy (“Device locked — change in Step 1”), and keep the SnapCase selection summary above the canvas so context stays clear even with the read-only picker present.

- **High – Missing search/brand tabs/detect + undersized grids on desktop.** The live device list is a single max-w-5xl stack with two cards per row even at `>=1024px`, and it lacks the search bar, segmented brand tabs, and Detect affordance defined for every breakpoint in `docs/Responsive_Blueprint.md:20-25`. Flow 1 mockups show a minimum three-column grid at `md` and four at `lg`, with filters aligned in a single row; today’s layout forces long scrolling and makes it impossible to filter the catalog quickly, which undermines the blueprint’s responsive intent and the “no guesswork” rule called out in the guidelines (`docs/UXCX_Guidelines.MD:5-10`). *Remediation:* Ship the search + segmented tabs + Detect stack, promote the grid to three/four/five columns per breakpoint, and clamp the content to `container-lg` so desktop users get the breathing room promised in the blueprint.

- **Medium – Action bar/FAB is missing, so the primary CTA gets buried off-screen.** On both desktop and mobile captures, “Continue to design” lives inside a static footer card that scrolls out of view, contrary to the sticky ActionBar + floating CTA requirements described in `docs/Responsive_Blueprint.md:10-16` and Screen 1 layout notes (`docs/Responsive_Blueprint.md:20-25`). Mobile testers must scroll past the entire Printful embed to proceed, which increases abandonment and breaks the safe-area padding expectation. *Remediation:* Restore the sticky ActionBar on base/sm and the FAB on lg+; wire it to the same guardrail gating logic so the CTA is always reachable while variant cards remain in view.

- **Medium – Guardrail copy is nested and redundant.** (Resolved) We previously layered a SnapCase guardrail card under Printful’s native warnings, which confused users (`Images/diagnostics/11.4.25_badCXUX.png`). The blueprint now mandates that Printful’s banner is the sole warning surface; SnapCase only adds brief helper text outside the iframe.

## Live Gap Analysis – 2025-11-05

**Inputs sampled:** `https://dev.snapcase.ai` (Chromium 120 desktop + iPhone 14 Pro emulation), `Images/diagnostics/design-live-desktop-2025-11-05T18-29-13-147Z.png`, `Images/diagnostics/design-live-mobile-2025-11-05T18-29-13-147Z.png`, `Images/diagnostics/design-accessibility-2025-11-05T18-45-00Z.json`.

- **Helper pill + CTA copy still reflect the Scene 5 prototype.** The latest live capture never renders the documented “Variant locked to your SnapCase selection” pill or the Printful-specific CTA states. Instead, the desktop accessibility dump shows the legacy “SCENE 5 – GUARDRAILS” copy and a `Continue to design` CTA (see `Images/diagnostics/design-accessibility-2025-11-05T18-45-00Z.json:230-355`). Users never see “Resolve the Printful banner above”/“Waiting on Printful…” labels, so the guardrail expectations documented in Screen 2 remain invisible in production.
- **Guardrail summary still shows Fabric-only DPI text.** The guardrail blurb continues to read “Your artwork meets the 300 DPI target…” even when Printful reports `designValid=false` (`Images/diagnostics/edm-diagnostics-2025-11-05T19-00-00Z.json`). We are mirroring stubbed DPI text rather than the live Printful errors, so the summary contradicts the toast queue requirement and never blocks the CTA when Printful says “Please add a design!”.
- **CTA analytics never fire.** `window.__snapcaseAnalyticsEvents` stays `undefined` throughout the session, so `design_cta_state_change` / `guardrail_toast_enqueued` never record evidence. This breaks the telemetry guardrails promised in §Screen 2 and leaves Task03 instrumentation effectively disabled in preview builds.

- **Medium – Desktop editor column is cramped and lacks the optional rail.** The current layout keeps the entire experience inside `max-w-5xl`, forcing the Printful canvas, guardrail summary, and footer stack into one column. Blueprint guidance (`docs/Responsive_Blueprint.md:24-34`) allows an optional left rail and expects the editor canvas plus guardrail content to stretch within `container-lg` (~1400px) on xl screens. Without that breathing room, the toolbar overflows and the guardrail summary sits far below the fold on desktop, which is the “cramped desktop layout” called out in the diagnostic screenshot. *Remediation:* Move `/design` to the shared responsive grid, allocate a wider canvas column, and reserve the optional rail (merch/education) so future content can dock without squeezing the editor.

- **Resolved – Review & Shipping reassurance + live totals now mirror Screen 3.** Sprint02-Task05 reinstated the violet Snapcase Quality Promise banner, added the Stripe lockup CTA helper copy, and wired polite `aria-live` announcers for subtotal/shipping/tax updates in `src/app/checkout/page.tsx`. See `Images/diagnostics/checkout-desktop-2025-11-05T16-48-23-099Z.png` and `Images/diagnostics/checkout-mobile-2025-11-05T16-48-23-099Z.png` for the shipped desktop/mobile layouts.

- **Medium – Thank-you timeline still depends on placeholder data until Printful order APIs land.** The hero, summary card, dual CTAs, delivery chip, support link, and Submitted → Shipped timeline now match the mockups (see `Images/diagnostics/thank-you-desktop-2025-11-05T16-41-30-616Z.png` + `thank-you-mobile-2025-11-05T16-41-30-616Z.png`). However, Track order currently deep-links to `/order/preview`, timeline state defaults to **Submitted** unless `?status=` overrides it, and no Printful webhook or order ID exists yet. Next action: wire `/api/order/create` + webhook polling so the timeline + CTA carry real Printful order IDs/tracking links.

- **Medium – Desktop Screen 2 toolbar semantics and optional rail remain unresolved.** Diagnostics (`Images/diagnostics/11.4.25_badCXUX.png`) still show the single-column layout with the Printful toolbar compressed. Keep the optional rail collapsed until a labeled toolbar plan exists and document any experiments in the delta notes.

### Resolved – 2025-11-05

- Search input, Apple/Samsung segmented tabs, Detect CTA row, and the 2/3/4/5-column responsive grid now live in `src/app/design/page.tsx`. The layout clamps to `max-w-screen-xl` with container gutters so desktop follows the blueprint “shell + filters + grid” spec. Filtering, UA-based detect helper text, and aria-live status messaging ship alongside the new tokens.
- Sticky ActionBar (base/sm) and floating CTA pod (lg+) are restored with the guardrail helper “Back-only print” copy and the same gating logic as the summary card. Both controls source `guardrailState` so enabling/disabling stays in sync regardless of viewport.
- The editor section promotes to a two-column desktop layout with a scaffolded optional rail. Guardrail/editor cards retain rounded tokens, and an empty rail callout reminds future agents where merchandising/education content can dock without shrinking the canvas.
- Screenshot capture for the refreshed desktop layout is pending because the shared Printful EDM type error (`PFDesignMakerOptions.style.navigation`) currently blocks `next build`/`next dev`. Capture once that upstream issue is resolved so the Live Gap gallery can reflect the new implementation.

### Questions for Ethan
- Should we invest in a Fabric-only desktop experience (matching the storyboarded safe-area toggles and DPI chips) until the Printful embed lets us fully suppress their device picker/guardrails?
- Do we want Printful’s picker available as a troubleshooting fallback hidden behind a diagnostics flag, or should it be completely removed once `initProduct` is stable?
- Can we prioritize the search/detect backlog for Sprint 2, or do we need a slimmer interim (e.g., brand filter chips only) to hit the holiday beta timeline?
- Desktop Screen 1 mocks add full marketing navigation links inside AppHeader, but production keeps the simplified header. Decide whether to ship those links or keep them art-only so delta docs can mark the element as Not Started with clear intent (new screenshot required either way).

### Guardrail ownership in Printful-first UX
- **Single source of truth:** When the EDM is active, the SnapCase guardrail component now switches to “Printful mode,” collapsing the storyboard copy and surfacing the exact `designValid`, `errors[]`, and `warnings[]` payload sent via `onDesignStatusUpdate`. We avoid duplicating language already shown inside the iframe and instead summarize Printful’s banner state, variant selection, and timestamps.
- **CTA gating:** Checkout/continue CTAs stay disabled whenever Printful reports `designValid=false`, emits blocking errors, or returns a variant ID that doesn’t match the SnapCase selection. Guardrail summaries in the footer reference the Printful status first, then fall back to SnapCase DPI/safe-area logic only when EDM data is unavailable.
- **Diagnostics + telemetry:** The diagnostics card now logs whether guardrails are in `printful` or `snapcase` mode, stores the last raw `designStatus` payload, and captures every guardrail warning as analytics events (`edm_design_status`, `edm_guardrail_blocked`, `edm_guardrail_warning`). These events are driven entirely by EDM callbacks, not DOM scraping.
- **Copy expectations:** While Printful owns the warnings, SnapCase still keeps the safe-area overlay and DPI meter in place for Fabric parity. The panel’s footnote explicitly states that the Printful banner is gating the CTA whenever we’re in printful mode, setting the expectation that users must resolve their banner before SnapCase copy reappears.

## Live Gap Analysis – 2025-11-06

**Context:** Sprint02-Task11 release check for `https://dev.snapcase.ai`.

- **Alias still serves the Nov 4 slug.** `vercel inspect https://dev.snapcase.ai` reports deployment `snapcase-6ic8h47wt-snapcase.vercel.app` (`dpl_6BW1PB9tBT4uXhJBhewbtdUSbwmF` inside project `snapcase-app`). No alias changes occurred because every new deployment attempt failed before publishing.
- **Local builds remain unstable.** `npm run vercel-build` on Windows Node 22 still hits `TypeError: e[o] is not a function` while prerendering `/design` + `/checkout`. Running the same command via WSL Node 20 (nvm) progresses further but now aborts with `PageNotFoundError: Cannot find module for page: /_document`, so `.vercel/output` was never produced for `vercel deploy --prebuilt`.
- **Remote build also fails.** A fallback `vercel deploy --yes` generated slug `https://snapcase-k5tu1tq4r-snapcase.vercel.app`, but Vercel’s Linux builder exited with `npm ERR! EBADPLATFORM Unsupported platform for lightningcss-win32-x64-msvc@1.30.2`. `package-lock.json` currently lists the Windows LightningCSS binary as a top-level dependency, blocking every Linux install.
- **Diagnostics unchanged.** No new desktop/mobile captures or JSON dumps exist for 2025-11-06 because the Sprint02 UI never reached the dev alias. Once the lockfile + build issues are resolved, rerun `SNAPCASE_BASE_URL="https://dev.snapcase.ai" node scripts/run-edm-live-flow.js` and store the refreshed evidence under `Images/diagnostics/` before updating this section.
