# Incident Post-Mortem: Dev Alias Rollback and Time Loss
**Date:** December 20, 2025  
**Incident ID:** Sprint04-Task33-postmortem  
**Status:** Resolved

---

## 1. Summary

Between December 18-20, 2025, the development environment (`dev.snapcase.ai`) experienced alias drift and process breakdowns that required rolling back to a stable build (Task22) and consumed multiple days of engineering time on process cleanup instead of feature work. The root cause was a combination of inconsistent alias change logging, worktree hygiene violations, and documentation drift that made it unclear which build was authoritative for the dev environment.

**Impact:**
- Lost 2-3 days of development time on process/hygiene tasks instead of features
- Dev alias rolled back to Task22 stable build (December 19) on December 20
- Multiple tasks (Task23, Task25, Task26, Task27, Task28, Task31, Task33) spent on cleanup/audit instead of product work
- Confusion about which Vercel preview was backing `dev.snapcase.ai`

---

## 2. Timeline of Key Events

| Date/Time | Event | Impact |
|-----------|-------|--------|
| **2025-12-18** | **Task23:** Alias guard script created (`scripts/alias-dev.mjs`) and dev alias set to `snapcase-hwbcudj5f-snapcase.vercel.app` | New guardrails added, but alias changed without updating PROGRESS.md |
| **2025-12-18** | **Task25:** Process audit discovered alias drift - alias was at `snapcase-ikedc1s8f` but PROGRESS.md still listed `snapcase-hwbcudj5f` | Identified root causes: logging gaps, worktree violations, doc drift |
| **2025-12-19** | **Task22:** Summary card polish completed; dev alias set to `snapcase-ikedc1s8f-snapcase.vercel.app` (Task22 stable build) | Feature work completed, but alias change not immediately reflected in PROGRESS |
| **2025-12-19** | **Task26:** Hygiene cleanup updated PROGRESS.md to reflect actual alias state (`snapcase-ikedc1s8f`) | Documentation corrected, but time already lost |
| **2025-12-19** | **Task27:** Preflight automation script added (`scripts/preflight.mjs`) | Process improvement, but reactive rather than preventive |
| **2025-12-19** | **Task28:** CI pipeline added (GitHub Actions for lint/build) | Process improvement, but reactive |
| **2025-12-19** | **Task31:** Stabilization cleanup attempted; worktree/OneDrive stub deletion blocked by file locks | Cleanup incomplete due to Windows file locks |
| **2025-12-20** | **Task33:** Dev alias rolled back to Task22 stable build (`snapcase-ikedc1s8f-snapcase.vercel.app`) | Rollback completed; dev environment restored to known-good state |

---

## 3. Root Causes

### 3.1 Alias Change Logging Gaps (Primary)
**What happened:** When the dev alias was changed (Task22, Task23), the change was not immediately logged in `PROGRESS.md`. The "Last Updated" date in PROGRESS.md remained stale (December 16), and alias state was only captured in scattered AgentReports.

**Why it happened:**
- No automated check to ensure PROGRESS.md is updated when alias changes
- Alias changes were logged in AgentReports but not synced to the sprint log
- The alias guard script (`alias-dev.mjs`) was created in Task23 but wasn't used consistently before that

**Impact:** Reviewers couldn't tell which preview was backing dev without reading multiple AgentReports. This led to Task25 audit discovering the drift.

### 3.2 Worktree Hygiene Violations
**What happened:** The guardrail specifies max 3 worktrees, but 4+ worktrees existed. Additionally, a dirty standalone clone existed at `C:\Repos\SnapCase_App` and an orphaned OneDrive repo with locked files.

**Why it happened:**
- Worktree cleanup wasn't enforced before starting new tasks
- OneDrive sync conflicts created locked `.git` pack files that couldn't be deleted
- No automated preflight check existed until Task27

**Impact:** Increased risk of running commands in the wrong worktree, blocking clean-tree gates, and confusion about which repo path was canonical.

### 3.3 Documentation Drift and Visibility Gaps
**What happened:** `PROGRESS.md` mixed stale Sprint 3 blockers with new Sprint 4 updates. TaskPipeline had mojibake characters and listed outdated active tasks. Recent alias/pipeline shifts were captured in scattered AgentReports rather than the sprint log.

**Why it happened:**
- No single source of truth for alias state
- Documentation updates were batched per feature but alias changes weren't included
- TaskPipeline wasn't updated when tasks completed

**Impact:** Made it unclear which branch/preview was authoritative for dev, leading to merge/preview readiness confusion.

### 3.4 Process Controls Bypassed or Incomplete
**What happened:** The alias guard script (`alias-dev.mjs`) was created in Task23 but wasn't used for all alias changes. Some changes were made directly via `vercel alias set` without running the guard script.

**Why it happened:**
- Guard script was new and not yet part of muscle memory
- No enforcement mechanism to prevent direct `vercel alias` commands
- Script required clean worktree, which was sometimes blocked by hygiene issues

**Impact:** Alias changes happened without lint/build verification or rollback path documentation.

---

## 4. Contributing Factors

### 4.1 Environment Issues
- **OneDrive file locks:** Windows OneDrive sync created locked `.git/objects/pack/*.pack` files that blocked cleanup attempts (Task24, Task26, Task31)
- **Multiple repo paths:** Existence of both `C:\Repos\SnapCase_App_main` and `C:\Repos\SnapCase_App` created confusion about canonical path
- **Worktree metadata locks:** `.git/worktrees/*` cleanup failed with "Permission denied" errors

