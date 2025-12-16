# Sprint04-Workflow-Audit

## Scope
- Task ID: Sprint04-Task11A-workflow-audit-reset
- Objective: Re-audit workflow/version-control discipline, list root causes, guardrails, immediate actions, stash triage, and propose SOP edits for `docs/PROJECT_MANAGEMENT.md`, `docs/TaskPipeline.md`, and `docs/PROMPT_TEMPLATE.md`.

## Findings (root causes)
- Wrong branch/cleanliness drift: Session opened on `task/Sprint04-Task11-audit-sop-rollout` before switching; 23 worktrees (duplicate Task43/45 variants plus a detached HEAD) make wrong-branch edits likely and hide dirt across trees.
- Rebase/merge exposure: No active rebase now, but `main-merge*` worktrees and cross-branch stashes show merges/resets happening outside the primary tree without a documented pause gate; a rebase in any worktree could be missed.
- Missing lint config history: `npm run lint` recently prompted to create a config until Sprint04-Task12 restored `.eslintrc.cjs`, so lint gates were bypassed on `main` for a period and unlinted diffs could have landed.
- Skipped documentation/diagnostics: TaskPipeline shows Sprint04-Task08 active with no AgentReport yet; numerous safety stashes are not recorded in `PROGRESS.md`, so audit trails for partial work and diagnostics are incomplete.
- Uncontrolled stashes: 35 stashes from 2025-10-27 to 2025-12-16 (multiple "rescue", "pre-pull", and WIP stashes on `main` and task branches) with no catalog or owner/intent logged; risk of silent drift or hidden regressions.
- PR/compare gaps: `PROGRESS.md` and TaskPipeline entries lack compare/PR URLs even though the MCP branching script exists, so reviewers cannot confirm branches were pushed or reviewed.

## Guardrails to adopt
- Enforce preflight: Run `git worktree list`, `git status -sb`, and `git stash list --date=iso`; stop if any worktree shows rebase/merge or untracked dirt until resolved or documented.
- Worktree budget: Cap active worktrees at three (main + current sprint + one hotfix). Archive or delete dormant Task43/45/Sprint1 worktrees; no detached HEAD worktrees.
- Stash discipline: No unlogged stashes. All stashes must use `<TaskID> <purpose>` names, be logged in `PROGRESS.md`, and be reviewed within 48 hours; forbid new stashes on `main` except for emergency pre-pull snapshots that are immediately reapplied or cleaned.
- Lint config gate: Add a preflight check for `.eslintrc.cjs` before running `npm run lint`; block prompts that would recreate configs. Keep lint required even for doc-only runs that touch Next.js code.
- Documentation gate: No handoff or branch switch unless the AgentReport and `PROGRESS.md` entry are written (even for aborted/partial runs). Capture and link diagnostics when behavior was exercised.
- PR/compare gate: Push every task branch and record the compare or PR URL in both the AgentReport and `PROGRESS.md`; cite `scripts/mcp-branch.mjs` output.
- AI-enforceable hygiene: Every agent run must start by cleaning up before touching the task. Rules: retire any worktree older than 7 days or not tied to the current branch list; delete detached HEAD worktrees immediately; drop or apply any stash older than 7 days after logging the decision in `PROGRESS.md`. If a worktree or stash is kept, the agent must renew its timestamp in `PROGRESS.md` with a clear reason. No human intervention required.

## Immediate action plan
- Today: Publish this audit and AgentReport; add the PROGRESS entry (owner: AI).
- Within 24 hours: Triage stashes `{0..6}` (safety/pre-pull and Task07 rescues); drop with notes or reapply/merge, logging outcomes in `PROGRESS.md` (owner: Ethan/PM).
- Within 48 hours: Delete or archive redundant worktrees (`SnapCase_App_task43*`, `SnapCase_App_task45*`, `SnapCase_App_task59*`, detached HEAD) after confirming no unique commits; log disposition (owner: PM/engineering lead).
- By next sprint kickoff: Apply the SOP edits below and require compare/PR links in new PROGRESS entries; add a weekly hygiene checklist to close old stashes/worktrees (owner: PM).
- Ongoing enforcement by agents: The first step of every agent prompt is the hygiene sweep above; agents retire stale worktrees/stashes themselves and log actions in `PROGRESS.md` before executing any task steps.

## Stash triage (priority)
- P0 (today): `stash@{0}`/`{1}` safety pre-pull on `main`; `stash@{2}` pre-Task07 rescue (untracked); `{3}-{5}` pre-Task07/08 cleanup on Task06 branch; `{6}-{8}` Task45 pre-merge/WIP.
- P1 (this week): `{9}-{19}` Task43/44/45 safety and temp stashes from 2025-12-08; reconcile with merged branches.
- P2 (next): `{20}-{32}` November Task43/44/45 prep snapshots; likely obsolete--review then drop with a note.
- P3 (cleanup): `{33}-{34}` sprint1-preview WIP from 2025-10-27; confirm obsolete and drop.

## Proposed SOP edits (text to apply)
- `docs/PROJECT_MANAGEMENT.md` additions:
  - Under "Git Workflow": "Cap active worktrees at three (main + current task + one hotfix). Remove or archive any others before starting a prompt; no detached HEAD worktrees."
  - Add "Stash hygiene": "Stashes must be named `<TaskID> <purpose>`, logged in `PROGRESS.md`, and reviewed within 48 hours. Do not leave safety pre-pull stashes on `main` beyond the same day."
- `docs/TaskPipeline.md` preflight additions:
  - "Run `git stash list --date=iso`; if more than five stashes exist or any are older than seven days, pause and triage/log before new work."
  - "Record branch plus compare/PR URL in PROGRESS and the AgentReport before moving a prompt to Archive; use `scripts/mcp-branch.mjs` output when possible."
  - "Block prompts if any worktree shows `rebase/merge in progress`; resolve or escalate before proceeding."
- `docs/PROMPT_TEMPLATE.md` insertions:
  - Add a Preflight checkbox: "`git stash list --date=iso` reviewed; no stale/unlogged stashes; lint config present (`.eslintrc.cjs`)."
  - Add Deliverables fields: "Branch + compare/PR link: ____" and "Stash actions (if any) logged in PROGRESS: ____."
