# SnapCase Development Progress

**Project**: SnapCase Custom Phone Case Platform

**Owner**: Ethan Trifari

**Engineering Lead**: AI Assistant (Cursor)

**Repository**: https://github.com/ethtri/SnapCase_App

**Last Updated**: December 15, 2025

## Current Status: MVP Development Phase

### Project Overview

Building a web application at `app.snapcase.ai` that allows customers to design and order custom phone cases, extending the kiosk experience to the web through Printful's print-on-demand infrastructure.

### Current Blockers

- **Sprint03-Task49 mobile automation (2025-12-10)**: Headless Playwright mobile cannot trigger the Printful filechooser; `design_status` stays `designValid=false` (`blockingIssues=["Please add a design!"]`) and Printful emits `rpcError/loadTemplateFailed` (`raw: "Template not found"`) against the cached auto-* template ID. Added a live smoke runner `scripts/run-mobile-live-smoke.mjs` that attempts a real upload and, if still locked, forces guardrail/pricing/template events via `__snapcaseTestHooks` to finish checkout/thank-you. Artifacts: `Images/diagnostics/2025-12-10T18-56-41-990Z-mobile-upload.png` (stuck CTA), `Images/diagnostics/2025-12-10T19-32-49-526Z-{design,checkout,thankyou}-mobile.png` (fallback path). Manual mobile upload still required for true E2E; vendor support needed for a reliable mobile filechooser.
- **Sprint03-Task52 variant sync (2025-12-10)**: Locking now hands the catalog model name (with variant-id fallback) into `preselectedSizes` and captures Printful-reported `reportedVariantIds` for diagnostics/analytics to keep the embed aligned with the chosen device. Tests: `npm run build`; `node scripts/run-mobile-live-smoke.mjs` vs `dev.snapcase.ai` (file chooser blocked in automation; forced ready via test hooks; CTA reached checkout/thank-you with `selectedVariantIds=[17726]`, `variantMismatch=false`). Artifacts: `Images/diagnostics/2025-12-10T20-55-32-493Z-{design,checkout,thankyou}-mobile.png`. Follow-up: confirm manual mobile upload path and monitor if Printful requires size labels instead of model/variant ids.
- **Deployment (2025-12-10)**: Deployed `https://snapcase-jag5wpacy-snapcase.vercel.app` and aliased to `https://dev.snapcase.ai` for Task52 changes.
- **Open issue**: Google Pixel snap cases are still missing from the Printful catalog/store APIs, so Google variants cannot be mapped until Printful exposes real product + variant IDs. Samsung S24 entries now use product 684 + catalog variant IDs to keep the embed aligned.
- **2025-12-10 Live smoke (dev.snapcase.ai)**: Design->checkout->thank-you passed after uploading `tmp/task45-design.png`; CTA unlocked on designValid=true with the variant locked (17726). Artifacts: `Images/diagnostics/20251210T021337-design-desktop.png`, `Images/diagnostics/20251210T021337-checkout-desktop.png`, `Images/diagnostics/20251210T021337-thankyou-desktop.png`, `Images/diagnostics/20251210T021337-analytics.json`. Segment allowed by CSP; analytics captured. Console: expected Printful WebGL capability warning and 404s for `/stripe/lockup.svg` and thank-you `/order/preview` fetch (non-blocking).
- **Printful webhook signing (Task44/Task50):** Printful API does not expose a webhook signing secret for store 17088301; `PRINTFUL_WEBHOOK_SECRET` stays unset by design. Webhook remains at `https://app.snapcase.ai/api/webhooks/printful` (events: order_created/updated/failed/package_shipped/package_returned); archive dir set to `Images/diagnostics/printful`. Protections: HTTPS-only, strict JSON parsing + 5 MB cap, duplicate-event short-circuiting, payload archiving.
- (None noted for Task42; monitor Printful live-token runs post-mask.)

- **Printful EDM Access (2025-11-04 update)**: `ensureEdmScript()` now loads `embed.js` as a plain `<script>` (no `crossOrigin`) with a 15s watchdog so diagnostics capture script failures, and create-mode always passes Printful?s SUBLIMATION technique + a fallback reboot when PF returns `Template not found`. `npm run vercel-build` (Nov 4 @ 19:14Z) succeeded aside from pre-existing lint warnings, `vercel deploy --yes` published preview `https://snapcase-fbtuk9oqr-snapcase.vercel.app`, and `"/mnt/c/Program Files/nodejs/node.exe" scripts/collect-edm-diagnostics.js` logged the healthy session (`Images/diagnostics/edm-diagnostics-2025-11-04T19-17-46-144Z.png`) showing `setProductOK` / `designerLoadedOK`. **Update 2025-11-10:** EDM saves now hit `/api/edm/templates`, which caches the template ID server-side so `/api/checkout` + `/api/order/create` can trust server tokens; next diagnostics will focus on keeping Printful?s allowlist + dev alias in sync.

- **Sprint03-Task36 sandbox order (2025-11-21 LIVE ON DEV):** ? **DEV VALIDATION PASSED** - dev.snapcase.ai now points at snapcase-shucqgnm7-snapcase.vercel.app with PRINTFUL_ORDER_MODE=live, PRINTFUL_STORE_ID=17088301, PRINTFUL_ORDER_CONFIRM=true. /api/edm/templates uploads a public image to /v2/files and returns printfulFileId=905983476 (see Images/diagnostics/task36-step1-template-upload-2025-11-21T20-13-57-926Z.json). /api/order/create posts to /v2/orders and created Printful order **134019973** (external_id TASK36-MI9AT0RS, status draft) using placements[].layers[].file_id. Summary: Images/diagnostics/task36-VALIDATION-SUMMARY-2025-11-21T20-13-59-149Z.json. **Follow-up resolved 2025-11-22:** webhook handler added + store-scoped registration, sandbox orders 134060644/134060697/134060829 confirmed to `pending`, and Printful emitted `order_created`/`order_updated`/`order_failed` payloads captured under `Images/diagnostics/printful-webhook-*.json` (see docs/AgentReports/Sprint03-Task36.md). **2025-11-23 rerun:** placed/confirmed order **134118858** (external_id TASK36-MIAZNG0H), captured `order_created`/`order_updated`/`order_failed` payloads via webhook.site bin (files `Images/diagnostics/printful-webhook-2025-11-23T08-37-22-000Z-*.json`), and restored the webhook to `https://dev.snapcase.ai/api/webhooks/printful`. Keep the dev alias + env flags in place for repeatability.

- **Printful UI customization research (2025-11-04)**: Audited `docs/openapi-Printful.json` plus `src/components/editor/edm-editor.tsx` and published the UI customization matrix + escalation draft in `docs/Printful_EDM_InvalidOrigin.md`. **Next actions:** wire the documented `featureConfig` flags into `EdmEditor` to hide non-MVP buttons, build a theming adapter that sets Printful?s `style.variables` tokens, gather screenshots proving why we need their picker/guardrail hidden, and be ready to send the escalation draft if support is required.
- **Printful EDM escalation packet (2025-11-04)**: `docs/Printful_EDM_Escalation.md` now bundles the context, asset list (`design-desktop-*.png`, `design-mobile-*.png`, `Images/diagnostics/11.4.25_badCXUX.png`, `Images/diagnostics/edm-diagnostics-2025-11-04T21-12-24-222Z.png`), and diagnostics JSON/runbook for contacting Printful about hiding their picker + guardrail banner. **Next action for Ethan:** email the packet to Printful support (script included in the doc) and track their response back in `docs/Printful_EDM_InvalidOrigin.md`.
- **Printful EDM UX alignment (2025-11-04)**: Decision logged to ship exactly with Printful?s native picker/toolbar/guardrail UX for MVP. We?ll theme the iframe, capture variant/pricing/guardrail telemetry via callbacks, and avoid any duplicate SnapCase guardrail UI. Wishlist items (picker suppression, banner toggle) remain future nice-to-haves only if Printful exposes them.

- **EDM-first layout gap (2025-11-08)**: Resolved in Sprint03-Task32. `/design` now boots straight into the Printful EDM (no device grid or Fabric rails), pulls the selected variant from `onDesignStatusUpdate`, surfaces Printful messaging inside a compact guardrail card, and drives the CTA/checkout handoff entirely from Printful telemetry. The new layout mirrors Responsive_Blueprint Scenes 1-3, captures template IDs via `onTemplateSaved/onTemplateHydrated`, and re-enables the `/checkout` route once the banner clears. Lint still reports the pre-existing `<img>` warnings in `/checkout` + `/thank-you`.

### Recently Resolved

