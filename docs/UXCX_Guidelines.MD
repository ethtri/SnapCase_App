# Snapcase UX/CX Guidelines Index

Use this index to locate the authoritative experience docs before making product, design, or implementation changes. All files live in the repo unless noted.

> **Section Status**
>
> | Section | Status | Notes |
> | --- | --- | --- |
> | Core References | Authoritative | Points to the living specs engineers must consult first. |
> | Stitch Mockups & Delta Notes | Authoritative | Delta docs remain the mobile source of truth; desktop derives from them. |
> | Implementation Checklists | Authoritative | QA/test docs remain active and align with EDM-first plans. |
> | How to Work With These Docs | Authoritative | Process reminders still match our async workflow. |
> | Director Memo — Guardrail & Rail Decisions | Authoritative | Mirrors the EDM-only guardrail approach documented in `docs/Printful_EDM_KeyFacts.md:141-165`. |
> | Items Requiring Ethan’s Approval | Authoritative | Still current escalation policy. |
> | Appendix — Assets Referenced | Authoritative | Supports diagnostics + delta doc traceability. |

## Core References
- `docs/SnapCase_App_Prototype.MD` — PRD and acceptance criteria for the Design & Order flow.
- `docs/Storyboard_EDM.md` — Scene-by-scene journey highlights and integration notes for Printful and Stripe.
- `docs/DESIGN_SYSTEM.md` — Tokens, typography, spacing, motion, and component patterns.
- `docs/VISUAL_CONSISTENCY_GUIDE.md` — Alignment rules with the marketing site and brand voice.
- `docs/Responsive_Blueprint.md` — Breakpoint-by-breakpoint layout guidance for Screens 1–4, now covering guardrail banners, cancel/resume flows, accessibility checklist, and open UX decisions that need sign-off.

## Stitch Mockups & Delta Notes
Mobile Stitch exports and their corrections live under `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Mobile/`:
- Screen 1: `Screen-1-Pick-your-device/` (image, HTML, `snapcase-notes-delta-screen-1.md`)
- Screen 2: `Screen-2-Design-your-case/` (image, HTML, `snapcase-notes-delta-screen-2.md`)
- Screen 3: `Screen-3-Review-and-Shipping/` (image, HTML, `snapcase-notes-delta-screen-3.md`)
- Screen 4: `Screen-4-Order-Placed/` (image, HTML, `snapcase-notes-delta-screen-4.md`)

Use the delta docs as the source of truth when translating Stitch files into our design system. They document visual tweaks, behavior, accessibility, analytics, and responsive notes per screen.

## Implementation Checklists
- `docs/SELF_TEST_CHECKLIST.md` — Manual QA steps before sharing builds.
- `docs/TESTING_STRATEGY.md` — Automated and manual testing expectations for critical flows.
- `PROGRESS.md` — Project status, documentation updates, and links to recent deliverables.

## How to Work With These Docs
1. Start with the PRD and storyboard to ensure the flow and tone match stakeholder intent.
2. Consult the design system + visual consistency guide for token names and brand requirements (no hard-coded hex values).
3. Apply the relevant screen delta doc. If a value or interaction is missing, document it there before implementing.
4. Reference the responsive blueprint whenever extending layouts beyond mobile; note open follow-ups listed at the bottom of that file.
5. Record any new UX/CX artifacts by adding them to this index and updating the Documentation section of `PROGRESS.md`.

Questions or gaps? Surface them in `PROGRESS.md` under Documentation Updates so the next agent knows what needs follow-up.

## Director Memo — 2025-11-04 Guardrail & Rail Decisions

