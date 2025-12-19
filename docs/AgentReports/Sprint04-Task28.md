# Sprint04-Task28 - CI pipeline

## Scope & Files
- Worked from `C:\Repos\SnapCase_App_task24` on branch `task/Sprint04-Task28-ci-pipeline`.
- Added `.github/workflows/ci.yml` to run lint/build on push/PR (Node 20, `NEXT_TELEMETRY_DISABLED=1`).
- Updated `docs/PROJECT_MANAGEMENT.md`, `docs/TaskPipeline.md`, and `PROGRESS.md` to document the CI gate.

## Verification
- Merged `origin/main` (no changes), confirmed `scripts/preflight.mjs` missing; `npm run preflight` still fails (missing script).
- `npm ci` (completed; npm reported deprecated package warnings and 7 vulnerabilities).
- `npm run lint` (pass).
- `npm run build` (pass).

## Links
- Compare: https://github.com/ethtri/SnapCase_App/compare/main...task/Sprint04-Task28-ci-pipeline.