- **Sprint04-Task12 issue triage (2025-12-16):** Restored `.eslintrc.cjs` (extends `next`, `next/core-web-vitals`) so lint can run on this branch. `npm run lint` and `npm run build` now complete; both surface the existing `react-hooks/exhaustive-deps` warnings in `src/app/design/page.tsx` (CTA/guardrail memo + callback dependencies) that remain by design for this task.
- **Sprint03-Task56 CX realignment (2025-12-11):** Restored `Snapcase-Flow-Mockups` references, refreshed design/checkout/thank-you to the design system tokens (colors/radii/spacing/shadows), and scrubbed vendor mentions from customer copy while keeping variant lock and CTA gating intact. Checkout panel now sticks on desktop, payment copy is provider-agnostic, and thank-you uses tokenized hero/cards plus neutral timeline helpers. Tests: `npm run build`. Artifacts: `Images/diagnostics/2025-12-11T22-07-25-505Z-before-{design,checkout,thank-you}-{desktop,mobile}.png`, `Images/diagnostics/2025-12-11T22-26-13-456Z-after-{design,checkout,thank-you}-{desktop,mobile}.png`, diagnostics `Images/diagnostics/2025-12-11T22-26-13-456Z-cx-diagnostics.json`.
- **Sprint03-Task54 CX/UX audit + device picker proposal (2025-12-11):** Audited design/checkout/thank-you for on-brand copy (no new Printful/template leaks) and documented a modern full-catalog device picker (search/filter, Samsung/Pixel emphasis, lock-aware CTA). Design still surfaces verbose diagnostics on failure; recommended a compact error/retry state and hiding JSON behind a toggle. Tests: doc-only (no code changes). Artifacts: `Images/diagnostics/2025-12-11T20-43-41-546Z-{design,checkout,thank-you}-desktop.png`, `Images/diagnostics/2025-12-11T20-43-41-546Z-picker-wireframe.png`. Backlog: implement the picker proposal and design error-state polish.
- **Sprint03-Task53 CX/UX audit (2025-12-11):** Scrubbed customer-facing Printful mentions and template/variant IDs from design, checkout, and thank-you, replacing them with Snapcase voice and neutral design-status copy (loader/offline messaging, guardrail helpers, and checkout/thank-you summaries). CTA/lock behaviour unchanged. Tests: `npm run build`. Artifacts: `Images/diagnostics/2025-12-11T17-40-07-409Z-{design,checkout,thank-you}-{desktop,mobile}.png` (before) and `Images/diagnostics/2025-12-11T18-01-08-610Z-{design,checkout,thank-you}-{desktop,mobile}.png` (after). Backlog: modern full-catalog device picker to reduce grid bloat and better surface Samsung/Pixel coverage.
- **Sprint03-Task48 overlay hardening (2025-12-10):** Tightened the host-side Product-tab guard in the Printful embed with clamped size, border, shadow, and max-width to prevent UI bleed while keeping variant lock/CTA gating intact. Deployed `snapcase-eopqpujyk-snapcase.vercel.app` and aliased `dev.snapcase.ai`; artifacts at `Images/diagnostics/2025-12-10T175055209Z-before-{desktop,mobile}-{design,checkout,thankyou}.png/json` and `Images/diagnostics/2025-12-10T175354781Z-after-{desktop,mobile}-{design,checkout,thankyou}.png/json`. Tests: `npm run build`; manual desktop/mobile uploads unlock CTA. Known issue: Playwright mobile automation intermittently fails to unlock CTA, but manual mobile upload succeeds. Feature request sent to Printful for a first-party hide-navigation/variant-lock option; awaiting response.
- **Sprint03-Task50 - Printful webhook secret investigation (2025-12-10):** Confirmed Printful API does not expose a webhook signing secret for store 17088301 (`secret_key` not returned via GET/POST /webhooks with any flags). `PRINTFUL_WEBHOOK_SECRET` stays unset by design; archive dir remains `Images/diagnostics/printful`. Docs added: `docs/PRINTFUL_WEBHOOK_SECRET_FINAL.md`, `docs/PRINTFUL_WEBHOOK_SECRET_CLARIFICATION.md`; `docs/PRINTFUL_WEBHOOK_SETUP_GUIDE.md` updated to note the limitation. Tests not rerun (missing `next/jest` in clean worktree; handler unchanged).
- **Sprint03-Task47 CX refresh (2025-12-10):** Hid the Product tab with a host-side guard overlay, reduced the EDM mask height so controls stay visible, and scrubbed Flow/Scene labels plus Printful/variant IDs from `/design`, `/checkout`, and `/thank-you` in favor of Snapcase voice. Tests: `npm run build`. Screenshots: `Images/diagnostics/20251210T031700Z-before-design-{desktop,mobile}.png`, `Images/diagnostics/20251210T034229Z-after-design-{desktop,mobile}.png`. See `docs/AgentReports/Sprint03-Task47-CX-refresh.md`.
- **Sprint03-Task45 sponsor refresh (2025-12-10):** Locked the Printful embed with `lockVariant=true` + `isVariantSelectionDisabled`, reordered live `design_status` to prefer catalog variants (CTA unlocks on designValid=true), and relaxed `/api/checkout` validation to log-but-allow missing template IDs when Printful withholds them. CSP connect now whitelists Segment (`cdn.segment.com`, `api.segment.io`, `cdn-settings.segment.com`). Deployed `snapcase-qnb2d99br-snapcase.vercel.app` and re-pointed `dev.snapcase.ai`; artifacts at `Images/diagnostics/20251210T012645-{design,checkout,thankyou}-{desktop,mobile}.png` with analytics `Images/diagnostics/20251210T012645-analytics.json` (designValid=true on variant 17726). Tests: `npm run build`. Prior WIP remains stashed in `SnapCase_App_task45_run2` as `Task45 WIP stub editor + diagnostics`; kept `tmp/task45-design.png` as the uploaded asset for reruns.
- **Sprint03-Task44 - Printful webhook hardening (2025-11-24):** Webhook receiver supports HMAC when a secret exists, archives payloads idempotently under `PRINTFUL_WEBHOOK_ARCHIVE_DIR` (`Images/diagnostics/printful` in preview/prod), and has Jest coverage (`tests/integration/printful-webhook-route.test.ts`). Webhook is set to `https://app.snapcase.ai/api/webhooks/printful` with events order_created/updated/failed/package_shipped/package_returned; **Printful does not expose a webhook secret** (see Task50), so signature verification remains disabled by design.
- **Sprint03-Task42 - SnapCase-first picker & EDM stub (2025-11-23):** SnapCase copy/picker now leads /design, Printful picker chrome is masked and variant-locked via host config, and the Playwright EDM stub hooks/guardrails are updated. `npx playwright test tests/e2e/design-to-checkout.spec.ts --project=chromium` passes; diagnostic captures at `Images/diagnostics/design-task42-desktop-2025-11-23T03-44-53-352Z.png` and `Images/diagnostics/design-task42-mobile-2025-11-23T03-44-53-352Z.png`; AgentReport refreshed.
- **Sprint03-Task41 - sponsor readiness sweep (2025-11-22)**: dev.snapcase.ai HEAD 200 (`X-Vercel-Id: sfo1::j5nqw-1763854932269-ce745ad0a85e`); captured sponsor screenshots across design/checkout/thank-you desktop+mobile (`Images/diagnostics/design-sponsor-2025-11-22T23-43-11-433Z.png`, `checkout-sponsor-2025-11-22T23-43-11-433Z.png`, `thank-you-sponsor-2025-11-22T23-43-11-433Z.png` + mobile counterparts) plus analytics JSON (`Images/diagnostics/sponsor-readiness-2025-11-22T23-43-11-433Z.json`). Segment debugger harness logged 17 `api.segment.io` requests (design 11, thank-you 6) in `Images/diagnostics/segment-task34-2025-11-22T23-44-25-911Z.{json,png}`. `docs/UserTesting/Sprint02_Sponsor_Script.md` now references the new artifacts/timestamp for the sponsor walk-through.
- **Sprint03-Task40 - Stripe prod secret (2025-11-24)**: Confirmed Vercel holds live `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and `STRIPE_SHIPPING_RATE_STANDARD` across Development/Preview/Production via `vercel env ls --scope snapcase` (all present, updated ~18h ago). Exercised `/api/checkout` on `https://snapcase-4pbc17d3l-snapcase.vercel.app` and received live session `cs_live_b1nwyFwooz1C2tKaeWfhUXlEIBhPMWTq2NoqPW8y5IcKnfotuSimDinauc`; blocker cleared.
- **Sprint03-Task37 lint + telemetry refresh (2025-11-14)**: Replaced the raw `<img>` tags on `/checkout` + `/thank-you` with `next/image` (Stripe lockup now uses its native 96?28 dimensions and the Printful previews stay `unoptimized` to avoid double processing). Added a `PLAYWRIGHT_SKIP_BUILD` escape hatch to `scripts/run-playwright-server.mjs` so Windows runs of `npm run test:e2e` can reuse the preceding build, updated the guardrail spec to reflect the new Printful copy/state machine, and re-ran `npm run lint && PLAYWRIGHT_SKIP_BUILD=1 npm run test:e2e` to green. Captured fresh telemetry artifacts via `SNAPCASE_BASE_URL="https://snapcase-app.vercel.app" node scripts/capture-segment-telemetry.js` (`segment-task34-2025-11-14T21-40-34-227Z.{json,png}` plus scene screenshots in `Images/diagnostics/`).
- **Sprint03-Task38 Printful v2 integration (2025-11-16)**: EDM saves now call `/api/edm/templates` which uploads the preview/mockup URL to Printful `/v2/files`, stores the returned `file_id`, and hands a `templateStoreId` back to checkout. `/api/order/create` posts to `/v2/orders` with the required `placements[]/layers[]` structure and rejects devices missing a `catalog_variant_id`. Docs updated: `docs/PRINTFUL_CATALOG.md`, `docs/Printful_EDM_KeyFacts.md`, `docs/DEPLOYMENT_GUIDE.md`. Evidence lives in `src/app/api/edm/templates/route.ts`, `src/lib/template-registry.ts`, and `src/app/api/order/create/route.ts`.
- **Sprint03-Task35 ? Printful iframe theming & tool gating (2025-11-14):** `globals.css` now defines the SnapCase design tokens (violet/gray palette, radii, spacing, shadows) so `src/components/editor/printful-config.ts` can drive Printful?s `style.variables` knobs. The Printful config pipeline now passes a dedicated `iframeClassName` (`.snapcase-edm-frame`) plus expanded CSS overrides (toolbar/button radii, banner colors, mobile footer shadow) and documents the selected class inside the diagnostics snapshot. `featureConfig` explicitly hides clipart/text/pattern/background layers, disables Printful?s external file library, and forces `initial_open_view="layers_view"` while keeping the file uploader enabled. Captured before/after evidence via `scripts/collect-edm-diagnostics.js` (`Images/diagnostics/edm-diagnostics-2025-11-14T20-17-02-028Z.png` ? `Images/diagnostics/edm-diagnostics-2025-11-14T20-22-42-858Z.png` + JSON `Images/diagnostics/edm-diagnostics-after.json`) shows Printful acknowledging `setStyleOK` / `setFeatureConfigOK` with the new palette applied.

