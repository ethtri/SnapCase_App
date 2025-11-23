# Snapcase - Delta Doc (Screen 3: Review & Shipping)

**Viewport:** Mobile 390x844  
**Executive intent:** Let shoppers confirm design, shipping, and costs with zero surprises before handing off to Stripe; reassure them about Snapcase quality and fulfillment.

> **Section Status**
>
> | Section | Status | Notes |
> | --- | --- | --- |
> | A) Visual & Components | Authoritative | Matches Responsive Blueprint + Printful pricing callbacks (`docs/Printful_EDM_KeyFacts.md:104-136`). |
> | B) Behavior & States | Authoritative | Checkout flow still mirrors current EDM handoff. |
> | C) Accessibility | Authoritative | Applies to Printful + Stripe flows. |
> | D) Copy & Voice | Authoritative | Voice/tone unchanged. |
> | E) Analytics | Authoritative | Events required for funnel coverage. |
> | F) Acceptance Criteria | Authoritative | No Printful conflicts. |
> | G) Responsive Notes | Authoritative | Aligns with Responsive Blueprint Section 3. |

> **Delta Status (2025-11-05)**
>
> | Mockup element | Reality snapshot | Status |
> | --- | --- | --- |
> | Shipping cards + Express gating | Standard/Express radios run off Printful pricing with inline helpers per the blueprint guardrail section. | Shipped |
> | Cancel/resume banner | `/checkout` now surfaces the “No worries—your design is saved” banner when `?canceled=1`, matching blueprint guidance. | Shipped |
> | Snapcase Quality Promise banner | Still missing in React; blueprint flags it as an open gap and calls for a new diagnostics capture once reinstated. | Not Started |
> | Pricing skeletons + `aria-live` totals updates | Current build lacks the `aria-live="polite"` hooks required by the blueprint to announce re-pricing; treat as outstanding work. | Not Started |
> | Stripe lockup asset + CTA helper text | CTA still uses plain text; blueprint’s Stripe handoff note requires the approved lockup asset and Printful-first helper copy. | Not Started |

## What to change vs Stitch

### A) Visual & Components
1. **Page shell**
   - Body background uses `--snap-gray-50`; cards on `--snap-white` w/ shadow `--shadow-md`.
   - Sticky header reuses global `AppHeader` pattern from Screen 1 (back chevron left, centered title, blur + divider `calc(var(--space-1) / 4)`).
   - Title copy: **Review & Shipping** (Title Case), `var(--font-display)` `--font-semibold` at `--text-xl`.
2. **Design summary card**
   - Reuse `DesignSummary` component from Screen 2 handoff: `--radius-xl` corners, `--space-5` internal padding, `var(--snap-violet)` focus ring on keyboard focus.
   - Thumbnail uses stored template preview (same aspect ratio + rounded border as device cards).
   - Swap "Edit" text button for tertiary style defined in design system (Snap Violet text, icon `--space-5`, hover underline).
3. **Shipping option cards**
   - Convert to `RadioCard` component: `--radius-xl`, border `calc(var(--space-1) / 4)` in `var(--snap-gray-200)`, `--space-3` vertical padding.
   - Selected state: border `calc(var(--space-1) / 2)` in `var(--snap-violet)` + soft `--snap-focus-ring` glow; radio uses the `--space-5` token; focus ring visible & non-overlapping.
   - Copy: **Standard (3-5 business days)**, **Express (1-2 business days)**; price pulls from pricing service, right-aligned `var(--font-body)` with `--font-semibold` weight.
   - Hide Express card entirely when `SHOW_EXPRESS_SHIPPING` false; maintain card spacing.
4. **Ship-to block**
   - Reuse global `AddressCard` (`--radius-xl`, `--space-5` padding, line height `--text-base`) with text locking to sentence case.
   - `Change` action uses tertiary button style with right chevron icon.
5. **Cost breakdown**
   - Use `CostSummary` component: stacked rows `--space-3` spacing, typography `var(--font-body)` at `--text-sm`/`--text-base`.
   - Totals row uses `var(--font-display)` `--font-semibold` at `--text-lg`; amounts formatted via currency util; include tooltip icon for tax when location uncertain.
   - Divider `calc(var(--space-1) / 4)` `--snap-gray-200` full width.
6. **Quality reassurance**
   - Replace blue block with branded `PromiseBanner`: `var(--snap-violet-50)` tint, icon `shield_star` `--space-6` tinted `var(--snap-violet)`.
   - Copy: Heading **Snapcase Quality Promise**, body **"If anything's off, we remake it on us."**
7. **Sticky CTA bar**
   - Reuse bottom `ActionBar` component from Screens 1/2: safe-area padding, blur, top border `calc(var(--space-1) / 4)`.
   - Left button: tertiary **Back to design** (outline style). Right CTA: primary Snap Violet button labeled **Pay with Stripe** with Stripe wordmark lockup asset (replace ad-hoc SVG with approved asset).
   - CTA height `--space-12`, radius `--radius-xl`, disabled state `var(--snap-cloud)` background + 60% label tone.

