# Task Pipeline Tracker

This tracker lists ready-to-run prompts. Copy the **Agent Kickoff** line verbatim into a new Codex chat. Move items to **Archive** once their AgentReports land in `docs/AgentReports/`.

**Preflight (every prompt):**
- Use `docs/PROMPT_TEMPLATE.md` to capture worktree/branch and guardrails before editing.
- Run `git worktree list` then `git status` (stop if another worktree is dirty; stash with `git stash push -m "<TaskID> context"` if cleanup is needed).
- `git pull` from the task branch before starting so you have the latest TaskPipeline and docs.
- Check out the prompt's branch (e.g., `task/Sprint03-Task43-edm-live-smoke`).
- Keep changes scoped. Update `PROGRESS.md` and the relevant `docs/AgentReports/` file before handoff; leave the tree clean.

**Definition of Done (DoD) for all prompts:**
- Code/files updated; new assets in `Images/diagnostics/` when applicable.
- Evidence in AgentReport with artifact paths, test results, and decisions.
- Tests run as specified; if failing, log why and what was attempted.
- `PROGRESS.md` updated; move prompt to Archive when complete.

## Active Prompts

| Task ID | Goal (Sponsor Language) | Prep & References | Agent Kickoff |
| --- | --- | --- | --- |
| Sprint03-Task56 | Restore Snapcase mockups and align design/checkout/thank-you CX to the design system (no vendor IDs/copy leaks) | Branch `task/Sprint03-Task56-cx-realignment` on clean worktree; references: `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/*/snapcase-notes-delta-screen-*.md`, `docs/DESIGN_SYSTEM.md`, `docs/Responsive_Blueprint.md`, `docs/UXCX_Guidelines.MD` | Prompt: Sprint03-Task56 – Restore mockups & realign CX/UX to design system |
| Sprint03-Task49 | Stabilize mobile Playwright smoke on `dev.snapcase.ai` so CTA unlocks and flow reaches checkout/thank-you | Base: `https://dev.snapcase.ai` (alias `snapcase-eopqpujyk-snapcase.vercel.app`); asset `tmp/task45-design.png`; report `docs/AgentReports/Sprint03-Task49-mobile-automation.md`; script `scripts/run-mobile-live-smoke.mjs` | `Prompt: Sprint03-Task49 prompt (branch task/Sprint03-Task49-mobile-automation, run scripts/run-mobile-live-smoke.mjs)` |

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
| Sprint03-Task63 | DONE | Implemented UX plan and sponsor feedback fixes (Flow/Design-steps removed, detect-my-device hidden on desktop, proof rail collapsed, Product-tab guard made transparent, rail status simplified). `npm run build`; deployed https://snapcase-mqqigvhom-snapcase.vercel.app aliased to https://dev.snapcase.ai. Artifacts: `Images/diagnostics/2025-12-15T19-49-00-540Z-before-{design,checkout,thank-you}-{desktop,mobile}.png`, `Images/diagnostics/2025-12-15T23-51-54-807Z-after-{design,checkout,thank-you}-{desktop,mobile}.png`. |
| Sprint03-Task62 | DONE | CX/UX plan for sponsor feedback (design/checkout/thank-you); annotated captures + wireframes at `Images/diagnostics/2025-12-15T18-07-53-204Z-*`; report `docs/AgentReports/Sprint03-Task62-ux-plan.md`. |
| Sprint03-Task59A | DONE (Google mapping pending IDs) | Catalog expanded with iPhone 16/17 (Printful 683) and Samsung S24 mapped to product 684 + glossy catalog variant IDs to align the embed; Google Pixel snap cases are not in the Printful catalog, so mapping is deferred. Artifacts: `Images/diagnostics/2025-12-15T05-33-28-766Z-before-design-{desktop,mobile}.png`, `Images/diagnostics/2025-12-15T05-42-25-226Z-after-design-{desktop,mobile,s24-desktop}.png`. Tests: `npm run build` (pass); npm install reports 7 vulns (2 moderate, 5 high). |
| Sprint03-Task59B | DONE | Picker refresh merged clean (branch already aligned with main); compact text-first cards with brand chips + Apple icon remain intact. Tests: `npm run build` (pass); `npm ci` reports 7 vulns (2 moderate, 5 high). |
| Sprint03-Task59C | DONE | Flow/review tweaks merged clean (branch already aligned with main); proof/review copy/layout live with CTA/variant lock unchanged; checkout/thank-you unaffected. Tests: `npm run build` (pass); `npm ci` reports 7 vulns (2 moderate, 5 high). |
| Sprint03-Task54 | DONE | CX/UX audit + device picker proposal: on-brand review of design/checkout/thank-you (no new Printful/template leaks) and modern picker recommendation (search/filter, Samsung/Pixel emphasis, lock-aware CTA). Artifacts: `Images/diagnostics/2025-12-11T20-43-41-546Z-{design,checkout,thank-you}-desktop.png`, `Images/diagnostics/2025-12-11T20-43-41-546Z-picker-wireframe.png`. Tests: doc-only. |
| Sprint03-Task53 | DONE | CX/UX audit & copy refresh: scrubbed Printful/variant IDs, tightened Snapcase voice on design/checkout/thank-you. Artifacts: `Images/diagnostics/2025-12-11T17-40-07-409Z-{design,checkout,thank-you}-{desktop,mobile}.png` (before), `Images/diagnostics/2025-12-11T18-01-08-610Z-{design,checkout,thank-you}-{desktop,mobile}.png` (after). Tests: `npm run build`. Backlog: modern full-catalog device picker. |
| Sprint03-Task52 | DONE | Variant lock now feeds catalog model names (fallback to variant id) into `preselectedSizes` and records Printful `reportedVariantIds` for diagnostics/analytics. See `docs/AgentReports/Sprint03-Task52-variant-sync.md` and `Images/diagnostics/2025-12-10T20-55-32-493Z-{design,checkout,thankyou}-mobile.png`. |
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
| Sprint03-Task44 | DONE | Webhook at `https://app.snapcase.ai/api/webhooks/printful` with archive dir `Images/diagnostics/printful`; integration test covered. Printful does **not** expose a webhook secret, so `PRINTFUL_WEBHOOK_SECRET` remains unset by design (see Task50). Artifacts: `Images/diagnostics/printful-webhook-2025-11-23T22-37-57-192Z-evt_local_capture.json`. |
| Sprint03-Task50 | DONE | Confirmed Printful API does not return a webhook signing secret for store 17088301 (no `secret_key` via GET/POST /webhooks). `PRINTFUL_WEBHOOK_SECRET` intentionally unset; archive dir unchanged. Docs: `docs/PRINTFUL_WEBHOOK_SECRET_FINAL.md`, `docs/PRINTFUL_WEBHOOK_SECRET_CLARIFICATION.md`; AgentReport: `docs/AgentReports/Sprint03-Task50-webhook-secret.md`. |
| Sprint03-Task40 | DONE | Stripe prod secrets verified across scopes; live `/api/checkout` session captured. See `docs/AgentReports/Sprint03-Task40.md`. |
| Sprint03-Task41 | DONE | Sponsor readiness sweep complete with fresh screenshots + Segment debugger evidence. See `docs/AgentReports/Sprint03-Task41.md`. |
| Sprint03-Task42 | DONE | SnapCase-first picker with masked Printful row; Playwright e2e passing; new `/design` screenshots captured. See `docs/AgentReports/Sprint03-Task42.md`. |