- **Sprint03-Task33 domain handoff (2025-11-10)**: `vercel alias set snapcase-7yx0mxnud-snapcase.vercel.app app.snapcase.ai --scope snapcase` now routes the production hostname to the latest `snapcase-app` deployment; `vercel domains inspect app.snapcase.ai --scope snapcase` shows the project binding and `nslookup app.snapcase.ai` still resolves to `2cceb30524b3f38d.vercel-dns-017.com`. `curl -I https://app.snapcase.ai` returns `200 OK` with `X-Vercel-Id: sfo1::z986q-1762802170628-ef743de4cd17`, confirming the Vercel edge is serving the alias.
- **Sprint02-Task25 - Git MCP automation workflow (2025-11-08):** Added `scripts/mcp-branch.mjs`, a `mcp-client` CLI that shells into the GitHub MCP (`@modelcontextprotocol/server-github`) to create `task/SprintNN-TaskXX-*` branches from `main`, serialize staged/working-tree/patch files, push with the standardized `${TaskID}: <summary> [MCP]` message, and optionally draft a PR. Documented the process + quickstart checklist in `docs/PROJECT_MANAGEMENT.md` and the full reference in `docs/Engineering/Automation.md`. Dry-run + live pushes now log compare/PR URLs so AgentReports can include proof without relying on local branch gymnastics.
- **Sprint03-Task26 ? `/design` rebuild (2025-11-08):** `/design` now ships the full-width EDM iframe with Printful owning device selection; all Fabric rails, legacy guardrail cards, and device grids were archived. Only the helper pill + CTA stack remain beneath the designer, and the Playwright spec now stubs Printful events directly. See `docs/AgentReports/Sprint03-Task26.md`.
- **Sprint03-Task31 ? Template registry + checkout wiring (2025-11-10):** Landed a server-side template registry (`src/lib/template-registry.ts`) and `/api/edm/templates` so every Printful save/hydrate call returns a short-lived token. `/design` now syncs template IDs through that API, `/checkout` validates tokens before hitting Stripe, and `/api/order/create` can assemble a Printful order payload (mock mode by default). Integration tests cover the registry, EDM save route, checkout handler, and the new order route. Evidence: `docs/AgentReports/Sprint03-Task31.md`.
- **Sprint03-Task27 ? Variant sync & CTA unlock (2025-11-08):** The helper pill/CTA read Printful `designStatus` events, syncing variant + template IDs into `saveDesignContext` and enabling ?Continue? only when Printful reports a valid design. Clicking the CTA now pushes users into `/checkout` with the correct variant metadata. See `docs/AgentReports/Sprint03-Task27.md`.
- **Sprint03-Task28 ? Telemetry QA evidence (2025-11-07):** Preview-only mode is now disabled for the dev alias: `vercel env rm/add NEXT_PUBLIC_SEGMENT_PREVIEW_ONLY` set the preview scope to `0`, `vercel deploy --yes` produced slug `https://snapcase-7yx0mxnud-snapcase.vercel.app`, and `vercel alias set ? dev.snapcase.ai` moved the alias. The refreshed telemetry capture at `Images/diagnostics/analytics-live-2025-11-07T23-25-06-362Z.{json,png}` shows `analytics_buffer_ready` with `previewOnly:false` plus live `api.segment.io/v1/{m,t}` requests carrying `thank_you_viewed` + guardrail events, satisfying the Segment debugger evidence requirement. See `docs/AgentReports/Sprint03-Task28.md`.
- **Sprint03-Task34 ? Segment QA & prod promotion (2025-11-10):** Ran the new `scripts/capture-segment-telemetry.js` harness against the Task16 slug (`https://snapcase-c2kwdcslf-snapcase.vercel.app`) to confirm preview-mode telemetry still mirrors into `window.__snapcaseSegmentPreview` (`Images/diagnostics/segment-task34-2025-11-10T19-11-27-144Z.{json,png}`), normalized env parsing so stray quotes/newlines in `.env.*` no longer break sink detection, forced `NEXT_PUBLIC_SEGMENT_PREVIEW_ONLY=0` in Vercel Production, and deployed `https://snapcase-esy2kc62z-snapcase.vercel.app` (`snapcase-app.vercel.app`) with the live Segment snippet enabled. `Images/diagnostics/segment-task34-2025-11-10T19-26-02-074Z.{json,png}` captures the debugger overlay plus the `https://api.segment.io/v1/{m,p,t}` requests carrying `thank_you_viewed`. Next: keep monitoring Segment?s debugger for noise and flip preview back to `previewOnly=1` after sponsor QA completes if desired.
- **Sprint02-Task16 ? dev alias redeploy & diagnostics (2025-11-07):** `npm run vercel-build` (Node?20) now finishes cleanly, `vercel deploy --prebuilt --yes` produced slug `https://snapcase-c2kwdcslf-snapcase.vercel.app` (`dpl_8xSdox6bDaDSc5As5s4Qvgvtrn2U`), and `vercel alias set ? dev.snapcase.ai` reattached Printful?s trusted hostname. `scripts/run-edm-live-flow.js` captured fresh Screens?2?4 evidence + analytics at `Images/diagnostics/edm-live-analytics-2025-11-07T17-34-44-390Z.{json,png}`, so QA + Printful can now review the latest guardrail, CTA, checkout, and thank-you flows.
- **Sprint02-Task17 ? Repo hygiene + docs consolidation (2025-11-06):** Added `.gitignore` coverage for `next-dev*.log`, `tmp_*.js`, and `node_modules_win_backup/`, deleted the stray artifacts, and kept `Images/diagnostics/*` intact for the AgentReports that cite those captures. The mixed-case `Docs/` tree now lives under the lowercase `docs/` root; every README/AgentReport reference points at `docs/`, and the layout is documented inside `docs/PROJECT_MANAGEMENT.md` so new work lands in the canonical path.
- **Sprint02-Task19 ? Playbook right-sizing (2025-11-07)**: Updated `docs/PROJECT_MANAGEMENT.md` with a dated Process Update that raises the run timebox to 45 minutes, allows dependent multi-step prompts (with explicit `_plan` steps), and lets documentation updates batch per feature while keeping Task ID logging, AgentReports, and source-of-truth citations mandatory. See `docs/AgentReports/Sprint02-Task19.md` for rationale + follow-ups.
- **Git workflow guardrail refresh (2025-11-08)**: Added a Git Workflow section to `docs/PROJECT_MANAGEMENT.md` that mandates per-task branches (`task/SprintNN-TaskXX-*`), pre/post `git status` checks, commit-or-stash handoffs, and a cap of two concurrent engineering prompts. All new prompts must include the branch/clean-tree checklist, and the PM tracks active branches in this log so we avoid the ?too many active changes? errors seen earlier in the week.
- **Prompt pipeline tracker (2025-11-08)**: Created `docs/TaskPipeline.md` plus the supporting ?Prompt Pipeline Tracker? section in `docs/PROJECT_MANAGEMENT.md`. Sponsors now just say ?Run Sprint02-Task15? and agents pull the full instructions (branch name, references, deliverables) from the tracker, eliminating the copy/paste prompt loop.
- **Sprint02-Task12 ? Analytics buffer bootstrap (2025-11-06):** Investigated the dev preview bundle (`/_next/static/chunks/app/design/page-7831b2ffeb422515.js?dpl=...`) and confirmed all `logAnalyticsEvent` calls were tree-shaken once `NEXT_PUBLIC_USE_EDM=false`, which left `window.__snapcaseAnalyticsEvents` undefined for QA. Added `initializeAnalyticsBuffers()` plus a root-level `<AnalyticsBootstrap />` client shim so every preview load pre-creates the buffer and emits an `analytics_buffer_ready` event before any EDM code runs. `next build` (Node 20) now passes, and a Playwright smoke against `next start` shows both the bootstrap event and the usual `design_cta_state_change` payloads landing in the buffer. See `Docs/AgentReports/Sprint02-Task12.md` for curl evidence + verification logs.
- **Sprint02-Task14 ? Next.js build stabilization (2025-11-07):** Reproduced the `_document` crash on WSL Node?20, added a stub `src/pages/_document.tsx`, guarded nullable `useSearchParams()` call sites in checkout/thank-you, and confirmed `npm run vercel-build` now finishes with only the pre-existing `<img>` lint warnings. Full log: `docs/AgentReports/Sprint02-Task14.md`.
- **Sprint02-Task15 ? Lockfile regeneration (2025-11-06):** Removed the Windows-only `lightningcss-win32-x64-msvc` dependency, re-synced the repo onto an ext4 workspace inside WSL, and ran `npm install --no-audit --progress=false` (Node?20) to capture a Linux-safe `package-lock.json`. `npm run vercel-build` now completes with the usual `<img>` lint warnings, so Vercel?s Linux builders will no longer hit `EBADPLATFORM`. Details + build log: `docs/AgentReports/Sprint02-Task15.md`.
- **Sprint02-Task18 ? ESLint alignment (2025-11-06)**: Revalidated the Next 14 toolchain with `next@14.2.33`, `eslint-config-next@14.2.33`, and `eslint@8.57.1` pinned in both `package.json` and `package-lock.json`. `npm run lint` (WSL Node 20) now completes without fatal errors; remaining warnings are `@next/next/no-img-element` on `src/app/checkout/page.tsx:543`/`733` and `src/app/thank-you/page.tsx:605`. Next actions: migrate the `<img>` tags to `next/image` (or document why they must remain).

