# Sprint04-Task12 - Issue triage lint/build

## Summary
- Added the missing `.eslintrc.cjs` extending `next` and `next/core-web-vitals` so linting runs on this branch.
- Adjusted the CTA `useMemo` dependencies in `src/app/design/page.tsx` to include `guardrailSummary.message` (`[edmSnapshot, guardrailSummary.message, ownershipHelper]`) per exhaustive-deps guidance.

## Verification
- `npm run lint` (passes; known `react-hooks/exhaustive-deps` warning on the CTA/checkout `useCallback` dependency list).
- `npm run build` (passes; same lint warning echoed during build).

## Notes
- Branch: `task/Sprint04-Task12-issue-triage`.
- Diagnostics/screenshots not required for this task.
