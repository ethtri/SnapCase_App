# Project Management Playbook - SnapCase

**Owner:** Ethan Trifari  
**Last Updated:** October 24, 2025  

This playbook defines how we plan, document, and collaborate with AI coding agents so work stays small, reviewable, and aligned with the SnapCase storyboard.

---

### Process Update – November 7, 2025
- Timebox each prompt to **45 minutes** instead of 30; alert the PM sooner if new blockers appear so we can rescope before the window is exhausted.
- Multi-step prompts are allowed when steps are interdependent (e.g., schema change → API handler) and remain tied to one Task ID. List the sub-steps in the `_plan` before editing so reviewers can confirm scope.
- Documentation can be **batched per feature**—roll up the Blueprint, UX, and prototype edits in one pass—as long as `PROGRESS.md` and the AgentReport cite every touched source-of-truth document.
- Task ID logging, AgentReports, and source-of-truth references stay mandatory; this update simply right-sizes the guardrails so flow is not blocked by excessive prompt slicing.

### Documentation Layout – November 6, 2025
- `docs/` (all lowercase) is the single documentation root; do not recreate `Docs/` or mix casing in new commits.
- Use the existing subfolders: `docs/AgentReports/` (per-task evidence), `docs/Engineering/` (architecture supplements), and `docs/UserTesting/` (scripts + checklists). New specs should sit beside the closest existing reference instead of spawning parallel trees.
- Asset references (screenshots, JSON captures) stay under `Images/diagnostics/` because AgentReports cite those exact paths—link to them rather than duplicating blobs inside `docs/`.
- When logging work in `PROGRESS.md`, always cite the lowercase `docs/...` path so WSL + Windows contributors share the same filename casing.

### Git Workflow - November 8, 2025
- **Branch per task:** Before editing, create (or reuse) a branch named `task/SprintNN-TaskXX-<slug>` so each prompt's diff stays isolated. Do not stack multiple tasks on `main`.
- **Workspace standard:** Operate from `C:\Repos\SnapCase_App` (outside OneDrive). If the path differs, stop and relocate the worktree before editing.
- **Hard clean-tree gate:** Start only when `git status` is clean and no other worktree is dirty. If dirty: (1) restore any `Snapcase-Flow-Mockups/*` deletions from `origin/main`; (2) delete or stash stray diagnostics/unrelated files; (3) rerun `git status` and proceed only when clean. Halt if a merge/rebase is in progress.
- **Protect mock assets:** Treat `Snapcase-Flow-Mockups/*` as read-only references. Do not delete or move files there; if `git status` shows changes/deletions, restore them from `origin/main` before editing any code or docs.
- **Diagnostics hygiene:** Keep only the final relevant captures. Commit the last set to `Images/diagnostics/` or clean them before exit so the tree stays tidy.
- **Worktree & lint discipline:** One worktree per task, max 3. Run `git worktree list` + `git status` before/after prompts; stop if another worktree is dirty. Copy `.vercel` from the main worktree if missing, run `vercel whoami`, and pull lint config from `origin/main` (never generate a new one).
- **CI gate:** GitHub Actions runs `npm run lint` and `npm run build` on pushes and pull requests; no deploy occurs. Treat CI green as a required gate before merge.
- **Stash + handoff:** Name stashes `git stash push -m "<TaskID> context"` and log them in `PROGRESS.md`; never drop or edit others' stashes. At handoff, either commit/push the task branch or stash with the Task ID - never leave a dirty tree.
- **Dev alias guard:** Only promote `dev.snapcase.ai` from `main` or a sponsor-approved branch. Use `docs/Deployment/Alias_Runbook.md` and `node scripts/alias-dev.mjs` (dry-run allowed) to capture rollback + compare/PR URLs; do not bypass lint/build or the baseline check.
- **Active prompt cap:** Limit concurrent engineering prompts to **two**. Start a third only after one branch has been merged, pushed for review, or stashed. The PM should track active branches in `PROGRESS.md`.
- **Prompt boilerplate:** Include the preflight checklist (clean tree, correct branch, mock protection, diagnostics hygiene) in every engineering prompt so reviewers can confirm gates were applied.

