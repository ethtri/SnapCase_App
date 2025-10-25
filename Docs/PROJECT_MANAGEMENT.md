# Project Management Playbook - SnapCase

**Owner:** Ethan Trifari  
**Last Updated:** October 24, 2025  

This playbook defines how we plan, document, and collaborate with AI coding agents so work stays small, reviewable, and aligned with the SnapCase storyboard.

---

## 1. Task Definition
- Scope each prompt to **one clear outcome** that can be completed in under 30 minutes. Split multi-step efforts (e.g., add Jest scaffolding *then* add Playwright tests) into consecutive prompts.
- Reference the **source of truth documents** (`PROGRESS.md`, `Docs/Storyboard_EDM.md`, `Docs/PRINTFUL_CATALOG.md`, etc.) inside the prompt so agents pull context, not assumptions.
- Explicitly list **what must not change** (e.g., "Do not modify package versions" or "Avoid updating production routes").
- Request **status updates** at the end of the run (tests executed, files touched) rather than raw logs.

## 2. Change Control Expectations
- Agents must use existing conventions: Tailwind styling, TypeScript, shadcn/ui, and the documentation tone defined in `Docs/DESIGN_SYSTEM.md` and `Docs/UXCX_Guidelines.MD`.
- Every change needs a home in documentation:
  - Update `PROGRESS.md` (Sprint Log) when tasks start/finish.
  - Add or amend specs in `Docs/SnapCase_App_Prototype.MD` or related references for new behaviour.
  - Record secrets or credentials updates in `Docs/MCP_Credentials.md`.
- Avoid touching unrelated files. If defaults or templates are generated automatically, review before committing.
- Run the relevant test command(s) and summarize pass/fail (no full log dumps). If tests can't run, note why and flag the blocker.

## 3. Prompt Writing Template
```
Context:
- Repo root, key docs to read, current sprint goal.
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
- **Timebox every run:** structure prompts so an agent can finish in 20 minutes or less. If a run exceeds 20 minutes with no result, stop it, review the partial diff, and rescope before retrying.
- **One deliverable per prompt:** avoid bundling config changes, test rewrites, and docs in one run. Sequence them (e.g., “add data-testid attributes” then “extend Playwright spec”).
- **Known friction first:** call out required cleanup upfront. For Playwright on Windows/OneDrive, instruct the agent to delete the `.next` directory before launching the web server and to stop on the first `EBUSY` file-lock error instead of retrying endlessly.
- **No stubbing real pages:** when testing flows, interact with the actual Next.js pages. Do not allow agents to inject standalone HTML/JS stubs that diverge from the app.
- **Force a plan:** ask agents to print a brief plan before editing (`_plan`), so we can confirm scope before actions begin.
- **Clean exits on failure:** require agents to halt and report if key commands (build, tests, deployments) fail after one retry; we’ll decide how to proceed instead of letting them loop.

## 4. Review & Merge Process
1. **Diff Review:** Inspect `git status` and `git diff` after each agent run. If changes exceed scope, stop and decide whether to keep or revert before continuing.
2. **Testing Confirmation:** Ensure `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`, and `npm run verify:mcp` (when relevant) succeed before merging.
3. **Story Alignment:** Cross-check new UI/API behaviour against storyboard scenes (`Docs/Storyboard_EDM.md`) to confirm acceptance criteria.
4. **Documentation Sync:** Confirm README, PROGRESS.md, and sprint plans reflect the new state before approving a merge.

## 5. Issue Escalation
- If an agent introduces unexpected breadth, **stop immediately** and record the state in `PROGRESS.md` under "Blockers".
- Re-run with a tighter prompt or manually adjust the changes; never push ahead with unclear diffs.
- Log any repeatable friction (tooling gaps, missing docs) so we can update this playbook.

## 6. User Testing Cadence
- Maintain the sprint plan in `PROGRESS.md` and note preview URLs for each midpoint + end-of-sprint drop.
- For each sprint, prepare a short test script referencing the storyboard scenes covered.
- Capture findings in a shared doc or the Sprint Log and translate into backlog items.

---

**Reminder:** When in doubt, slow down, tighten the scope, and surface questions early. This playbook keeps our velocity high without sacrificing control. Update it whenever our process evolves. 
