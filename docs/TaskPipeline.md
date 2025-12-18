# Task Pipeline Tracker

This tracker lists ready-to-run prompts. Copy the **Agent Kickoff** line verbatim into a new Codex chat. Move items to **Archive** once their AgentReports land in `docs/AgentReports/`.

**Preflight (every prompt):**
- Work from `C:\Repos\SnapCase_App` only (no OneDrive paths) on the task branch (`task/SprintNN-TaskXX-*`).
- Stop if `git status` is not clean or another worktree is dirty. If dirty: restore any `Snapcase-Flow-Mockups/*` deletions from `origin/main`, delete or stash stray diagnostics/unrelated files, then rerun `git status` before proceeding. Halt on any rebase/merge in progress.
- Treat `Snapcase-Flow-Mockups/*` as read-only reference assets; restore deletions before editing.
- Run `git worktree list` (cap at 3) + `git status` before editing; stash cleanup uses `git stash push -m "<TaskID> context"`.
- Diagnostics hygiene: keep only final captures; commit the relevant `Images/diagnostics/*` files or clean them before exit.
- Use `docs/PROMPT_TEMPLATE.md` (strict controls) before editing; for UX prompts default to the mockups + `docs/Responsive_Blueprint.md` instead of scattering across multiple UX docs unless a blocker requires it.
- Lint config guard: if `npm run lint` prompts to create an ESLint config, do not generate one; pull the existing config from `origin/main` or stop and report if none exists.
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
| Sprint04-Task08 | Persist design when returning from checkout and add the short pricing transparency helper in checkout. | Read: PROGRESS.md, docs/Responsive_Blueprint.md (save/resume + pricing helper), docs/SnapCase_App_Prototype.MD, docs/UXCX_Guidelines.MD. Branch: `task/Sprint04-Task08-save-resume-pricing`. Pricing helper approved by sponsor. | **Agent Kickoff:** “Task ID: Sprint04-Task08-save-resume-pricing. Branch: task/Sprint04-Task08-save-resume-pricing. Objective: Persist selected device + latest template/design context when returning from checkout so /design rehydrates state and CTA. Add the approved pricing transparency helper line near totals on checkout (desktop/mobile). Keep checkout logic/Stripe/Printful intact; no deps/env changes. Scope: src/app/design/* (state rehydrate/persistence), src/app/checkout/* (helper copy + banner persistence), shared context/storage helpers if needed. Docs: update docs/Responsive_Blueprint.md (save/resume + pricing helper), docs/SnapCase_App_Prototype.MD, PROGRESS.md, AgentReport docs/AgentReports/Sprint04-Task08.md. Verification: npm run lint; npm run build; manual smoke returning from checkout; optional targeted integration if available. Diagnostics: JSON showing persisted design context before/after; checkout screenshots with helper text under Images/diagnostics/<ts>-checkout-pricing-*.png/json. Completion Gate: AgentReport + PROGRESS updated + docs updated + diagnostics linked + clean git status + TaskPipeline updated.” |

> These prompts are ready to run in parallel; each owns its branch and AgentReport. Keep sponsor updated via `PROGRESS.md`.

### Deferred / Re-run Later

| Task ID | Status | Notes |
| --- | --- | --- |
| Sprint03-Task29 | Blocked | Hold until Tasks 31-34 land; sponsor walkthrough requires a complete Design + Checkout flow. |
| Sprint03-Task30 | Blocked | Resume once `/design` stops using the Fabric layout so downstream polish isn't wasted. |

> **Sponsor shortcut:** Just tell Codex "Please run Sprint02-Task15 and Sprint02-Task22B in parallel." The agents already know to open this file for the detailed plan.

## Archive

| Task ID | Status | Notes |
| --- | --- | --- |
| Sprint04-Task18 | DONE | Restored Screen 1 picker (Task14 baseline: deterministic sort, search/suggestions, brand tabs incl Pixel/More, Option A FAB/ActionBar) and kept Task17 design shell polish (change-device controls, merged status chip + summary, designer skeleton, transparent picker guard). Diagnostics: `Images/diagnostics/20251218T212401-design-{picker,shell}-{desktop,mobile}.png`. Tests: `npm run lint`, `npm run build`. AgentReport: `docs/AgentReports/Sprint04-Task18.md`. Branch: `task/Sprint04-Task18-restore-picker` (C:\Repos\SnapCase_App_task18). OneDrive worktree remains dirty per instructions. |
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
