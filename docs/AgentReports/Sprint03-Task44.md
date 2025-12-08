# Sprint03-Task44 - Printful webhook hardening

## Summary
- Added a Printful webhook receiver that validates `X-PF-Signature`/`X-Printful-Signature` with HMAC-SHA256 when `PRINTFUL_WEBHOOK_SECRET` is set and documents the explicit fallback when it is not.
- Incoming payloads now resolve an event id (header value, payload id, or body hash), skip duplicates, and archive JSON with timestamps/headers under `PRINTFUL_WEBHOOK_ARCHIVE_DIR` (default `Images/diagnostics`).
- New Jest coverage exercises signature enforcement, idempotent archival, and the unverified fallback path; stored a local diagnostic payload for reference.

## Verification
- `npx --yes jest --runInBand tests/integration/printful-webhook-route.test.ts` (pass).
- Manual handler invocation captured `Images/diagnostics/printful-webhook-2025-11-23T22-37-57-192Z-evt_local_capture.json`.

## Webhook registrations
- `.env.preview`/`.env.production` list `PRINTFUL_STORE_ID=17088301` but no `PRINTFUL_WEBHOOK_SECRET`.
- Printful dashboard access/verification was not available; dev/prod webhook endpoint and signing secret still need confirmation/rotation for store `17088301`.

## Artifacts
- `Images/diagnostics/printful-webhook-2025-11-23T22-37-57-192Z-evt_local_capture.json`
