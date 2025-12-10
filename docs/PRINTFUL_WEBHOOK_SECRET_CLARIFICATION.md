# Printful Webhook Secret Clarification (Store 17088301)

**Summary:** Printful’s webhook API does **not** return a signing secret for store `17088301`. Calls to `GET /webhooks` (with/without `include_secret`, `detailed`, or similar flags) and `POST /webhooks` only return `url`, `types`, and an empty `params` array. No `secret`/`secret_key` field is present, and there is no alternate endpoint to fetch one.

## Why this matters
- The webhook handler supports HMAC verification when `PRINTFUL_WEBHOOK_SECRET` is provided, but the Printful API never surfaces a secret to use.
- Some Printful docs and forum posts mention webhook secrets, but those references do not match the live API surface for this store.

## Current stance
- `PRINTFUL_WEBHOOK_SECRET` remains **unset** in preview/production; this is intentional, not a misconfiguration.
- Webhook security relies on HTTPS, strict JSON parsing, a 5 MB body cap, duplicate-event short-circuiting, and archiving to `Images/diagnostics/printful`.

## If Printful adds a secret later
1) Pull the secret once exposed and set `PRINTFUL_WEBHOOK_SECRET` in preview/prod.  
2) Re-run `tests/integration/printful-webhook-route.test.ts`.  
3) Update `docs/PRINTFUL_WEBHOOK_SECRET_FINAL.md` and `PROGRESS.md` with the new posture.
