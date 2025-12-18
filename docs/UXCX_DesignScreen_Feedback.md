# Design Screen UX/CX Sponsor Feedback (2025-12-18)
Owner: CX/UX Director  
Scope: Screen 2 (/design after device picker). Keep feedback inside Printful EDM limits (iframe owns guardrails/picker; SnapCase only mirrors status and gates CTAs).
Audience: AI/UX/CX engineer implementing fixes; use existing tokens/patterns (no new values).

## What to share with sponsor (brevity-first)
- Current reality: Printful editor iframe loads after device selection; picker is visible but locked with helper copy. SnapCase summary card mirrors Printful status, CTA sticks to ActionBar/floating bar.
- Known rough spots: cluttered helper/status copy, unclear change-device path, summary card polish, iframe load perception, spacing/hierarchy/sticky CTA fit on desktop vs mobile.
- Ask for knee-jerk reactions, not solutions; focus on clarity, noise, and whether the CTA feels comfortably placed.

## Questions to ask (copy/paste or live)
1) Clarity: Is it obvious which device is being designed, and how to change it?  
2) Noise: Which labels/boxes feel redundant or confusing (status boxes, "locked" language, helper pills)?  
3) Summary: Does the design summary/card help? Which details matter most (device, finish, price, validity, template ID, thumbnail)?  
4) Flow/CTA: Is CTA placement/spacing comfortable on desktop and mobile? Would you move or restyle anything?  
5) Load/perf: Does the editor feel slow to appear? Would a skeleton/loading shimmer make the wait feel better?  
6) Biggest distraction: What single distraction would you fix first?

## Sponsor feedback (fill live; bullets only)
- Device clarity/change path: No clear back/change control; wants a modern, obvious way to swap device.
- Noise/redundant labels: "Locked" helper language feels unnecessary; blocker label on iframe top-left looks bad; prefers invisible/clear overlay if needed.
- Summary card usefulness (what to keep/drop): Design Status box feels useless/redundant with summary; integrate status into summary; remove clutter.
- CTA placement/spacing comfort: CTA not called out as an issue, but overall layout feels dated; wants cleaner, modern treatment.
- Load/perf perception (need skeleton?): EDM iframe takes a few seconds; open to preloading while on device screen or faked two-step flow to mask load; skeleton/illusion welcome.
- Biggest distraction to fix first: Blocker label on iframe, cut-off top of EDM iframe, ugly desktop Design Summary box.
- Additional notes/screenshots to attach: Need captures showing blocked picker label, cut-off top of iframe, current summary card desktop view.

## Follow-ups to route after sponsor reply
- Copy tweaks to helper pill/summary card/CTA labels:
- Layout/spacing adjustments by breakpoint (base/sm vs lg+):
- Loading treatment decision (skeleton vs keep spinner):
- Any data fields sponsor wants added/removed in summary:

## CX/UX response plan (prioritized)
- **Remove visual blocker label; keep functional lock:** Drop the visible blocker badge on the iframe. Keep the functional overlay to prevent clicks on the Printful picker row; restyle as transparent/inset overlay with no text, retain screen-reader label for accessibility. Update helper copy above iframe to concise device/context only.
- **Clarify device change path:** Replace current back affordance with a modern, consistent control: top-left text button (“Change device”) using `--snap-violet`, `--radius-lg`, `--control-height`, plus summary chip above iframe (“Your device: <model> · Change”). Ensure on desktop it aligns with left column header; on mobile pin near ActionBar.
- **Fix iframe cropping:** Recheck container height/padding so the Printful top toolbar is fully visible; add `overflow: hidden` only where safe; ensure `--space-4/5` padding keeps the toolbar clear.
- **Streamline guardrail/status:** Remove the standalone Design Status box. Fold status into the Design Summary card with a single line using status chip tokens (`--snap-success/warning/error`) tied to `designValid`/errors. Keep summary minimal: device, finish/color, price, design validity, thumbnail.
- **Polish Design Summary (desktop + mobile):** Restyle with design-system tokens: `--radius-xl`, `--shadow-md`, `--space-5/6` padding, `--snap-cloud-border` outline, `--text-sm/base` typography, thumbnail at `--space-16` size, compact metadata stack. Drop redundant labels.
- **Loading/perception:** Add skeleton/shimmer for the iframe container (header bar + toolbar strip + canvas block) visible while EDM initializes; consider preloading on device screen after selection (defer to perf constraints). Maintain a graceful spinner fallback.
- **Locked language:** Remove “locked” wording from helper; rely on device summary + change affordance; keep the picker truly read-only via config.
- **QA/screenshots:** Capture mobile + desktop after changes to confirm no cropping, no blocker badge, and improved summary.

## Definition of Done (for engineering follow-through)
- Sponsor feedback logged in this doc with actionable interpretations (done).
- Implementation plan captured above, token-aligned, and scoped to current constraints (done).
- After changes: capture fresh mobile + desktop screenshots showing (a) no blocker badge, (b) full toolbar visible, (c) modern change-device control, (d) restyled summary; attach paths here.
- Update PROGRESS.md with a short note linking to this doc and the screenshots.

## Capture tips
- Grab one mobile and one desktop screenshot highlighting the areas they mention (helper pill, summary card, CTA bar, iframe load).
- Note if feedback conflicts with the design system tokens or Responsive Blueprint; flag that in PROGRESS.md before changes ship.