- **Sprint02-Task24 ? Analytics hook dependency fix (2025-11-07):** `getAnalyticsBasePayload` now uses `useCallback` scoped to `variantId`, and the EDM bootstrap effect lists it in its dependency array so `react-hooks/exhaustive-deps` is satisfied without changing payload contents. `npm run lint` passes aside from the known `<img>` warnings noted above. See `docs/AgentReports/Sprint02-Task24.md` for verification details.
- **Printful guardrail consolidation (2025-11-05)**: Wired `EdmEditor` to consume Printful?s `onDesignStatusUpdate` payloads, surface them inside the diagnostics drawer, and pass normalized guardrail state back up to `/design` so the Continue CTA is disabled whenever `designValid=false`, blocking errors exist, or Printful?s variant IDs diverge from the SnapCase selection. We removed the SnapCase guardrail card entirely?Printful?s banner is the only warning surface?and analytics fire from those callbacks. Docs (`docs/Responsive_Blueprint.md`, `docs/Printful_EDM_KeyFacts.md`, `docs/openapi-Printful.json`) call out the new ownership model. Commands: `npm run lint` (passes with pre-existing checkout/thank-you warnings).
- **EDM guardrail summary + picker notice (2025-11-06)**: When Printful drives validation we now suppress the SnapCase safe-area overlay + guardrail panel, render a compact summary card (`src/components/editor/edm-editor.tsx`) that mirrors `designValid`/`errors[]`, log `analytics.edm_guardrail_summary_update`, and show inline helper copy reminding users the Printful picker is locked to the SnapCase variant. Documentation updates span `docs/Responsive_Blueprint.md`, `docs/UXCX_Guidelines.MD`, and `docs/Printful_EDM_Risk_Analysis.md` so stakeholders see the before/after UX and retired assumptions. **Next actions:** capture refreshed screenshots for the blueprint gallery and confirm Fabric-only fallback still needs the SnapCase overlay before deleting that component entirely.
- **Sprint02-Task04 copy alignment (2025-11-05)**: `/design` now ships the documented ?Variant locked to your SnapCase selection? chip, CTA copy states (`Select a device` ? `Resolve the Printful banner above` ? `Waiting on Printful?` ? `Continue to checkout`), and a serialized guardrail-toast queue that mirrors Printful payloads. `/checkout` keeps the cancel/resume banner persistent; any future dismiss is guarded by `NEXT_PUBLIC_ALLOW_CANCEL_BANNER_DISMISS`. Docs refreshed (`docs/SnapCase_App_Prototype.MD`, `docs/UXCX_Guidelines.MD`) cite `docs/Responsive_Blueprint.md` ?Screen?2, and new diagnostics live at `Images/diagnostics/design-messaging-2025-11-05T15-57-23-800Z.png` + `Images/diagnostics/checkout-cancel-banner-2025-11-05T15-57-23-800Z.png`. Command: `PLAYWRIGHT_PORT=3100 npx playwright test tests/e2e/design-to-checkout.spec.ts --project=chromium`.
- **Sprint02-Task05 ? Checkout reassurance + live pricing (2025-11-07)**: `/checkout` now matches Screen?3 with the violet Snapcase Quality Promise card, sticky cost rail, Stripe lockup CTA + helper copy, analytics for `checkout_shipping_selected`/`checkout_pricing_update`, and polite `aria-live` regions wiring the totals + shipping helpers. Docs updated (`docs/Responsive_Blueprint.md`, `docs/UXCX_Guidelines.MD`, `docs/SnapCase_App_Prototype.MD`) and diagnostics captured at `Images/diagnostics/checkout-desktop-2025-11-05T16-48-23-099Z.png` + `Images/diagnostics/checkout-mobile-2025-11-05T16-48-23-099Z.png`. `npx playwright test tests/e2e/design-to-checkout.spec.ts --project=chromium` currently **fails** because `next start` crashes with `TypeError: e[o] is not a function` while loading `/design`; resolver needed before the suite can reach the new checkout assertions/screenshots.
- **Sprint02-Task13 ? Sponsor test readiness (2025-11-06)**: Authored `docs/UserTesting/Sprint02_Sponsor_Script.md` with a four-screen sponsor script, PM readiness checklist (preview URL, diagnostics timestamps, analytics buffer, seeded design context, mock Stripe dry run), and caveats (mock Stripe flow, placeholder Printful order IDs, analytics buffer limitations, locked Printful picker, diagnostics cadence). Linked the doc from `docs/UXCX_Guidelines.MD` and captured next steps in `docs/AgentReports/Sprint02-Task13.md`. Follow-up: schedule the sponsor walk-through once parity build lands and re-run diagnostics to confirm Screen?2 helper copy + analytics fire in preview.
- **Sprint02-Task09 ? Playwright prod server fix (2025-11-08)**: Reproduced the `next start` crash with `DEBUG=pw:webserver` and traced it to `.next/server/webpack-runtime.js` coming from a dev build (it tries to `require("./948.js")`/`./682.js` instead of `./chunks/?`), which is the same stale artifact that surfaces as `TypeError: e[o] is not a function` when `/design` hydrates. Added `scripts/run-playwright-server.mjs` and updated `playwright.config.ts` so every `npx playwright test ?` run now deletes `.next`, runs `next build`, and only then boots `next start` with the Playwright env. Guardrail logged in `docs/PROJECT_MANAGEMENT.md`, and `DEBUG=pw:webserver npx playwright test tests/e2e/design-to-checkout.spec.ts --project=chromium` now passes (3/3 specs, ~57?s). **Next steps:** use the new script for any manual production-mode server to avoid leaking dev bundles back into `.next`.
- **UX/CX documentation hygiene (2025-11-07)**: Tagged every UX/CX spec with Authoritative/Deprecated/Needs Rewrite labels, added the Source-of-Truth appendix inside `docs/UXCX_Guidelines.MD`, aligned `docs/SnapCase_App_Prototype.MD`, `docs/Responsive_Blueprint.md`, `docs/Printful_EDM_KeyFacts.md`, `docs/Printful_EDM_Risk_Analysis.md`, `docs/Printful_EDM_Escalation.md`, and all Flow?1/Flow?2 delta docs with the Picker-visible, Printful-owned guardrail reality, and logged Fabric-only guidance as deprecated. **Next steps:** Rewrite Screen?2 delta docs (mobile + desktop) for EDM-first layout, refresh the Printful escalation packet now that picker suppression is off the table, and capture new blueprint screenshots once staging redeploys.
- **Sprint02-Task02 ? EDM desktop grid + diagnostics (2025-11-07)**: `/design` now uses the shared `container-lg` grid with safe-area padding, a 960px Printful column, 320px SnapCase order column, and the optional left-rail placeholder (hidden on `lg-`). The helper pill above the iframe reiterates the locked picker, the CTA column shows Printful-first guardrail copy + `Next: Review`, and the sticky mobile ActionBar/floating desktop CTA share the same gating logic. Docs refreshed: `docs/Responsive_Blueprint.md` Mockup-vs-Reality table cites the new captures, and `Snapcase-Flow-Mockups/.../Desktop/Screen-2-Design-your-case/snapcase-notes-delta-screen-2.md` now describes the EDM-first layout + open questions. **Artifacts:** `Images/diagnostics/design-desktop-2025-11-05T15-47-53-583Z.png`, `Images/diagnostics/design-mobile-2025-11-05T15-49-00-368Z.png`, `docs/AgentReports/Sprint02-Task02.md`. **Commands:** `npm run build`, `npx playwright test tests/e2e/design-to-checkout.spec.ts --project=chromium` (pass after killing stale Windows `node.exe` listeners on port 3000).
- **Sprint02-Task03 ? EDM telemetry instrumentation (2025-11-07)**: Wired `EdmEditor` to emit normalized analytics payloads (`variantId`, `designValid`, `errorSummaries`, `timestamp`) for `edm_variant_locked`, `edm_design_status`, `edm_guardrail_blocked`, `edm_guardrail_warning`, `edm_pricing_update`, and `edm_template_saved`, added a Playwright spec that forces `/design?forceEdm=1` to assert each event fires, and captured payload samples at `Images/diagnostics/edm-analytics-forceEdm-sample.json`. See `docs/AgentReports/Sprint02-Task03.md` for verification evidence + open approvals.
- **Sprint02-Task06 ? Screen?4 thank-you timeline + diagnostics (2025-11-05)**: `/thank-you` now matches the blueprint hero, order summary card, delivery ETA chip, support link, and dual CTAs while a four-step timeline (Submitted ? Print files ? In production ? Shipped) maps Printful statuses to UI state. Checkout persists an `order-confirmation` snapshot so the confirmation page can copy order IDs, emit analytics (`thank_you_viewed`, `track_order_clicked`, `timeline_step_revealed`, `copy_order_id`), and expose `?status=` QA overrides until Printful webhooks land. Docs refreshed (`docs/Responsive_Blueprint.md` ?Screen?4, `docs/UXCX_Guidelines.MD`, `docs/SnapCase_App_Prototype.MD`, `docs/AgentReports/Sprint02-Task06.md`) and diagnostics live at `Images/diagnostics/thank-you-desktop-2025-11-05T16-41-30-616Z.png` + `Images/diagnostics/thank-you-mobile-2025-11-05T16-41-30-616Z.png`. Command: `npx playwright test tests/e2e/design-to-checkout.spec.ts --project=chromium`.
- **Sprint02-Task07 ? Analytics sink & data policy (2025-11-07)**: Selected Segment Connections as the production telemetry destination (bridging to GA4 + BigQuery), documented the retention/privacy stance + data minimization grid in `docs/Printful_EDM_KeyFacts.md`, extended `docs/TESTING_STRATEGY.md` with the analytics validation plan, added a PoC Segment stub + hashing/sampling guardrails in `src/lib/analytics.ts`, and filed `docs/AgentReports/Sprint02-Task07.md`. **Next actions:** Ethan to approve Segment ownership + retention, drop the write key + template salt into `docs/MCP_Credentials.md`, and prioritize Fabric/checkout telemetry follow-ups before enabling the live sink.
- **Sprint02-Task10 ? Segment preview enablement (2025-11-06)**: Wired the `snapcase-web-dev` write key + preview hashing salt into `.env.local`, enabled `NEXT_PUBLIC_SEGMENT_PREVIEW_ONLY=1`, and captured diagnostics proving `/design?forceEdm=1` + `/thank-you` telemetry land in both `window.__snapcaseAnalyticsEvents` (raw) and `window.__snapcaseSegmentPreview` (sanitized with `templateFingerprint`). Evidence: `Images/diagnostics/analytics-preview-2025-11-06T16-37-14.644Z.{json,png}`. Docs touched: `docs/MCP_Credentials.md`, `docs/Printful_EDM_KeyFacts.md`, `docs/TESTING_STRATEGY.md`, `docs/AgentReports/Sprint02-Task10.md`. **Next:** capture the `snapcase-web-prod` credentials + salt, push the env vars into Vercel, and rerun the checklist with `NEXT_PUBLIC_SEGMENT_PREVIEW_ONLY=0` before shipping live traffic.
- **Sprint02-Task10 follow-up ? Segment prod dry-run (2025-11-06)**: Added the prod write key/salt references to `docs/MCP_Credentials.md`, gated the Segment snippet in `src/app/layout.tsx`, opened CSP to `cdn.segment.com`/`api.segment.io`, and ran a live-mode smoke where `/design?forceEdm=1` + `/thank-you` events hit Segment endpoints. Evidence: `Images/diagnostics/analytics-live-verified-2025-11-06T17-26-31.656Z.{json,png}` (decoded payloads show hashed `templateFingerprint`). **Next:** store the prod salt/key in Vercel Production, capture a Segment debugger screenshot once the deployment is live, then leave Previews in preview-only mode to avoid noisy data.
- **Sprint02-Task21 ? Segment env promotion & runbook sync (2025-11-06)**: Documented the exact CLI workflow to mirror preview/prod Segment keys + salts into Vercel (`vercel env pull`, `env add`, `env ls/diff`) and spelled out the verification artifacts (Segment debugger screenshot + `/design?forceEdm=1` smoke). Updates touch `docs_new/MCP_Credentials.md`, `docs_new/DEPLOYMENT_GUIDE.md`, and `docs_new/AgentReports/Sprint02-Task21.md`. **Next:** Ethan runs the CLI steps with real secrets, redeploys both scopes, and drops the debugger screenshots into `Images/diagnostics/` before promoting prod analytics.
- **Sprint02-Task08 ? Live EDM QA (2025-11-05)**: Exercised `/design ? /checkout ? /thank-you` against `https://dev.snapcase.ai` with real Printful payloads (desktop + iPhone emulation) using `scripts/collect-edm-diagnostics.js` and the new `scripts/run-edm-live-flow.js` harness. Captured diagnostics (`Images/diagnostics/edm-diagnostics-2025-11-05T18-41-16-226Z.png`, `Images/diagnostics/design-live-desktop-2025-11-05T18-29-13-147Z.png`, `Images/diagnostics/checkout-live-2025-11-05T18-29-13-147Z.png`, `Images/diagnostics/thank-you-live-2025-11-05T18-29-13-147Z.png`) plus accessibility dumps to prove current copy. Key findings: helper pill/CTA states are still the Scene?5 prototype, `window.__snapcaseAnalyticsEvents` never initializes (no `edm_*`, `checkout_*`, or `thank_you_*` events), and preview builds continue to serve the pre-Sprint02 checkout/thank-you UI. Reported in `docs/AgentReports/Sprint02-Task08.md` with follow-ups to redeploy Screens?2?4 and restore the analytics buffer. Command history: `"/mnt/c/Program Files/nodejs/node.exe" scripts/collect-edm-diagnostics.js`, `SNAPCASE_BASE_URL="https://dev.snapcase.ai" "/mnt/c/Program Files/nodejs/node.exe" scripts/run-edm-live-flow.js`.
- **Sprint02-Task11 ? dev alias redeploy (2025-11-06)**: Confirmed `dev.snapcase.ai` still resolves to `snapcase-6ic8h47wt-snapcase.vercel.app` (`dpl_6BW1PB9tBT4uXhJBhewbtdUSbwmF` in project `snapcase-app`). `npm run vercel-build` keeps failing locally?Windows Node?22 hits the long-standing `TypeError: e[o] is not a function` while prerendering `/design` + `/checkout`, and even after switching to WSL Node?20 with a fresh `npm install`, the build halts with `PageNotFoundError: Cannot find module for page: /_document`. A remote `vercel deploy --yes` fallback produced slug `https://snapcase-k5tu1tq4r-snapcase.vercel.app` but aborted because `package-lock.json` currently lists `lightningcss-win32-x64-msvc` as a direct dependency (`npm ERR! EBADPLATFORM ?`). Result: no new deployment, alias still serves the Nov?4 slug, and diagnostics were not rerun. Next steps: regenerate the lockfile on Linux/WSL, get `npm run vercel-build` green, then repeat `vercel deploy --prebuilt` followed by `SNAPCASE_BASE_URL="https://dev.snapcase.ai" node scripts/run-edm-live-flow.js`. Full report: `docs/AgentReports/Sprint02-Task11.md`.
- **UX/CX blueprint reset (2025-11-06)**: Rewrote `docs/Responsive_Blueprint.md` (responsive strategy + Screen?2 guardrails), `docs/UXCX_Guidelines.MD`, `docs/SnapCase_App_Prototype.MD` (Design section), and `PROGRESS.md` to codify the Printful-first guardrail plan, Mockup-vs-Reality table, and business-copy clarifications. Remaining execution: (1) audit `Snapcase-Flow-Mockups/.../Desktop/Screen-2-*` commentary to sync helper copy, (2) capture fresh desktop/mobile screenshots once `PFDesignMakerOptions.style.navigation` type issue is resolved, (3) thread the new helper/CTA messaging into `/design`, and (4) operationalize today?s resolved UX decisions (no extra rail, persistent cancel/resume banner, queued guardrail toasts) in code + QA checklists.

