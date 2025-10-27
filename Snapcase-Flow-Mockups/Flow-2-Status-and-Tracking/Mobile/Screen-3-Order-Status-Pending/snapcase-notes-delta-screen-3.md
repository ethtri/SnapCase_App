# Snapcase - Delta Doc (Flow 2 Screen 3: Order Status - Pending)

**Viewport:** Mobile 390x844  
**Executive intent:** Keep shoppers calm while Printful finishes production, surface the next status ETA, and provide clear refresh and escalation controls without leaving the tracking flow.

## What to change vs Stitch

### A) Visual & Components
1. **Page shell**
   - Reuse `OrderStatusLayout` from Screen 1: background `--snap-gray-50`, content card on `--snap-white`, global `AppHeader` with back chevron, centered title, and order number subtext (`Order #SC-{id}`) in Inter 14.
   - Header actions: right slot hosts a subtle `help` icon button (Snap Violet outline) that opens the support sheet; hide on desktop where the support rail will surface instead.
2. **Sticky status banner**
   - Replace the centered hero circle with a `StatusBanner` card that sits directly below the header and stays sticky (`position: sticky`) with `top: headerHeight + safeAreaInset`.
   - Card styling: `--radius-xl`, `padding: var(--space-5)`, background `--snap-violet` at 0.08 opacity, icon chip (36px) using `hourglass_empty` in Snap Violet, Inter 16 body text.
   - Banner content: heading **"Your case is in production"**, supporting line **"We run the presses in batches and keep you posted the moment it ships."**
3. **Progress timeline**
   - Persist the four-step timeline from Screen 1 under the banner; mark `Created` and `In production` as complete, upcoming steps muted.
   - On mobile the timeline is horizontal and scrollable if needed; on `md+` it snaps into a full-width bar with labels underneath. Use `aria-current="step"` for the active stage.
4. **Refresh module**
   - Convert the stitched `Retry` button into the standard `Button` primary: label **"Refresh status"**, Snap Violet background, `--radius-xl`, height 48px.
   - Beneath the button add secondary helper copy (Inter 14, `--snap-gray-600`): **"Auto-refresh in {countdown}s - Last checked {hh:mm a}"**.
   - Include a subtle tertiary text link **"View tracking FAQ"** aligned center; tap opens Docs article in a modal sheet.
5. **Support and reassurance**
   - Add an outline button beneath the refresh helper: **"Contact support"** uses secondary button style; place `chevron_right` icon 20px.
   - Follow with reassurance note in `PromiseBanner` style: Snap Violet shield icon, copy **"If anything looks off, we remake it on us."**
6. **Empty footprint handling**
   - Ensure vertical spacing respects `--space-6` between sections so that when the sticky banner collapses (desktop) the rest of the content still centers without large gaps.

### B) Behavior & States
1. **Auto-refresh cadence**
   - `useOrderStatus(orderId)` should poll `GET /api/order/{id}/status` (server reads Printful) every 30 seconds for the first 10 minutes while status is `created` or `processing`.
   - After 10 minutes with no status change, back off to a 120-second interval; after 30 minutes back off to 5 minutes and surface the escalation helper described below.
   - Apply 10 percent jitter to intervals to avoid thundering herd, and suspend polling when `document.visibilityState === "hidden"`.
2. **Manual refresh**
   - Primary button triggers an immediate refetch (debounced to once every 10 seconds). While fetching, disable the button, show inline spinner, and set `aria-busy="true"`.
   - On success, announce **"Status checked at {time}"** via `aria-live="polite"` and reset the auto-refresh countdown. On failure, show inline error text **"We could not reach Printful. We will retry automatically."** and log analytics.
3. **State transitions**
   - When status becomes `shipped`, route to Screen 4 (tracking details) while preserving scroll position history.
   - If the API returns `order_failed` or `cancelled`, switch to the Screen 4 error variant with blocking message and escalate to support automatically.
4. **Stale or slow updates**
   - After 30 minutes without status change, show inline helper in the banner: **"Still in production? Some batches take up to an hour - feel free to ping support below."**
   - After 12 hours still `processing`, elevate the helper to warning (Snap Amber tint), pre-open the support button on load, and send proactive email (see Notifications).
5. **Error and offline handling**
   - Detect offline via `navigator.onLine`; replace countdown with **"You are offline. We will refresh once you are back."** and pause polling.
   - Retry loop maxes at five consecutive failures; after that show alert banner and require manual refresh or support contact.

