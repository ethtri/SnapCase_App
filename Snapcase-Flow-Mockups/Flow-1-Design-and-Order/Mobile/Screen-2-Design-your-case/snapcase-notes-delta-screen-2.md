# Snapcase â€” Delta Doc (Screen 2: Design Your Case)

**Viewport:** Mobile 390Ã—844  
**Executive intent:** Focused canvas with safety rails (safe-area, camera cutout, DPI), minimal chrome, bottom-anchored primary action.

> **Section Status**
>
> | Section | Status | Notes |
> | --- | --- | --- |
> | A) Visual & Layout | Needs Rewrite | Printful EDM now controls the canvas/picker; layout guidance must reference the iframe + helper block (Ref: docs/Printful_EDM_KeyFacts.md:85-165). |
> | B) Interaction & Behavior | Deprecated – Fabric-only | Safe-area/DPI toggles and local modals apply only when Fabric fallback is active. |
> | C) EDM Integration | Needs Rewrite | EDM exposes callbacks but no custom overlay control; update once iframe hooks are finalized. |
> | D) Accessibility | Needs Rewrite | Screen-reader flow must reference the Printful iframe + summary card pattern captured in `docs/Responsive_Blueprint.md`. |
> | E) Microcopy | Deprecated – Fabric-only | Many strings reference toggles/modals that no longer render during EDM sessions. |
> | F) Analytics | Needs Rewrite | Events should mirror EDM callbacks (`onDesignStatusUpdate`, `onTemplateSaved`) per docs/Printful_EDM_KeyFacts.md:104-136. |
> | G) Acceptance Criteria | Deprecated – Fabric-only | DPI thresholds + overlay toggles conflict with Printful guardrails. |
> | H) Responsive Note | Needs Rewrite | Desktop guidance must follow the EDM-first blueprint, not the Fabric canvas. |

> **Delta Status (2025-11-05)**
>
> | Mockup element | Reality snapshot | Status |
> | --- | --- | --- |
> | “Hide Printful picker” request | Picker remains visible but is locked via `isVariantSelectionDisabled` + helper pill (“Device locked — change in Step 1”); diagnostics show the read-only picker in `Images/diagnostics/edm-diagnostics-2025-11-04T19-17-46-144Z.png`. | Blocked by Printful |
> | Guardrail summary card | SnapCase summary card now mirrors `designValid`, `errors[]`, and variant drift from `onDesignStatusUpdate`, per the blueprint guardrail ownership notes. | Shipped |
> | Safe-area overlay + DPI toggles | Overlays/chips only ship in Fabric fallback; EDM mode hides them and relies on Printful banners (docs/Responsive_Blueprint.md — Screen 2 Safe-area & DPI visuals). | Deferred Fabric-only |
> | Upload moderation toasts + analytics | Upload spinners/toasts sit outside the iframe with `edm_file_upload` / `edm_guardrail_warning` analytics hooked up (docs/Responsive_Blueprint.md — Screen 2 Uploads & telemetry). | Shipped |
> | Multi-pane preview strip / optional left rail | Still a single Printful column; optional left rail stays collapsed until we have a multi-pane API (docs/Responsive_Blueprint.md — Mockup vs Reality table, multi-pane row). | Not Started |

> **EDM Reality:** Printful’s Embedded Design Maker owns the guardrails, picker, overlays, and DPI enforcement. Treat the sections below as **Fabric fallback only** until this doc is rewritten; defer to `docs/Responsive_Blueprint.md` + `docs/Printful_EDM_KeyFacts.md:85-165` for the active EDM spec.

## What to change vs Stitch

### A) Visual & Layout
1. **Tokenized sizes**
   - Primary: Snap Violet `var(--snap-violet)` fill with white text, min-height `var(--control-height)` (step up to `--space-14` only when extra tap depth is required), radius `--radius-xl`, optional icon `--space-5` with `--space-2` gap.
   - Switches: ON = `var(--snap-violet)` track/thumb; OFF = `var(--snap-cloud)` track with `var(--snap-cloud-border)` outline; size â‰¥ `var(--space-8)` Ã— `var(--space-5)` (â‰ˆ32Ã—20px).
   - Tool icons: single thin-stroke set sized to `--space-5`, labels in `--text-xs` (tight) or `--text-sm` when space allows.

2. **Sticky regions**
   - Only the **primary CTA bar** is sticky. Tool row sits **above** it, non-sticky.