- **Responsive layout + CTA restoration (2025-11-05)**: Rebuilt `/design` to match the responsive blueprint by adding the search input, Apple/Samsung segmented tabs, Detect CTA row with UA helper text, and a 2/3/4/5-column card grid clamped to `max-w-screen-xl`. Guardrail/editor content now sits inside a wider container with a scaffolded optional rail, and the sticky ActionBar (base/sm) plus floating CTA pod (lg+) share the guardrail gating copy (?Back-only print?). Updated `docs/Responsive_Blueprint.md` Live Gap Analysis to mark those deltas resolved and called out that screenshots will follow once the Printful EDM type error stops blocking local builds. Verification: `npm run lint` (passes with the existing checkout/thank-you warnings). Screenshot capture via `next dev` + Playwright remains blocked by the upstream `PFDesignMakerOptions.style.navigation` type failure; noted for follow-up in the gap section.

- **Printful config builder diagnostics (2025-11-10)**: Refactored the Printful config builder into a single payload that carries initProduct, variant locks, tool suppression, SnapCase CSS tokens, navigation icon overrides, and confirmation-mode settings, exposed analytics hook stubs for `onDesignStatusUpdate`/`onPricingStatusUpdate`, mirrored those hooks inside `EdmEditor`, expanded the diagnostics drawer with the new snapshot data, and documented the module in `docs/Printful_EDM_KeyFacts.md`. Commands: `npm run lint` (passes with existing checkout/thank-you warnings).
- **Printful EDM bootstrap hardening (2025-11-04)**: Removed the `crossOrigin="anonymous"` attribute from the dynamically injected `embed.js`, added a 15s watchdog + request IDs so diagnostics capture stalled loads, and forced Printful create-mode to include the documented SUBLIMATION technique plus an automatic retry when PF responds with `Template not found`. Redeployed via `npm run vercel-build` ? `vercel deploy --yes` (preview `snapcase-fbtuk9oqr`) and captured a clean run with `scripts/collect-edm-diagnostics.js` showing `setProductOK`/`designerLoadedOK` events for variant `SNAP_IP15PRO_SNAP`.
- **Printful EDM viewport fix (2025-11-04)**: Added a global CSS rule (`[id^="snapcase-edm-canvas-"] iframe`) so the injected Printful iframe stretches to 100% width/height of the phone mock. Prior to the fix the iframe defaulted to 300?150 px, which made it appear as a tiny tile near the guardrail column. Verified by sampling bounding boxes via Playwright (iframe now matches the 418?908 canvas) and redeployed through `npm run vercel-build` ? `vercel deploy --yes` (preview `https://snapcase-6ic8h47wt-snapcase.vercel.app`, aliased to `dev.snapcase.ai`).

- **Printful EDM config + theming (2025-11-06)**: Added `src/components/editor/printful-config.ts` so `EdmEditor` now passes a centralized `buildPrintfulConfig(...)` payload (initProduct, variant-lock flags, tool suppression, Snapcase violet theme tokens, and `useUserConfirmationErrors=false`) into PFDesignMaker, wired `onDesignStatusUpdate` snapshots + theme info into the diagnostics drawer, and refreshed `docs/Printful_EDM_InvalidOrigin.md` plus `docs/Responsive_Blueprint.md`. Commands: `npm run lint`, `npm run test:integration -- template-cache`.

- **EDM template regression harness** *(2025-11-08)*: Added `npm run check:printful-templates` to probe every `externalProductId` via the Printful template API and fail fast when a template is missing, plus a Playwright spec that forces `?forceEdm=1`, saves a template, reloads, and confirms edit-mode reuse without `initProduct`. The spec stubs `embed.js`, clears `snapcase:design-context` / `snapcase:edm-template-cache`, updates the JSON mock at `tests/fixtures/printful-template-mock.json`, and captures screenshots when failures occur so Ethan can share diagnostics.
- **Printful EDM Invalid Origin** *(Regression flagged 2025-10-30)*: Local (`localhost:3050`) passes with `Snapcase-Dev-110325-1`, but protected Vercel previews will still loop on `invalidOrigin` until every preview slug is whitelisted (or aliased) in the Printful dashboard. Use the diagnostics panel on `/design` to copy origin + nonce payloads for support, and confirm the domain entries listed in [docs/Printful_EDM_InvalidOrigin.md](docs/Printful_EDM_InvalidOrigin.md).
  - **Printful EDM template gap** *(Found 2025-11-04)*: Even with the alias whitelisted, the Printful iframe stays blank and emits `rpcError`/`loadTemplateFailed` because the store has no saved template associated with `external_product_id=SNAP_IP15PRO_SNAP`. Printful responds with a valid nonce but then returns `Template not found`, so the design surface never renders. Action: either (1) create base product templates in Printful for every `external_product_id` we request, or (2) update `EdmEditor` to call `initProduct` with full variant metadata once Printful shares the required payload format. Evidence: latest diagnostics run (`Images/diagnostics/edm-diagnostics-2025-11-04T01-15-29-155Z.png`) + console log attached to Ethan?s bug report.
  - 2025-11-05: Refreshed `docs/Responsive_Blueprint.md` with a ?Responsive Delivery Strategy? section clarifying that mobile deltas remain the primary spec, desktop commentary lives alongside them, guardrails are SnapCase-owned, and every responsive tweak must update the blueprint/delta docs before code merges. Also updated `docs/Printful_EDM_KeyFacts.md` to link both the official Printful docs and our local `docs/openapi-Printful.json` so every agent knows exactly where to look before troubleshooting EDM again.
- **2025-11-04**: Captured Printful EDM customization research in `docs/Printful_EDM_InvalidOrigin.md#UI Customization & Control Matrix`, summarizing configuration knobs (initProduct, variant locks, toolbar toggles, theming tokens) plus embedded UX best practices from Planoly/Dunkin case studies. Logged open questions for Printful support (hiding variant panels, extra CSS hooks) so future agents know the limits before building layout experiments.
- **Printful EDM automation plan** *(Kickoff 2025-11-04)*: Product templates should be auto-generated the first time a variant is opened. We will (a) map each Snapcase catalog entry to Printful?s catalog `productId`, (b) detect whether a template already exists via `GET /product-templates/@{externalProductId}`, (c) pass `initProduct` to `PFDesignMaker` whenever we need to create a fresh template, and (d) capture `onTemplateSaved` to persist `{ external_product_id, template_id }`. This prevents manual template drift and keeps Ethan out of the Printful dashboard for routine maintenance.
- **EDM create/edit auto wiring** *(2025-11-07)*: `EdmEditor` now probes `/api/edm/templates/{externalProductId}` before loading `PFDesignMaker`, switches to create mode via `initProduct` when Printful reports `exists=false`, and passes `templateId` for edit sessions. Saved IDs land in the new session-storage `TemplateCacheEntry` helper plus the checkout design context, so repeated visits reuse the same template even if Printful is momentarily offline. The diagnostics panel now calls out create vs edit mode, cache hits, and every template ID involved, and `docs/Printful_EDM_InvalidOrigin.md` + `tests/integration/template-cache.test.ts` were updated to match.
- **Design Continue CTA Disabled** *(Resolved 2025-10-26)*: Relaxed CSP `script-src` to permit Next bootstrap (dev adds `'unsafe-eval'` temporarily). Removed lingering CSP bypass so warn/good variants unlock Continue again. `npm run verify` now succeeds locally and in CI.

