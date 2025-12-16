# Sprint04-Task06 - CX/UX alignment plan

- **Date**: 2025-12-15
- **Branch**: `task/Sprint04-Task06-cx-ux-alignment`
- **Scope**: Plan and document device picker flow options (dedicated picker vs collapsible single-screen) and direction for the Proof/Checkout card, ahead of downstream implementation.

## Summary
- Locked on the **Option A** dedicated picker screen followed by an editor-only screen with a compact summary chip (`Your device: <model> · Change device`) above the iframe; Option B (single-screen collapse) remains a fallback only if spacing requires.
- Recommended removing the empty Proof/Checkout box; when design data exists, render a populated design summary card instead of placeholders.
- Captured decisions and deltas in `docs/Responsive_Blueprint.md` and `docs/SnapCase_App_Prototype.MD`.

## Follow-ups
- Persist design context when returning from checkout (save device + template) and add the approved pricing transparency helper in checkout (spun into Sprint04-Task08).
- Remove the proof/thumbnail placeholder now and schedule a feasibility spike for generating thumbnails later.

## Verification
- Docs-only; no code or tests executed in this task.

## Artifacts
- Documentation updates: `docs/Responsive_Blueprint.md`, `docs/SnapCase_App_Prototype.MD`
