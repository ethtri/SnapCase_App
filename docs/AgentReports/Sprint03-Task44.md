# Sprint03-Task44 - Printful webhook hardening

## Summary
- Pointed Printful store `17088301` to production via `scripts/printful-webhook-setup.js set https://app.snapcase.ai/api/webhooks/printful` (events: `order_created`, `order_updated`, `order_failed`, `package_shipped`, `package_returned`).
- Added `PRINTFUL_WEBHOOK_ARCHIVE_DIR=Images/diagnostics/printful` to `.env.preview` and `.env.production` and created the archive folder so payloads land under `Images/diagnostics/printful`.
- Left `PRINTFUL_WEBHOOK_SECRET` unset (no confirmed signing key yet); risk remains that incoming webhooks are accepted without signature validation until a secret is provided.
- Re-ran the webhook integration test suite to verify signature gating/archiving behavior remains green.

## Verification
- `npx --yes jest --runInBand tests/integration/printful-webhook-route.test.ts` (pass).
- `scripts/printful-webhook-setup.js set https://app.snapcase.ai/api/webhooks/printful` (with `.env.preview` credentials) succeeded.
- `scripts/printful-webhook-setup.js check` confirms the active webhook URL `https://app.snapcase.ai/api/webhooks/printful` with event types `order_created`, `order_updated`, `order_failed`, `package_shipped`, `package_returned`.

## Webhook registrations
- `.env.preview` and `.env.production` now set `PRINTFUL_STORE_ID=17088301`, `PRINTFUL_TOKEN`, and `PRINTFUL_WEBHOOK_ARCHIVE_DIR=Images/diagnostics/printful`; `PRINTFUL_WEBHOOK_SECRET` remains unset (no signature validation live).
- API check shows the active webhook URL is `https://app.snapcase.ai/api/webhooks/printful` with events `order_created`, `order_updated`, `order_failed`, `package_shipped`, `package_returned`. Follow-up: add `PRINTFUL_WEBHOOK_SECRET` when a signing key is confirmed so handlers enforce signatures in production.

## Artifacts
- `Images/diagnostics/printful-webhook-2025-11-23T22-37-57-192Z-evt_local_capture.json`