### Documentation Updates
- **2025-11-06 (Sprint02-Task20)**: Published the component decomposition blueprint in `docs/Engineering/Sprint02_Component_Decomposition.md`, outlining Phases 0-6 (analytics buffer restoration through guardrail diagnostics/checkout alignment) plus spawn-ready sub-task IDs. The plan references `docs/Responsive_Blueprint.md` and `docs/UXCX_Guidelines.MD` so every slice keeps the Screen?1 layout + guardrail governance intact, and it sets explicit test targets (unit hooks + Playwright coverage) before we touch `/design` or `EdmEditor`.
- **2025-11-04**: Reconciled MVP assumptions per Ethan?s call. `docs/UXCX_Guidelines.MD` now states that (a) we will not petition Printful for guardrail suppression unless their refusal catastrophically harms UX/CX, (b) the Screen 2 desktop ?rail? is solely the native EDM toolbar (no SnapCase assist rail or guardrail panel), and (c) analytics upgrades must remain cost-neutral (free tier or existing credits). `docs/Responsive_Blueprint.md` and `docs/Printful_EDM_InvalidOrigin.md` were amended to match, so future agents don?t plan layout/content work against a non-existent rail or pursue vendor asks prematurely.
- **2025-11-04**: Logged the UX/CX director memo in `docs/UXCX_Guidelines.MD` plus blueprint/Printful addenda covering (a) guardrail single-ownership, (b) desktop layout assumptions, (c) analytics instrumentation priorities, and (d) Printful escalation posture. Decisions: SnapCase controls all safety messaging while Printful enforces validation; tier-0 analytics events (variant change, guardrail warning, design saved, price update, editor abandon) stream through `logAnalyticsEvent` until Segment is funded. Dependencies: Ethan must approve any vendor escalation; engineering needs `GuardrailStateAdapter` + `logAnalyticsEvent` sinks; design systems must ensure `/design` has enough width for the editor/guardrail columns. Next actions: build the adapter, extend `scripts/collect-edm-diagnostics.js` to capture guardrail events, and prep the escalation artifacts for Ethan?s sign-off.
- **2025-11-08**: Authored the desktop deltas for Flow 1 Screens 3-4 (`Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Desktop/Screen-3-Review-and-Shipping/snapcase-notes-delta-screen-3.md`, `.../Screen-4-Order-Placed/snapcase-notes-delta-screen-4.md`), extended `docs/Responsive_Blueprint.md` with the "Desktop Checkout & Confirmation" guidance, and logged outstanding desktop-only questions (marketing nav suppression, sticky rail collapse, confirmation timeline orientation, PDF receipt ask) for Ethan.
- **2025-11-04**: Captured the AI-generated desktop mock review for Flow?1 Screens?1?2; authored `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Desktop/Screen-1-Pick-your-device/snapcase-notes-delta-screen-1.md` and `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Desktop/Screen-2-Design-your-case/snapcase-notes-delta-screen-2.md`, then linked both from `docs/Responsive_Blueprint.md` (?Desktop References?). Notes cover layout wins, token drift, CTA/guardrail gaps, and open questions so engineers don?t treat the mockups as shippable UI.
- **2025-11-04**: Logged the Live Gap Analysis for `/design` (duplicate pickers, layered guardrails, cramped desktop layout), captured supporting screenshots (`design-desktop-selected.png`, `design-mobile-selected.png`, `Images/diagnostics/11.4.25_badCXUX.png`), and documented remediation paths plus open questions in `docs/Responsive_Blueprint.md:91-110`.
- **2025-11-06**: Added the Template probe API section to `docs/Printful_EDM_InvalidOrigin.md`, covering the new `/api/edm/templates/{externalProductId}` endpoint semantics, error handling contract, and a ready-to-run cURL snippet for QA.
- **2025-11-05**: Refreshed `docs/Responsive_Blueprint.md` with breakpoint-specific layouts, guardrail messaging (DPI, cancel/resume, safe-area overlays), accessibility checklist, and open UX decisions awaiting Ethan. Updated `docs/UXCX_Guidelines.MD` to point to the new blueprint guidance.
- **2025-11-05 (Sprint02-Task01)**: Added Delta Status tables to every Flow?1 delta doc (mobile + desktop Screens?1-4), rewrote the blueprint?s Mockup vs Reality + Screen?3/4 sections to call out Quality Promise/thank-you gaps, extended the UX/CX Source-of-Truth index, and filed `docs/AgentReports/Sprint02-Task01.md` so workstreams stay synced with the Printful-first reality. **Next actions:** (1) Ship the Screen?3 Quality Promise banner + `aria-live` pricing updates, (2) build the full `/thank-you` timeline + dual CTA experience and capture new diagnostics, (3) decide on the desktop toolbar/AppHeader nav plan so we can graduate the ?Not Started? tags, and (4) capture Screen?1 screenshots once the Printful type error unblocks builds.
- **2025-11-04**: Investigated the blank EDM stage on dev preview; confirmed Printful sends `iframeLoadedOK` but immediately responds with `rpcError` / `loadTemplateFailed` (`Template not found`). Logged the gap in this tracker, captured screenshots + JSON logs via `scripts/collect-edm-diagnostics.js`, and documented next steps (create base templates or wire `initProduct` calls) in `docs/Printful_EDM_InvalidOrigin.md`.
- **2025-11-04**: Documented the create-on-demand EDM workflow (initProduct, onTemplateSaved persistence, health-check endpoints) so future agents can implement automated template provisioning without manual Printful setup. See `docs/Printful_EDM_InvalidOrigin.md` ?Create-mode workflow? section for the runbook.
- **2025-11-04**: Verified the aliased preview `https://dev.snapcase.ai?_vercel_share=YUEI91JlQxSOTGd5TxBsDAPA9hthrMd3` loads without the Vercel password gate, exercised `/design` end-to-end with the new `scripts/collect-edm-diagnostics.js` harness (captured origin `https://dev.snapcase.ai`, nonce `j7AfWMqv3AZPULp1EBxoHrsHsjtKiyuG`, Printful iframe events, screenshot `Images/diagnostics/edm-diagnostics-2025-11-04T01-15-29-155Z.png`), and confirmed `node scripts/check-printful-nonce.js` returns `200` with token `Snapcase-Dev-110325-1` (EDM loads, latest warning is `loadTemplateFailed` if no saved template is linked).
- **2025-11-03**: Deployment/architecture docs refreshed for the preview?alias runbook (`_vercel_share` links, dev.snapcase.ai protection bypass), Vercel secret ownership (`PRINTFUL_TOKEN`, `STRIPE_SECRET_KEY`), and the `app.snapcase.ai` DNS cutover checklist so coordination with Printful stays non-technical.
- **2025-11-04**: Realigned `eslint-config-next` (14.2.33) with the existing Next.js 14.2 runtime, pinned ESLint to 8.57 to satisfy peer requirements, replaced the flat config with a `.eslintrc.cjs` that mirrors the previous ruleset, and confirmed `npm run lint` completes (warnings remain in app code for `react-hooks/exhaustive-deps` and `@next/next/no-img-element`).
- **2025-11-03**: Rotated Printful EDM token to `Snapcase-Dev-110325-1`, updated `.env.local` plus Vercel (`PRINTFUL_TOKEN`, `PRINTFUL_TOKEN_DEV_CURRENT`), and refreshed Printful docs with the new allowlist (`dev.snapcase.ai`, localhost, production domains, legacy previews).
- **2025-11-03**: Expanded `docs/TESTING_STRATEGY.md` with a current automation snapshot, gap analysis, and phased roadmap tied to the guardrail/Stripe/EDM priorities so QA owners have a single source of truth before pilot testing.
- **2025-10-31**: Rotated Printful EDM token to `Snapcase-Dev-103125-1`, mirrored the value across `.env.local` and Vercel (`PRINTFUL_TOKEN`, `PRINTFUL_TOKEN_DEV_CURRENT`), and expanded the Printful dashboard allowlist to include the latest preview host plus Squarespace domains.
- **2025-10-31**: Refreshed `docs/Printful_EDM_InvalidOrigin.md` and `docs/MCP_Credentials.md` with the new token metadata, updated origin allowlist, and rotation cadence details.

- **2025-10-28**: Token-aligned Flow 2 status & tracking delta docs (Screens 1-5) to reference `var(--snap-*)`, `--space-*`, `--control-height`, and `--radius-*` tokens instead of raw hex/px values; no additional design tokens needed beyond the new `--snap-cloud`, `--snap-cloud-border`, and `--snap-violet-50` aliases already added to the system.
- **2025-10-27**: Authored pending-state delta notes for Flow 2 Screen 3 in `Snapcase-Flow-Mockups/Flow-2-Status-and-Tracking/Mobile/Screen-3-Order-Status-Pending/snapcase-notes-delta-screen-3.md`, covering reassurance copy, polling cadence, escalation paths, analytics, and responsive behavior.

- **2025-10-27**: Captured detailed delta notes for Review & Shipping (Screen 3) and Order Placed (Screen 4) in `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Mobile/*/snapcase-notes-delta-screen-*.md`, aligning Stitch mockups with Snapcase design tokens, accessibility guardrails, and analytics expectations.

- **2025-10-28**: Finalized Screen 3 Review & Shipping delta doc (`Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Mobile/Screen-3-Review-and-Shipping/snapcase-notes-delta-screen-3.md`), updated UX/CX guidelines index with new Flow 2 resources, noted follow-up analytics requirements, and verified the latest Vercel preview (design ? checkout ? thank-you) with results captured in `docs/SELF_TEST_CHECKLIST.md`.

- **2025-10-27**: Added `docs/Responsive_Blueprint.md`, documenting breakpoint-by-breakpoint behavior for Screens 1?4 and listing outstanding desktop design follow-ups (Stripe lockup asset, animation specs, optional right-rail content).

- **2025-10-27**: Filed Flow 2 Status & Tracking delta docs for Mobile Screens 2?5 under `Snapcase-Flow-Mockups/Flow-2-Status-and-Tracking/` and updated `docs/UXCX_Guidelines.MD` to surface the new references (Screen 1 still pending delta coverage).

- **2025-10-27**: Authored Flow 2 Tracking Details delta doc (`Snapcase-Flow-Mockups/Flow-2-Status-and-Tracking/Mobile/Screen-2-Tracking-Details/snapcase-notes-delta-screen-2.md`) covering timeline drill-down behavior, metadata fields, accessibility rules, and analytics hooks.

- **2025-10-27**: Logged Flow 2 order-tracking error handling updates in `Snapcase-Flow-Mockups/Flow-2-Status-and-Tracking/Mobile/Screen-4-Order-Tracking-Errors/snapcase-notes-delta-screen-4.md`, detailing recoverable vs hard failures, accessibility alerts, and analytics for retries/support escalations.

### Next 3 Actions

1. **EDM Integration Spike** (AI): Wire Printful nonce request + iframe handshake behind `USE_EDM`, validating guardrail messaging within the EDM chrome.

2. **Responsive Alignment** (AI + Design): Review `docs/Responsive_Blueprint.md` tasks (floating CTA, sticky checkout panel, timeline layout) and slot the first set into Sprint 2 execution.

3. **Printful Order Dry Run** (AI + Ethan): Capture live catalog external IDs and run the sandbox order/confirm cycle to validate fulfillment mapping and webhook handling.

## Sprint Log

### Sprint 0 - Testing Loop Setup *(Oct 25 - Nov 7, 2025)*

| Task | Owner | Status | Notes / Next Step |

| --- | --- | --- | --- |

| Provide Stripe production secret + webhook signing secret via secure channel | Ethan | DONE | Stripe sandbox keys + webhook secret confirmed; no further action until we swap to live. |

| Store Stripe and Printful secrets in Vercel + refresh `.env.local` | AI | DONE | Vercel env updated, redeploy triggered, and `.env.local` synced with Stripe sandbox values. |

| Verify Printful catalog external IDs align with curated data | AI | DONE | Catalog snapshot captured in `docs/PRINTFUL_CATALOG.md`; ready to wire live Printful queries. |

| Point `app.snapcase.ai` CNAME at Vercel (`2cceb30524b3f38d.vercel-dns-017.com`) | Ethan | DONE | DNS now validated in Vercel (see app.snapcase.ai domain dashboard). |

| Harden automated test harness (`test:unit`, `test:integration`, `test:e2e`) and add smoke stubs | AI | DONE | Jest unit/integration placeholders plus the Playwright smoke test now run locally; `npm run test:e2e` passes with mocked services. |

| Wire CI/local `npm run verify:mcp` + test suite into developer workflow | AI | DONE | Added `npm run verify` script chaining MCP + unit/integration/e2e tests and linked it into README and deployment checklist. |

| Draft Playwright happy-path scenario for design->checkout using mock services | AI | DONE | Smoke spec walks design ? checkout flow with mocked EDM + Stripe endpoints. |

| Publish user-testing plan (participants, schedule, success criteria) | Ethan + AI | IN PROGRESS | Ethan will self-test each preview build; flesh out script & logging template before Sprint 1 demo. |

#### Blockers

- 2025-10-24: Runaway agent widened scope beyond the prompt and touched config defaults; diff was rolled back, workspace cleaned, and the guardrails now live in `docs/PROJECT_MANAGEMENT.md` for future prompts.

- 2025-10-25: Playwright prompt exceeded timebox while fighting `.next` file locks on OneDrive; updated the playbook with timeboxing, cleanup, and no-stub guidance to prevent repeat overruns.

- 2025-10-25: Squarespace already handles the marketing hero; plan to redirect `/` ? `/design` in the Next.js app so users land directly in Scene 1.

- 2025-10-26: CSP relaxation merged; both dev + prod builds hydrate `/design` correctly and unlock Continue for warn/good variants. Full `npm run verify` green.

