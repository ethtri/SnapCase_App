# Snapcase - Delta Doc (Screen 3: Review & Shipping)

**Viewport:** Mobile 390x844  
**Executive intent:** Let shoppers confirm design, shipping, and costs with zero surprises before handing off to Stripe; reassure them about Snapcase quality and fulfillment.

## What to change vs Stitch

### A) Visual & Components
1. **Page shell**
   - Body background uses `--snap-gray-50`; cards on `--snap-white` w/ shadow `--shadow-md`.
   - Sticky header reuses global `AppHeader` pattern from Screen 1 (back chevron left, centered title, blur + 1px divider).
   - Title copy: **Review & Shipping** (Title Case), Poppins 600 20px.
2. **Design summary card**
   - Reuse `DesignSummary` component from Screen 2 handoff: 16px radius, 20px internal padding, Snap Violet focus ring on keyboard focus.
   - Thumbnail uses stored template preview (same aspect ratio + rounded border as device cards).
   - Swap "Edit" text button for tertiary style defined in design system (Snap Violet text, icon 20px, hover underline).
3. **Shipping option cards**
   - Convert to `RadioCard` component: 16px radius, 1px `--snap-gray-200` border, 12px vertical padding.
   - Selected state: 2px Snap Violet ring + soft `--snap-focus-ring` glow; radio uses 20px token; focus ring visible & non-overlapping.
   - Copy: **Standard (3-5 business days)**, **Express (1-2 business days)**; price pulls from pricing service, right-aligned Inter 600.
   - Hide Express card entirely when `SHOW_EXPRESS_SHIPPING` false; maintain card spacing.
4. **Ship-to block**
   - Reuse global `AddressCard` (16px radius, 20px padding, line height 20px) with text locking to sentence case.
   - `Change` action uses tertiary button style with right chevron icon.
5. **Cost breakdown**
   - Use `CostSummary` component: stacked rows 12px spacing, typography Inter 14/16.
   - Totals row uses Poppins 600 18px; amounts formatted via currency util; include tooltip icon for tax when location uncertain.
   - Divider 1px `--snap-gray-200` full width.
6. **Quality reassurance**
   - Replace blue block with branded `PromiseBanner`: Snap Violet tint at 10% (#7C3AED1A), icon `shield_star` 24px tint Snap Violet.
   - Copy: Heading **Snapcase Quality Promise**, body **"If anything's off, we remake it on us."**
7. **Sticky CTA bar**
   - Reuse bottom `ActionBar` component from Screens 1/2: safe-area padding, blur, 1px top border.
   - Left button: tertiary **Back to design** (outline style). Right CTA: primary Snap Violet button labeled **Pay with Stripe** with Stripe wordmark lockup asset (replace ad-hoc SVG with approved asset).
   - CTA height 48px, 16px radius, disabled state Cloud background + 60% label.

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
   - On return with `?canceled=1`, show inline info bar above totals: **"No worries—your design is saved. Pick up where you left off."**; keep shipping selection and pricing.
   - Track cancellations without forcing refresh; CTA remains active.
7. **Post-payment**
   - On redirect success, `/thank-you` should already create Printful order; ensure this screen stores `shippingSpeed` and `templateId` in checkout metadata for order creation (no duplicates).
8. **Error & edge cases**
   - If Express selected but Printful API reports unavailable, auto-switch to Standard and surface toast.
   - Handle tax lookup failure by showing `--` with helper **"Tax calculated at Stripe."**
   - If session expired (template missing), show blocking modal **"We saved your design, but need a fresh preview. Reload?"** with reload CTA.

### C) Accessibility
- Focus order: Back button → Title → Design summary → Edit → Shipping cards (Standard then Express) → Address block → Change → Totals rows → Promise banner → Back to design → Pay with Stripe.
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
- Layout matches design tokens (spacing 20px blocks, 16px card radius, Snap Violet CTA) and reuses shared components.
- Standard shipping pre-selected; Express gated by flag and availability; pricing recalculates within 500ms on change with skeleton placeholder.
- Stripe CTA disabled during async call; on cancel, info bar appears and state persists.
- Address edits validate via existing rules (required fields, country-led format); inability to validate blocks CTA with inline messaging.
- All analytics events fire with payloads above; debug mode logs to console.
- AA contrast, focus states, `aria-live` handlers implemented; keyboard navigation passes (Tab/Shift+Tab cycles, Enter/Space toggles radios).

### G) Responsive Notes
- Mobile-first single column; on ≥768px introduce 2-column layout: left column design + shipping, right column totals + promise + CTA stacked (CTA still anchored bottom on mobile, becomes right column sticky on desktop).
- Sticky ActionBar respects device safe area; on desktop convert to `CheckoutStickyPanel` anchored within right column with 24px padding and 64px max width.
- Ensure hero background remains `--snap-gray-50`; avoid full-width tinted sections so content doesn't feel boxed on large screens.

