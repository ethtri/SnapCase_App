# Snapcase - Delta Doc (Screen 2: Tracking Details)

**Viewport:** Mobile 390x844  
**Executive intent:** Give customers an instant, trustworthy snapshot of package progress, what is inside, and how to follow up without friction.

## What to change vs Stitch v2

### A) Visual & Components
1. **Page shell**
   - Reuse mobile app bar from Screen 1 (back chevron, centered title **Tracking details**), background `--snap-gray-50` light / `--snap-ink-900` dark, 1px divider, safe-area padding.
   - Show order reference under title as subdued caption: `Order #SC-12345`, Inter 14px, `--snap-gray-500`.
2. **Status headline**
   - Under header, stack ETA pill + status copy on white card: headline **"On the way"** (Poppins 22px 600), subcopy `Estimated delivery: Tue, Jan 7` (Inter 16px).
   - ETA pill uses subtle tint (`--snap-violet-50`, text `--snap-violet-600`) with calendar icon 20px.
3. **Timeline rail**
   - Vertical timeline on left edge of detail card: 24px nodes, 2px connecting line in `--snap-gray-200`; active node filled Snap Violet, future nodes outlined.
   - Each step is a 16px radius card (white/dark surface) with `Show details` chevron button; card padding 16px vertical, 20px horizontal.
4. **Step detail accordion**
   - Expanded state reveals scan table: timestamp (localised), location, carrier note; uses monospace timestamp 14px Inter, separators 1px `--snap-gray-100`.
   - Include optional media row (e.g., proof of delivery) as thumbnail 64px with rounded corners and `View photo` link button.
5. **Package metadata card**
   - Separate card with two-column definition list for: Carrier logo, service level, tracking number (with copy icon button), package weight, contents summary, ship-from facility.
   - Use `DefinitionList` component: label Inter 13px uppercase, value Inter 16px. Tracking number always wraps to copy-friendly line; long numbers break at 4-digit groups.
6. **Tracking actions**
   - Primary button **Open carrier site** (Snap Violet 48px height); secondary outline **Copy tracking number**; tertiary plain text **Share tracking link** with `share` icon.
   - `Refresh status` icon button (circular) anchored top-right of metadata card; rotates 180deg when loading.
7. **Support and issue reporting**
   - Info banner tinted `--snap-violet-50` reminding of Snapcase quality promise.
   - `Report an issue` button opens modal (mobile bottom sheet) listing issues (missing, damaged, wrong item). Buttons use tertiary style w/ right chevron.

### B) Behavior & States
1. **Data loading**
   - Fetch `/api/tracking/{orderId}` on entry; show skeleton shimmers for title, timeline steps, and metadata while pending.
   - Do not block UI when data cached; show toast `Updated tracking` when fresh snapshot arrives.
2. **Refresh control**
   - `Refresh status` triggers refetch with optimistic spinner; disable while pending. On failure show inline banner `We could not reach the carrier. Retrying in 30 seconds.` with auto retry.
3. **Timeline drill-down**
   - Steps sorted newest first. Tapping the step header toggles `aria-expanded`; only one step expanded at a time unless user explicitly opens multiple with long press (desktop uses Cmd+Click).
   - Expanded step lists scans with latest at top, includes `status_code`, `carrier_note`, `scan_id`.
4. **Missing or stale tracking**
   - When carrier has no events, show placeholder card: icon `schedule`, heading **"Label created, waiting on first scan"**, helper copy prompting refresh later.
   - After 24h with no updates, show alert banner `Still waiting on the carrier. Contact support` linking to chat.
5. **Multiple packages**
   - If `shipments.length > 1`, add segmented control above timeline: `Package 1`, `Package 2` with delivered badge where applicable. Persist last selection via router state.
6. **Deep links**
   - Primary action opens `trackingUrl` in new tab with `target="_blank"`, `rel="noopener"`, appends `?utm_source=snapcase_app&utm_medium=tracking`.
   - `Share tracking link` surfaces native share sheet when available; fallback copies URL with toast `Tracking link copied`.
7. **Report issue modal**
   - Modal collects issue type + optional note; on submit route to `/support/new?orderId=...&issueType=...`, preserving packageId.
   - If tracking missing, prompt `Report issue` automatically after warning; user can dismiss (persist choice per session).
8. **Backend expectations (informational)**
   - Requires API to supply merged Printful + carrier data (status, scans, metadata). No webhook changes; UX assumes payload already hydrated by backend workers.

