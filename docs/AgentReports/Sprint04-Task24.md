# Sprint04-Task24 - hygiene removal

## Scope & Actions
- Added non-OneDrive worktree `C:\Repos\SnapCase_App_task24` on `task/Sprint04-Task24-hygiene-removal` from `origin/main` and copied `.vercel` from `C:\Repos\SnapCase_App_task22`.
- Recorded dirty OneDrive state before cleanup (`git status --short` from `C:\Users\ethtr\OneDrive\Documents\Work\SnapCase_App`), then stashed all tracked/untracked changes as `Sprint04-Task24 OneDrive backup` (stash@{0}).
- Relocated the primary repo to `C:\Repos\SnapCase_App_main`, repaired linked worktrees to the new gitdir, and cleaned the main working tree (still on `task/Sprint04-Task11A2-hygiene-migration`).
- Removed linked worktrees `C:\Repos\SnapCase_App_task20` and `C:\Repos\SnapCase_App_task21` to enforce the <=3 cap; current worktrees: `C:\Repos\SnapCase_App_main`, `C:\Repos\SnapCase_App_task22`, `C:\Repos\SnapCase_App_task24`.
- OneDrive worktree deregistered; remaining directory is an orphaned `.git` with locked reparse-point files (`pack-*.pack`, `COMMIT_EDITMSG*`). Deletion is still blocked by access-denied; manual elevated cleanup required. Empty folder `C:\Repos\SnapCase_App_task20` is still in use by another process and will need a retry after handles clear.

## Evidence
```
git status --short (OneDrive before stash):
MM PROGRESS.md
D  docs/AgentReports/Sprint04-Task11A2.md
 M docs/EDM_FEASIBILITY_CONFIRMATION.md
 M docs/EDM_VARIANT_SELECTION_SOLUTION.md
 M docs/PRINTFUL_WEBHOOK_SETUP_GUIDE.md
 M docs/PROJECT_MANAGEMENT.md
 M docs/PROMPT_TEMPLATE.md
 M docs/Responsive_Blueprint.md
 M docs/SnapCase_App_Prototype.MD
 M docs/TaskPipeline.md
 M docs/UX_RECOMMENDATIONS_EDM_CASE_SELECTION.md
 M scripts/printful-webhook-setup.js
 M src/app/checkout/page.tsx
 M src/app/design/page.tsx
 M src/data/catalog.ts
 M src/lib/design-context.ts
?? docs/AgentReports/Sprint04-Task11A2.md
?? docs/AgentReports/Sprint04-Task16.md
?? docs/AgentReports/Sprint04-Task22.md
?? docs/GitHub_Extensions_Research.md
?? docs/UXCX_DesignScreen_Feedback.md
?? docs/UXCX_DevicePicker_Feedback.md
?? docs/UX_CX_EXPERT_PROMPT.md
?? docs/Workflow_Improvements_Recommendations.md
?? tmp-dev-check-2.png
?? tmp-dev-check.png
```

## Verification
- No tests run (ops-only). `git status` clean in `C:\Repos\SnapCase_App_main`, `C:\Repos\SnapCase_App_task22`, and `C:\Repos\SnapCase_App_task24`.
- `git stash list` top entry: `stash@{0}: On task/Sprint04-Task11A2-hygiene-migration: Sprint04-Task24 OneDrive backup`.

## Follow-ups / Next Steps
- Manually delete the remaining OneDrive `.git` reparse-point files (`pack-*.pack`, `COMMIT_EDITMSG*`) and remove `C:\Users\ethtr\OneDrive\Documents\Work\SnapCase_App` once access permits.
- Remove `C:\Repos\SnapCase_App_task20` after whatever process is holding the folder releases its handle.
- Restore the OneDrive worktree state later via `git stash show/apply stash@{0}` from `C:\Repos\SnapCase_App_main` if needed.

Compare/PR: https://github.com/ethtri/SnapCase_App/compare/main...task/Sprint04-Task24-hygiene-removal
