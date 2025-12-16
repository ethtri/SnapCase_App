# Sprint04-Task12 - Issue triage lint/build

## Summary
- Added the missing `.eslintrc.cjs` extending `next` and `next/core-web-vitals` so linting runs on this branch.
- Kept the Task07A CTA `useMemo` dependencies in `src/app/design/page.tsx` (`[edmSnapshot, selectedDevice, view]`) alongside the `<Image>` swap; no extra exhaustive-deps helpers added.

## Verification
- `npm run lint` (clean).
- `npm run build` (clean).

## Notes
- Branch: `task/Sprint04-Task12-issue-triage`.
- Diagnostics/screenshots not required for this task.
