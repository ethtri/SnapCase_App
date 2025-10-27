# Snapcase – Delta Doc (Flow 2, Screen 4: Order Tracking Errors)

**Viewport:** Mobile 390×844  
**Executive intent:** Give shoppers a calm, guided recovery path when order status or tracking data cannot be shown. Classify what they can try again versus when Snapcase must step in, reinforce support availability, and capture analytics on every failure.

## What to change vs Stitch

### A) Visual & Components
- **Shell:** Reuse `AppHeader` (back chevron, centered title, blur divider) and keep page background on `--snap-gray-50`. Body shell uses `SafeArea` padding so the error state stays vertically centered without jumping on devices with home indicators.
- **Error illustration:** Swap Tailwind ad-hoc circle for `StatusGlyph` component with violet tint token `--snap-violet-100` and `material-symbols-outlined` `warning_amber` icon. Maintain 96px circle on mobile, clamp to 120px on md+.
- **Messaging block:** Wrap heading + body copy in `EmptyState` component for consistent typography (Poppins 600 / Inter 400). Heading uses `--text-xl`, body uses `--text-sm` with 60% opacity. Ensure text color references tokens, not hex values.
- **Primary CTA:** For recoverable errors, use primary button `Retry` (height 48px, radius 16px) aligned center, width = min(320px, 100%). Loading state shows spinner left of label and sets `aria-busy=true`.
- **Support CTA:** Place secondary `Contact support` button below primary with outline style (`ActionSecondary`). On hard failures, invert hierarchy: promote Contact support to primary (violet) and demote Retry to subtle link button, per Behavior rules.
- **Informational footer:** Include caption-sized reassurance (`--text-xs`, `text-subtle`) about Snapcase investigating and expected response time (<24h) aligned with BusinessContext.

### B) Behavior & States
- **Data fetch pipeline:** On mount, call `GET /api/orders/:id/status`. If response stale (`updatedAt` > 5 min) or missing tracking, trigger background fetch to Printful (`/api/order/sync/:id`). Promise results feed a central state machine with `status`, `tracking`, `lastSyncedAt`, `errorType`, `isRecoverable`.
- **State classification:**  
  • `network_timeout`, `stripe_webhook_lag`, `printful_rate_limit` → **recoverable** (user retry possible).  
  • `carrier_missing_data` (Printful shipped but no carrier code) → **soft exception** (we show partial status, no retry).  
  • `order_failed` (Printful `failed` or `canceled`) and `webhook_signature_invalid` → **hard failure** (user cannot fix).  
  • `order_not_found` (404) only after double-checking order id → treat as hard failure, point to support.
- **Recoverable handling:** Replace content with error state, announce via polite live region. `Retry` refires both local cache refetch and Printful sync. Debounce successive retries to 5s minimum; after three failures, surface escalation banner suggesting support.
- **Carrier data missing:** Show inline message above buttons: “We’re still waiting on the carrier to post tracking. We’ll email you as soon as it’s ready.” Keep `Retry` as secondary link to refresh status but clarify expectation. Do not classify as failure for analytics; log separate event.
- **Webhook failures:** If Stripe or Printful webhook logs show last failure within past 5 minutes, display info toast “We’re refreshing your order status—check back in a minute.” Button text stays `Retry`; disable until backoff expires. Background job should enqueue webhook retry (handled server-side; ensure UI copy references that process, not new policy).
- **Printful order_failed:** Replace heading with resolution copy (see Copy section). Hide Retry, promote `Contact support` primary, and append bullet list clarifying that payment is captured and Snapcase will reprint or refund per policy. Include `support@snapcase.ai` mailto in support sheet and reference reprint promise.
- **Support CTA behavior:** Button opens existing Contact Support bottom sheet (reuse Flow 2 Screen 1 pattern) showing FAQ link plus `support@snapcase.ai` mailto. Prepopulate message subject with `Order {id} – tracking issue` for triage. No new escalation policy introduced.
- **Navigation:** Back chevron routes to previous screen (`/order/:id` parent timeline). Preserve referring params so analytics stay linked. If user navigates back after retry success, restore timeline view with updated data.
- **Error logging:** Every state change dispatches structured log (`order_tracking_error`) with `orderId`, `errorType`, `retryCount`, `responseTime`. Ensure logs also send to monitoring channel for ops follow-up.

