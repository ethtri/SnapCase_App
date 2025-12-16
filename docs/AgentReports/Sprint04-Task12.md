# Sprint04-Task12 - Issue triage lint/build

## Summary
- Added the missing `.eslintrc.cjs` extending `next` and `next/core-web-vitals` so linting runs on this branch.
- Kept the existing CTA state dependency change in `src/app/design/page.tsx` (`useMemo` deps set to `[edmSnapshot, ownershipHelper]`); no other code or dependency edits.

## Verification
- `npm run lint` (passes; known `react-hooks/exhaustive-deps` warnings for `guardrailSummary.message` and the CTA/checkout `useCallback` dependency list).
- `npm run build` (passes; same lint warnings echoed during build).

## Notes
- Branch: `task/Sprint04-Task12-issue-triage`.
- Diagnostics/screenshots not required for this task.