3. **Canvas**
   - `--radius-xl` corners with dashed border `calc(var(--space-1) / 4)` in `var(--snap-cloud-border)`; min height ~`calc(9.5 Ã— var(--space-14))` (â‰ˆ520px) on 390Ã—844.
   - Overlays never touch border (`--space-3` inner padding).

4. **Z-index (top â†’ bottom)**
   - DPI chip (z=40) > Overlays (z=30) > EDM canvas (z=20) > Frame (z=10).

### B) Interaction & Behavior
5. **Toggles**
   - Both **ON** by default; instant show/hide.  
   - Implement as `role="switch"` with `aria-checked`.

6. **DPI guard**
   - Compute at **print size**.  
   - States: **Great ≥300** (chip uses `var(--snap-success)`), **OK 180–299** (`var(--snap-warning)` toast), **Low <180** (`var(--snap-error)` blocking modal).  
   - Chip updates via `aria-live="polite"` on any transform.

7. **Low-DPI modal**
   - Title: â€œ**Image too low-res to print.**â€  
   - Body: â€œ**We need at least 180 DPI at print size.**â€  
   - Primary **Replace photo**; Secondary **Back to editor**. Focus trap; ESC = secondary.

8. **Content moderation**
   - Lightweight NSFW/illegal filter on upload. Toast: â€œ**We canâ€™t print that content.**â€ + **See policy** link.

9. **Upload rules**
   - Types: JPG/PNG/HEIC; Max **20 MB**; respect EXIF orientation; show progress with cancel.

10. **Transforms**
   - Tools: **Upload, Stickers, Fit (cover/contain), Rotate 90Â°, Reset**.  
   - Gestures: pinch/drag; prevent panning outside print bounds when overlays ON.  
   - Reset â†’ scale=1, rotation=0, centered.

11. **CTA enablement**
   - Disabled until an image exists **and** DPI â‰¥180.  
   - **OK** enables with prior toast; **Low** blocks.

### C) EDM Integration
12. **Mount**
   - Replace frame with `<div id="edm-root" />`; expose `edm.setOverlays`, `edm.getDpi`, `edm.on('dpiChange', cb)` (shim for Fabric fallback).

### D) Accessibility
13. **Focus order**
   - Back â†’ Title â†’ Safe area (switch) â†’ Camera cutout (switch) â†’ Canvas â†’ Tool buttons â†’ **Next: Review**.

14. **Roles/labels**
   - Switches `role="switch"`; buttons have explicit `aria-label`.  
   - Toasts `aria-live="polite"`; modal `role="dialog"` with focus trap.

15. **Contrast & touch**
   - All hit areas meet the `var(--control-height)` tap target; validate AA for labels on `var(--snap-violet)` and `var(--snap-cloud)`.

### E) Microcopy
- Header: **Design Your Case**  
- Toggles: **Safe area**, **Camera cutout**  
- DPI chip: **DPI: Great / OK / Low**  
- OK toast: **â€œPrint quality may be soft.â€**  
- Low modal: see 7  
- Policy toast: **â€œWe canâ€™t print that content.â€ â€“ See policy**  
- CTA: **Next: Review**

### F) Analytics (snake_case)
- `editor_viewed { device_model, case_style }`
- `overlay_toggled { overlay: "safe_area"|"camera_cutout", on }`
- `photo_uploaded { file_type, file_size_mb, width_px, height_px }`
- `dpi_state_changed { state, dpi, scale, rotation }`
- `sticker_added { sticker_id }`
- `fit_used { mode: "cover"|"contain" }`
- `rotate_used { degrees }`
- `reset_used {}`
- `editor_next_clicked { dpi_state }`
- `content_blocked { reason }`

### G) Acceptance Criteria
- Overlays ON by default; correct ARIA/labels.  
- DPI guard behaves as specified; **OK** warns, **Low** blocks.  
- Upload constraints enforced; EXIF honored; progress + cancel.  
- Canvas prevents invalid crops with overlays ON.  
- CTA disabled until image + DPI â‰¥180; state persists to Review.  
- AA contrast + `var(--control-height)` targets; clear focus styles.  
- All analytics events fire with props.

### H) Responsive Note
- Mobile-first layout scales to desktop by widening the centered canvas. Create a desktop frame later only if adding a right properties rail/multi-pane editor.




