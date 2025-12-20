# Task Pipeline Tracker

This tracker lists ready-to-run prompts. Copy the **Agent Kickoff** line verbatim into a new Codex chat. Move items to **Archive** once their AgentReports land in `docs/AgentReports/`.

**Preflight (every prompt):**
- Work from a clean non-OneDrive worktree under `C:\Repos` (e.g., `C:\Repos\SnapCase_App_main`) on the task branch (`task/SprintNN-TaskXX-*`).
- Stop if `git status` is not clean or another worktree is dirty. If dirty: restore any `Snapcase-Flow-Mockups/*` deletions from `origin/main`, delete or stash stray diagnostics/unrelated files, then rerun `git status` before proceeding. Halt on any rebase/merge in progress.
- Treat `Snapcase-Flow-Mockups/*` as read-only reference assets; restore deletions before editing.
- Run `git worktree list` (cap at 3) + `git status` before editing; stash cleanup uses `git stash push -m "<TaskID> context"`.
- Run `npm run preflight` before editing; use `npm run preflight:full` for release or alias work.
- Diagnostics hygiene: keep only final captures; commit the relevant `Images/diagnostics/*` files or clean them before exit.
- Use `docs/PROMPT_TEMPLATE.md` (strict controls) before editing; for UX prompts default to the mockups + `docs/Responsive_Blueprint.md` instead of scattering across multiple UX docs unless a blocker requires it.
- Lint config guard: if `npm run lint` prompts to create an ESLint config, do not generate one; pull the existing config from `origin/main` or stop and report if none exists.
- Dev alias guard: do not repoint `dev.snapcase.ai` unless approved. Follow `docs/Deployment/Alias_Runbook.md` with `node scripts/alias-dev.mjs` (dry-run allowed) and log rollback + compare/PR URLs.
- `git pull` from the task branch before starting so you have the latest TaskPipeline and docs.
- Keep changes scoped. Update `PROGRESS.md` and the relevant `docs/AgentReports/` file before handoff; leave the tree clean.

**Definition of Done (DoD) for all prompts:**
- Code/files updated; new assets in `Images/diagnostics/` when applicable; `git status` clean on exit.
- Evidence in AgentReport with artifact paths, test results, decisions, and the compare/PR URL after pushing the branch.
- Tests run as specified; if failing, log why and what was attempted.
- `PROGRESS.md` updated; move prompt to Archive when complete; log the compare/PR URL in both `PROGRESS.md` and the AgentReport.

## Active Prompts

| Task ID | Goal (Sponsor Language) | Prep & References | Agent Kickoff |
| --- | --- | --- | --- |
| None | Sprint04 tasks 22-24 are already shipped; awaiting the next kickoff. | N/A | N/A |

> These prompts are ready to run in parallel; each owns its branch and AgentReport. Keep sponsor updated via `PROGRESS.md`.

### Deferred / Re-run Later

| Task ID | Status | Notes |
| --- | --- | --- |
| Sprint04-Task28 | DONE | Added `.github/workflows/ci.yml` to run lint/build on push/PR (Node 20, telemetry disabled), plus docs updates (`docs/PROJECT_MANAGEMENT.md`, `PROGRESS.md`, `docs/AgentReports/Sprint04-Task28.md`). Tests: `npm run lint`, `npm run build`. Compare: https://github.com/ethtri/SnapCase_App/compare/main...task/Sprint04-Task28-ci-pipeline. |
| Sprint03-Task29 | Blocked | Hold until Tasks 31-34 land; sponsor walkthrough requires a complete Design + Checkout flow. |
| Sprint03-Task30 | Blocked | Resume once `/design` stops using the Fabric layout so downstream polish isn't wasted. |

> **Sponsor shortcut:** Just tell Codex "Please run Sprint02-Task15 and Sprint02-Task22B in parallel." The agents already know to open this file for the detailed plan.

## Archive

