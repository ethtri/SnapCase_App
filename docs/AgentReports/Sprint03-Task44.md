# Sprint03-Task44 - Printful webhook hardening

## Summary
- Re-ran the webhook integration suite to confirm HMAC signature enforcement and event-idempotent archiving remain intact (no code changes needed).
- Confirmed `PRINTFUL_STORE_ID="17088301"` is present in `.env.preview`/`.env.production`; no `PRINTFUL_WEBHOOK_SECRET` or `PRINTFUL_WEBHOOK_ARCHIVE_DIR` is configured yet (handler currently falls back to `Images/diagnostics`), so recommend `PRINTFUL_WEBHOOK_ARCHIVE_DIR=Images/diagnostics/printful`.
- Queried Printful via `scripts/printful-webhook-setup.js check` (using `.env.production` token) and found the store webhook currently points to `https://dev.snapcase.ai/api/webhooks/printful` with event types: `order_created`, `order_updated`, `order_failed`, `order_canceled`, `order_put_hold`, `order_remove_hold`, `package_shipped`, `package_returned`. Still need to decide whether to switch to production URL and set a signing secret.

## Verification
- `npx --yes jest --runInBand tests/integration/printful-webhook-route.test.ts` (pass).
- `node scripts/printful-webhook-setup.js check` (with `PRINTFUL_TOKEN`/`PRINTFUL_STORE_ID` sourced from `.env.production`): returns webhook URL `https://dev.snapcase.ai/api/webhooks/printful` and events listed above.

## Webhook registrations
- `.env.preview` and `.env.production` list `PRINTFUL_STORE_ID=17088301`; neither defines `PRINTFUL_WEBHOOK_SECRET` nor `PRINTFUL_WEBHOOK_ARCHIVE_DIR` (handler default is `Images/diagnostics`; recommended `Images/diagnostics/printful`).
- API check shows the active webhook URL is `https://dev.snapcase.ai/api/webhooks/printful` with the events listed above. Next actions: confirm whether to repoint production traffic to `https://app.snapcase.ai/api/webhooks/printful`, set `PRINTFUL_WEBHOOK_SECRET` after clarifying Printful’s signing key expectations, and set `PRINTFUL_WEBHOOK_ARCHIVE_DIR=Images/diagnostics/printful` in both scopes.

## Artifacts
- `Images/diagnostics/printful-webhook-2025-11-23T22-37-57-192Z-evt_local_capture.json`