### 1. Guardrail Alignment With Printful (Refs: `docs/Responsive_Blueprint.md`, `docs/Printful_EDM_InvalidOrigin.md`)
- **Decision:** For MVP the Printful EDM banner and validation states are the single customer-facing guardrail experience. SnapCase will not duplicate DPI/safe-area messaging outside the iframe; we simply honor Printful’s blocking behavior, add concise helper copy (“Back-only print”, “Stay within the dotted area”) near our picker/CTA, and theme the iframe within the limits documented in `docs/Printful_EDM_KeyFacts.md`.
- **Implementation notes:** 
  - `edm-editor.tsx` still listens to `onDesignStatusUpdate` so we can disable SnapCase CTAs when Printful reports `designValid=false`, but we now hide the SnapCase safe-area overlay + guardrail panel while EDM is active and render a compact summary card that simply repeats Printful’s payload for diagnostics/CTA gating.
  - Analytics `logAnalyticsEvent('guardrail_warning', …)` fires when Printful emits new errors; payload mirrors their `errors[]` array and is stored for diagnostics only.
  - Fabric fallback remains the only place where SnapCase’s DPI calculator + safe-area overlay render; document any divergences so we can retire that logic once EDM becomes the sole editor.
  - Any transcripts or support copy should reference the exact text users see inside EDM so there is no mismatch between systems.
- **Follow-up research:** Focus on learning how far theming can go (colors, helper subtitles) rather than requesting suppression toggles. Escalate to Printful only if their UX blocks responsiveness or accessibility outright.
- **Success metrics:** Patients align with Printful telemetry: <5% drift between Printful `designValid=false` counts and our recorded analytics; CTA disabling always matches the iframe state.

### 2. Desktop Layout Within EDM Constraints (Refs: `docs/Responsive_Blueprint.md:14-40,129-132`, `Snapcase-Flow-Mockups/.../Desktop/Screen-2-*`)
- **Decision:** Desktop stays a two-column layout: Printful’s native toolbar/canvas on the left and SnapCase’s order summary + CTA column on the right. No SnapCase-specific guardrail rail or card ships for MVP.
- **Behavior:** 
  - Keep enough width (`container-lg`/~1400px) so the Printful canvas and toolbar breathe; the right column focuses on price, device summary, and navigation actions—never redundant warnings.
  - On smaller breakpoints, collapse to a single column where Printful controls the canvas and warnings; SnapCase helper copy sits inline above/below the iframe per Stitch guidance.
  - Any reassurance or education copy must be short, outside the iframe, and must not rephrase Printful’s banner; link to policy docs instead of rewriting their warnings.
- **Engineering actions:** Update `/design` grid to drop references to “guardrail panel” or “assist rail.” Ensure the CTA disable state simply mirrors Printful’s `designValid` flag and do not introduce extra warning components.

### 3. Analytics & CX Instrumentation Priorities (Refs: `docs/TESTING_STRATEGY.md`, `src/lib/analytics.ts`, `docs/Printful_EDM_KeyFacts.md`)
- **Tier-0 events (ship immediately via `logAnalyticsEvent` → Vercel Analytics export + CSV until Segment/GA is funded):**  
  1. `variant_change` (payload: `catalogId`, `color`, `source='edm'|'picker'`).  
  2. `guardrail_warning` (payload: `warning_type`, `severity`, `blocking`).  
  3. `design_saved` (payload: `templateId`, `duration`, `valid=true/false`).  
  4. `price_update` (payload: `variantId`, `baseCost`, `retailPrice`, `currency`).  
  5. `editor_loaded` / `editor_abandoned`.  
  Route dual writes to: (a) Vercel Analytics (already whitelisted in `docs/DEPLOYMENT_GUIDE.md`), (b) daily CSV emitted by `scripts/collect-edm-diagnostics.js` so Ethan can ingest into Looker Studio. Segment/PostHog remains stretch-goal; keep the helper signature stable for future swap per `README.md:29`.
  **Newly wired:** `design_cta_state_change` (captures helper chip/CTA messaging drift per blueprint expectations) and `guardrail_toast_enqueued` (tracks the queued warning surface) now land in `src/app/design/page.tsx` and should stay Tier-0 until funnel baselines are set.