### C) Accessibility
- **Focus management:** On entering the error view, move focus to the heading container with `tabIndex=-1` and `role="alertdialog"` for hard failures; use `role="status"` for recoverable alerts to avoid trapping focus. Ensure Back button remains first in tab order when header is focused.
- **Live regions:** Error message sits in `aria-live="assertive"` for hard failures and `aria-live="polite"` for recoverables. Retry success posts “Order details refreshed” to the same region.
- **Button semantics:** While retrying, set `Retry` to `aria-disabled="true"` and toggle `aria-live` announcement “Refreshing order status.” Support button includes `aria-describedby` pointing to a span containing response time expectation.
- **Icon alt text:** Provide visually hidden text “Order status error” before icon. Icon itself should be `aria-hidden="true"`.
- **Keyboard:** Ensure Escape closes support sheet, Enter/Space triggers buttons, and focus returns to originating button on sheet close.

### D) Copy & Voice
- **Header:** `Track Order`
- **Recoverable headline:** **We couldn’t load your order just now.**  
  Body: **“Let’s try that again—connection hiccups happen.”**
- **Carrier missing copy:** Inline helper: **“We’re still waiting on the carrier to post tracking. We’ll email you as soon as it’s ready.”**
- **Retry button:** `Retry`
- **Hard failure headline:** **We’re on it—your order needs a hand.**  
  Body: **“Printful hit a snag finishing this order. Tap Support so we can remake or refund it fast.”**
- **Support CTA label:** `Contact support`
- **Footer reassurance:** **“Snapcase support replies within 24 hours.”**
- Tone remains optimistic, direct, avoids blaming the user, and reaffirms Snapcase Quality Promise.

### E) Analytics (snake_case)
- `order_tracking_error_viewed { order_id, error_type, is_recoverable, retry_count }`
- `order_tracking_retry_clicked { order_id, error_type, retry_count }`
- `order_tracking_retry_succeeded { order_id, attempts, response_source: "cache"|"printful" }`
- `order_tracking_support_clicked { order_id, error_type, classification: "hard"|"soft" }`
- `order_tracking_carrier_pending_viewed { order_id, carrier: null, last_status_age_minutes }`
- `order_tracking_webhook_backoff_shown { order_id, webhook_type: "printful"|"stripe" }`

### F) Acceptance Criteria
- Error state uses shared components (`AppHeader`, `EmptyState`, `ActionPrimary/Secondary`) and brand tokens; no hard-coded hex values remain.
- State machine correctly classifies recoverable vs hard failures and toggles CTA hierarchy, copy, and analytics payloads accordingly.
- Retry button debounces to 5s minimum, shows loader, and announces status changes; support CTA always opens bottom sheet with prefilled subject referencing order id.
- Live regions, focus handling, and alert roles meet WCAG 2.1 AA; keyboard-only users can exit support sheet and trigger retries without losing context.
- Analytics events fire for each transition and include `order_id`, with schemas documented in tracking plan.
- Logs capture error context for ops, and UI messaging references the <24h support SLA from BusinessContext without inventing new policies.

### G) Responsive Notes
- **Mobile (base–sm):** Keep content vertically centered with `min-height: calc(100vh - header)`; buttons stack with `--space-4` gaps and stretch edge-to-edge minus `--space-6` horizontal padding.
- **md (≥768px):** Expand illustration to 120px, clamp content block to 480px and center horizontally. Support CTA aligns inline with Retry when both visible; switch to side-by-side layout using `gap: --space-4`.
- **lg (≥1024px):** Position error card in right column of status layout while left column retains timeline or helpful tips. Ensure support sheet anchors to right rail but still full-screen modal on touch devices.
- Respect `prefers-reduced-motion`: fade/scale transitions on error entry should reduce to opacity only.

