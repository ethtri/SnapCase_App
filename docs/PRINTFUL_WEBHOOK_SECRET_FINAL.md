# Printful Webhook Secret – Final Status (Store 17088301)

**Date:** 2025-12-10  
**Status:** Printful’s API does not expose a webhook signing secret. `secret_key` is not returned by `GET /webhooks`, `POST /webhooks`, or any documented query params (`include_secret`, `detailed`, etc.). There is no separate endpoint to fetch a signing key.

## Findings
- The current webhook is configured at `https://app.snapcase.ai/api/webhooks/printful` with events: `order_created`, `order_updated`, `order_failed`, `package_shipped`, `package_returned`.
- All tested permutations of the Printful webhooks API returned only `url`, `types`, and an empty `params` array; no `secret`, `secret_key`, or similar fields exist.
- Printful developer docs reference secrets in some places, but the live API does not supply one for store `17088301`.

## Decision
- Leave `PRINTFUL_WEBHOOK_SECRET` **unset** in all environments. Signature verification cannot be enabled until/unless Printful publishes a secret or allows custom keys.
- Keep `PRINTFUL_WEBHOOK_ARCHIVE_DIR=Images/diagnostics/printful` (already set in preview/prod) so payloads remain auditable.

## Current Protections (without a secret)
- HTTPS-only endpoint.
- Strict JSON parsing and 5 MB body cap.
- Idempotent handling via event-id headers/hash with duplicate short-circuiting.
- Payload archiving for audit and replay.

## Next Steps (if Printful adds support)
1) Retrieve the exposed secret (or set a custom one, if they allow).  
2) Set `PRINTFUL_WEBHOOK_SECRET` in preview + production.  
3) Re-run `npx --yes jest --runInBand tests/integration/printful-webhook-route.test.ts`.  
4) Update this file and `PROGRESS.md` to reflect the new posture.