### Prompt Pipeline Tracker – November 8, 2025
- **Single source:** `docs/TaskPipeline.md` lists every scoped prompt with links to required specs, branch names, and the exact phrase sponsors can use to start the agent. Keep it updated whenever tasks finish or new ones queue.
- **Sponsor workflow:** PM call-to-actions reference Task IDs only (e.g., “Run Sprint02-Task15 + Sprint02-Task22B”). Agents know to open the tracker for full instructions, so sponsors don’t have to copy long prompts between chats.
- **Lifecycle:** Move entries from the “Active Prompts” table to “Archive” once their AgentReport is merged, and ensure `PROGRESS.md` reflects the completion so audit trails stay intact.

#### Git MCP Automation (Sprint02-Task25 – November 8, 2025)
- **Script:** `node scripts/mcp-branch.mjs <TaskID> [summary]` shells into the GitHub MCP (`@modelcontextprotocol/server-github`) with the local `GITHUB_PAT` and performs the full workflow: `create_branch` from `main`, serialize either staged changes, working tree files, or a supplied patch, `push_files`, and (optionally) `create_pull_request`.
- **Inputs:** `GITHUB_PAT`/`GITHUB_PERSONAL_ACCESS_TOKEN` must be in the environment, the repo needs a clean `main`, and agents choose their file source via `--source staged|working` or `--apply patch.diff`. The script refuses deletes/renames because GitHub’s current MCP endpoint cannot remove blobs—split those into manual follow-ups until the server adds support.
- **Standard commit message:** `${TaskID}: <summary> [MCP]`. Override with `--message` only when the PM requests a different phrasing.
- **Optional PR creation:** Pass `--create-pr [--pr-title ... --pr-body ... --pr-draft]` to open a draft directly from the script. Otherwise, use the printed compare URL (`https://github.com/<owner>/<repo>/compare/main...task/...`) to open the PR manually.
- **Failure handling:** Missing credentials, existing branches, or GitHub API validation errors are surfaced directly in the CLI and should be copied into the Agent Report + prompt. Use `--dry-run` whenever you only need a file list/log.

**Quickstart checklist (“call scripts/mcp-branch.sh …” prompts)**
1. `git status` → ensure only the target task’s files are staged/dirty.
2. `node scripts/mcp-branch.mjs Sprint02-TaskNN-TaskXX "<one-line summary>" --dry-run --source staged` to capture the plan in the Agent Report.
3. Run the same command without `--dry-run` (add `--create-pr` if the branch should land with a draft).
4. Paste the printed branch/compare (or PR) URL into `PROGRESS.md` + the sprint Agent Report before closing the run.

## 1. Task Definition
- Default to **one clear outcome**, but permit tightly-coupled sub-steps when they share dependencies or deliverables. Keep the `_plan` explicit so reviewers can validate the sequence before changes land.
- Timebox work to **45 minutes**; if the plan will exceed that window, surface a rescope or follow-up prompt before continuing.
- Reference the **source of truth documents** (`PROGRESS.md`, `docs/Storyboard_EDM.md`, `docs/PRINTFUL_CATALOG.md`, etc.) inside the prompt so agents pull context, not assumptions.
- Explicitly list **what must not change** (e.g., "Do not modify package versions" or "Avoid updating production routes").
- Request **status updates** at the end of the run (tests executed, files touched) rather than raw logs.

## 2. Change Control Expectations
- Agents must use existing conventions: Tailwind styling, TypeScript, shadcn/ui, and the documentation tone defined in `docs/DESIGN_SYSTEM.md` and `docs/UXCX_Guidelines.MD`.
- Every change needs a home in documentation:
  - Update `PROGRESS.md` (Sprint Log) when tasks start/finish; batching is fine if you summarize all related edits under the feature’s Task ID.
  - Add or amend specs in `docs/SnapCase_App_Prototype.MD` or related references for new behaviour, grouping multiple doc tweaks into one pass when they belong to the same flow.
  - Record secrets or credentials updates in `docs/MCP_Credentials.md`.
