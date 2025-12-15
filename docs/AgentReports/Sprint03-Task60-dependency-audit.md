# Sprint03-Task60 - Dependency vulnerability cleanup

## Summary
- `npm audit` on the clean main baseline reported 7 issues (2 moderate, 5 high) in Next 14.2.33, glob 10.3.10 (@next/eslint-plugin-next), js-yaml 4.1.0 (eslint/eslintrc), body-parser 2.2.0 (express via mcp-client), and @modelcontextprotocol/sdk 1.20.2 (mcp-client).
- Upgraded Next and eslint-config-next to 14.2.35 and added npm overrides to pin patched transitive versions: @modelcontextprotocol/sdk@1.24.3, body-parser@2.2.1, glob@10.5.0, js-yaml@4.1.1. Regenerated the lockfile via `npm install`.
- Post-update `npm audit` reports 0 vulnerabilities; changes are patch-level only and no deploy is required.

## Verification
- `npm install`
- `npm audit` (0 vulnerabilities)
- `npm run build`

## Risks / Follow-ups
- Keep the overrides until upstream packages ship patched defaults; drop them on future upgrades once `npm audit` stays clean without them.

## Audit deltas
- Before: 7 vulnerabilities (2 moderate, 5 high).
- After: 0 vulnerabilities.
