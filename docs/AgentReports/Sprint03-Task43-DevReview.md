# Sprint03-Task43 DevReview - Dynamic Printful Catalog Pivot

**Date:** 2025-12-31  
**Branch:** task/Sprint03-Task43-DevReview  
**Author:** Codex (AI)

## Feasibility Verdict
- **Needs changes before approval.** A dynamic Printful catalog is technically workable, but the current plan assumes variant locking and curated gating that do not exist in Printful, the checkout still prices off a static constant, and the working branch is missing required modules (`@/data/printful-catalog`, `@/components/editor/printful-config.ts`, etc.) because they are stashed. We need targeted adjustments to CTA gating, pricing/order flows, and build hygiene to avoid regressions.

## Findings
- **Catalog & editor coupling:** `src/app/design/page.tsx` builds its picker from the static `src/data/catalog.ts` and disables the CTA when Printful reports a variant outside that curated set or a mismatch against the locked seed. With a dynamic catalog (and no reliable variant lock), these guards will keep the CTA permanently disabled unless the gating logic is revised to accept Printful’s selected variant as canonical.
- **Variant lock limits:** `src/components/editor/printful-config.ts` (stashed) still relies on `isVariantSelectionDisabled` + `preselectedSizes` to “lock” a variant. Research docs confirm Printful does not honor true variant locking; the embed will continue to surface other variants even when those flags are set. `EdmEditor`’s mismatch detection (`detectVariantMismatch: true`) will therefore keep emitting `variantMismatch` when users pick anything else.
- **Checkout pricing gap:** `src/app/api/checkout/route.ts` uses a hardcoded `$34.99` (`DEFAULT_UNIT_AMOUNT_CENTS`) and ignores `onPricingStatusUpdate` from the EDM. A dynamic catalog with Printful-sourced prices will drift immediately unless we persist the catalog/EDM price into design context and pass it through to Stripe.
- **Order payload coupling:** The EDM flow expects `externalProductId` + `variantId` and uses `findPrintfulCatalogEntry` to derive `printfulProductId` for create-mode init. The helper lives in the stashed `src/data/printful-catalog.ts` (productIds 683/684 only). Dynamic catalog variants that point at other productIds (or new device families) will fail create-mode unless this mapping and the nonce/template probes are made data-driven.
- **UX/CX coherence risk:** The current copy/CTA states assume SnapCase owns the picker and enforces a curated beta list. Switching to “all Printful variants” without UI changes will show the same helper/guardrail language while surfacing far more options (colors, finishes, non-supported devices), eroding the SnapCase-first promise. The harness `tmp/task43-capture.js` also hunts only the curated labels, so automated diagnostics will report false negatives after the pivot.
- **Build hygiene:** Because the new catalog/Printful files are stashed off `task/Sprint03-Task43-edm-live-smoke`, the current branch will not build (`import "@/data/printful-catalog"` fails). Any DevReview-approved plan must explicitly un-stash/re-stage those files when implementation resumes on the Task43 branch.

## Risks & Mitigations
- **Variant selection & CTA gating:** Without true locking, Printful can emit any variant; the current mismatch/unsupported checks disable the CTA. Mitigation: treat the EDM-reported variant as canonical, drop the curated allowlist check, and gate only on `designValid`/blocking issues. Persist the returned variant into design context so checkout/order payloads match the actual EDM state.
- **Pricing accuracy:** Static `$34.99` in `src/app/api/checkout/route.ts` will diverge from Printful catalog/EDM prices and could undercharge/overcharge. Mitigation: capture price from `onPricingStatusUpdate` (or the catalog API) into design context, pass it to checkout, and include it in Stripe line items and analytics; define a fallback/markup policy.
- **Order creation payloads:** Dynamic variants need to flow through nonce, template probe, checkout, and order creation with consistent identifiers (`catalog_variant_id`, `external_product_id`, placement files). Mitigation: extend the mapping layer to carry `productId`, `externalProductId`, and `catalogVariantId` directly from the catalog API; validate payload shapes against Printful before enabling CTA.
- **Origin allowlisting & host drift:** Dynamic catalog fetches don’t fix EDM origin requirements. Mitigation: keep `dev.snapcase.ai` (and any preview hosts used for QA) whitelisted before reruns; document the allowlist check in the plan so CTA failures aren’t misattributed to catalog changes.
- **Catalog performance & UX overload:** Pulling the full Printful catalog may slow `/design` and overwhelm users. Mitigation: cache catalog responses (e.g., 5m TTL), filter to phone-case products and `available:true`, and add brand/model search with SnapCase-preferred defaults to preserve the “SnapCase-first” flow.
- **QA harness drift:** `tmp/task43-capture.js` only clicks the curated labels. Mitigation: update the harness to read dynamic catalog data (or use EDM telemetry) so smoke runs remain meaningful post-pivot.

## Required Adjustments to the Implementation Plan
- **Rework gating:** In `src/app/design/page.tsx`, accept the EDM-selected variant as the source of truth; remove the curated allowlist/mismatch CTA blocks and instead gate on `designValid`/blocking issues. Update helper/guardrail copy to reflect dynamic availability.
- **Catalog ingestion:** Add a server endpoint to fetch/cache the Printful catalog (filtered to phone cases + `available:true`), and reshape UI data so SnapCase cards/search derive from live catalog entries instead of `src/data/catalog.ts`. Include `productId`, `externalProductId`, `catalogVariantId`, and pricing in the payload.
- **Editor bootstrap:** Make `EdmEditor` robust to dynamic variants: derive `printfulProductId` from catalog data (not the static map), and remove reliance on `preselectedSizes` for locking. If variant locking stays best-effort, avoid treating variant mismatches as blocking.
- **Pricing pipeline:** Store EDM/catalog price in design context and thread it through checkout (`src/app/api/checkout/route.ts`) and Stripe metadata; define a rounding/markup rule and display the live price on `/design` and `/checkout`.
- **Order payload validation:** Ensure the order creation path (server-side) consumes the same `catalog_variant_id` and placement payload the EDM produced; add defensive checks so orders fail fast with actionable errors if catalog data is missing or stale.
- **Build hygiene:** When resuming implementation on `task/Sprint03-Task43-edm-live-smoke`, reapply the stashed files (`@/data/printful-catalog`, `@/components/editor/printful-config.ts`, template API routes) before coding against this plan.

## Open Questions for PO/PM
1) Is it acceptable for users to see all Printful phone-case variants (including finishes/colors) without SnapCase curation, or do we need a “recommended” subset surfaced first?
2) What pricing policy should we apply (pass-through vs. markup) once we ingest Printful prices? Are taxes/shipping handled separately or baked into the margin?
3) If Printful offers variants outside the current beta devices, should CTA remain enabled (true dynamic) or should we still soft-limit to a SnapCase-approved list?
4) Are we comfortable dropping variant-lock messaging (“SnapCase owns the picker”) if the embed can’t be locked, or do we need revised copy to set expectations?
5) Which hosts must stay on the Printful allowlist for QA (dev alias vs. ephemeral previews) during the dynamic-catalog rollout, and who owns keeping that list current?
