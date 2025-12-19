# Sprint04-Task25 - process audit

## Scope & Inputs
- Read: `PROGRESS.md`, `docs/PROJECT_MANAGEMENT.md`, `docs/PROMPT_TEMPLATE.md`, `docs/TaskPipeline.md`, `docs/Deployment/Alias_Runbook.md`.
- Reviewed recent AgentReports: `docs/AgentReports/Sprint04-Task22.md`, `docs/AgentReports/Sprint04-Task23.md`, `C:\Repos\SnapCase_App_task24\docs\AgentReports\Sprint04-Task24.md`.
- Inspected worktree state via `git worktree list` and checked the extra clone at `C:\Repos\SnapCase_App` plus the orphaned OneDrive path noted in Task24.

## Findings (root causes)
- **Alias drift & logging gaps:** Current dev alias was moved to `https://snapcase-ikedc1s8f-snapcase.vercel.app` (Sprint04-Task22), but `PROGRESS.md` still lists the prior target `snapcase-hwbcudj5f-…` from Task23 and the header still reads “Last Updated: December 16, 2025”. Alias changes are not being logged in one place on the day they occur, so reviewers can’t tell which preview backs dev without chasing AgentReports.
- **Worktree hygiene regression:** Guardrail says max 3 worktrees, but `git worktree list` now shows four (`SnapCase_App_main`, `_task22`, `_task24`, `_task25`). There is also a dirty clone at `C:\Repos\SnapCase_App` (modified `package.json` + untracked `.github/` and audit docs) and the orphaned OneDrive repo still exists with locked `.git` files (Task24 follow-up). These extra/different roots increase the odds of running commands in the wrong place or being blocked by the clean-tree gate.
- **Prompt/doc clarity issues:** TaskPipeline’s active kickoff line and AgentReports (Tasks 22/23) contain mojibake characters (e.g., “ƒ?o…”) from bad encoding, and TaskPipeline still only lists Sprint04-Task08 as “active” while newer tasks sit outside the tracker. This invites copy/paste errors and hides current work from the prompt source of truth.
- **Visibility/merge drift:** `PROGRESS.md` mixes stale Sprint 3 blockers with new Sprint 4 updates and lacks a concise alias/state recap, so it’s unclear which branch/preview is authoritative for dev. Recent alias/pipeline shifts are captured in scattered AgentReports rather than the sprint log, making merge/preview readiness hard to assess quickly.

## Action plan

### Short-term (next few days)
1) Record the actual dev alias state in `PROGRESS.md` (target + rollback) and refresh the “Last Updated” stamp so the sprint log reflects the Snapcase-ikedc1s8f target from Task22. Add a single alias-status line whenever dev moves to prevent future drift.
2) Normalize worktrees to the guardrail: keep `C:\Repos\SnapCase_App_main` as canonical, prune to <=3 worktrees after this audit (drop `_task22` once merged), and avoid using the dirty `C:\Repos\SnapCase_App` clone; finish deleting the orphaned OneDrive repo when the lock clears.
3) Clean prompt sources: re-encode the TaskPipeline kickoff text and recent AgentReports to plain ASCII, update TaskPipeline’s Active/Archive tables to reflect Sprint04 tasks 22–24, and add a short note pointing to the current dev alias so prompts stay aligned.
4) Preflight guardrail reminder: keep running `scripts/alias-dev.mjs` from a clean, non-OneDrive worktree and log its output (targets + lint/build status) into `PROGRESS.md` the same day.

### Medium-term (next 1–2 weeks)
1) Add a lightweight preflight helper that checks the working path, worktree count, and clean status before running lint/build/alias to prevent temp-copy workarounds.
2) Automate alias drift checks (e.g., nightly `vercel alias inspect dev.snapcase.ai` logged to a small `docs/Deployment/alias-status.md` or a PROGRESS snippet) so baseline/rollback targets stay in sync.
3) Archive or delete unused clones (`C:\Repos\SnapCase_App`, OneDrive) after backing up any required audit files, and document the canonical repo path in one spot to avoid future split-brain work.
