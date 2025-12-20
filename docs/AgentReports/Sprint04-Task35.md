# Sprint04-Task35 - preflight alias guard tighten

## Scope
- Make preflight mandatory and fail-fast in the prompt template.
- Auto-update PROGRESS after successful dev alias changes (skip dry-run; warn on update failure).

## Actions
- Updated `docs/PROMPT_TEMPLATE.md` with explicit mandatory/fail-fast preflight language.
- Added a PROGRESS refresh helper to `scripts/alias-dev.mjs` that runs only after alias set and does not block the alias command on update failure.

## Verification
- `npm run preflight`
- `node scripts/alias-dev.mjs --target https://snapcase-ikedc1s8f-snapcase.vercel.app --allow-branch task/Sprint04-Task35-preflight-alias-guard-tighten --dry-run`

## Notes
- Dry-run only; no alias changes. Baseline confirmation answered via stdin to avoid interactive prompt.

## Links
- Compare: https://github.com/ethtri/SnapCase_App/compare/main...task/Sprint04-Task35-preflight-alias-guard-tighten
