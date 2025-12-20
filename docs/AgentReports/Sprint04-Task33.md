# Sprint04-Task33 - dev rollback

## Scope
- Restore `dev.snapcase.ai` to the Task22 stable build and verify.

## Actions
- Ran `vercel alias set https://snapcase-ikedc1s8f-snapcase.vercel.app dev.snapcase.ai --scope snapcase`.
- Confirmed alias mapping via `vercel alias list --scope snapcase | rg dev.snapcase.ai`.

## Verification
- `curl -I https://dev.snapcase.ai/design` returned `200 OK`.
- Opened `https://dev.snapcase.ai/design?v=20251220T033101Z` and captured `Images/diagnostics/20251220T033101Z-dev-design.png`.

## Notes
- No code or branch changes.
