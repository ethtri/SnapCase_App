# Snapcase â€” Delta Doc (Screen 4: Order Placed / Confirmation)

**Viewport:** Mobile 390Ã—844  
**Executive intent:** Celebrate the purchase, set clear fulfilment expectations, and create a confident bridge to tracking and future designs while staying on-brand and AA-accessible.

> **Section Status**
>
> | Section | Status | Notes |
> | --- | --- | --- |
> | A) Visual & Content Hierarchy | Authoritative | Aligns with Printful status feed + order summary flows. |
> | B) Interaction & Behavior | Authoritative | Ties directly to Printful order webhooks documented in `docs/Printful_EDM_KeyFacts.md:289-310`. |
> | C) Messaging / Tone | Authoritative | No Printful conflicts. |
> | D) Fulfilment & Status Expectations | Authoritative | Mirrors Printful status progression. |
> | E) Accessibility | Authoritative | Applies regardless of fulfillment backend. |
> | F) Analytics | Authoritative | Events still required for post-purchase telemetry. |

> **Delta Status (2025-11-05)**
>
> | Mockup element | Reality snapshot | Status |
> | --- | --- | --- |
> | Hero badge + confetti moment | Current `/thank-you` page is a static hero with body copy only; blueprint flags this as placeholder content needing a new diagnostics capture once the designed hero ships. | Not Started |
> | Status timeline (Created → In production → Shipped) | Not yet implemented; blueprint’s Screen 4 section calls it out as missing in today’s build. | Not Started |
> | Track Order CTA + design summary CTAs | Live page only has “Start another design” and does not pass template/variant context back to `/design`, so both CTAs remain outstanding per blueprint notes. | Not Started |
> | Order ID copy affordance + delivery ETA chip | No order ID pill, copy button, or delivery chip exists; blueprint Live Gap Analysis lists this as a high-priority mismatch. | Not Started |
> | Support link + SMS/email acknowledgement | Support link + notification acknowledgement copy referenced in this doc remain unimplemented while `/thank-you` stays in placeholder state. | Not Started |

## What to change vs Stitch baseline

### A) Visual & Content Hierarchy
1. **Hero confirmation**
   - Maintain Snap Violet primary token (`--snap-violet`) for the checkmark badge; glow animation on load (â‰¤400â€¯ms fade/scale).
   - Heading: **â€œOrder placed!â€** (Title Case), `var(--font-display)` `--font-semibold` at `--text-3xl` (step up to `--text-4xl` when localization needs extra width).
   - Subheading: `Your order ID is #{{order_number}}` `var(--font-body)` `--text-base`; expose copy-to-clipboard icon (outlined, `--space-5`) with tooltip “Copy ID” (uses standard hover/focus states from the design system).

2. **Celebration moment**
   - Confetti micro-animation or sparkles burst once on first render; respect `prefers-reduced-motion` (show static shimmer instead).
   - Secondary line under hero: â€œWeâ€™ll email updates as your case moves through production.â€

3. **Status timeline**
   - 3 nodes (Created â†’ In production â†’ Shipped) mapped to Printful events; left-to-right progress bar uses design system neutral/brand tokens.
   - Active step fills with solid Snap Violet + check glyph; future steps stay outlined in `var(--snap-cloud-border)`.
   - Include sub-labels beneath each step (`var(--font-body)` `--font-medium` at `--text-xs`) and optional timestamp chips once available (e.g., â€œToday, 2:14â€¯PMâ€).

4. **Cards stack**
   - Order summary, Ship-to, Payment remain in rounded cards (`--radius-xl`, `--shadow-md` per tokens). Align card headings with Screen 3 (`var(--font-body)` `--font-semibold` at `--text-lg`).
   - Order summary image uses existing safe-area thumbnail; if missing, show neutral silhouette placeholder consistent with Screenâ€¯1 grid guidance.

5. **CTA group**
   - Primary button: **Track order** (fills Snap Violet, `var(--control-height)` tall) deep-links to `/order/{{id}}`.
   - Secondary: **Design another** tinted button (use `var(--snap-violet-50)` on light, ~30% tint variant on dark) that routes to `/design` carrying `templateId` when available.
   - Provide tertiary text link below buttons: â€œNeed help? Contact supportâ€ linking to `/support` (matches global footer style).

