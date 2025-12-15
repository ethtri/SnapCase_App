# Printful Catalog Snapshot

**Last Updated:** December 14, 2025  
**Source:** Printful catalog APIs (`/products/683` + `/products/684`, glossy variants)

> **2025-11-17 clarification:** The active token (`Snapcase-Dev-110325-1`) authenticates successfully and the Snapcase store ID is `17088301`. Printful's phone-case workflow runs exclusively on the v2 orders API, so we no longer chase `product_template_id` values. Keep this callout here so future agents do not revert to the legacy template assumptions.

| Brand | Model | Case Type | Identifier | Identifier Type | Catalog Variant ID | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| apple | iPhone 17 Pro | snap | SNAP_IP17PRO_SNAP | external_id | 34013 | Printful product 683 (Snap Case for iPhone) |
| apple | iPhone 17 | snap | SNAP_IP17_SNAP | external_id | 34009 |  |
| apple | iPhone 17 Pro Max | snap | SNAP_IP17PM_SNAP | external_id | 34015 |  |
| apple | iPhone 17 Air | snap | SNAP_IP17AIR_SNAP | external_id | 34011 |  |
| apple | iPhone 16 Pro | snap | SNAP_IP16PRO_SNAP | external_id | 20296 | Printful product 683 (Snap Case for iPhone) |
| apple | iPhone 16 | snap | SNAP_IP16_SNAP | external_id | 20294 |  |
| apple | iPhone 16 Pro Max | snap | SNAP_IP16PM_SNAP | external_id | 20297 |  |
| apple | iPhone 16 Plus | snap | SNAP_IP16PLUS_SNAP | external_id | 20295 |  |
| apple | iPhone 15 Pro | snap | SNAP_IP15PRO_SNAP | external_id | 17726 |  |
| apple | iPhone 15 | snap | SNAP_IP15_SNAP | external_id | 17722 |  |
| apple | iPhone 15 Pro Max | snap | SNAP_IP15PM_SNAP | external_id | 17728 |  |
| apple | iPhone 15 Plus | snap | SNAP_IP15PLUS_SNAP | external_id | 17724 | Not yet exposed in the app catalog. |
| apple | iPhone 14 Pro | snap | SNAP_IP14PRO_SNAP | external_id | 16912 |  |
| apple | iPhone 14 | snap | SNAP_IP14_SNAP | external_id | 16910 |  |
| apple | iPhone 14 Pro Max | snap | SNAP_IP14PM_SNAP | external_id | 16916 |  |
| samsung | Galaxy S24 Ultra | snap | SNAP_S24U_SNAP | external_id | 18739 | Printful product 684 (Snap Case for Samsung) |
| samsung | Galaxy S24+ | snap | SNAP_S24P_SNAP | external_id | 18738 | Printful product 684 |
| samsung | Galaxy S24 | snap | SNAP_S24_SNAP | external_id | 18737 | Printful product 684 |

> Update this table whenever Printful catalog entries change. Confirm the `external_id` values match the live store before enabling production order flows. Printful still does not list Google Pixel snap cases in the catalog or store APIs; Google mapping remains blocked until variants exist.

SnapCase now uses Printful's v2 order payload (`/v2/orders`) which requires the numeric `catalog_variant_id` for each device. EDM exports are uploaded to Printful's `/v2/files` API and Checkout references the resulting `file_id` when creating orders, so keeping the catalog mapping current is mandatory for successful fulfillment.

## Legacy Template Endpoints (reference only)

- Requests against `GET https://api.printful.com/product-templates/@SNAP_*` still return **404 Not Found**. This is expected because the phone-case workflow no longer creates v1 product templates.
- Full template listings (`GET /product-templates`) continue to show only apparel SKUs. Ignore this result; it has no bearing on the v2 checkout.
- `/api/edm/templates` now focuses on uploading the saved design preview to `/v2/files` and storing the returned `file_id`. Do **not** block checkout on `product_template_id`.
- Historical diagnostics remain in `Images/diagnostics/printful-template-probe-SNAP_IP15PRO_SNAP-2025-11-14T20-49-44Z.json` and `Images/diagnostics/printful-template-list-2025-11-14T20-49-44Z.json` if someone needs to review the legacy behavior.