- **QA hooks:** Add assertions in `tests/e2e/design-to-checkout.spec.ts` ensuring guardrail warnings and design saves emit analytics events (aligns with the instrumentation gap called out in `docs/TESTING_STRATEGY.md#EDM-analytics`).  
- **Budget guardrail:** Only pursue tooling upgrades that keep project spend flat (e.g., free-tier Segment/PostHog or existing credits). Flag any cost-bearing plan for Ethan before enabling it.
- **Success metrics:** Track funnel conversion from `editor_loaded` → `design_saved` → `checkout_start` with weekly deltas; target ≥70% save-to-checkout rate (matches benchmark from CASETiFY live chat data shared last quarter).

- **Canvas width & toolbar spacing:** Expand `container-lg` to 1400px on desktop so Printful’s toolbar never feels cramped and their guardrail banner remains legible.  
- **Variant picker consistency:** Because Printful’s picker is now masked + locked, SnapCase’s device picker remains the only actionable control. Keep the helper chip (“Device locked — change in Step 1”) so users know the embed is preloaded and the hidden picker cannot be edited.  
- **Price parity:** Mirror live `onPricingStatusUpdate` data into the right-column order summary so mockups reflecting static $34.99 remain accurate even when Printful surcharges apply. Use simple helper copy (e.g., “Printful sets base costs”) instead of a bespoke panel.

## Printful-first Guardrail Playbook (2025-11-06 reset)
- **Ownership:** Printful’s iframe banners, overlays, and DPI enforcement are the canonical warnings for /design. SnapCase only mirrors the raw `onDesignStatusUpdate` payload into the guardrail summary card and CTA state (refs: `docs/Printful_EDM_KeyFacts.md` §Critical Gotchas, `docs/Responsive_Blueprint.md` §Screen 2).
- **Where SnapCase speaks:** We surface our own copy in three places only and the copy deck is now canonical: (1) the helper chip reads “Variant locked to your SnapCase selection” with inline reminder to change devices in Step 1 (`Images/diagnostics/design-messaging-2025-11-05T15-57-23-800Z.png`), (2) the guardrail summary mirrors Printful payloads verbatim, and (3) CTA labels rotate through `Select a device` → `Resolve the Printful banner above` / `Relock your variant in Step 1` → `Waiting on Printful…` → `Continue to checkout`. Every transition logs `design_cta_state_change` so analytics can track gating state (Refs: `docs/Responsive_Blueprint.md` §Screen 2 Layout & CTA gating).
- **Checkout reassurance:** The Snapcase Quality Promise banner on `/checkout` is the canonical reassurance copy (“If anything’s off, we remake it on us.”) and must appear ahead of the Stripe CTA helper text so no other guardrail messaging contradicts Printful’s warnings. Reference the shipped captures in `Images/diagnostics/checkout-desktop-2025-11-05T16-48-23-099Z.png` / `checkout-mobile-2025-11-05T16-48-23-099Z.png` when updating downstream docs.
- **Fabric fallback:** Safe-area overlay, camera cutout toggle, and DPI badge revive only when EDM fails or `USE_EDM=false`. That state must be labeled “Fabric fallback” and follow the original Stitch layout so QA can compare apples-to-apples (refs: `docs/Printful_EDM_Risk_Analysis.md` §1, `docs/Responsive_Blueprint.md` Screen 2 Fabric note).
- **Diagnostics:** Guardrail summary logs raw payloads, active picker IDs, and whether we are in `printful` or `snapcase` mode so support can forward data without screenshots. Reference the collected screenshots in `Images/diagnostics/11.4.25_badCXUX.png` when explaining why duplicate banners are prohibited.

## Safe-Area, DPI, and Responsive Requirements
- **Safe-area & DPI:** When EDM is active, do **not** render SnapCase overlays or DPI chips. Instead, trust Printful, echo their state in copy, and gate CTAs accordingly. Only Fabric fallback shows the storyboarded toggles and “DPI: Great/OK/Low” badge (refs: `docs/Printful_EDM_KeyFacts.md` §Guardrails).
- **Picker messaging:** Because Printful’s picker cannot be hidden, every build must include helper text showing it is locked plus a link back to Screen 1 for changes. Never promise that the picker will disappear; note the limitation explicitly in blueprints, help-center copy, and support macros (refs: `docs/Printful_EDM_Risk_Analysis.md` §2).
- **Responsive rails:** Follow the `/design` blueprint: single column on base/sm, split stack on `md`, full two-column layout on `lg+`, and optional left rail only when there is curated content that will not cramp the iframe. Use `container-lg` targets called out in `docs/Responsive_Blueprint.md` lines 14-60 so Printful’s toolbar has breathing room (`Images/diagnostics/11.4.25_badCXUX.png` shows the cramped anti-pattern).
- **CTA linkage:** Action bars and floating CTAs must mirror Printful `designValid`, `selectedVariantIds`, and live pricing from `onPricingStatusUpdate`. CTAs never display contradictory enablement states relative to the iframe banner.

