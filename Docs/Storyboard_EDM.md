# Snapcase EDM Storyboard

_Last updated: October 24, 2025_

## Purpose
- Visual walkthrough of the Snapcase web flow for Printful EDM stakeholders and the product/dev team.
- Aligns with the live PRD flow (`/design → /checkout → /thank-you → /order/:id`) and highlights guardrails, security, and fulfillment handoffs.
- Serves as a storyboard + requirements companion; use alongside `Docs/SnapCase_App_Prototype.MD` for authoritative specs.

### Quick Facts
- **Audience**: Printful EDM team, Snapcase dev/design, CX reviewers.
- **Runtime target**: 90–110 seconds cut; 9:16 variant optional.
- **Focus**: Mobile-first entry, ergonomic editor handoff, Stripe cancel/resume safety, idempotent webhook timeline, feature flag fallback.

## Scene Cheat Sheet
| # | Title | Focus | Routes / Events |
|---|-------|-------|-----------------|
| 1 | Brand Hook & Promise | Mobile hero, trust belt | Squarespace CTA → `/design` |
| 2 | Handoff to App | Device picker entry | `/design` device selector, variant pricing |
| 3 | Select Device & Case | Variant confirmation | `select_device` analytics event |
| 4 | Editor Loads (EDM) | Nonce & CSP overlay | `POST /api/edm/nonce`, EDM iframe |
| 5 | Upload & Place | DPI meter + safe area | `upload_image` event, guardrail chips |
| 6 | Add Text & Sticker | Curated assets | Starter pack toggle, keyboard focus |
| 7 | Guardrails & Blocker | Cutout collision handling | CTA disable until resolved |
| 8 | Save & Template ID | Template persistence toast | `onTemplateSaved(template_id)` |
| 9 | Review & Shipping | Shipping selector, promise | `/checkout` summary (Express gated by flag) |
|10 | Stripe Checkout + Cancel | Hosted flow & safe return | `POST /api/checkout`, `stripe_checkout_loaded`, cancel path |
|11 | Purchase Success | Thank-you UI | `/thank-you`, order summary |
|12 | Order Create → Printful | Server-side fulfillment | `POST /orders?confirm=true` overlay, retries |
|13 | Webhooks & Tracking | Timeline updates | Printful + Stripe idempotent webhooks |
|14 | Feature Flag Fallback | USE_EDM split-screen | `process.env.USE_EDM` toggle (Fabric.js MVP) |

## For Coding Agents
- Use `POST /api/checkout` as the canonical Stripe session route (legacy `/api/checkout/session` references must call into the same handler).
- Honor `SHOW_EXPRESS_SHIPPING`: hide Express in UI and omit its Stripe shipping rate when the flag is `false`.
- Respect `USE_EDM`: EDM iframe when `true`; Fabric.js fallback mirrors the same guardrails when `false`.
- Capture `onTemplateSaved(templateId, assets)` (EDM) or Fabric export and persist in session/local storage for checkout/order creation.
- Treat Stripe & Printful webhooks as signed, idempotent events; dedupe on `event.id` with a 7‑day TTL store.
- Maintain CSP exceptions only for required hosts: Stripe (`js.stripe.com`, `api.stripe.com`, `checkout.stripe.com`) and Printful EDM/CDN endpoints.

## Stripe Cancel & Resume
- Demo shows a voluntary cancel from Stripe Checkout back to `/checkout` with state intact.
- Copy: “No worries—your design is saved. Pick up where you left off.”
- Confirms `onTemplateSaved` or Fabric export persists across the cancel loop.

## Printful ↔ UI Status Mapping
| Printful Event | Timeline Label | Notes |
|----------------|----------------|-------|
| `order_created` | **Created** | Initial Printful acknowledgement. |
| `order_updated` (status: processing/in-production) | **In production** | Mirror Printful status payload; allow future granular copy. |
| `package_shipped` | **Shipped** | Includes carrier, tracking URL, and ETA chip. |
| `order_failed` | **Needs attention** (future) | Soft-fail state; keep as backlog callout. |

## Demo Assets Checklist
- Squarespace hero (desktop + 9:16 crop), device picker mock, EDM chrome with Snapcase theming.
- Safe-area/camera mask SVGs per variant, DPI meter states (Great/OK/Low).
- Stripe Checkout test screenshots (success + cancel), status timeline icons, end card lockup.
- Store assets under `/demo/assets/` with a README enumerating filenames and scene usage.

## Variations & Cut-downs
- **9:16 mobile-first** emphasizing bottom CTA reach and Apple Pay one-tap.
- **Fabric.js fallback cut**: Scenes 4–7 swap to local editor export → same save/checkout flow.
- **Variant swap micro-cut**: Apply `template_id` from iPhone 15 Pro to iPhone 15, highlight cutout/DPI recalculation.

## Voiceover Script (120s reference)
1. “Welcome to Snapcase—design your custom phone case online in minutes.”
2. “Start by picking your phone model and case type.”
3. “Our embedded editor helps you place your photo perfectly with safe-area guides and a live DPI meter.”
4. “When you’re happy, save your design—we store a template so you can reuse or switch variants.”
5. “Checkout is powered by Stripe for a fast, secure payment experience.”
6. “We create your order at Printful and update you as it moves from production to shipped.”
7. Optional EDM closer: “EDM handles template mapping and renders; our app manages payments, webhooks, and tracking.”

## Acceptance Criteria (Demo Build)
- EDM iframe loads with Snapcase theming; nonce request + response are visible in overlays.
- Guardrails appear (safe-area warning, DPI warn/block) before save/continue.
- Save emits `template_id` and we surface the captured value at least once.
- Stripe Checkout success + cancel paths both route back to branded pages with persisted state.
- Timeline visibly advances on Stripe and Printful webhook replays, showing “ignored duplicate” on idempotent events.
- Total runtime fits 90–120 seconds; note if alternate cuts diverge.