- 2025-10-26: Follow-up review removed the legacy `NEXT_PUBLIC_E2E_MODE` CSP bypass branch to ensure playwright and preview builds always exercise the production headers.

**Sprint Goal:** Establish a reliable build -> preview -> test loop so every feature increment can be exercised in Vercel previews and shared with testers before production deploys.

**Outcome Summary (2025-10-26):** Sprint 1 completed with the design ? checkout ? thank-you loop running in preview, `npm run verify` automated, and self-test checklist entries captured. Guardrail UX remains a stub pending EDM access and moves to Sprint 2.

### Sprint 2 - Redirect & EDM Integration *(Nov 22 - Dec 5, 2025)*

| Task | Owner | Status | Notes / Next Step |

| --- | --- | --- | --- |

| Add `/` ? `/design` redirect and document Squarespace handoff | AI | DONE | 2025-11-22: Middleware now issues 307 redirect to `/design`, Playwright + docs updated. |

| Replace guardrail stub with EDM iframe nonce flow | AI | IN PROGRESS | 2025-10-28: Added Printful-backed `/api/edm/nonce` and iframe loader behind `USE_EDM=true`; awaiting live-token QA before enabling by default. 2025-10-29: `npm run verify` (unit/integration/e2e + MCP) passing locally; TODO flip `NEXT_PUBLIC_USE_EDM` in staging after Printful sign-off. 2025-10-29: Patched EDM script bootstrap to guard null `readyState`, added slow-load hint and offline banner so previews degrade gracefully when Printful is unreachable. 2025-10-30: Updated CSP + nonce route to handle Printful v2 response shape; confirmed dev token with `product_templates/write` scope returns valid nonce. |

| Sprint02-Task21 ? Segment env promotion & runbook sync | AI | DONE | 2025-11-06: Added the Vercel CLI promotion checklist + verification steps to `docs_new/MCP_Credentials.md` and `docs_new/DEPLOYMENT_GUIDE.md`; pending Ethan running `vercel env add` + debugger screenshots with real secrets. |

| Run Printful sandbox order end-to-end using saved template | AI + Ethan | NOT STARTED | Validate variant mapping and webhook payloads; record in `docs/PRINTFUL_CATALOG.md` and Sprint log. |

| Refine `/design` UX messaging per self-test feedback | Design/AI | NOT STARTED | Consolidate guardrail messaging and polish layout once EDM renders. |

| Audit design tokens & responsive assets from new CX docs | AI + Design | NOT STARTED | Confirm `docs/Responsive_Blueprint.md`, Stripe button lockup, and animation specs are wired into tickets before lg+/desktop work. |

- 2025-10-27: Added thank-you handoff token (query param + sessionStorage rehydrate) so the design summary survives Stripe-style redirects; `npm run verify` re-ran successfully on 2025-10-27 with Stripe MCP configured.

### Sprint 3 - EDM-first MVP Polish *(Dec 6 - Dec 20, 2025)*

| Task | Owner | Status | Notes / Next Step |
| --- | --- | --- | --- |
| Sprint03-Task26 ? `/design` rebuild (EDM owns picker) | AI | DONE | `/design` now ships the full-width EDM embed with Printful owning variant selection, the helper pill + CTA stack, and archived Fabric/guardrail components moved under `src/components/editor/archive/`. Playwright spec updated to drive Printful states directly. |
| Sprint03-Task27 ? Variant sync + CTA gating | AI | DONE | CTA now unlocks only when Printful reports `designValid=true`, the iframe?s variant/template persist into `saveDesignContext`, and Continue pushes users into `/checkout`; telemetry evidence is the next follow-up. |
| Sprint03-Task28 ? Telemetry QA evidence | PM/AI | DONE | Preview env now runs with `NEXT_PUBLIC_SEGMENT_PREVIEW_ONLY=0`, deployment `https://snapcase-7yx0mxnud-snapcase.vercel.app` backs `https://dev.snapcase.ai`, and `Images/diagnostics/analytics-live-2025-11-07T23-25-06-362Z.{json,png}` captures the live Segment debugger proof (`api.segment.io/v1/{m,t}` plus `thank_you_viewed`). |
| Sprint03-Task29 ? Sponsor walkthrough rerun | PM | PLANNED | Once the new `/design` page deploys, re-run the sponsor script (`docs/UserTesting/Sprint02_Sponsor_Script.md`) and log findings; this becomes the go/no-go for the MVP pivot. |
| Sprint03-Task30 ? Checkout/thank-you responsive polish | AI | PLANNED | Ensure `/checkout` and `/thank-you` layouts remain delightful on desktop/mobile after the new `/design` flow feeds them; fix any copy analytics regressions spotted during sponsor testing. |
| Sprint03-Task34 ? Segment telemetry QA & prod promotion | AI | DONE | Preview slug `https://snapcase-c2kwdcslf-snapcase.vercel.app` passed the Segment stub checklist, `scripts/capture-segment-telemetry.js` produced `segment-task34-2025-11-10*.{json,png}`, production env was flipped to `previewOnly=0`, and deployment `https://snapcase-esy2kc62z-snapcase.vercel.app` now feeds `snapcase-app.vercel.app` with live `api.segment.io/v1/{p,t}` traffic. |

**Sprint 3 Goal:** Deliver a clean EDM-first design-to-order flow that a non-technical reviewer can complete end-to-end, with analytics evidence and sponsor-ready documentation.

### Sprint 1 - Design Flow v1 *(Nov 8 - Nov 21, 2025)*

| Task | Owner | Status | Notes / Next Step |

| --- | --- | --- | --- |

| Align `/design` device picker UX with storyboard scenes 1-3 (copy, pricing, analytics event) | AI | DONE | Catalog module powers the picker, Tailwind styling matches storyboard, and placeholder analytics logs `select_device`. |

| Implement EDM/Fabric guardrails (safe-area overlay, DPI warnings, template persistence) | AI | CARRY FORWARD | Guardrail state + session persistence stubbed with tests; awaiting live Printful metrics and EDM access to replace stub UI. |

| Wire Stripe cancel/resume loop with persisted design context | AI | DONE | Mock Stripe flow preserves session context, displays cancel/resume messaging, and thank-you summary mirrors storyboard scenes 9-10. |

| Extend Playwright spec to cover guardrail + cancel/resume behaviors | AI | DONE | Spec now drives the live design?checkout?thank-you flow with data-testid hooks, covering guardrail block/warn bands, cancel/resume banner, and thank-you context clear. |

| Prepare Sprint 1 self-test script and feedback log template | Ethan | DONE | Added `docs/SELF_TEST_CHECKLIST.md` with step-by-step flow + session log template. |

**Sprint Goal:** Deliver a preview-ready design ? checkout flow matching storyboard scenes 1-10 that can be exercised in moderated user tests.

### EDM Integration Work Plan

- Verify Printful store catalog metadata (external IDs, thumbnails) so live APIs stay in sync with fallback data.

- Continue Fabric.js fallback work: device picker, safe-area overlay, DPI validation, and local draft persistence.

- Implement Vercel KV order tracking plus Stripe/Printful webhook idempotency using sandbox payloads.

- Expand automated checks (e.g., `npm run verify:mcp`, Jest/Playwright stubs) to keep regressions visible.

### Latest Updates
  - 2025-12-15: CX/UX plan for sponsor feedback (design/checkout/thank-you) captured; annotated screenshots and wireframes at `Images/diagnostics/2025-12-15T18-07-53-204Z-*`; see `docs/AgentReports/Sprint03-Task62-ux-plan.md`.
 
  - 2025-12-14: Catalog refreshed with iPhone 16/17 entries (Printful 683) and Samsung S24 mappings pointing at Printful product 684 + glossy catalog variant IDs; Google Pixel snap cases still missing from the Printful catalog/store APIs.
  - 2025-11-06: Added `src/lib/printful/templates.ts` plus `GET /api/edm/templates/{externalProductId}` to surface `{ exists, templateId, printfulProductId }` ahead of EDM launch. New integration coverage lives in `tests/integration/edm-template-status-route.test.ts`; validated locally via `npx jest --runInBand tests/integration/edm-template-status-route.test.ts`. Docs updated with the ?Template probe API? subsection.
  - 2025-11-04: Printful Snap Case catalog map landed in `src/data/printful-catalog.ts:1-75` (+ Jest guard `tests/unit/printful-catalog.test.ts:1-26`). Commands: `curl https://api.printful.com/products/683`, `curl https://api.printful.com/products/684`, and a one-off `python3` filter to list variant labels. Endpoints verified: `GET /products/683`, `GET /products/684`. Output informs EDM create-mode + PROGRESS log per docs/Printful_EDM_InvalidOrigin.md.
  - 2025-10-24: `/api/catalog/phones` now queries Printful via the shared client and falls back to curated fixtures when live data is missing.

  - 2025-10-24: Printful EDM token regenerated for the Snapcase API store (V2); secrets stored locally and on Vercel.

  - 2025-10-24: Upgraded Stripe webhook endpoint to verify signatures and log key events while we stage downstream automation.

  - 2025-10-24: Documented MCP usage patterns so future agents know when to lean on GitHub, Vercel, and Stripe servers.

  - 2025-10-24: Wired `/api/checkout` to Stripe (with mock fallback), gated express shipping via feature flag, and added global security headers/CSP in Next.js.

  - 2025-10-24: Standardized the checkout route on `/api/checkout`, promoted EDM integration requirements into the PRD, and published the EDM storyboard companion doc for coding agents.

- 2025-10-23: Documented MCP credential workflow and added `npm run verify:mcp` to validate GitHub/Vercel/Stripe MCP servers.

- 2025-10-22: Fabric.js fallback editor foundation implemented (image upload, safe-area overlay, export pipeline).

- 2025-10-22: Added Zod validation and request size limits to /api/edm/nonce; added query filters with validation to /api/catalog/phones.

- 2025-10-22: Verified `snapcase-app` as the sole Vercel project, removed duplicate slugs, and confirmed `main` branch auto-deploys after cleanup.

- 2025-10-21: Vercel preview deployment succeeded after converting Next.js config to next.config.mjs and swapping to Inter/Roboto Mono fonts to unblock builds.

- 2025-10-21: Added .env.example, editor scaffolding (/design, /checkout, /thank-you), and refreshed landing copy to align with MVP milestones.

- 2025-10-21: Implemented /api/catalog/phones + /api/edm/nonce with mock fallbacks and hooked the design editor to consume them, persisting state into checkout stub.

### [Notes] Documentation Status

- **Last Updated**: October 24, 2025

- **Next Review**: Daily (as part of sprint discipline)

- **Current Status**: Up to date with latest changes

- **Pending Updates**: Monitor MCP automation adoption and update guides as new servers come online.

## [Metrics] Milestone Progress

### [Done] Completed Milestones

#### M0: Repository & Infrastructure Setup

- [x] GitHub repository created and configured

- [x] README.md with comprehensive documentation

- [x] PROGRESS.md for tracking development

- [x] Basic project structure established

- [x] Next.js 14 project scaffolded ([Done] Already exists)