## Messaging Surfaces by Flow Step
| Flow step | Printful-owned copy | SnapCase-owned copy | Notes |
| --- | --- | --- | --- |
| Device picker (/design Screen 1) | None | Grid cards, Detect helper, ActionBar CTA | Hand-off message must mention that the Printful picker is masked/locked downstream. |
| Editor (/design Screen 2) | Iframe picker, toolbar, guardrail banner, DPI overlays | Helper chip above iframe, guardrail summary card, CTA copy, upload toasts | Summary references Printful payload verbatim; cite `docs/Responsive_Blueprint.md` Mockup vs Reality table when updating. |
| Fabric fallback | Safe-area overlay + DPI warnings (SnapCase) | Same as above plus storyboarded toggles | Clearly label fallback mode and link to diagnostics. |
| Checkout (/checkout) | None | Order summary, Snapcase Quality Promise banner (“If anything’s off, we remake it on us.”), Stripe CTA helper text about Printful-first gating | Reference Printful limiters if pricing or template IDs are missing so CX can chase root cause; banner copy is the reassurance source of truth. |
| Thank-you (/thank-you Screen 4) | Hero badge confirmation copy, fulfillment timeline helper text, delivery ETA chip, support link CTA | Order summary order-ID affordance, analytics for Track order/Design another, support mailto target | Reference `docs/Responsive_Blueprint.md` §Screen 4 plus diagnostics `Images/diagnostics/thank-you-desktop-2025-11-05T16-41-30-616Z.png` and `Images/diagnostics/thank-you-mobile-2025-11-05T16-41-30-616Z.png`. |

Document any new messaging surface in this table and in `PROGRESS.md` before merging code so downstream agents know which system owns the UX.

## Resolved UX Decisions (2025-11-07)
- **Desktop editor rails:** Treat the Printful toolbar as the sole left rail. SnapCase won’t add a second rail until multi-pane tooling or merchandising content is approved and we confirm the iframe retains ≥960 px width (`docs/Responsive_Blueprint.md` §Responsive Delivery Strategy).
- **Cancel/resume banner:** `/checkout` banner remains sticky until the user completes payment. Any optional dismiss control must be gated behind `NEXT_PUBLIC_ALLOW_CANCEL_BANNER_DISMISS`, emit `checkout_cancel_banner_dismissed`, and leave a secondary indicator (chip/badge) so CX can verify status in session history (`Images/diagnostics/checkout-cancel-banner-2025-11-05T15-57-23-800Z.png`).
- **Guardrail toasts:** Use a single queue for DPI/content/policy/pricing toasts. Never stack or overlap warnings; let Printful’s iframe banner stay visually dominant and serialize SnapCase toasts underneath (`docs/Responsive_Blueprint.md` §UX Decision Log). `src/app/design/page.tsx` now enforces this via a queued surface anchored above the ActionBar, matching the captured evidence in `Images/diagnostics/design-messaging-2025-11-05T15-57-23-800Z.png`.

### Items Requiring Ethan’s Approval
1. **Printful escalation:** Only escalate if EDM behavior blocks launch (e.g., non-responsive layout, inaccessible controls). Duplicate copy is no longer grounds for escalation.  
2. **Analytics destination upgrade:** Confirm any non-zero cost path; free/credit-based upgrades can proceed once documented.  
3. **Future non-Printful guardrail UI:** Any proposal to reintroduce SnapCase-specific warning components must be reviewed before tickets are opened.

