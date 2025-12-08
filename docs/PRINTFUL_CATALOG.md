# Printful Catalog Snapshot

**Last Updated:** November 17, 2025  
**Source:** Ethan-provided MVP mapping (external_id strategy)

> **2025-11-17 clarification:** The active token (`Snapcase-Dev-110325-1`) authenticates successfully and the Snapcase store ID is `17088301`. Printful's phone-case workflow runs exclusively on the v2 orders API, so we no longer chase `product_template_id` values. Keep this callout here so future agents do not revert to the legacy template assumptions.

| Brand | Model | Case Type | Identifier | Identifier Type | Catalog Variant ID | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| apple | iPhone 15 Pro | snap | SNAP_IP15PRO_SNAP | external_id | 17726 | Maps to `catalog.products/683` |
| apple | iPhone 15 | snap | SNAP_IP15_SNAP | external_id | 17722 |  |
| apple | iPhone 15 Pro Max | snap | SNAP_IP15PM_SNAP | external_id | 17728 |  |
| apple | iPhone 15 Plus | snap | SNAP_IP15PLUS_SNAP | external_id | 17724 |  |
| apple | iPhone 14 Pro | snap | SNAP_IP14PRO_SNAP | external_id | 16912 |  |
| apple | iPhone 14 | snap | SNAP_IP14_SNAP | external_id | 16910 |  |
| apple | iPhone 14 Pro Max | snap | SNAP_IP14PM_SNAP | external_id | 16916 |  |
| samsung | Galaxy S24 Ultra | snap | SNAP_S24U_SNAP | external_id | _pending_ | Printful catalog does not expose S24 variants yet. |
| samsung | Galaxy S24+ | snap | SNAP_S24P_SNAP | external_id | _pending_ |  |
| samsung | Galaxy S24 | snap | SNAP_S24_SNAP | external_id | _pending_ |  |

> Update this table whenever Printful catalog entries change. Confirm the `external_id` values match the live store before enabling production order flows.

SnapCase now uses Printful's v2 order payload (`/v2/orders`) which requires the numeric `catalog_variant_id` for each device. EDM exports are uploaded to Printful's `/v2/files` API and Checkout references the resulting `file_id` when creating orders, so keeping the catalog mapping current is mandatory for successful fulfillment.

## Legacy Template Endpoints (reference only)

- Requests against `GET https://api.printful.com/product-templates/@SNAP_*` still return **404 Not Found**. This is expected because the phone-case workflow no longer creates v1 product templates.
- Full template listings (`GET /product-templates`) continue to show only apparel SKUs. Ignore this result; it has no bearing on the v2 checkout.
- `/api/edm/templates` now focuses on uploading the saved design preview to `/v2/files` and storing the returned `file_id`. Do **not** block checkout on `product_template_id`.
- Historical diagnostics remain in `Images/diagnostics/printful-template-probe-SNAP_IP15PRO_SNAP-2025-11-14T20-49-44Z.json` and `Images/diagnostics/printful-template-list-2025-11-14T20-49-44Z.json` if someone needs to review the legacy behavior.