### 4.2 Process Gaps
- **No preflight automation:** Until Task27, there was no automated check for worktree count, OneDrive paths, or clean status
- **No alias drift detection:** No automated check to verify PROGRESS.md alias state matches actual Vercel alias
- **Incomplete completion gates:** AgentReports and PROGRESS updates weren't enforced as hard gates before marking tasks complete

### 4.3 Alias/Branch Mismatch
- **Branch approval confusion:** The alias guard requires `main` or sponsor-approved branch, but approval process wasn't always clear
- **Rollback path not captured:** Some alias changes didn't document the rollback target before making changes

---

## 5. What Worked (Controls That Helped)

1. **Task25 Process Audit:** Identified root causes early and provided actionable fixes
2. **Alias Guard Script (Task23):** Once created, provided lint/build verification and rollback path capture
3. **Preflight Automation (Task27):** Added automated checks for worktree count, OneDrive paths, and clean status
4. **CI Pipeline (Task28):** Added GitHub Actions to run lint/build on every push/PR
5. **AgentReport Discipline:** Scattered AgentReports still contained the information needed to reconstruct timeline

---

## 6. What Didn't Work (Controls Bypassed or Incomplete)

1. **PROGRESS.md as Single Source of Truth:** Alias changes weren't consistently logged there, breaking the single-source-of-truth model
2. **Worktree Hygiene Guardrail:** Max 3 worktrees rule was violated without enforcement
3. **Alias Guard Script Adoption:** Script existed but wasn't used for all alias changes
4. **Completion Gates:** Tasks were marked complete without ensuring PROGRESS.md and alias state were synced
5. **OneDrive Cleanup:** File locks prevented cleanup, leaving orphaned repos that blocked future work

---

## 7. Concrete Fixes

### 7.1 Short-Term Fixes (Next 1-2 Weeks)

| Fix | Owner | Due Date | Status |
|-----|-------|----------|--------|
| **7.1.1** Add alias state check to preflight script | AI Assistant | 2025-12-27 | Pending |
| **7.1.2** Update `alias-dev.mjs` to auto-update PROGRESS.md alias line | AI Assistant | 2025-12-27 | Pending |
| **7.1.3** Add completion gate check: verify PROGRESS.md alias state matches Vercel before marking alias tasks complete | AI Assistant | 2025-12-27 | Pending |
| **7.1.4** Document canonical repo path (`C:\Repos\SnapCase_App_main`) in PROJECT_MANAGEMENT.md | AI Assistant | 2025-12-27 | Pending |
| **7.1.5** Retry OneDrive stub deletion after handles clear (manual unlock) | Ethan Trifari | 2025-12-27 | Pending |
| **7.1.6** Retry worktree metadata cleanup (`.git/worktrees/SnapCase_App_task24`) | Ethan Trifari | 2025-12-27 | Pending |

### 7.2 Long-Term Fixes (Next Month)

| Fix | Owner | Due Date | Status |
|-----|-------|----------|--------|
| **7.2.1** Automate alias drift detection: nightly `vercel alias inspect dev.snapcase.ai` logged to `docs/Deployment/alias-status.md` | AI Assistant | 2026-01-15 | Pending |
| **7.2.2** Add preflight check to CI pipeline to fail builds if worktree count > 3 or OneDrive paths detected | AI Assistant | 2026-01-15 | Pending |
| **7.2.3** Create alias change runbook checklist that must be completed before any alias change (update PROGRESS, verify rollback, run guard script) | AI Assistant | 2026-01-15 | Pending |
| **7.2.4** Move repo entirely off OneDrive to prevent future file lock issues | Ethan Trifari | 2026-01-15 | Pending |
| **7.2.5** Add automated test to verify PROGRESS.md "Last Updated" date is within 24 hours of latest entry | AI Assistant | 2026-01-15 | Pending |

---

## 8. Prevention Measures

### Immediate Actions
1. **Before any alias change:** Run `node scripts/alias-dev.mjs --dry-run` to verify guards pass
2. **After any alias change:** Immediately update PROGRESS.md alias status line and "Last Updated" date
3. **Before marking alias tasks complete:** Verify PROGRESS.md alias state matches `vercel alias list` output

### Process Updates
1. **Completion Gate Enhancement:** Add explicit check: "PROGRESS.md alias state matches Vercel alias" before marking alias-related tasks complete
2. **Preflight Mandate:** Require `npm run preflight` before any alias change or deployment work
3. **Worktree Cap Enforcement:** Add preflight check that fails if worktree count > 3

---

## 9. Lessons Learned

1. **Single Source of Truth Must Be Enforced:** PROGRESS.md can't be the single source of truth if updates aren't mandatory and automated
2. **Process Controls Need Adoption Time:** New guardrails (alias script, preflight) need explicit adoption period with reminders
3. **Environment Issues Compound:** OneDrive file locks and multiple repo paths created cascading issues
4. **Reactive Fixes Are Expensive:** Spending 2-3 days on cleanup is more expensive than preventing the issues upfront

---

## 10. Related Documents

- `docs/AgentReports/Sprint04-Task25.md` - Process audit findings
- `docs/AgentReports/Sprint04-Task26.md` - Hygiene cleanup actions
- `docs/AgentReports/Sprint04-Task27.md` - Preflight automation
- `docs/AgentReports/Sprint04-Task33.md` - Rollback execution
- `docs/Deployment/Alias_Runbook.md` - Alias change procedures
- `docs/PROJECT_MANAGEMENT.md` - Process guardrails
- `PROGRESS.md` - Sprint log (see entries for Dec 18-20, 2025)

---

**Document Owner:** AI Assistant (Ops/Process)  
**Review Date:** January 15, 2026  
**Next Review:** Verify all short-term fixes are complete

