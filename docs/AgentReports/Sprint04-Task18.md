# Sprint04-Task18 - restore picker + design shell

## Scope & Files
- Restored the Screen 1 picker from the Task14 baseline: deterministic brand/model sorting (Apple/Samsung/Pixel/More), search with suggestions, loading/error states, and the Option A flow with sticky ActionBar/FAB gating. Picker controls now share the design-system control height and reset affordances.
- Kept and reapplied Task17 Screen 2 polish: change-device controls, merged status chip + summary card, designer skeleton, uncropped toolbar, and the transparent Printful picker guard with sr-only label in `EdmEditor`.
- Touched: `src/app/design/page.tsx`, `src/components/editor/edm-editor.tsx`.
- Diagnostics captured: see below. OneDrive worktree (`C:\Users\ethtr\OneDrive\Documents\Work\SnapCase_App`) was left dirty/untouched per instructions.

Compare/PR: https://github.com/ethtri/SnapCase_App/compare/main...task/Sprint04-Task18-restore-picker
Deploy: https://snapcase-bhrszgl42-snapcase.vercel.app (aliased to https://dev.snapcase.ai)

## Verification
- `npm run lint`
- `npm run build`
- Manual smoke: `/design` shows the restored picker; selecting a device flows to the designer-only shell with the merged status/summary chip, change-device controls, skeleton overlay, and CTA gating intact.
- Post-deploy checks: `curl -I https://dev.snapcase.ai/design` (200). `/api/health` returns 404 (endpoint absent), noted for awareness.

## Diagnostics
- Images/diagnostics/20251218T212401-design-picker-desktop.png
- Images/diagnostics/20251218T212401-design-picker-mobile.png
- Images/diagnostics/20251218T212401-design-shell-desktop.png
- Images/diagnostics/20251218T212401-design-shell-mobile.png

## Follow-ups / Notes
- OneDrive worktree remains dirty and will need a separate hygiene pass; this branch only touched the clean `C:\Repos\SnapCase_App_task18` worktree.