- [x] Vercel deployment configured (preview build successful on Vercel)

- [ ] Custom domain (app.snapcase.ai) setup

#### Documentation & Planning

- [x] Business context documented

- [x] Technical prototype specification completed

- [x] UX/CX guidelines established

- [x] Development progress tracking system implemented

### [In Progress] In Progress

#### M1: Design Editor Implementation (Days 2-3)

- [ ] Printful EDM integration setup

- [ ] Fallback Fabric.js editor implementation

- [ ] Device picker component

- [ ] Safe area overlay system

- [ ] DPI validation and warnings

## [Team] Accountability Matrix

### **Ethan's Tasks (Product Owner)**

- [ ] **Printful Account**: Create account, request EDM access, get API tokens

- [ ] **Stripe Account**: Create account, configure webhooks, get API keys

- [ ] **Vercel Account**: Create account, connect GitHub, configure environment

- [ ] **Domain Setup**: Configure app.snapcase.ai DNS (CNAME to Vercel)

- [ ] **Content**: Provide final copy, logo, pricing, legal policies

### **AI Assistant Tasks (Technical Lead)**

- [ ] **Next.js Enhancement**: Improve project structure, add missing dependencies

- [ ] **Design System Implementation**: Implement design system matching SnapCase.ai homepage

- [ ] **API Routes**: Implement all API endpoints (EDM, checkout, orders, webhooks)

- [ ] **UI Components**: Build device picker, checkout flow, order tracking

- [ ] **Design Editor**: Implement EDM integration + Fabric.js fallback

- [ ] **Testing**: Set up testing framework and implement test suite

## [Notes] Definition of Done (Sprint Requirements)

### **Every Sprint Must Include:**

- [ ] **Code Complete**: All planned features implemented and tested

- [ ] **Documentation Updated**: PROGRESS.md reflects current status

- [ ] **Progress Logged**: Completed tasks marked with [Done] and timestamps

- [ ] **Blockers Documented**: Any new blockers added to current blockers section

- [ ] **Next Actions Updated**: Next 3 actions reflect current priorities

- [ ] **Technical Docs Updated**: API docs, architecture docs updated if changed

- [ ] **Testing Complete**: All tests passing, new tests added for new features

- [ ] **Deployment Ready**: Code deployed to staging/preview environment

### **Documentation Discipline:**

- **Daily**: Update PROGRESS.md with completed tasks and blockers

- **Sprint End**: Full documentation review and update

- **Before Merge**: Ensure all relevant docs are current

- **After Deployment**: Update deployment status and any configuration changes

### [Checklist] Documentation Checklist (Every Sprint)

- [ ] **PROGRESS.md Updated**: Current status, completed tasks, new blockers

- [ ] **Technical Docs Current**: Architecture, API, deployment docs updated if changed

- [ ] **Progress Logged**: All completed tasks marked with [Done] and timestamps

- [ ] **Next Actions Updated**: Next 3 actions reflect current priorities

- [ ] **Blockers Documented**: Any new blockers added to current blockers section

- [ ] **Testing Docs Updated**: Test strategy and results documented

- [ ] **Deployment Status**: Current deployment status and any changes noted

### [Alert] Documentation is NOT Optional

**Every sprint MUST include documentation updates. No exceptions.**

- Documentation is part of the Definition of Done

- Incomplete documentation = incomplete sprint

- Use the Sprint Update Template for consistency

- AI agents depend on current documentation for context

### [Checklist] Upcoming Milestones

#### M2: Payment Integration (Days 3-4)

- [ ] Stripe Checkout implementation

- [ ] Payment flow testing

- [ ] Error handling for payment failures

- [ ] Receipt and confirmation system

#### M3: Order Fulfillment (Days 4-5)

- [ ] Printful order creation API

- [ ] Webhook integration for status updates

- [ ] Order tracking system

- [ ] Fulfillment error handling

#### M4: Polish & Launch (Days 6-7)

- [ ] Accessibility audit (WCAG AA compliance)

- [ ] Performance optimization (Lighthouse >=90)

- [ ] Security review

- [ ] Production deployment

- [ ] Go-live checklist completion

## [Growth] Success Metrics & KPIs

### Target Metrics

- **Conversion Rate**: >=4% (editor start -> purchase)

- **Average Order Value**: $35-$45

- **Reprint/Defect Rate**: <2%

- **30-day Repeat Rate**: >=10%

- **Performance Score**: Lighthouse >=90

- **Uptime**: 99.9%

### Current Performance

- **Conversion Rate**: TBD (not yet measured)

- **Average Order Value**: TBD

- **Performance Score**: TBD

- **Uptime**: TBD

## [Cycle] Development Backlog

### High Priority

1. **Core Application Setup**

   - Next.js 14 project initialization

   - TypeScript configuration

   - Tailwind CSS + shadcn/ui setup

   - Environment configuration

2. **Design Editor**

   - Printful EDM integration

   - Fallback editor with Fabric.js

   - Device catalog integration

   - Image upload and processing

3. **Payment System**

   - Stripe Checkout integration

   - Payment success/failure handling

   - Order confirmation system

### Medium Priority

4. **Order Management**

   - Printful API integration

   - Webhook handling

   - Order status tracking

   - Email notifications

5. **User Experience**

   - Mobile responsiveness

   - Loading states and error handling

   - Accessibility improvements

   - Performance optimization

### Low Priority

6. **Advanced Features**

   - User accounts and profiles

   - Design templates and galleries

   - Referral system

   - Analytics and reporting

## [Warning] Risks & Issues

### High Risk Items

#### Technical Risks

- **EDM Access Delayed**: Printful EDM may not be immediately available

  - **Mitigation**: Fallback Fabric.js editor implemented

  - **Status**: Monitoring Printful EDM access

  - **Owner**: Development Team

- **API Integration Complexity**: Stripe and Printful webhook reliability

  - **Mitigation**: Comprehensive error handling and retry logic

  - **Status**: Under development

  - **Owner**: Development Team

#### Business Risks

- **Quality Control**: Print quality variance across orders

  - **Mitigation**: Sample orders, supplier vetting, defect reprint policy

  - **Status**: Pending supplier evaluation

  - **Owner**: Ethan Trifari

- **Trademark Issues**: "Snapcase" name clearance

  - **Mitigation**: Legal review, backup trademark options

  - **Status**: In progress

  - **Owner**: Legal Advisor

### Medium Risk Items

- **Performance Under Load**: Vercel serverless function limits

  - **Mitigation**: Performance monitoring, optimization

  - **Status**: Monitoring

- **Mobile UX**: Touch interface optimization

  - **Mitigation**: Extensive mobile testing

  - **Status**: Pending

### Low Risk Items

- **Third-party Dependencies**: External service reliability

  - **Mitigation**: Service monitoring, fallback options

  - **Status**: Monitoring

## [Bug] Known Issues

### Critical Issues

- None currently identified

### High Priority Issues

- None currently identified

### Medium Priority Issues

- None currently identified

### Low Priority Issues

- None currently identified

## [Tools] Technical Debt

### Code Quality

- [ ] Implement comprehensive error boundaries

- [ ] Add unit tests for critical functions

- [ ] Set up automated testing pipeline

- [ ] Implement proper logging system

### Performance

- [ ] Optimize image loading and processing

- [ ] Implement caching strategies

- [ ] Bundle size optimization

- [ ] CDN configuration

### Security

- [ ] Implement rate limiting

- [ ] Add input sanitization

- [ ] Security headers configuration

- [ ] Regular dependency updates

## [Metrics] Development Velocity

### Recent Sprints

- **Sprint 1** (Week 1): Project setup and documentation

- **Sprint 2** (Week 2): Core application development (planned)

### Team Capacity

- **Development**: 1 AI Assistant (Full-time equivalent)

- **Product**: Ethan Trifari (Part-time)

- **Design**: AI + Ethan collaboration

- **QA**: Manual testing by team

## Next Actions

### Immediate (This Week)

1. Begin EDM nonce handshake spike, capturing guardrail expectations and iframe notes in `PROGRESS.md`.

2. Inventory CX/UX follow-ups (Stripe button asset, animation specs, desktop mockups) and spin tickets aligned to `docs/Responsive_Blueprint.md`.

3. Schedule Printful sandbox order dry run and document webhook expectations ahead of Sprint 2 delivery.

### Short Term (Next 2 Weeks)

1. Complete EDM handshake and migrate guardrail UI into the iframe.

2. Execute Printful order dry run; document webhook mappings and timelines.

3. Polish `/design` layout and copy per Sprint 1 self-test feedback.

4. Plan `/order/[id]` status timeline scaffold leveraging webhook outputs.

5. Align ESLint config to unblock `npm run lint`.

### Medium Term (Next Month)

1. Ship Fabric.js fallback parity (if EDM remains gated) with safe-area + export tooling.

2. Instrument analytics and error monitoring across the funnel.

3. Advance checkout polish (shipping options, copy refinement, cancel/resume UX).

4. Coordinate marketing integrations and launch content.

## [Communication] Communication & Updates

### Daily Standups

- **Format**: Async updates via this document

- **Participants**: Development team, Product owner

- **Focus**: Progress, blockers, next steps

### Weekly Reviews

- **Format**: Progress assessment and planning

- **Participants**: Full team

- **Deliverables**: Updated progress, risk assessment, next week planning

### Monthly Retrospectives

- **Format**: Process improvement discussion

- **Focus**: What worked, what didn't, process improvements

## [Resources] Resources & References

### Documentation

- [Business Context](./docs/BusinessContext.Md)

- [Technical Prototype](./docs/SnapCase_App_Prototype.MD)

- [UX/CX Guidelines](./docs/UXCX_Guidelines.MD)

- [Design System](./docs/DESIGN_SYSTEM.md)

- [Visual Consistency Guide](./docs/VISUAL_CONSISTENCY_GUIDE.md)

- [Responsive Blueprint](./docs/Responsive_Blueprint.md)

- [Design Implementation Guide](./docs/DESIGN_IMPLEMENTATION_GUIDE.md)

- [EDM Storyboard](./docs/Storyboard_EDM.md)

- [MCP Credentials](./docs/MCP_Credentials.md)

- [Account Setup Guide](./docs/ACCOUNT_SETUP_GUIDE.md)

- [Sprint Update Template](./docs/SPRINT_UPDATE_TEMPLATE.md)

- [Documentation Reminder](./docs/DOCUMENTATION_REMINDER.md)

### External Resources

- [Printful API Documentation](https://developers.printful.com/)

- [Stripe Documentation](https://stripe.com/docs)

- [Next.js Documentation](https://nextjs.org/docs)

- [Vercel Documentation](https://vercel.com/docs)

### Tools & Services

- **Development**: Cursor AI, GitHub, Vercel

- **Marketing Site**: Squarespace (snapcase.ai)

- **App Hosting**: Vercel (app.snapcase.ai)

- **Payments**: Stripe

- **Fulfillment**: Printful

- **Analytics**: TBD

- **Monitoring**: Vercel Analytics

---

**Last Updated**: December 15, 2025

**Next Review**: Weekly

**Document Owner**: Ethan Trifari
