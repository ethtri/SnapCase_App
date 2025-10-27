# Snapcase — Delta Doc (Screen 4: Order Placed / Confirmation)

**Viewport:** Mobile 390×844  
**Executive intent:** Celebrate the purchase, set clear fulfilment expectations, and create a confident bridge to tracking and future designs while staying on-brand and AA-accessible.

## What to change vs Stitch baseline

### A) Visual & Content Hierarchy
1. **Hero confirmation**
   - Maintain Snap Violet primary token (`--snap-violet`) for the checkmark badge; glow animation on load (≤400 ms fade/scale).
   - Heading: **“Order placed!”** (Title Case), Poppins 600, 28–32 px depending on locale length.
   - Subheading: `Your order ID is #{{order_number}}` Inter 16 px; expose copy-to-clipboard icon (outlined, 20 px) with tooltip “Copy ID” (uses standard hover/focus states from the design system).

2. **Celebration moment**
   - Confetti micro-animation or sparkles burst once on first render; respect `prefers-reduced-motion` (show static shimmer instead).
   - Secondary line under hero: “We’ll email updates as your case moves through production.”

3. **Status timeline**
   - 3 nodes (Created → In production → Shipped) mapped to Printful events; left-to-right progress bar uses design system neutral/brand tokens.
   - Active step fills with solid Snap Violet + check glyph; future steps stay Cloud 200 outline.
   - Include sub-labels beneath each step (Inter 12 px, medium) and optional timestamp chips once available (e.g., “Today, 2:14 PM”).

4. **Cards stack**
   - Order summary, Ship-to, Payment remain in rounded cards (radius 16 px, shadow-md per tokens). Align card headings with Screen 3 (Inter 18 px, bold).
   - Order summary image uses existing safe-area thumbnail; if missing, show neutral silhouette placeholder consistent with Screen 1 grid guidance.

5. **CTA group**
   - Primary button: **Track order** (fills Snap Violet, 44–48 px tall) deep-links to `/order/{{id}}`.
   - Secondary: **Design another** tinted button (violet 20% tint on light, 30% on dark) that routes to `/design` carrying `templateId` when available.
   - Provide tertiary text link below buttons: “Need help? Contact support” linking to `/support` (matches global footer style).

6. **Tone & reassurance**
   - Add small reassurance chip below CTAs: “Estimated delivery: {{shipping_estimate}}” (pull from checkout selection). Uses success tone (`--snap-success` for icon) but ensures AA contrast.

### B) Interaction & Behavior
1. **Timeline state engine**
   - Default state highlights “Created”. On Printful `order_updated` push, advance to “In production”; `package_shipped` reveals “Shipped” with tracking chip (carrier + track link).
   - Each update animates node fill (200 ms) and scrolls timeline into view using smooth scrolling (respect reduced-motion).

2. **Track order CTA**
   - On tap, push route with `replace=false` to allow back navigation; append query `?from=thank-you` for analytics.
   - If network offline, show inline banner “We couldn’t open tracking—try again once you’re back online.” (use existing global offline component).

3. **Design another CTA**
   - Prefill `/design` with last `templateId` and `variantId` so users can remix quickly; show toast “Design loaded—tweak anything before you reorder.”

4. **Email + SMS follow-up**
   - Acknowledge confirmation email: “Receipt sent to {{email}}.” If user opted into SMS updates, include “We’ll text you when it ships.”

5. **Dark mode parity**
   - Reuse dark tokens from design system; ensure timeline connectors meet AA on dark backgrounds (increase opacity to 60%).

6. **Support fallback**
   - If Printful status returns `order_failed`, show inline alert card (warning token) with CTA “Contact support” while keeping celebration copy intact.

### C) Messaging / Tone
1. Keep voice warm, concise, future-oriented (“Your custom case is officially in motion.”).
2. Mention single-sided print constraint once (linking to policy doc referenced earlier delta).
3. Reinforce brand promise: “Printed by our US partner, usually ships within 2 business days.”
4. Avoid duplicating Screen 3 copy; reference existing shipping promise tokens (`shipping_promise_short` from content library).

### D) Fulfilment & Status Expectations
1. Map backend events to timeline copy exactly: Created (Stripe success), In production (Printful processing), Shipped (Printful package). Leave placeholders for future “Out for delivery/Delivered”.
2. Include microcopy under timeline: “Status updates come from Printful’s production feed; refresh to check for new events.”
3. Tracking button should append carrier deep link once shipped; prior to shipment open `/order/:id` anchored at timeline section.

### E) Accessibility
1. Confirmation hero announced via `role="status"` on load (polite); order ID copy button labeled `aria-label="Copy order ID"`.
2. Timeline implemented as ordered list with `aria-current="step"` on active node; ensure 44 px touch targets for each node.
3. Focus order: Back → Hero heading → Copy ID → Timeline nodes → Cards (in reading order) → Track order → Design another → Support link.
4. Confetti respects `prefers-reduced-motion`; provide fallback visual (static gradient).
5. High contrast validation for tinted secondary CTA on both palettes (≥4.5:1).

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
- Page meets AA contrast, 44 px hit targets, valid focus states, animations honor reduced-motion.

## Responsive Notes
- On ≥md widths, hero and timeline left-align within 8-column max-width container (align with Screen 1/2 responsive rules); cards sit two-up when space allows.
- Timeline connectors switch to horizontal layout on mobile, vertical on desktop (use container queries from design system utilities).
- CTA buttons remain stacked ≤768 px; switch to inline pair with even width ≥768 px while maintaining minimum 44 px height.
- Confetti animation area scales with viewport but capped to container bounds to prevent scroll jumps.