- Avoid touching unrelated files. If defaults or templates are generated automatically, review before committing.
- Run the relevant test command(s) and summarize pass/fail (no full log dumps). If tests can't run, note why and flag the blocker.

## 3. Prompt Writing Template
```
Context:
- Repo root, key docs to read, current sprint goal.
- Agent role: state the domain and level (e.g., Senior UX Engineer, Senior Frontend Engineer).
- Known constraints (feature flags, mock services, testing scope).

Objective:
1. Primary deliverable
2. Secondary deliverable (optional, still in scope)

Constraints / Do Not:
- Forbidden changes (dependencies, deployment secrets, etc.)
- Keep diffs minimal; use existing design tokens/components.

Deliverables:
- Files to update.
- Tests to run and report.
- Documentation updates required.
```

## 4. Prompt Guardrails & Timeboxing
- **Timebox every run:** structure prompts so an agent can finish in 45 minutes or less. If a run approaches the limit without clear progress, stop it, capture the partial diff, and rescope before retrying.
- **Bundled deliverables:** keep prompts lean, but allow multi-step work when dependencies make separate prompts inefficient (e.g., schema update + migration + API handler). Call out each sub-step in the `_plan`, and stop if new scope creeps in.
- **Known friction first:** call out required cleanup upfront. For Playwright on Windows/OneDrive, instruct the agent to delete the `.next` directory before launching the web server and to stop on the first `EBUSY` file-lock error instead of retrying endlessly.
- Playwright harness now shells through `node scripts/run-playwright-server.mjs` (see `playwright.config.ts`), which deletes `.next`, performs `next build`, and then boots `next start` for parity with production. Always let this script manage the server when running `npx playwright test` so stale dev artifacts never leak into production-mode checks.
- **No stubbing real pages:** when testing flows, interact with the actual Next.js pages. Do not allow agents to inject standalone HTML/JS stubs that diverge from the app.
- **Force a plan:** ask agents to print a brief plan before editing (`_plan`), so we can confirm scope before actions begin.
- **Clean exits on failure:** require agents to halt and report if key commands (build, tests, deployments) fail after one retry; we’ll decide how to proceed instead of letting them loop.

## 5. Review & Merge Process
1. **Diff Review:** Inspect `git status` and `git diff` after each agent run. If changes exceed scope, stop and decide whether to keep or revert before continuing.
2. **Testing Confirmation:** Ensure `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`, and `npm run verify:mcp` (when relevant) succeed before merging.
3. **Story Alignment:** Cross-check new UI/API behaviour against storyboard scenes (`docs/Storyboard_EDM.md`) to confirm acceptance criteria.
4. **Documentation Sync:** Confirm README, PROGRESS.md, and sprint plans reflect the new state before approving a merge.

## 6. Issue Escalation
- If an agent introduces unexpected breadth, **stop immediately** and record the state in `PROGRESS.md` under "Blockers".
- Re-run with a tighter prompt or manually adjust the changes; never push ahead with unclear diffs.
- Log any repeatable friction (tooling gaps, missing docs) so we can update this playbook.

## 7. User Testing Cadence
- Maintain the sprint plan in `PROGRESS.md` and note preview URLs for each midpoint + end-of-sprint drop.
- For each sprint, prepare a short test script referencing the storyboard scenes covered.
- Capture findings in a shared doc or the Sprint Log and translate into backlog items.
- When Squarespace (snapcase.ai) drives the funnel, keep the Next.js app focused on Scene 1 onward. `/` should redirect to `/design` so users land directly in the storyboard flow; avoid duplicating the marketing hero already handled on Squarespace.

---