### B) Behavior & States
1. **Data appetite**
   - Design summary pulls `deviceModel`, `caseStyle`, `finish`, `templateId` from Screen 2 context; `Edit` routes back to `/design` preserving state via query/session.
   - Thumbnail refreshes from latest EDM render or fallback canvas export.
2. **Shipping selection**
   - Default to Standard; if user previously selected Express, persist via local store or session cookie.
   - When Express hidden by flag or unavailable from Printful rates, fall back to Standard and show helper copy: **"Express is currently unavailable for your address."**
3. **Pricing sync**
   - On option change, recalc shipping/tax/total using `pricing.calculate({ variantId, templateId, shippingSpeed })`.
   - Show skeleton shimmer (3 lines) for totals while recomputing.
   - Handle Printful cost API errors with toast: **"We couldn't refresh shipping. Try again?"** and keep prior values.
4. **Address management**
   - `Change` opens bottom sheet using existing `AddressSheet` from checkout; allows edit and validation before returning.
   - If address incomplete, block proceed and show inline red helper under address block.
5. **Stripe handoff**
   - Primary CTA validates shipping selection, persists checkout payload (`shippingSpeed`, `price`, `templateId`) then calls `POST /api/checkout`.
   - Disable CTA and show loading spinner while request pending; on network failure re-enable and show toast **"Payment couldn't start. Please retry."**
6. **Stripe cancel/resume**
   - On return with `?canceled=1`, show inline info bar above totals: **"No worriesâ€”your design is saved. Pick up where you left off."**; keep shipping selection and pricing.
   - Track cancellations without forcing refresh; CTA remains active.
7. **Post-payment**
   - On redirect success, `/thank-you` should already create Printful order; ensure this screen stores `shippingSpeed` and `templateId` in checkout metadata for order creation (no duplicates).
8. **Error & edge cases**
   - If Express selected but Printful API reports unavailable, auto-switch to Standard and surface toast.
   - Handle tax lookup failure by showing `--` with helper **"Tax calculated at Stripe."**
   - If session expired (template missing), show blocking modal **"We saved your design, but need a fresh preview. Reload?"** with reload CTA.

### C) Accessibility
- Focus order: Back button â†’ Title â†’ Design summary â†’ Edit â†’ Shipping cards (Standard then Express) â†’ Address block â†’ Change â†’ Totals rows â†’ Promise banner â†’ Back to design â†’ Pay with Stripe.
- Shipping cards use `role="radiogroup"` wrapper, each card `role="radio"` with `aria-checked`, entire card clickable, radio visible for screen readers.
- Totals updates announced via `aria-live="polite"` region to convey pricing changes.
- CTA loading state sets `aria-busy="true"` and announces **"Contacting Stripe"**.
- Ensure 4.5:1 contrast: Snap Violet on white & gray text on tinted background validated; if using tinted banner, ensure text uses `--snap-gray-800`.
- Respect `prefers-reduced-motion`: disable card hover lifts, use opacity fades only.

### D) Copy & Voice
- Header: **Review & Shipping**.
- Design card labels: `Case for {deviceModel}`; subtext `{finishName} finish`.
- Shipping helper (optional): **"Ships from our US hub. Duties may apply internationally."**
- Address block uses multiline formatting, no commas at line ends.
- Error toast copy from Behavior 6/8; success states keep brand voice playful but clear.

### E) Analytics (snake_case)
- `checkout_review_viewed { device_model, case_style, finish, shipping_options_shown }`
- `shipping_option_selected { option, price, source: "printful"|"cached" }`
- `address_change_clicked { has_existing }`
- `address_updated { validation_result }`
- `checkout_review_edit_design { source: "review_card" }`
- `checkout_review_pay_clicked { option, subtotal, shipping, tax }`
- `checkout_review_pay_failed { error_type }`
- `stripe_checkout_canceled { option }`
- `shipping_option_unavailable { option, reason }`

### F) Acceptance Criteria
- Layout matches design tokens (spacing `--space-5` blocks, `--radius-xl` card corners, Snap Violet CTA) and reuses shared components.
- Standard shipping pre-selected; Express gated by flag and availability; pricing recalculates within 500ms on change with skeleton placeholder.
- Stripe CTA disabled during async call; on cancel, info bar appears and state persists.
- Address edits validate via existing rules (required fields, country-led format); inability to validate blocks CTA with inline messaging.
- All analytics events fire with payloads above; debug mode logs to console.
- AA contrast, focus states, `aria-live` handlers implemented; keyboard navigation passes (Tab/Shift+Tab cycles, Enter/Space toggles radios).

### G) Responsive Notes
- Mobile-first single column; on â‰¥768px introduce 2-column layout: left column design + shipping, right column totals + promise + CTA stacked (CTA still anchored bottom on mobile, becomes right column sticky on desktop).
- Sticky ActionBar respects device safe area; on desktop convert to `CheckoutStickyPanel` anchored within right column with `--space-6` padding and `--space-16` max width.
- Ensure hero background remains `--snap-gray-50`; avoid full-width tinted sections so content doesn't feel boxed on large screens.






