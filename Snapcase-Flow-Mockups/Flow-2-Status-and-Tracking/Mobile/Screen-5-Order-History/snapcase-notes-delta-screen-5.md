# Snapcase - Delta Doc (Flow 2 Screen 5: Order History)

**Viewport:** Mobile 390x844 (baseline)  
**Executive intent:** Provide guests with a trustworthy, self-serve ledger of their recent Snapcase purchases, help them jump back into live tracking (Flow 2 Screens 1-2), and surface clear affordances to reorder without requiring an account.

> **Section Status**
>
> | Section | Status | Notes |
> | --- | --- | --- |
> | A) Visual & Content Hierarchy | Authoritative | Aligns with Flow 2 navigation + Printful status chips. |
> | B) Interaction & Behavior | Authoritative | Matches tokenized order-history flows + Printful status mapping. |
> | C) Data, States, and Edge Cases | Authoritative | Describes merged Printful data + token governance. |
> | D) Copy & Tone | Authoritative | Maintains CX commitments. |
> | E) Accessibility | Authoritative | Required for compliance. |
> | F) Analytics | Authoritative | Telemetry spec still accurate. |
> | G) Acceptance Criteria | Authoritative | QA gating remains valid. |
> | Responsive Notes | Authoritative | Aligns with Responsive Blueprint. |

## What to change vs Stitch baseline

### A) Visual & Content Hierarchy
1. **Top bar & context**
   - Title: `Order history` (sentence case). Subline under title (`var(--font-body)` `--text-sm`, `var(--snap-gray-700)` at 70%) reads `Last 6 months of orders sent to {{email}}`.
   - Back button returns to the last flow context (prefer `/order/{{id}}` if navigated from tracking; otherwise `/thank-you`). Add `aria-label="Back to order status"`.

2. **Search + filters row**
   - Convert the static sort row into a two-tier control:
     - First row: search input as shown (placeholder `Search by order # or item`). Add inline results count badge (`{{result_count}} results`) that updates live.
     - Second row: pill filters (`All statuses`, `In production`, `Shipped`, `Delivered`, `Issue`). Add a `Last 30 days` dropdown (options: 30 days, 6 months, 12 months, All time) and a `Sort` segmented control (Newest, Oldest, Total, Status A-Z). Each pill uses `--radius-full`, border `calc(var(--space-1) / 4)`, height `var(--control-height)`.
   - Include a `Download CSV` icon button right-aligned on row two (label `Export history`). Hide on base view until user scrolls (show inside kebab menu) to reduce clutter.

3. **Order card anatomy**
   - Wrap each card in `Card` component (radius `--radius-xl`, `--shadow-md`). Card header: include a `--space-12` thumbnail (latest case render) left of order title `Order #SC-12345`.
   - Sub-header lines:
     - `Ordered {{order_date}} at {{order_time}} {{timezone}}`.
     - `Total {{total}} - {{shipping_method}}`.
     - If tracking exists, show `Last update {{last_update_relative}}`.
   - Status pill follows Flow 2 token palette (Delivered = success, Issue = warning, Cancelled = neutral). Move chevron into a ghost-icon button with label `View status`.

4. **Inline actions**
   - Introduce a two-button footer inside each card:
     - Primary text button `View status` linking to Flow 2 Screen 1 (`/order/{{id}}?origin=history`).
     - Secondary outline button `Reorder` linking to Flow 1 Screen 2 (`/design?templateId=...&variantId=...&origin=order_history`). Disable if no `templateId`.
   - On delivered orders expose a tertiary inline link `Download receipt` (opens Stripe receipt in new tab).

5. **Section dividers**
   - When orders span multiple calendar years, add year dividers (`2024`, `2023`) using the subtle separator component (`var(--snap-gray-600)` at 60%, uppercase `var(--font-body)` `--text-xs`, `--space-3` padding).

6. **Empty and zero-results states**
   - Default empty (no orders at all): illustration icon + headline `No orders yet` + copy `Design your first custom case to see it here.` Primary CTA `Start a design` linking to Flow 1 Screen 1 (`/design`).
   - Filtered zero-results: use info card `No matches` with copy `Try a different filter or clear search.` Provide `Clear filters` button.

### B) Interaction & Behavior
1. **Guest authentication token**
   - Screen reachable from emailed `order_history_token` query. Validate token, fetch orders for associated email without requiring login. Expire tokens after 30 days; refreshing extends session for 15 minutes (in-memory + cookie).

2. **Search behavior**
   - Debounce at 300ms, ignore input under 3 characters unless numeric (order IDs). Match on order ID, product name, colorway, or shipping city. Highlight matches in results.
   - When the user clears search, revert to previous filters and focus the input.

3. **Filter controls**
   - Status pills allow multi-select; `All statuses` clears others. Timeframe dropdown applies immediately with spinner overlay. Remember selections in `localStorage` keyed to the history token.
   - Sorting segmented control reorders results instantly; default `Newest`. On desktop convert to `Select` component that persists choice across sessions.

4. **Pagination / load more**
   - Fetch in pages of 10. Display `Load more orders` tertiary button after current page (disabled + skeleton when loading). When more than 3 pages exist, switch to infinite scroll but keep `Back to top` floating button.

5. **Deep links into Flow 2 Screens 1-2**
   - Tapping card body or `View status` opens Order Overview (Screen 1) with `origin=history`. Preserve filters in query string so the user can return via app bar back.
   - When an order has active tracking, surface a quick action `View tracking` inside the card that deeplinks directly to Screen 2 (`/order/{{id}}/tracking?origin=history`).