## 8. Agent Identification & Reporting Standards
- **Task IDs:** Every prompt must use the `SprintNN-TaskXX` format (e.g., `Sprint02-Task03`) and restate it inside the prompt so the agent references it in logs and doc updates.
- **Agent Reports:** Each agent produces a concise report in `docs/AgentReports/<TaskID>.md` covering scope, key files touched, verification evidence, and open questions. Report templates should mirror the Definition of Done and include direct links to screenshots/diagnostics when used.
- **Progress Logging:** `PROGRESS.md` must gain a dated entry per task with Task ID, outcome, files touched, and remaining follow-ups. This is the canonical sprint log—if it isn’t logged there, it didn’t happen.
- **Doc Citations:** Agents cite exact doc sections/line numbers (or diagnostics filenames) in both their report and code comments when behavior depends on specs.
- **Output Discipline:** Agents summarize command results (tests, lint) rather than dumping logs, and must call out failures immediately with reproduction steps.

## 9. Documentation Lifecycle & Lean Flow
- **Source-of-Truth Index:** Keep `docs/UXCX_Guidelines.MD`’s Source-of-Truth table current whenever specs move or deprecate; cross-link new docs as they appear.
- **Mockup vs Reality:** Update `docs/Responsive_Blueprint.md` any time a mockup delta, screenshot, or Printful limitation changes so engineers are never guessing which artifact is authoritative.
- **Doc Hygiene Tasks:** Schedule regular “doc hygiene” prompts (at least once per sprint) to prune stale content, flag deprecated Fabric-only guidance, and ensure escalation packets match current Printful realities.
- **Lean WIP:** Limit concurrent agent prompts to the minimum needed to maintain flow (typically ≤3 active engineering tasks plus PM oversight). Finish/verify/doc one task before starting another whenever dependencies exist.
- **Plan–Do–Review Loop:** Every agent run should follow the lightweight agile loop—state the plan, execute with small diffs, verify (tests/screenshots), and document learnings. If a run bumps against the 45-minute guardrail or scope grows, stop, log the partial progress in PROGRESS.md, and rescope.

---

### UX Reference Discipline - December 2025
- Keep UX prompts focused on a single bundle: the relevant `Snapcase-Flow-Mockups/...` screen(s) plus the must-do list in `docs/Responsive_Blueprint.md` (Mockup-vs-Reality table). Do not fan out to multiple UX docs unless a blocker requires it; if you add another source, call out why.

### Preflight Snippet (copy/paste into prompts)
- Path: `C:\Repos\SnapCase_App` (no OneDrive); branch `task/SprintNN-TaskXX-<slug>`.
- Stop if `git status` isn't clean. If dirty: restore `Snapcase-Flow-Mockups/*` from `origin/main`, delete or stash stray diagnostics/unrelated files, rerun `git status`.
- Treat `Snapcase-Flow-Mockups/*` as read-only; restore any deletions before editing.
- Run `git worktree list` (max 3) + `git status`; halt if another worktree is dirty or if rebase/merge is in progress.
- Run `npm run preflight` before editing; use `npm run preflight:full` for release or alias work.
- Keep diagnostics tidy: save only the final captures in `Images/diagnostics/` or clean them before exit.

---

## 10. Getting Started Checklist for PM Agents
1. **Read `PROGRESS.md`** — capture the latest dated entry (sprint goal, blockers, running tasks).
2. **Review the Sprint Plan** — within `PROGRESS.md` (“Current Sprint”) plus any linked docs (e.g., Sprint02 prompts).
3. **Open Source-of-Truth Index** — `docs/UXCX_Guidelines.MD` appendix lists every active spec; follow those links for details.
4. **Check blueprint + diagnostics** — skim `docs/Responsive_Blueprint.md` Mockup-vs-Reality table and the newest `Images/diagnostics/` captures.
5. **Confirm active agents** — verify which Task IDs are in-flight via `PROGRESS.md`; avoid issuing overlapping prompts without coordination.

