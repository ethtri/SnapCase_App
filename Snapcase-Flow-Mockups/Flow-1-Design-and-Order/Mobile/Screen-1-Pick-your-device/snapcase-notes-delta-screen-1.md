# Snapcase — Delta Doc (Screen 1: Select Your Device)

**Viewport:** Mobile 390×844  
**Executive intent:** Help users pick the correct device fast and confidently, AA accessible, on-brand.

## What to change vs Stitch v2

### A) Visual & Components
1. **Buttons**
   - Primary: Snap Violet `#4B3ACB`, white text, radius 16px, height ≥44px, optional icon 20px with 8px gap.
   - Outline: 1px Snap Violet border on white, label in Snap Violet; same size as primary.
   - Disabled: same size; bg Cloud `#F5F7FA`; label Midnight @60% opacity; **AA contrast**.

2. **Typography & casing**
   - Header: **“Select Your Device”** (Title Case), Poppins 600, 20–22px.
   - Body/labels: Sentence case, Inter 14–16px.
   - Buttons: Inter 16px, 600.

3. **Segmented control (Apple | Samsung)**
   - True segmented control:  
     - Selected: Snap Violet fill + white text.  
     - Unselected: Cloud fill, Ink text, 1px Cloud-darker border.
   - Height ≥44px; equal widths; Arrow-key cycle; `aria-selected`.

4. **Detect my phone**
   - **Outline** style (not filled). On tap, inline helper: “We only read your device info; no personal data.”
   - Success chip: “Detected: iPhone 15 Pro.”  
   - Failure toast: “Couldn’t detect your device.”

5. **Grid**
   - **2 columns**, fixed card height, **16px radius**, unified soft shadow.
   - Use **neutral silhouettes** (avoid wallpaper-style photos).  
   - Selection: **2px Snap Violet ring** + subtle elevation.  
   - Persist selection when returning from editor.

6. **Pricing**
   - Remove per-card prices; **single helper** above grid: “From $34.99.”

7. **Sticky bar**
   - Left caption **“Back-only print”**; right primary **“Next: Design.”**
   - Safe-area padding (iOS), slight blur + 1px top divider.
   - Disabled until a model is selected.

### B) Behavior
- Search shows instant results; keyboard keeps sticky bar visible.
- Detect uses UA+Client Hints; does **not** store PII.
- Lazy-load grid images; show skeletons.

### C) Accessibility
- **Focus order:** Back → Title → Search → Segmented control → Detect → Grid (row) → Sticky CTA.  
- Roles: segmented control `role="tablist"` + `role="tab"`; results `role="grid"`/`gridcell`.  
- Live regions: Detect outcomes via `aria-live="polite"`.  
- All hit targets ≥44px; AA contrast for all states.

### D) Analytics (snake_case)
- `device_picker_viewed { brand_default, models_available_count }`
- `brand_changed { brand }`
- `search_used { query_length, results_count }`
- `detect_device_clicked {}`
- `detect_device_resolved { detected, brand?, model? }`
- `model_selected { model, brand }`
- `picker_next_clicked { model, brand }`

### E) Acceptance Criteria
- Search/brand/detect work via touch/keyboard.  
- Single selected model enables **Next: Design**.  
- Empty/offline states implemented.  
- AA contrast + ≥44px targets.  
- Events above fire with props.  
- First paint ≤1s median; images lazy-load with skeletons.

## Responsive Rules (for dev, no separate desktop wireframe required here)
- **Grid columns:** sm:2, md:3, lg:4, xl:5.  
- On `lg+`, place brand control and Detect inline beside search.  
- Sticky bar becomes a bottom-right **floating action** on `lg+` (same content).