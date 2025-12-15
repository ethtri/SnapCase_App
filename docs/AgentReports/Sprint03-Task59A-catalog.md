# Sprint03-Task59A – Catalog expansion & mapping fix

## Summary
- Added iPhone 16/17 (Air/Plus/Pro/Pro Max) to `src/data/catalog.ts` and mapped them in `src/data/printful-catalog.ts` using the glossy Printful catalog variant IDs from product `683` so the embed locks to the chosen device.
- Updated Samsung S24/S24+/S24 Ultra entries to use Printful product `684` with glossy catalog variant IDs (`18737/18738/18739`) to fix the non-iPhone embed mismatch; pricing remains unchanged.
- Checked the Printful catalog/store APIs (category `244`, `search=pixel`, store `17088301`) and confirmed no Google Pixel snap case variants exist yet, so Google mapping is deferred to avoid a broken embed.

## Printful mapping
- iPhone 17: `SNAP_IP17_SNAP` (`34009`), 17 Air `34011`, 17 Pro `34013`, 17 Pro Max `34015` (product `683`).
- iPhone 16: `SNAP_IP16_SNAP` (`20294`), 16 Plus `20295`, 16 Pro `20296`, 16 Pro Max `20297` (product `683`).
- Samsung S24: `SNAP_S24_SNAP` `18737`, S24+ `18738`, S24 Ultra `18739` (product `684`).
- Google: no Pixel snap case variants surfaced via `https://api.printful.com/catalog/products?category_id=244` or `search=pixel` (with and without store scope), so Google entries were not added; add once Printful exposes real product/variant IDs.

## Diagnostics
- Before: `Images/diagnostics/2025-12-15T05-33-28-766Z-before-design-desktop.png`, `Images/diagnostics/2025-12-15T05-33-28-766Z-before-design-mobile.png`.
- After: `Images/diagnostics/2025-12-15T05-42-25-226Z-after-design-desktop.png`, `Images/diagnostics/2025-12-15T05-42-25-226Z-after-design-mobile.png`, `Images/diagnostics/2025-12-15T05-42-25-226Z-after-design-s24-desktop.png`.

## Tests
- `npm run build` (pass).
- `npm install` reported 7 vulnerabilities (2 moderate, 5 high); not auto-resolved in this task.

## Deployment
- `vercel deploy --prod --scope snapcase` → `https://snapcase-aykgj0bvw-snapcase.vercel.app` aliased to `https://dev.snapcase.ai`.

## Follow-ups
- Add Google Pixel snap cases once Printful publishes the product + variant IDs; extend catalog and mapping accordingly.
- Keep an eye on Printful embed telemetry on dev to confirm Samsung catalog IDs stay aligned after the product swap to `684`.