## 11. Sprint Planning & Tracking
- `PROGRESS.md` is the canonical sprint backlog. Update it when:
  - Kickstarting a new sprint (goal, workstreams, dependencies).
  - Issuing or completing a `SprintNN-TaskXX` prompt.
  - Logging blockers, mitigations, or approvals.
- Keep a lightweight burndown by ensuring each PROGRESS entry specifies status (“Planned / In Progress / Complete / Blocked”).
- When closing a sprint, summarize outcomes + retro notes directly in `PROGRESS.md` and link to any external artifacts (screenshots, diagnostics).

## 12. Agent Report Expectations
- **Report Location:** Every task writes to `docs/AgentReports/<TaskID>.md`. Create the folder if missing.
- **Suggested Template:**
  ```
  # <TaskID> – <Task Name>
  ## Scope & Files
  - Summary of work
  - Files touched (with relative paths)

  ## Verification
  - Commands/tests run + result summary
  - Screenshot/log references (Images/diagnostics/*, etc.)

  ## Follow-ups / Questions
  - Pending steps, approvals, or blockers
  ```
- **Linkage:** Reference relevant doc sections (e.g., `docs/Responsive_Blueprint.md:46-53`) and diagnostics assets so future reviewers have context.
- **Cross-Reference:** Add a short pointer in `PROGRESS.md` (“See docs/AgentReports/Sprint02-Task03.md for full details”) to keep the sprint log tidy while preserving deep detail.

---

**Reminder:** When in doubt, slow down, tighten the scope, and surface questions early. This playbook keeps our velocity high without sacrificing control. Update it whenever our process evolves. 

### Completion Gate � November 23, 2025
- A task is not complete unless all are true: (1) an AgentReport for the Task ID exists in `docs/AgentReports/` with artifact paths and decisions; (2) `PROGRESS.md` has an updated entry; (3) required tests are run and their results (pass/fail + rationale) are logged; (4) `git status` is clean on the task branch; (5) `docs/TaskPipeline.md` is updated (move the prompt to Archive when done).
- PM acceptance checklist (apply before marking done): AgentReport present, `PROGRESS.md` updated, tests noted, clean tree, TaskPipeline updated. If any are missing, the task is **not done**.
- Every prompt must repeat the gate: �Do not mark complete unless AgentReport + PROGRESS updated + tests logged + clean tree. Missing any of these = rejected.�
- Use the shared AgentReport template at `docs/AgentReports/TEMPLATE.md` to keep evidence/test results consistent.
- Keep TaskPipeline active rows stable during a wave; do not rewrite active entries mid-run. Add new prompts only after the prior wave is archived.

### Completion Gate � November 23, 2025
- Not done unless all are true: (1) AgentReport for the Task ID exists in `docs/AgentReports/` with artifact paths and decisions; (2) `PROGRESS.md` has an updated entry; (3) required tests are run and results (pass/fail + rationale) are logged; (4) `git status` is clean on the task branch; (5) `docs/TaskPipeline.md` is updated (move prompt to Archive when done).
- PM acceptance checklist (apply before marking done): AgentReport present, `PROGRESS.md` updated, tests noted, clean tree, TaskPipeline updated. Missing any = not done.
- Every prompt must repeat the gate: �Do not mark complete unless AgentReport + PROGRESS updated + tests logged + clean tree. Missing any of these = rejected.�
- Use `docs/AgentReports/TEMPLATE.md` for consistency. Keep TaskPipeline active rows stable during a wave; add/archive only between waves.

### Prompt Standards � November 23, 2025
- Preflight in every prompt: clean `git status`, correct task branch (`task/SprintNN-TaskXX-*`), scope files, required tests, required artifacts (screenshots/JSON).
- Deliverables block: AgentReport file path, PROGRESS update required, tests to run/report, assets to save under `Images/diagnostics/`.
- Completion reminder: restate the completion gate verbatim at the end of the prompt.
- Keep prompts lean: one primary goal, optional secondary only if tightly coupled; avoid extra boilerplate beyond preflight/deliverables/gate.
