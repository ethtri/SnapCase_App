# Device Picker UX/CX Feedback (v3)  
Target: AI CX/UX engineers; scope is the current desktop picker variant shown in the latest sponsor screenshot (Galaxy S24+ selected, out-of-stock and coming-soon states visible).

## Snapshot Assessment
- Overall: Cleaner and functional; major clutter removed.
- Remaining feel: Still a bit utilitarian/dated; hierarchy and control sizing need polish.
- Buttons/controls: Mixed heights between chips, search, and CTA; selection ring feels heavy on desktop.

## Key Findings
1) **Button/control height mismatch**  
   - Filter chips, search, and CTA do not share the `--control-height` baseline; height inconsistency makes the bar feel uneven and less premium.

2) **Sorting/scanability**  
   - Apple list order is jumbled (17 Pro Max + 17 Pro + 17 + 17 Air + 16 Pro Max …). Users can’t predict where to look.

3) **Hierarchy and background**  
   - Grid sits directly on the page background; needs a subtle `--snap-cloud` container to separate the picker from the rest of the shell.

4) **Selection affordance weight**  
   - Thick violet outline + chip reads chunky on desktop. Needs a thinner stroke and light tint fill to feel more modern.

5) **Disabled/out-of-stock tone**  
   - Out-of-stock/coming-soon states are clear but slightly heavy; helper labels could be lighter (sentence case) and tinted instead of repeated in all caps.

6) **Filter chip prominence**  
   - “All devices 20” chip is visually dominant; secondary chips risk overcrowding, especially on mobile. “MagSafe-ready” is meaningful; others should be minimal or removed on mobile.

7) **Copy/affordances**  
   - Top helper chip is good; ensure consistent voice: “Your device: Galaxy S24+ · Change device.” Bottom CTA copy is fine; confirm state changes on mobile when nothing is selected.

8) **Accessibility**  
   - Need explicit `aria-disabled` + status text on out-of-stock/coming-soon; visible focus rings on cards/chips; `aria-live` announcement for selection change; ensure AA contrast on disabled text/tints.

## Recommendations (actionable)
- **Normalize control heights**  
  - Apply `--control-height` to search, chips, and CTA; align vertical padding to `--space-3`/`--space-4`. Keep CTA radius `--radius-xl`; chips radius `--radius-lg`.

- **Deterministic sorting**  
  - Sort within brand by generation (newest + oldest or the reverse, but consistent). E.g., Apple: 17 Pro Max, 17 Pro, 17, 17 Air, 16 Pro Max, 16 Pro, 16, 15 Pro Max, 15 Pro, 15, 14 Pro Max, 14.

- **Grid container hierarchy**  
  - Wrap the grid in a panel with `background: var(--snap-cloud)`, `border: 1px solid var(--snap-cloud-border)`, `border-radius: var(--radius-xl)`, `padding: var(--space-5/6)`, `box-shadow: var(--shadow-sm)`.

- **Selection styling**  
  - Reduce stroke to 2px, add a soft tint fill (`--snap-violet-50`), keep the check chip but reduce its size to match the slimmer stroke.

- **Disabled state**  
  - Use a light tint fill (`--snap-gray-100`), muted text (`--snap-gray-500`), helper text “Out of stock”/“Coming soon” in sentence case, no hover lift, `aria-disabled="true"`, and remove the focus outline from disabled cards.

- **Filter chips**  
  - Make “All devices” a neutral chip (not primary). On mobile, collapse less-used chips; prioritize “All,” top 2 brands, and “MagSafe-ready” only if critical. If “Fits saved template” is reintroduced, gate it behind a clearer label (“Works with your saved design”) and show it only when a saved design exists.

- **Spacing rhythm**  
  - Increase spacing between helper chip + search/filters + grid (`--space-4` + `--space-5/6`). Keep consistent horizontal gutters inside the grid (gap `--space-4/5`).

- **Copy/voice alignment**  
  - Top chip: “Your device: <model> · Change device.”  
  - CTA states: “Select a device” + “Continue to design” + “Waiting for designer…” (loading) + “Continue to design.”  
  - Disabled helper text: sentence case; no all-caps.

- **Accessibility**  
  - `aria-live="polite"` for selection change; `aria-disabled="true"` with appended status in `aria-label` (“Pixel 9, coming soon”); ensure focus rings visible on all actionable chips/cards; disabled cards removed from tab order; maintain AA contrast on disabled text/tint.

## Quick QA Checklist
- Controls share `--control-height`; CTA, search, and chips visually align.
- Sorting is deterministic; Apple block predictable.
- Grid panel uses cloud background, border, radius, and shadow for hierarchy.
- Selection ring slimmer + tinted; check chip scales down proportionally.
- Disabled cards tint + sentence-case helper; no hover/focus, announce status to SR.
- Filters simplified; on mobile they wrap without overlapping search/CTA.
- Top helper chip voice matches; bottom CTA states change correctly when selection is cleared/restored.
- AA contrast passes for active, hover, disabled, and selected states.
