# Task Pipeline Tracker

This tracker lists ready-to-run prompts. Copy the **Agent Kickoff** line verbatim into a new Codex chat. Move items to **Archive** once their AgentReports land in `docs/AgentReports/`.

**Preflight (every prompt):**
- `git status` must be clean (commit or stash).
- Check out the prompt’s branch (e.g., `task/Sprint03-Task43-edm-live-smoke`).
- Keep changes scoped. Update `PROGRESS.md` and the relevant `docs/AgentReports/` file before handoff. Leave the tree clean.

**Definition of Done (DoD) for all prompts:**
- Code/files updated; new assets in `Images/diagnostics/` when applicable.
- Evidence in AgentReport with artifact paths, test results, and decisions.
- Tests run as specified; if failing, log why and what was attempted.
- `PROGRESS.md` updated; move prompt to Archive when complete.

## Active Prompts

| Task ID | Goal (Sponsor Language) | Prep & References | Agent Kickoff |
| --- | --- | --- | --- |
| Sprint03-Task43 | Smoke-test the masked-picker `/design` in a live Printful session to ensure the overlay and SnapCase-first copy don’t break real embeds; capture diagnostics/screenshots. **DoD:** (1) Live `/design` load with real Printful token succeeds; (2) screenshots + diagnostics JSON saved to `Images/diagnostics/` with paths in AgentReport; (3) no regression to variant lock or guardrail messaging; (4) AgentReport + `PROGRESS.md` updated; (5) tree clean. Latest: `dev.snapcase.ai` -> `snapcase-nb0bhjauq-snapcase.vercel.app`, CTA locked on Printful “Please add a design!” even after PNG upload; artifacts `task43-design-{desktop,mobile}-2025-12-09T01-41-41-880Z.*` + JSON log PFUploader errors and 27 non-catalog variants. | `src/app/design/page.tsx`, `src/components/editor/edm-editor.tsx`, `src/components/editor/printful-config.ts`, `scripts/collect-edm-diagnostics.js`, existing masked-picker screenshots. Branch `task/Sprint03-Task43-edm-live-smoke`. | “Run Sprint03-Task43 using docs/TaskPipeline.md instructions.” |
| Sprint03-Task44 | Harden Printful webhooks: add signature verification (if available), idempotent payload storage, and tests; confirm dev/prod registrations are correct. **DoD:** (1) `src/app/api/webhooks/printful/route.ts` enforces signature or documented fallback; (2) payloads persisted/archived with ids/timestamps; (3) integration/unit test added; (4) dev + prod webhook registrations verified/captured; (5) AgentReport + `PROGRESS.md` updated; (6) tree clean. | `src/app/api/webhooks/printful/route.ts`, `docs/AgentReports/Sprint03-Task36.md`, `Images/diagnostics/printful-webhook-*.json`, Printful dashboard webhook settings. Branch `task/Sprint03-Task44-webhook-hardening`. | “Run Sprint03-Task44 using docs/TaskPipeline.md instructions.” |
| Sprint03-Task45 | Refresh sponsor-ready captures with a real design (no “Please add a design!” guardrail), updating docs and Segment evidence. **DoD:** (1) New desktop+mobile screenshots for design/checkout/thank-you with a valid design saved to `Images/diagnostics/`; (2) Segment debugger evidence saved; (3) `docs/UserTesting/Sprint02_Sponsor_Script.md` + AgentReport + `PROGRESS.md` updated; (4) tree clean. | `docs/UserTesting/Sprint02_Sponsor_Script.md`, `Images/diagnostics/`, `tests/e2e/design-to-checkout.spec.ts`, `docs/Responsive_Blueprint.md`. Branch `task/Sprint03-Task45-sponsor-refresh`. | “Run Sprint03-Task45 using docs/TaskPipeline.md instructions.” |

> These prompts are ready to run in parallel; each owns its branch and AgentReport. Keep sponsor updated via `PROGRESS.md`.

### Deferred / Re-run Later

| Task ID | Status | Notes |
| --- | --- | --- |
| Sprint03-Task29 | Blocked | Hold until Tasks 31–34 land; sponsor walkthrough requires a complete Design + Checkout flow. |
| Sprint03-Task30 | Blocked | Resume once `/design` stops using the Fabric layout so downstream polish isn’t wasted. |

> **Sponsor shortcut:** Just tell Codex “Please run Sprint02-Task15 and Sprint02-Task22B in parallel.” The agents already know to open this file for the detailed plan.

## Archive

| Task ID | Status | Notes |
| --- | --- | --- |
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
| Sprint03-Task37 | DONE | Lint + telemetry refresh complete; see `docs/AgentReports/Sprint03-Task37.md`. |
| Sprint03-Task38 | DONE | Printful v2 order flow implemented; see `docs/AgentReports/Sprint03-Task38.md`. |
| Sprint03-Task39 | DONE | Webhook route registered for store `17088301`; sandbox order + payload captures logged in `docs/AgentReports/Sprint03-Task36.md` and `Images/diagnostics/printful-webhook-2025-11-23T08-37-22-000Z-*.json`. |
| Sprint03-Task40 | DONE | Stripe prod secrets verified across scopes; live `/api/checkout` session captured. See `docs/AgentReports/Sprint03-Task40.md`. |
| Sprint03-Task41 | DONE | Sponsor readiness sweep complete with fresh screenshots + Segment debugger evidence. See `docs/AgentReports/Sprint03-Task41.md`. |
| Sprint03-Task42 | DONE | SnapCase-first picker with masked Printful row; Playwright e2e passing; new `/design` screenshots captured. See `docs/AgentReports/Sprint03-Task42.md`. |
