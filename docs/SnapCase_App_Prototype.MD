# PRD.md — Snapcase “Design & Order” Web App (v0)

*Last updated: {{today}}  • Owner: Ethan Trifari  • Engineering Lead: TBA  • Repo: snapcase-app*

## 0) Summary

Build a minimal but production‑ready web app at **`app.snapcase.ai`** where customers can select their phone model, design a case, pay, and have it fulfilled via **Printful**. Marketing site remains on **Squarespace** at `snapcase.ai` and links into the app.

**Primary flow:** /design → /checkout → /thank‑you → /order/:id.
**Editor:** Prefer **Printful Embedded Design Maker (EDM)**; if not available, fall back to a custom lightweight editor (Fabric.js/Konva.js) that exports a 300‑DPI PNG and uses Printful Orders API.

> **Section Status**
>
> | Section | Status | Notes |
> | --- | --- | --- |
> | 0) Summary | Authoritative | Reflects EDM-first posture with Fabric fallback. |
> | 1) Goals & Non-Goals | Authoritative | Still aligns with stakeholder intent. |
> | 2) Users & Stories | Authoritative | No Printful deltas. |
> | 3) Scope (v0) | Authoritative | Updated to clarify safe-area/DPI guard are Fabric-only (Ref: docs/Printful_EDM_KeyFacts.md:141-165). |
> | 4) Constraints & Assumptions | Authoritative | Notes EDM gating + fallback flag remain true. |
> | 5) UX Requirements | Authoritative | Already references Printful owning guardrail banners. |
> | 6) Accessibility & NFRs | Authoritative | Applies to both EDM + Fabric shells. |
> | 7) Architecture | Authoritative | Includes initProduct requirement for EDM create mode (Ref: docs/Printful_EDM_KeyFacts.md:215-229). |
> | 8) API Contracts | Needs Rewrite | Section 8.1 now documents dual nonce response shapes (Ref: docs/Printful_EDM_KeyFacts.md:27-35). |
> | 9) Data Model | Authoritative | Matches current entity usage. |
> | 10) Environment Variables | Authoritative | Still required. |
> | 11) Feature Flags | Authoritative | `USE_EDM` remains primary toggle. |
> | 12) Acceptance Criteria | Authoritative | Aligns with EDM flow. |
> | 13) Error Handling | Deprecated – Fabric-only | Printful now owns DPI/guardrail UX; Fabric guidance retained for fallback only (Ref: docs/Printful_EDM_KeyFacts.md:141-165). |
> | 14) Observability | Authoritative | Events align with EDM callbacks. |
> | 15) Rollout & QA | Authoritative | Still accurate. |

## 1) Goals & Non‑Goals

**Goals**

* Replicate the kiosk “Pick → Design → Pay” experience on web.
* Ship a working prototype with Stripe payments and Printful fulfillment.
* Maintain brand consistency with the Snapcase CX/UX/Brand Guide.

**Non‑Goals (v0)**

* Accounts/profiles, coupons, gift wrap, tax-exempt logic, kiosk pickup sync.
* Multi-item cart/add-to-cart flow is out of v0 scope; single-case checkout only, with multi-case/cart to be scoped in a later sprint.

## 2) Users & Stories

* **Shopper (guest)**: “I want to make a case from my photos and get it shipped fast.”
* **Returning shopper** (later): “I want to reorder or remix a saved design.”
* **Operator**: “I want orders to appear in Printful, with statuses sent back to the app.”

## 3) Scope (v0)

* Devices: Recent iPhone & Samsung models (top ~12 across both).
* Case types: Snap (start) and Tough (add next).
* Editor: Image upload, crop/zoom, text, simple stickers. **Printful EDM owns guardrails** (banner, safe-area, DPI) and SnapCase only mirrors status; the legacy safe-area + DPI guard reactivates **only** when Fabric fallback is active (`USE_EDM=false`). (Ref: docs/Printful_EDM_KeyFacts.md:141-165)
* Payments: **Stripe Checkout** (test → live).
* Fulfillment: Printful orders (confirm immediately).
* Status: basic order status page + email receipt (Stripe email OK at v0).

## 4) Constraints & Assumptions

