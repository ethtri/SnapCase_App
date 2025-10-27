# Snapcase — Delta Doc (Screen 2: Design Your Case)

**Viewport:** Mobile 390×844  
**Executive intent:** Focused canvas with safety rails (safe-area, camera cutout, DPI), minimal chrome, bottom-anchored primary action.

## What to change vs Stitch

### A) Visual & Layout
1. **Tokenized sizes**
   - Primary: Snap Violet `#4B3ACB`, white text, **44–48px** height, radius **16px**, optional icon **20px** with **8px** gap.
   - Switches: ON = violet track/thumb; OFF = Cloud `#F5F7FA`; size ≥ **32×20px**.
   - Tool icons: single thin-stroke set, **20px**, labels **12–13px**.

2. **Sticky regions**
   - Only the **primary CTA bar** is sticky. Tool row sits **above** it, non-sticky.

3. **Canvas**
   - 16px radius, 1px Cloud-darker **dashed** border; min height ~**520px** on 390×844.
   - Overlays never touch border (12px inner padding).

4. **Z-index (top → bottom)**
   - DPI chip (z=40) > Overlays (z=30) > EDM canvas (z=20) > Frame (z=10).

### B) Interaction & Behavior
5. **Toggles**
   - Both **ON** by default; instant show/hide.  
   - Implement as `role="switch"` with `aria-checked`.

6. **DPI guard**
   - Compute at **print size**.  
   - States: **Great ≥300** (Mint), **OK 180–299** (warning toast), **Low <180** (blocking modal).  
   - Chip updates via `aria-live="polite"` on any transform.

7. **Low-DPI modal**
   - Title: “**Image too low-res to print.**”  
   - Body: “**We need at least 180 DPI at print size.**”  
   - Primary **Replace photo**; Secondary **Back to editor**. Focus trap; ESC = secondary.

8. **Content moderation**
   - Lightweight NSFW/illegal filter on upload. Toast: “**We can’t print that content.**” + **See policy** link.

9. **Upload rules**
   - Types: JPG/PNG/HEIC; Max **20 MB**; respect EXIF orientation; show progress with cancel.

10. **Transforms**
   - Tools: **Upload, Stickers, Fit (cover/contain), Rotate 90°, Reset**.  
   - Gestures: pinch/drag; prevent panning outside print bounds when overlays ON.  
   - Reset → scale=1, rotation=0, centered.

11. **CTA enablement**
   - Disabled until an image exists **and** DPI ≥180.  
   - **OK** enables with prior toast; **Low** blocks.

### C) EDM Integration
12. **Mount**
   - Replace frame with `<div id="edm-root" />`; expose `edm.setOverlays`, `edm.getDpi`, `edm.on('dpiChange', cb)` (shim for Fabric fallback).

### D) Accessibility
13. **Focus order**
   - Back → Title → Safe area (switch) → Camera cutout (switch) → Canvas → Tool buttons → **Next: Review**.

14. **Roles/labels**
   - Switches `role="switch"`; buttons have explicit `aria-label`.  
   - Toasts `aria-live="polite"`; modal `role="dialog"` with focus trap.

15. **Contrast & touch**
   - All hit areas ≥ **44×44px**; validate AA for labels on violet and Cloud.

### E) Microcopy
- Header: **Design Your Case**  
- Toggles: **Safe area**, **Camera cutout**  
- DPI chip: **DPI: Great / OK / Low**  
- OK toast: **“Print quality may be soft.”**  
- Low modal: see 7  
- Policy toast: **“We can’t print that content.” – See policy**  
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
- CTA disabled until image + DPI ≥180; state persists to Review.  
- AA contrast + ≥44px targets; clear focus styles.  
- All analytics events fire with props.

### H) Responsive Note
- Mobile-first layout scales to desktop by widening the centered canvas. Create a desktop frame later only if adding a right properties rail/multi-pane editor.