6. **Reorder pathway to Flow 1**
   - `Reorder` button preloads the last saved configuration: pass `templateId`, `variantId`, `finish`, and `is_reorder=true`. Display toast on `/design`: `Loaded your previous design from {{order_id}}`.
   - If template missing, show tooltip `Saved design unavailable` and link to support.

7. **CSV export**
   - Export includes columns: `order_id`, `placed_at_iso`, `status`, `total_cents`, `currency`, `shipping_method`, `tracking_code`, `template_id?`. Limit to current filters/timeframe, generate in worker, and respect rate limit (max 5 per hour per token).

8. **Offline / error handling**
   - Offline: show banner `You're offline. Showing the last synced list from {{sync_time}}.` Keep cached orders (IndexedDB). Disable CSV export and load more until network returns.
   - API error: display inline alert `We could not load your order history. Retry` with retry button. Preserve search/filter input states.

### C) Data, States, and Edge Cases
1. **Statuses mapping**
   - Map Printful events to status chips: `created`, `in_production`, `shipped`, `delivered`, `issue` (covers failed or returned). Ensure color tokens align with Flow 2 timeline.
2. **Timestamps & locales**
   - Render friendly date (`Dec 12, 2024`) and include actual timestamp in tooltip. Respect locale/timezone from browser but display shipping carrier timezone on hover.
3. **Order counts**
   - Display `{{result_count}} of {{total_count}} orders` above list; update after each filter/search. If total exceeds 50, prompt user with `Looking for older orders? Contact support for a full export.` link.
4. **Shared device privacy**
   - Provide `Not your email? Sign out` link that clears history token and returns to `/order/lookup`.
5. **Loading skeletons**
   - Use shimmer placeholders for cards (thumbnail + text lines) while fetching initial page. Maintain 3 skeletons to avoid jumpiness.

### D) Copy & Tone
1. Voice stays practical and reassuring. Primary hero line `Track and reorder past cases.` Supporting text keeps short sentences.
2. Empty state CTA copy: `Start a design` (primary) and `Learn how orders work` (secondary text link to support article).
3. CSV export confirmation toast: `History export ready. Check your downloads.` Provide failure toast `We couldn't generate the export. Try again later.`
4. Reorder tooltip in delivered cards: `Same device? Jump back in with your saved design.`

### E) Accessibility
1. Search input uses `aria-label="Search order history"` and updates results count via `aria-live="polite"` region.
2. Status filters are toggle buttons with `aria-pressed`. Ensure `var(--control-height)` touch target and 4.5:1 contrast in both themes.
3. Card acts as listitem inside `role="list"`. `View status` and `Reorder` remain explicit buttons (do not rely on entire card click alone) to avoid ambiguity.
4. Focus trap not needed, but maintain logical order: Back > Title > Search > Filters > Export > List items (status, actions) > Load More.
5. CSV export button announces progress with `aria-busy` on the button and provides downloadable file description when ready.

### F) Analytics (snake_case)
- `order_history_viewed { order_history_token, total_count, initial_filter, origin }`
- `order_history_filter_applied { order_history_token, filter_type, filter_value, result_count }`
- `order_history_sort_changed { order_history_token, sort, result_count }`
- `order_history_search_performed { order_history_token, query_length, result_count }`
- `order_history_load_more_clicked { order_history_token, page, page_size }`
- `order_history_export_clicked { order_history_token, format: "csv", filter_active }`
- `order_history_row_opened { order_history_token, order_id, destination: "flow2_screen1" }`
- `order_history_tracking_opened { order_history_token, order_id }`
- `order_history_reorder_clicked { order_history_token, order_id, template_id?, variant_id }`

### G) Acceptance Criteria
- Guest with valid `order_history_token` can view, search, filter, sort, and paginate orders without logging in; token expiry and sign-out link behave as documented.
- Status filters, timeframe, and sorting persist between visits (within token lifetime) and sync to the UI.
- `View status` takes user to Flow 2 Screen 1 with breadcrumb back to history; `View tracking` deep-links to Screen 2 when tracking exists.
- `Reorder` opens Flow 1 `/design` preloaded with previous design context and fires analytics event; disabled state handles missing template gracefully.
- CSV export respects active filters/timeframe, downloads with correct columns, and enforces rate limiting.
- Empty, zero-results, offline, and error states render with appropriate copy and accessible controls.

## Responsive Notes
- **Base (<640px):** Maintain stacked cards with `--space-4` gutters. Search occupies full width; filters and export collapse into horizontal scroll pill tray under search. Inline action buttons sit stacked (`View status` primary, `Reorder` secondary) with shared `--space-2` gap.
- **sm (>=640px):** Filters row can wrap into two columns: status pills grid and dropdowns on the right. Order cards switch to two-column layout inside (`thumbnail + details` left, status & actions right) while keeping `--space-4` padding.
- **md (>=768px tablets/landscape):** Promote layout to split view: left column (min ~`6.5 * --space-16`) holds filters stacked vertically; right column displays order list. Card actions align horizontally with icon buttons for `View status` and `Reorder`.
- **lg (>=1024px desktop):** Transform list into responsive table with columns `Order`, `Placed`, `Total`, `Status`, `Actions`. Preserve card styling for small widths via CSS container queries. Filters sit in a sticky left rail (max `5 * --space-16`) with export button surfaced as primary.
- **xl+ (>=1280px):** Allow simultaneous view of table and selected order preview (Flow 2 Screen 1 summary) in a two-pane layout. Keep table rows `--space-14` tall min and ensure hover states follow design tokens.