### Appendix — Assets Referenced
- `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Desktop/Screen-2-Design-your-case/snapcase-notes-delta-screen-2.md`: informed rail taxonomy & toolbar spacing.  
- `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Desktop/Screen-1-Pick-your-device/snapcase-notes-delta-screen-1.md`: validated optional-rail collapse rules on tablet widths.  
- `Images/diagnostics/11.4.25_badCXUX.png`: evidence of cramped guardrail copy + dual warnings.  
- `Images/diagnostics/edm-diagnostics-2025-11-04T16-59-49-634Z.png`: confirmed Printful callbacks needed for analytics parity.

## Appendix — UX/CX Source of Truth Index
| Doc | Scenario / Coverage | Status | Cross-links |
| --- | --- | --- | --- |
| `docs/Printful_EDM_KeyFacts.md` | Canonical EDM capabilities, guardrails, init workflow, and request/response schemas. | Authoritative | Pair with `docs/Printful_EDM_Risk_Analysis.md` for misalignment tracking. |
| `docs/Printful_EDM_Risk_Analysis.md` | Known mismatches + remediation priorities when SnapCase drifts from Printful reality. | Authoritative | Reference alongside Key Facts before editing docs or UX flows. |
| `docs/Responsive_Blueprint.md` | Breakpoint-specific layout + guardrail guidance for Flow 1. | Authoritative (EDM-first); Fabric notes marked Deprecated. | Cross-check with Flow-1 delta docs and guardrail decisions above. |
| `docs/SnapCase_App_Prototype.MD` | PRD across `/design → /checkout → /order/:id` plus API/flag requirements. | Authoritative with Fabric-only guardrail notes. | Aligns with Key Facts §Init Workflow + Risk Analysis §1. |
| `docs/Printful_EDM_Escalation.md` | How to capture diagnostics + thresholds for Printful support tickets. | Authoritative | Reference when Director Memo flags blockers. |
| `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/**/snapcase-notes-delta-screen-*.md` | Screen-level visual + behavioral deltas derived from Stitch exports. | Authoritative | Treat as mobile-first specs; escalate conflicts via Responsive Blueprint. |
| `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/{Mobile,Desktop}/Screen-1-*/snapcase-notes-delta-screen-1.md` | Flow 1 Screen 1 device-picker deltas + Nov 5 Delta Status tables. | Authoritative | Cross-link to `docs/Responsive_Blueprint.md` §Screen 1 + Live Gap Analysis (Resolved 2025-11-05). |
| `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/{Mobile,Desktop}/Screen-2-*/snapcase-notes-delta-screen-2.md` | Flow 1 Screen 2 EDM/Fabric guidance with blocker tags. | Authoritative w/ Fabric-only labels | Pair with `docs/Responsive_Blueprint.md` §Screen 2 (Guardrails, Mockup vs Reality). |
| `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/{Mobile,Desktop}/Screen-3-*/snapcase-notes-delta-screen-3.md` | Review & Shipping deltas, Quality Promise gap, Stripe checklist. | Authoritative (Delta Status 2025-11-05) | Cross-reference `docs/Responsive_Blueprint.md` §Screen 3 + Live Gap Analysis (Quality Promise). |
| `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/{Mobile,Desktop}/Screen-4-*/snapcase-notes-delta-screen-4.md` | Thank-you deltas covering hero, timeline, CTAs, ETA chip. | Authoritative (placeholder flagged) | Link to `docs/Responsive_Blueprint.md` §Screen 4 + Live Gap Analysis (Thank-you gaps). |
| `docs/UXCX_Guidelines.MD` (this file) | Index + governance for all UX/CX artifacts. | Authoritative | Links every other doc; update whenever a source moves. |
| `docs/UserTesting/Sprint02_Sponsor_Script.md` | Sponsor-facing script + PM checklist + caveats for Flow 1 Screen 1–4 validation. | Authoritative (Sprint 02 sponsor test) | Run before each sponsor session; refresh diagnostics + analytics evidence before reuse. |
