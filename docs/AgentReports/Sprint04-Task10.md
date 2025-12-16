# Sprint04-Task10 - ESLint config alignment

## Summary
- Added the standard Next.js 14 ESLint configuration so `next lint` runs with the repo defaults instead of failing for missing config.
- Left dependencies and environment untouched; reused the existing Next/ESLint toolchain already in `package.json`.
- Lint and build both complete, with the pre-existing `react-hooks/exhaustive-deps` warning still reported on `src/app/design/page.tsx:582`.

## Changes
- Added `.eslintrc.cjs` extending `next` and `next/core-web-vitals` to match the Next 14 defaults.

## Tests
- `npm run lint` (reports existing hook dependency warning at `src/app/design/page.tsx:582`)
- `npm run build` (same warning)

## Notes / Risks
- React hook dependency warning remains in `src/app/design/page.tsx`; no code changes were made to adjust dependencies.
