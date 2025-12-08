# Sprint03-Task43 PO Review - Dynamic Printful Catalog Pivot

**Date:** 2025-12-08  
**Branch:** task/Sprint03-Task43-PO-Review  
**Owner:** Codex (AI)

## Decision
- **Alternate (conditional Go once gating/pricing/variant plumbing are revised).** Proceed with the dynamic Printful catalog only if we reframe the UX to accept Printful as the source of truth for variants/pricing and harden the checkout/order path accordingly. Otherwise hold.

## Rationale
- **UX/CX:** Current `/design` copy promises “SnapCase owns the picker” and CTA gating blocks on a curated allowlist (`src/app/design/page.tsx`). Live smokes (`docs/AgentReports/Sprint03-Task43.md`, latest 2025-12-08) show Printful emitting non-catalog `selectedVariantIds` and no supported buttons; CTA stays disabled with “Select a supported device.” Shipping dynamic catalog without UX changes would surface more variants/finishes while retaining restrictive helper text, creating a confusing mixed ownership model.
- **Technical feasibility:** Dynamic ingestion is possible but the branch is missing `@/components/editor/printful-config.ts` and `@/data/printful-catalog` (stashed), `EdmEditor` still enforces `detectVariantMismatch: true`, and `tmp/task43-capture.js` only clicks curated labels. Checkout (`src/app/api/checkout/route.ts`) still prices via `DEFAULT_UNIT_AMOUNT_CENTS`, so Printful prices would be ignored even if surfaced. Without plumbing changes, the CTA will remain locked and checkout will diverge from EDM prices.
- **Risk & trade-offs:** Dropping the allowlist without new guardrails would erode the SnapCase-first promise and can send orders with mismatched IDs or stale prices. Keeping the allowlist keeps the CTA locked (as seen in live tests). A conditional Go requires: treating the EDM-selected variant as canonical, threading Printful price into design context/checkout, and updating copy to set expectations about dynamic availability.
- **Evidence reviewed:** `docs/AgentReports/Sprint03-Task43.md` (live smokes), `docs/AgentReports/Sprint03-Task43-DevReview.md` (feasibility risks), source (`src/app/design/page.tsx`, `src/components/editor/edm-editor.tsx`, `src/app/api/checkout/route.ts`, `src/data/catalog.ts`, `tmp/task43-capture.js`). PM/Research reports for Task43 were not present in the repo; assumptions above rely on available artifacts.

## Required adjustments to maintain a simple, delightful experience
1) **CTA & guardrails:** Accept the EDM-reported variant as canonical; drop the curated allowlist/mismatch blocks in `design/page.tsx` and gate CTA solely on `designValid`/blocking issues. Update helper/guardrail copy to “SnapCase primes Printful with our recommended picks; we’ll sync to whatever you choose.” Keep a soft nudge toward SnapCase-preferred variants rather than a hard block.
2) **Variant handling:** Fetch/cache the Printful catalog (filtered to phone cases, `available:true`) and map `{catalog_variant_id, productId, externalProductId, price}` into design context. Use that data to initialize `EdmEditor` (replace the static `findPrintfulCatalogEntry`) and persist the EDM-selected variant through nonce/template probe, checkout, and order payloads. Accept that true variant locking isn’t supported; avoid treating mismatch as fatal.
3) **Pricing flow:** Capture price from `onPricingStatusUpdate` (or catalog) into design context, display it on `/design` and `/checkout`, and use it in Stripe line items with a defined markup/fallback. Add analytics for “price source” to monitor drift.
4) **Diagnostics/QA:** Update `tmp/task43-capture.js` to read dynamic catalog data or EDM telemetry instead of fixed labels so smoke runs stay meaningful post-pivot. Keep Printful host allowlist documented to avoid false “designer offline” reports.
5) **Copy & ordering:** Rephrase the hero + helper to set expectations about dynamic availability and finishes/colors coming from Printful, while keeping a SnapCase-preferred default selection. Ensure order creation routes consume the same `catalog_variant_id` the EDM produced; fail fast with actionable messaging if missing.

## Simplified MVP path (preferred)
- Let Printful own variant selection; SnapCase supplies defaults/search filters instead of a lock.
- Gate the CTA only on Printful “design valid”; drop curated allowlists and mismatch blocks.
- Use the Printful price (catalog or `onPricingStatusUpdate`) everywhere: design UI, checkout UI, and Stripe line items.
- Pass the exact EDM-selected `catalog_variant_id` + price through checkout and order create; fail fast if missing.
- Keep SnapCase flavor via defaults and copy, not hidden controls; add deeper curation after MVP if needed.

## If Hold is chosen instead
- Blocking items: confirm acceptable pricing policy (pass-through vs markup), finalize the UX stance on showing all Printful variants vs a recommended subset, and un-stash the missing catalog/config modules so feasibility work can resume on a buildable branch. Without these, enabling a dynamic catalog will either break CTA gating or undercharge at checkout.

## User-centric experience checklist (implementation guide)
- CTA unlocks only when Printful marks the design valid; helper text names the chosen device and price source.
- Users see a SnapCase-preferred default device, but can search/swap to any available variant without dead-end errors.
- Live price appears alongside the device selection and stays consistent on `/checkout`.
- Guardrail/issue copy matches Printful’s banner language and avoids contradictory “SnapCase locked” messaging.
- Checkout and confirmation reflect the exact variant/color/finish the EDM reports (no silent remapping).