| Task ID | Status | Notes |
| --- | --- | --- |
| Sprint04-Task32 | DONE | Task08 recovery for save/resume pricing in `src/lib/design-context.ts`, `src/app/design/page.tsx`, and `src/app/checkout/page.tsx`. Tests: `npm run lint`, `npm run build`. Preview/dev target: https://snapcase-m33zfqs65-snapcase.vercel.app; rollback: https://snapcase-ikedc1s8f-snapcase.vercel.app. Verification: `curl -I https://dev.snapcase.ai/design` (200) and screenshot `Images/diagnostics/2025-12-20T02-12-34-390Z-dev-design-cachebust.png`. |
| Sprint04-Task24 | DONE | Hygiene removal: relocated the gitdir/worktrees to non-OneDrive paths (`C:\Repos\SnapCase_App_main`, `C:\Repos\SnapCase_App_task22`, `C:\Repos\SnapCase_App_task24`), copied `.vercel`, and removed linked worktrees `C:\Repos\SnapCase_App_task20`/`C:\Repos\SnapCase_App_task21` to enforce the ≤3 cap. OneDrive stash `Sprint04-Task24 OneDrive backup` saved the prior dirty state. Locked reparse files remain (`.git\objects\pack\pack-d5f3ae0e2298870b98f03af9d6113c6d884fedfc.pack`, `.git\objects\pack\pack-ff9d32288bd57239ee0ac45907d911ca32b4d138.pack`, `worktrees\SnapCase_App_task20\COMMIT_EDITMSG*`) plus the empty `C:\Repos\SnapCase_App_task20` folder; delete once handles clear. Compare: https://github.com/ethtri/SnapCase_App/compare/main...task/Sprint04-Task24-hygiene-removal. |
| Sprint04-Task23 | DONE | Added guarded alias helper `scripts/alias-dev.mjs` and `docs/Deployment/Alias_Runbook.md`; dev alias set to https://snapcase-hwbcudj5f-snapcase.vercel.app with rollback https://snapcase-pgz7j4zcj-snapcase.vercel.app. Lint/build rerun; verification via `curl -I https://dev.snapcase.ai/design` (200) and screenshot `Images/diagnostics/20251218T204958-dev-alias-design.png`. Branch: `task/Sprint04-Task23-dev-alias-guard`; compare: https://github.com/ethtri/SnapCase_App/compare/main...task/Sprint04-Task23-dev-alias-guard. |
| Sprint04-Task22 | DONE | Summary card polished to status chip/helper + device + price (finish row removed); not-ready CTA copy now "Add your design to continue"; picker/shell/CTA gating unchanged. Tests: `npm run lint`, `npm run build`. Diagnostics: `Images/diagnostics/20251219T023220Z-design-{picker,shell}-{desktop,mobile}.png`. Preview/dev target: https://snapcase-ikedc1s8f-snapcase.vercel.app; rollback: https://snapcase-hwbcudj5f-snapcase.vercel.app. Verification: `curl -I https://dev.snapcase.ai/design` (200) and screenshot `Images/diagnostics/20251219T052059Z-dev-design-shell-desktop.png`. |
| Sprint04-Task07 | DONE | Option A picker + editor-only flow shipped (sticky CTA + summary chip, blank proof box removed). Diagnostics: `Images/diagnostics/2025-12-16T02-05-51-402Z-design-after-{picker,editor}.png` + `...-status.json`. Tests: `npm run build` (pass); `npm run lint` blocked (no ESLint config on origin/main). See `docs/AgentReports/Sprint04-Task07.md`. |
| Sprint03-Task48 | DONE | Product-tab overlay hardened (clamped size/max width, border, shadow), CTA gating intact; deployed `snapcase-eopqpujyk-snapcase.vercel.app` aliased to `dev.snapcase.ai`. See `docs/AgentReports/Sprint03-Task48-overlay-hardening.md` and `Images/diagnostics/2025-12-10T175354781Z-after-*.png/json`. Known: mobile Playwright automation can fail to unlock CTA; manual upload succeeds. |
| Sprint03-Task47 | DONE | CX refresh: Product tab guarded/hidden, mask height lowered, Flow/Scene + Printful/variant IDs removed, Snapcase voice applied. See `docs/AgentReports/Sprint03-Task47-CX-refresh.md` and `Images/diagnostics/20251210T034229Z-after-design-{desktop,mobile}.png`. |
| Sprint03-Task45 | DONE | Sponsor refresh with Printful variant lock + relaxed checkout validation; see `docs/AgentReports/Sprint03-Task45.md` and `Images/diagnostics/20251210T012645-*`. |
| Sprint03-TaskXX-variant-lock | DONE | Folded into Task45; variant locking shipped per `docs/EDM_VARIANT_SELECTION_SOLUTION.md`. |
| Sprint02-Task15 | DONE | Lockfile regenerated on WSL; see `docs/AgentReports/Sprint02-Task15.md`. |
| Sprint02-Task16 | DONE | New slug deployed + diagnostics captured; see `docs/AgentReports/Sprint02-Task16.md`. |
| Sprint02-Task22B | DONE | Production Segment vars promoted; see `docs/AgentReports/Sprint02-Task22B.md`. |
| Sprint02-Task25 | DONE | Git MCP automation landed; see `docs/Engineering/Automation.md`. |
| Sprint03-Task26 | DONE | EDM-first layout landed; see `docs/AgentReports/Sprint03-Task26.md`. |
| Sprint03-Task27 | DONE | CTA unlock + variant sync finished; see `docs/AgentReports/Sprint03-Task27.md`. |
| Sprint03-Task28 | DONE | Telemetry capture completed; see `docs/AgentReports/Sprint03-Task28.md`. |
| Sprint03-Task35 | DONE | Printful iframe theming + diagnostics captured; see `docs/AgentReports/Sprint03-Task35.md`. |
| Sprint03-Task31 | DONE | Template registry + checkout/order wiring; see `docs/AgentReports/Sprint03-Task31.md`. |
| Sprint03-Task32 | DONE | `/design` now boots directly into Printful EDM; see `docs/AgentReports/Sprint03-Task32.md`. |
| Sprint03-Task33 | DONE* | DNS/alias flipped; Stripe secret still pending sponsor handoff. See `docs/AgentReports/Sprint03-Task33.md`. |
| Sprint03-Task34 | DONE | Segment QA + production promotion finished; see `docs/AgentReports/Sprint03-Task34.md`. |
| Sprint03-Task43 | DONE | Live masked-picker smoke with Printful; CTA gating/pricing simplified per PO decision; see `docs/AgentReports/Sprint03-Task43.md`. |
| Sprint03-Task37 | DONE | Lint + telemetry refresh complete; see `docs/AgentReports/Sprint03-Task37.md`. |
| Sprint03-Task38 | DONE | Printful v2 order flow implemented; see `docs/AgentReports/Sprint03-Task38.md`. |
| Sprint03-Task39 | DONE | Webhook route registered for store `17088301`; sandbox order + payload captures logged in `docs/AgentReports/Sprint03-Task36.md` and `Images/diagnostics/printful-webhook-2025-11-23T08-37-22-000Z-*.json`. |
| Sprint03-Task44 | DONE | Webhook now points to `https://app.snapcase.ai/api/webhooks/printful`, archive dir set to `Images/diagnostics/printful` (preview/prod), integration test rerun; `PRINTFUL_WEBHOOK_SECRET` still pending. See `docs/AgentReports/Sprint03-Task44.md` and `Images/diagnostics/printful-webhook-2025-11-23T22-37-57-192Z-evt_local_capture.json`. |
| Sprint03-Task40 | DONE | Stripe prod secrets verified across scopes; live `/api/checkout` session captured. See `docs/AgentReports/Sprint03-Task40.md`. |
| Sprint03-Task41 | DONE | Sponsor readiness sweep complete with fresh screenshots + Segment debugger evidence. See `docs/AgentReports/Sprint03-Task41.md`. |
| Sprint03-Task42 | DONE | SnapCase-first picker with masked Printful row; Playwright e2e passing; new `/design` screenshots captured. See `docs/AgentReports/Sprint03-Task42.md`. |
