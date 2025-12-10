# Sprint03-Task50 – Printful Webhook Secret

## Summary
- Confirmed Printful API for store `17088301` does **not** expose a webhook signing secret; `GET/POST /webhooks` return only `url`, `types`, and empty `params`.
- Kept `PRINTFUL_WEBHOOK_SECRET` unset in all environments; archive dir remains `Images/diagnostics/printful`.
- Updated documentation to reflect the API limitation and current security posture; no code/runtime changes or redeploys.

## What I Did
1) Pulled prod env vars for reference; confirmed webhook URL already set to `https://app.snapcase.ai/api/webhooks/printful`.
2) Queried Printful `GET /webhooks` with permutations (`include_secret`, `detailed`, etc.) and re-POSTed the webhook URL; responses never included `secret`/`secret_key`.
3) Added clarification docs: `docs/PRINTFUL_WEBHOOK_SECRET_FINAL.md`, `docs/PRINTFUL_WEBHOOK_SECRET_CLARIFICATION.md`, and updated `docs/PRINTFUL_WEBHOOK_SETUP_GUIDE.md` to state no secret is available and `PRINTFUL_WEBHOOK_SECRET` should stay unset.
4) Cleaned local env artifacts (`.env.local`, `.env.production`) and reverted `.gitignore` addition.

## Findings
- Printful’s live API surface does not provide a signing secret for webhooks; references in some docs appear outdated/unimplemented.
- Current webhook events remain subscribed as expected (order_created/updated/failed/package_shipped/package_returned).
- Security mitigations in place without a secret: HTTPS-only, strict JSON parsing, 5 MB body cap, duplicate-event short-circuiting, payload archiving.

## Tests
- `npx --yes jest --runInBand tests/integration/printful-webhook-route.test.ts` **not run** (missing dependency `next/jest` in this clean worktree; node_modules not installed). Handler logic unchanged.

## Env / Deployments
- `PRINTFUL_WEBHOOK_SECRET`: left unset (no value available from Printful).
- `PRINTFUL_WEBHOOK_ARCHIVE_DIR`: unchanged (`Images/diagnostics/printful`).
- No deployments triggered; runtime code unchanged.

## Follow-ups (if Printful ever exposes a secret)
- Pull the secret, set `PRINTFUL_WEBHOOK_SECRET` in preview/prod, rerun the integration test, and update docs/PROGRESS accordingly.