* **Squarespace** powers apex (`snapcase.ai`), **Vercel** hosts app on subdomain (`app.snapcase.ai`). DNS: Squarespace registry; CNAME for `app` to Vercel.
* **EDM access may be gated**; provide Plan‑B editor toggle via env flag.
* **Back‑only print**; communicate during design/review.

## 5) UX Requirements (must‑haves)

* Hero → CTA from Squarespace to app.
* **/design** page contains:

  1. Device picker (brand/model/case).
  2. Editor surface (EDM iframe or Fabric.js canvas).
  3. Clear notes and helper UI:
     - Printful’s picker remains visible but locked; helper copy keeps variant changes in Step 1 (refs: `docs/Responsive_Blueprint.md` §Screen 2, `docs/Printful_EDM_KeyFacts.md` §Variant Selection & Data Flow).
     - Typeahead search with suggestions, brand tabs (Apple/Samsung/Pixel/More) with counts, and filter chips for MagSafe-ready, In-stock/Low-stock, and template-fit variants. Coming-soon/non-selectable cards stay visible but disabled, and a compact error/retry tile replaces the verbose diagnostics state when the catalog fails to load.
     - Helper chip now ships as the compact summary above the iframe: “Your device: iPhone 15 Pro · Change device,” reinforcing the lock while keeping the editor layout clean (`docs/Responsive_Blueprint.md` §Screen 2 Layout & Messaging).
     - Guardrail summary card mirrors `onDesignStatusUpdate` payloads (designValid, errors, variant IDs) and drives CTA disablement; no duplicate SnapCase banners while EDM is active (`docs/Printful_EDM_Risk_Analysis.md` §1).
     - Guardrail toasts serialize through a single queue pinned above the ActionBar; DPI/content/policy warnings never stack or overlap Printful’s iframe per `docs/Responsive_Blueprint.md` §UX Decision Log #3.
     - CTA copy states align with the blueprint: **Select a device** (no selection), **Continue to design** (picker ready), **Waiting on your upload**/**Fix the Printful banner** (blocking/pending, disabled), and **Continue to checkout** once Printful clears the design. State transitions emit `design_cta_state_change` analytics so diagnostics can correlate UX + funnel data (`docs/Responsive_Blueprint.md` §Screen 2 CTA gating).
     - Safe-area overlay + DPI badge appear **only** during Fabric fallback; make the fallback label explicit so CX can reconcile screenshots.
     - Business copy reiterates “Back-only print” + “Printful sets base cost; SnapCase adds markup” to stay aligned with `docs/BusinessContext.Md` §3 and the checkout pricing narrative.
  4. **Flow options (Sprint04-Task06):**
     - **Option A (shipped Sprint04-Task07):** Screen 1 is a dedicated picker page with full-width grid + floating/sticky CTA. Continue loads the editor-only Screen 2 with the compact summary chip ("Your device: iPhone 15 Pro · Change device") above the iframe. Mirrors the mockups and avoids the cramped combined view.
     - **Option B (single-screen fallback):** Keep picker + editor on /design, but collapse the picker into a pill/accordion after selection. "Edit device" reopens the grid inline without shrinking the Printful column. ActionBar/FAB stays visible; CTA/state labels remain in view. Use only if the dedicated picker screen becomes blocked.
     - Copy deck for both: "Choose your phone and case." -> "Your device: iPhone 15 Pro · Change device." CTA states "Select a device" / "Continue to design" / "Waiting on your upload" / "Continue to checkout." Avoid jargon like "variant lock"/"rail."

  - Save/resume: persist selected device + latest template so returning from checkout restores the design and CTA state.
* **/checkout** shows item summary, shipping options (Standard/Express), price, and proceeds to Stripe Checkout.
  - Cancel/resume banner persists across sessions until checkout succeeds; no dismiss affordance ships by default. Future dismissal must be gated behind `NEXT_PUBLIC_ALLOW_CANCEL_BANNER_DISMISS` and continue logging the outstanding status (`docs/Responsive_Blueprint.md` §UX Decision Log #2, `Images/diagnostics/checkout-cancel-banner-2025-11-05T15-57-23-800Z.png`).
  - Snapcase Quality Promise banner (violet tint, shield icon) sits at the top of the review column reiterating “If anything’s off, we remake it on us.” Use the same copy in CX/support scripts and reference the captured evidence (`Images/diagnostics/checkout-desktop-2025-11-05T16-48-23-099Z.png`, `Images/diagnostics/checkout-mobile-2025-11-05T16-48-23-099Z.png`).
  - Cost summary + shipping helpers emit polite `aria-live` updates and analytics (`checkout_shipping_selected`, `checkout_pricing_update`) whenever variants or shipping speeds change. CTA helper text under “Pay with Stripe” repeats the Printful-first guardrail messaging so there is no conflicting reassurance downstream.
  - Pricing transparency helper: short line near totals such as "Base price set by Snapcase; shipping/tax shown below" to prevent surprises.
  - Proof/Checkout card: Blank Proof & Checkout tile removed. A "Design summary" card now renders only when data exists (device, art thumbnail, template status, price) powered by onDesignStatusUpdate + pricing; otherwise it stays hidden to reduce clutter. Action: schedule a later sprint spike to assess feasibility of a live thumbnail without blocking flow.
* **/thank‑you** renders the confirmation hero (violet badge + order ID), fulfillment timeline (Submitted → Print files → In production → Shipped), delivery ETA chip, Track order / Design another dual CTA, and support link. Timeline + delivery copy pull from the persisted `snapcase:order-confirmation` snapshot (set during `/checkout` submission) and currently map Printful statuses (`draft`, `on_hold`, `in_progress`, `shipped`) to the four steps while we wait for `/api/order/create` + webhook polling to provide live Printful IDs/tracking URLs. Until then, Track order routes to `/order/preview?from=thank-you` and timeline state defaults to **Submitted** unless QA forces it via `?status=`.

## 6) Accessibility & NFRs

* **WCAG AA** contrast, keyboard navigation for all interactive elements, visible focus ring.
* **Perf:** FCP < 1.5s, TTI < 3s on 4G; editor loads within 2s after route.
* **Security:** Secrets server‑side only; Stripe PCI handled by Stripe UI; rate‑limit API routes.
* **Privacy:** Link to Privacy/UGC policy on every page.

## 7) Architecture

```
Squarespace (snapcase.ai) → CTA → app.snapcase.ai (Vercel/Next.js 14)
  ├─ /design (EDM iframe or Fabric.js)
  ├─ /checkout (Stripe redirect)
  ├─ /thank-you (confirms payment; creates order if not already)
  ├─ /order/[id] (status)
  └─ /api/* (serverless routes)
      • /api/edm/nonce (POST) → Printful EDM Nonce
      • /api/catalog/phones (GET) → list supported variants
      • /api/checkout (POST) → Stripe Checkout Session
      • /api/order/create (POST) → Printful order (confirm=true)
      • /api/webhooks/stripe (POST) → mark paid
      • /api/webhooks/printful (POST) → update status
```

**EDM create-mode requirement:** Every new design session must pass `initProduct` `{ productId, technique: "SUBLIMATION" }` plus the selected `externalProductId` into `PFDesignMaker`. Only when Printful returns a `templateId` can `initProduct` be skipped (`edit` mode). (Ref: docs/Printful_EDM_KeyFacts.md:215-229)

### Tech choices

* **Next.js 14 (App Router)**, **TypeScript**, **Tailwind** (+ design tokens), **shadcn/ui**.
* **Stripe** (Checkout first; Element later).
* **Printful API** (EDM + Orders).
* Utility: **Zod** for input validation, **SWR**/**React Query** for data fetching, **Rate limiting** (Upstash/edge or simple in‑memory for v0).

## 8) API Contracts (v0)

### 8.1 `POST /api/edm/nonce`

**Body** `{ externalProductId: string, userAgent?: string, ip?: string }`
**Response** `200` with dual-shape payloads from Printful (`{ code, result: { nonce: string } }` **or** `{ code, result: { nonce: { nonce: string, template_id } } }`). Our route normalizes this into `{ nonce: string, templateId?: string, expiresAt?: number }` before returning to the client. (Ref: docs/Printful_EDM_KeyFacts.md:27-35)
**Notes**: Server → `POST https://api.printful.com/embedded-designer/nonces` with Bearer token.

### 8.2 `GET /api/catalog/phones`

**Query**: none (first pass uses a curated mapping)
**Response** `[{ brand: 'apple'|'samsung', model: 'iPhone 15', caseType: 'snap'|'tough', productId: number, variantId: number }]`

### 8.3 `POST /api/checkout`

**Body** `{ price: number, email?: string, shippingAddress?: {...}, metadata?: {...} }`
**Response** `{ url: string }` // Stripe Checkout Session URL

### 8.4 `POST /api/order/create`

**Body** `{ templateId?: string, variantId: number, recipient: {...}, items?: [...], externalId?: string }`
**Response** `{ printfulOrderId: number, status: 'created'|'failed', errors?: string[] }`

### 8.5 Webhooks

* **Stripe:** `checkout.session.completed` → mark order paid, persist `payment_intent`, `customer_email`.
* **Printful:** `order_created`, `order_updated`, `package_shipped` → update status and tracking.

## 9) Data Model (Typescript)

```ts
export type Variant = { brand:'apple'|'samsung'; model:string; caseType:'snap'|'tough'; productId:number; variantId:number };
export type DesignTemplate = { templateId:string; externalProductId:string; createdAt:string };
export type Order = { id:string; printfulOrderId?:number; status:'draft'|'paid'|'submitted'|'shipped'|'failed'; variantId:number; templateId?:string; price:number; email?:string; tracking?:{ carrier:string; code:string } };
```

## 10) Environment Variables (Vercel → Settings → Env Vars)

* `PRINTFUL_TOKEN` (private; EDM + Orders)
* `PRINTFUL_STORE_ID`
* `STRIPE_SECRET_KEY`
* `STRIPE_WEBHOOK_SECRET` (when configured)
* `NEXT_PUBLIC_APP_URL` = `https://app.snapcase.ai`
* `USE_EDM` = `true|false`

## 11) Feature Flags

* `USE_EDM` → switch between EDM and Plan‑B editor.
* `SHOW_EXPRESS_SHIPPING` → toggles express option in review.

## 12) Acceptance Criteria

* [ ] Visiting `/design` loads device picker and editor within 2s.
* [ ] Saving in EDM returns a `templateId` and advances to checkout.
* [ ] Stripe Checkout completes and redirects to `/thank‑you`.
* [ ] `/api/order/create` submits an order to Printful with **compatible** `variantId`; order appears in Printful dashboard.
* [ ] Printful webhook updates status to `shipped` with tracking.
* [ ] `/checkout` surfaces the Snapcase Quality Promise banner and announces pricing/shipping recalculations via `aria-live="polite"` while logging `checkout_shipping_selected` + `checkout_pricing_update`.

## 13) Error Handling

### EDM-first (Authoritative)
* Printful EDM enforces DPI, safe-area, and moderation automatically; SnapCase mirrors `designValid`, `errors[]`, and `warnings[]` inside our summary card plus analytics. (Ref: docs/Printful_EDM_KeyFacts.md:141-165)
* Printful/Stripe failure → toast + retry; preserve design context in localStorage/session so users can rehydrate after errors.
* OOS/invalid variant → fail fast with helper copy that references Printful’s picker being locked to SnapCase’s upstream selection; prompt user to revisit Screen 1 if catalog mismatch occurs.

### Deprecated – Fabric-only guardrails
* Legacy low-DPI modal + helper copy now apply only if `USE_EDM=false` and the Fabric canvas renders. Keep for fallback QA but hide automatically once Printful reconnects.

## 14) Observability

* Console + Vercel logs; structure logs with request id & user agent.
* Capture key funnel metrics: `editor_start`, `template_saved`, `checkout_started`, `payment_succeeded`, `order_created`, `order_shipped`.

## 15) Rollout & QA

* Dev → Preview → Prod in Vercel; feature flag for EDM.
* Stripe test cards; Printful Webhook Simulator.
* Lighthouse accessibility and performance scores ≥ 90.

## 16) Roadmap (v1.1+)

* Templates (collage, bold type), MagSafe option, accounts, referral codes, recycle coupon logic, kiosk pickup QR bridge.