### C) Data & Content
1. **Core fields per package**
   - `order_id`, `package_id`, `printful_fulfillment_id`, `carrier`, `carrier_service`, `tracking_number`, `tracking_url`, `eta` (ISO), `last_snapshot_at` (ISO), `status_code`, `status_label`, `support_url`.
2. **Scan events array**
   - Each item: `event_id`, `step_code`, `display_label`, `timestamp`, `timezone`, `location_city`, `location_state`, `location_country`, `description`, `evidence_asset` (optional URL), `is_key_milestone`.
3. **Package contents**
   - Array of `{ sku, display_name, finish, quantity, preview_image_url }`; render as comma-separated summary plus truncated list (show up to 3 items, reveal modal for full list).
4. **Metrics**
   - `transit_days_estimate`, `days_in_stage`, `percent_complete` to inform progress indicator (progress bar under headline).
5. **Fallback text**
   - If any field missing, show `Not provided yet` (label) or `--` (value) and log to console with warn flag; never display raw `null` or `undefined`.
6. **Time localisation**
   - Display all timestamps in recipient's timezone; include 24h fallback when timezone unknown (show `UTC` suffix). Provide machine-readable `<time datetime>` for screen readers.

### D) Accessibility
- **Focus order:** Back -> Title -> Refresh -> Status card -> Timeline steps (top to bottom) -> Actions (Open carrier, Copy, Share) -> Metadata list -> Issue banner -> Report issue -> Footer links.
- **Timeline semantics:** Use `<ol>` with each step `<li>` `role="listitem"` + `aria-current="step"` when active; toggle button inside step labelled `Show details for {status_label}` with `aria-expanded`.
- **Scan table:** Wrap in `<section>` with `aria-label="{status_label} event history"`; each row uses `<time>`, `<p>` and ensures 44px min height.
- **Link targets:** When opening new tab, include visually hidden text `(opens in new tab)` and `aria-label` announcing destination (e.g., `Open FedEx tracking in new tab`). Use `rel="noopener noreferrer"`.
- **Modal overlays:** `role="dialog"`, `aria-modal="true"`, focus trapped to sheet contents, background set `inert`; Escape and Backdrop tap close. Ensure initial focus on first actionable item.
- **Motion:** Honor `prefers-reduced-motion`; disable timeline line animations, replace with opacity fade.
- **Touch targets & contrast:** All buttons >=48px height, timeline node hit area 44px; maintain AA contrast (Snap Violet on white tested).

### E) Analytics (snake_case)
- `tracking_details_viewed { order_id, package_id, carrier, fulfillment_status, has_multiple_packages }`
- `tracking_package_switched { order_id, from_package_id, to_package_id }`
- `tracking_step_expanded { order_id, package_id, step_code, position_index }`
- `tracking_link_clicked { order_id, package_id, carrier, destination: "carrier_site" }`
- `tracking_number_copied { order_id, package_id, carrier }`
- `tracking_share_initiated { order_id, package_id, method }`
- `tracking_refresh_clicked { order_id, package_id, last_snapshot_age_seconds }`
- `tracking_refresh_failed { order_id, package_id, error_type }`
- `tracking_issue_report_started { order_id, package_id, issue_type_candidate }`
- `tracking_issue_report_submitted { order_id, package_id, issue_type }`

### F) Acceptance Criteria
- Layout matches design tokens (app bar, cards, buttons) and reuses shared components (`DefinitionList`, `ActionButton`, `Timeline`).
- Timeline renders at least four stages with accordions; expanding shows scan list sorted newest-first, collapses on second tap.
- Refresh button fetches latest data, updates timeline and metadata without full page reload, handles errors gracefully with inline banner.
- Missing tracking surfaces placeholder messaging and enables Report Issue pathway; analytics still record view/refresh attempts.
- Deep link opens carrier site in new tab with appended UTM; copy/share actions provide user feedback.
- Accessibility conditions satisfied (focus order, semantics, modals, 44px targets, reduced motion preferences).
- All analytics events fire with required payloads and log to console in dev.

### G) Responsive Notes
- Mobile default is single column. On >=768px, move timeline to left rail (25% width) and metadata/actions to right (card width 75%), keeping accordion functionality.
- On >=1024px, pin metadata card sticky at top while timeline scrolls; ensure support banner spans full width below.
- Report Issue modal becomes centered dialog with max width 480px on desktop; maintain bottom sheet presentation on mobile.
- Ensure buttons align horizontally on tablet/desktop (Open carrier + Copy side by side, Share as icon button).
- Timeline connectors scale with density; maintain 24px node even on large screens to stay proportional.

