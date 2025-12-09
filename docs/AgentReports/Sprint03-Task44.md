# Sprint03-Task44 - Printful webhook hardening

## Summary
- Re-ran the webhook integration suite to confirm HMAC signature enforcement and event-idempotent archiving remain intact (no code changes needed).
- Confirmed `PRINTFUL_STORE_ID="17088301"` is present in `.env.preview`/`.env.production`; no `PRINTFUL_WEBHOOK_SECRET` or `PRINTFUL_WEBHOOK_ARCHIVE_DIR` is configured yet (handler currently falls back to `Images/diagnostics`), so recommend `PRINTFUL_WEBHOOK_ARCHIVE_DIR=Images/diagnostics/printful`.
- Printful dashboard access was unavailable; dev/prod webhook registration and secret rotation for the Snapcase store remain pending.

## Verification
- `npx --yes jest --runInBand tests/integration/printful-webhook-route.test.ts` (pass).

## Webhook registrations
- `.env.preview` and `.env.production` list `PRINTFUL_STORE_ID=17088301`; neither defines `PRINTFUL_WEBHOOK_SECRET` nor `PRINTFUL_WEBHOOK_ARCHIVE_DIR` (handler default is `Images/diagnostics`).
- No Printful dashboard access in this session; need owner to confirm dev/prod endpoints are scoped to store `17088301`, set `PRINTFUL_WEBHOOK_SECRET`, and point archives at `Images/diagnostics/printful`.

## Artifacts
- `Images/diagnostics/printful-webhook-2025-11-23T22-37-57-192Z-evt_local_capture.json`
