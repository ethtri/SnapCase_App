# Snapcase UX/CX Guidelines Index

Use this index to locate the authoritative experience docs before making product, design, or implementation changes. All files live in the repo unless noted.

## Core References
- `Docs/SnapCase_App_Prototype.MD` — PRD and acceptance criteria for the Design & Order flow.
- `Docs/Storyboard_EDM.md` — Scene-by-scene journey highlights and integration notes for Printful and Stripe.
- `Docs/DESIGN_SYSTEM.md` — Tokens, typography, spacing, motion, and component patterns.
- `Docs/VISUAL_CONSISTENCY_GUIDE.md` — Alignment rules with the marketing site and brand voice.
- `Docs/Responsive_Blueprint.md` — Breakpoint-by-breakpoint layout guidance for Screens 1–4.

## Stitch Mockups & Delta Notes
Mobile Stitch exports and their corrections live under `Snapcase-Flow-Mockups/Flow-1-Design-and-Order/Mobile/`:
- Screen 1: `Screen-1-Pick-your-device/` (image, HTML, `snapcase-notes-delta-screen-1.md`)
- Screen 2: `Screen-2-Design-your-case/` (image, HTML, `snapcase-notes-delta-screen-2.md`)
- Screen 3: `Screen-3-Review-and-Shipping/` (image, HTML, `snapcase-notes-delta-screen-3.md`)
- Screen 4: `Screen-4-Order-Placed/` (image, HTML, `snapcase-notes-delta-screen-4.md`)

Use the delta docs as the source of truth when translating Stitch files into our design system. They document visual tweaks, behavior, accessibility, analytics, and responsive notes per screen.

## Implementation Checklists
- `Docs/SELF_TEST_CHECKLIST.md` — Manual QA steps before sharing builds.
- `Docs/TESTING_STRATEGY.md` — Automated and manual testing expectations for critical flows.
- `PROGRESS.md` — Project status, documentation updates, and links to recent deliverables.

## How to Work With These Docs
1. Start with the PRD and storyboard to ensure the flow and tone match stakeholder intent.
2. Consult the design system + visual consistency guide for token names and brand requirements (no hard-coded hex values).
3. Apply the relevant screen delta doc. If a value or interaction is missing, document it there before implementing.
4. Reference the responsive blueprint whenever extending layouts beyond mobile; note open follow-ups listed at the bottom of that file.
5. Record any new UX/CX artifacts by adding them to this index and updating the Documentation section of `PROGRESS.md`.

Questions or gaps? Surface them in `PROGRESS.md` under Documentation Updates so the next agent knows what needs follow-up.