6. **Tone & reassurance**
   - Add small reassurance chip below CTAs: â€œEstimated delivery: {{shipping_estimate}}â€ (pull from checkout selection). Uses success tone (`--snap-success` for icon) but ensures AA contrast.

### B) Interaction & Behavior
1. **Timeline state engine**
   - Default state highlights â€œCreatedâ€. On Printful `order_updated` push, advance to â€œIn productionâ€; `package_shipped` reveals â€œShippedâ€ with tracking chip (carrier + track link).
   - Each update animates node fill (200â€¯ms) and scrolls timeline into view using smooth scrolling (respect reduced-motion).

2. **Track order CTA**
   - On tap, push route with `replace=false` to allow back navigation; append query `?from=thank-you` for analytics.
   - If network offline, show inline banner â€œWe couldnâ€™t open trackingâ€”try again once youâ€™re back online.â€ (use existing global offline component).

3. **Design another CTA**
   - Prefill `/design` with last `templateId` and `variantId` so users can remix quickly; show toast â€œDesign loadedâ€”tweak anything before you reorder.â€

4. **Email + SMS follow-up**
   - Acknowledge confirmation email: â€œReceipt sent to {{email}}.â€ If user opted into SMS updates, include â€œWeâ€™ll text you when it ships.â€

5. **Dark mode parity**
   - Reuse dark tokens from design system; ensure timeline connectors meet AA on dark backgrounds (increase opacity to 60%).

6. **Support fallback**
   - If Printful status returns `order_failed`, show inline alert card (warning token) with CTA â€œContact supportâ€ while keeping celebration copy intact.

### C) Messaging / Tone
1. Keep voice warm, concise, future-oriented (â€œYour custom case is officially in motion.â€).
2. Mention single-sided print constraint once (linking to policy doc referenced earlier delta).
3. Reinforce brand promise: â€œPrinted by our US partner, usually ships within 2 business days.â€
4. Avoid duplicating Screenâ€¯3 copy; reference existing shipping promise tokens (`shipping_promise_short` from content library).

### D) Fulfilment & Status Expectations
1. Map backend events to timeline copy exactly: Created (Stripe success), In production (Printful processing), Shipped (Printful package). Leave placeholders for future â€œOut for delivery/Deliveredâ€.
2. Include microcopy under timeline: â€œStatus updates come from Printfulâ€™s production feed; refresh to check for new events.â€
3. Tracking button should append carrier deep link once shipped; prior to shipment open `/order/:id` anchored at timeline section.

### E) Accessibility
1. Confirmation hero announced via `role="status"` on load (polite); order ID copy button labeled `aria-label="Copy order ID"`.
2. Timeline implemented as ordered list with `aria-current="step"` on active node; ensure 44â€¯px touch targets for each node.
3. Focus order: Back â†’ Hero heading â†’ Copy ID â†’ Timeline nodes â†’ Cards (in reading order) â†’ Track order â†’ Design another â†’ Support link.
4. Confetti respects `prefers-reduced-motion`; provide fallback visual (static gradient).
5. High contrast validation for tinted secondary CTA on both palettes (â‰¥4.5:1).

### F) Analytics (snake_case)
- `thank_you_viewed { order_id, shipping_method, template_id?, total, currency }`
- `timeline_step_revealed { order_id, step }` (fire when node becomes active)
- `track_order_clicked { order_id, origin: "thank_you" }`
- `design_another_clicked { order_id, template_id?, variant_id }`
- `support_link_clicked { order_id }`
- `copy_order_id { order_id }`

### G) Acceptance Criteria
- Hero confirmation renders with dynamic order number, copy-to-clipboard works with feedback toast.
- Timeline advances on webhook events, persists state on reload, handles duplicate events idempotently.
- Track order CTA navigates correctly on/offline; design another preloads template where available.
- Email/SMS acknowledgement copy reflects actual notification settings.
- Page meets AA contrast, 44â€¯px hit targets, valid focus states, animations honor reduced-motion.

## Responsive Notes
- On â‰¥md widths, hero and timeline left-align within 8-column max-width container (align with Screenâ€¯1/2 responsive rules); cards sit two-up when space allows.
- Timeline connectors switch to horizontal layout on mobile, vertical on desktop (use container queries from design system utilities).
- CTA buttons remain stacked â‰¤768â€¯px; switch to inline pair with even width â‰¥768â€¯px while maintaining minimum 44â€¯px height.
- Confetti animation area scales with viewport but capped to container bounds to prevent scroll jumps.