### C) Notifications & Escalation
- **Email updates:** When the Printful webhook advances to `in_production` or `shipped`, fire transactional emails via the SendGrid template `order-status-update`, including current status, tracking placeholder, and next step ETA.
- **Push opt-in (future-ready):** Keep hidden toggle placeholder but document that when web push launches, the toggle appears under the countdown. Copy: **"Notify me via push when it ships"** (disabled until feature flag flips).
- **Escalation workflow:** `Contact support` opens the shared `SupportSheet` with order metadata (`orderId`, `status`, `lastStatusCheck`). Sheet offers: (1) prefilled email form, (2) optional phone number. After 12 hours stale, auto-select "Production delay" reason and pre-compose message.
- **Internal alerting:** Log stale orders (more than 24 hours in production) to support Slack via `/api/internal/order-alerts` so humans can review before customer emails.

### D) Accessibility
- Focus order: Back button -> title -> help icon -> sticky banner (icon then text) -> timeline steps (left to right) -> refresh button -> helper link -> contact support -> reassurance banner -> footer links.
- Sticky banner gains `role="status"` with `aria-live="polite"` so copy updates announce without stealing focus.
- Countdown text updates every second but only mutates visually every 5 seconds to reduce screen reader chatter; wrap in `aria-live="off"` and announce only on interval change.
- Manual refresh sets `aria-busy` on the main content region; on completion toggle to `false`.
- Ensure icon chips and buttons meet 44px touch targets, maintain 4.5:1 contrast (Snap Violet on tinted background uses `color: --snap-violet-dark` for text).
- Respect `prefers-reduced-motion`: replace spinner with static progress dots and remove fade-in animations for banner updates.

### E) Copy & Voice
- Header title: **Order status**; subtitle: **"Order #SC-{id}"**.
- Sticky banner heading: **"Your case is in production"**; body: **"We run the presses in batches and keep you posted the moment it ships."**
- Refresh helper: **"Auto-refresh in {countdown}s - Last checked {time}"**.
- Offline helper: **"You are offline. We will refresh once you are back."**
- Escalation helper (>=30 min): **"Still waiting? Some batches take up to an hour - ping support if you need us."**
- Support CTA confirmation toast: **"Support request drafted with your order details."**
- Fallback warning (>=12 h): **"Production is taking longer than usual. We are checking with the lab now."**

### F) Analytics (snake_case)
- `order_status_pending_viewed { order_id, status: "processing", last_known_event }`
- `order_status_poll_attempted { order_id, attempt, interval_ms, result: "success"|"error", status_returned }`
- `order_status_poll_failed { order_id, attempt, error_type }`
- `order_status_refresh_clicked { order_id, status_before, seconds_since_last_poll }`
- `order_status_refresh_completed { order_id, status_after, latency_ms }`
- `order_status_support_opened { order_id, status, entry_point: "pending_banner" }`
- `order_status_support_submitted { order_id, status, escalation_reason }`
- `order_status_push_opt_in_toggled { order_id, enabled }` (gate behind flag until push launches)
- `order_status_stale_detected { order_id, minutes_stale, auto_escalated: boolean }`

### G) Responsive Notes
- **Base / sm (<640px):** Sticky banner spans full width beneath the header, with `top` offset accounting for the safe area; countdown and helper link stack vertically with `--space-3` spacing. Contact support button is full-width.
- **md (>=768px):** Layout shifts to two-column: left column (60 percent) holds banner and timeline; right column hosts support card and promise banner. Sticky banner remains pinned but gains max width 520px; countdown text sits inline with helper link.
- **lg+ (>=1024px):** Banner becomes part of a sticky right rail (`OrderStatusAside`) alongside support entry and FAQs; primary refresh button moves into the right rail while timeline expands horizontally in the main column. Ensure sticky containers respect a 96px top offset so they do not collide with the global nav.
- Sticky behavior must degrade gracefully: when content is shorter than the viewport, sticky banner should not float mid-screen; pin it to the top container instead.

### H) Acceptance Criteria
- Screen uses brand tokens (`--snap-violet`, `--snap-gray-*`, `--radius-xl`) and shared components (`AppHeader`, `StatusBanner`, `Button`, `SupportSheet`).
- Auto-refresh polls begin immediately, respect visibility pause, and update countdown text; manual refresh resets timers and renders success and error messaging.
- Status transitions move the user to the appropriate follow-up screen without manual reload; shipped -> Screen 4, failed -> Screen 4 error variant.
- Stale logic surfaces escalation messaging at 30 minutes and 12 hours, logs analytics, and triggers internal alert at 24 hours.
- Accessibility checks pass: focus order, `aria-live` usage, contrast, and reduced-motion compliance validated via Axe and manual keyboard pass.
- Analytics events above fire with correct payloads (verify in dev console) and include timestamp metadata; failures raise warnings in logs.
- Notifications dispatch: email triggered on webhook, support sheet pre-fills order data, offline state handled without crashing the polling loop.
