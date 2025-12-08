# Snapcase — Delta Doc (Screen 1: Select Your Device)

**Viewport:** Mobile 390×844  
**Executive intent:** Help users pick the correct device fast and confidently, AA accessible, on-brand.

> **Section Status**
>
> | Section | Status | Notes |
> | --- | --- | --- |
> | A) Visual & Components | Authoritative | Pure SnapCase UI; no Printful dependencies. |
> | B) Behavior | Authoritative | Device picker flow precedes EDM so no conflicts. |
> | C) Accessibility | Authoritative | Applies across editors. |
> | D) Analytics | Authoritative | Events remain required for funnel instrumentation. |
> | E) Acceptance Criteria | Authoritative | Still matches responsive goals. |
> | Responsive Rules | Authoritative | Desktop derivations still valid. |

> **Delta Status (2025-11-05)**
>
> | Mockup element | Reality snapshot | Status |
> | --- | --- | --- |
> | Search + Apple/Samsung segmented row | Live `/design` now renders the search bar, segmented tabs, and helper text exactly as spec’d before the device grid; shakedown confirmed in the responsive blueprint’s resolved gap log (docs/Responsive_Blueprint.md — Live Gap Analysis, Resolved 2025-11-05). | Shipped |
> | Detect my phone CTA + helper chip | UA/client-hints detection with inline helper copy ships alongside the filters so analytics + aria-live copy match the doc (docs/Responsive_Blueprint.md — Live Gap Analysis, Resolved 2025-11-05). | Shipped |
> | Device grid (neutral silhouettes + 2/3/4/5 columns) | Grid now scales 2→5 columns with the neutral silhouettes + selection border tokens from this doc; see same blueprint resolved entry for confirmation. | Shipped |
> | Single “From $34.99” helper | Pricing copy sits above the grid per the new Content & CTA notes; diagnostics still lack a Screen 1 capture so a new run is required once the Printful type issue unblocks (docs/Responsive_Blueprint.md — Content & CTA Notes, Nov 5). | Shipped (awaiting screenshot) |
> | Sticky ActionBar + lg+ floating CTA (“Back-only print” helper) | Both CTA surfaces are restored with guardrail gating tied to `model_selected`, matching the blueprint’s resolved log entry (docs/Responsive_Blueprint.md — Live Gap Analysis, Resolved 2025-11-05). | Shipped |

## What to change vs Stitch v2

### A) Visual & Components
1. **Buttons**
   - Primary: Snap Violet `var(--snap-violet)` fill with white text, radius `--radius-xl`, min-height `var(--control-height)`, optional icon `--space-5` with `--space-2` gap.
   - Outline: border `calc(var(--space-1) / 4)` in `var(--snap-violet)` on `var(--snap-white)` background; label uses `var(--snap-violet)`; keep identical sizing and `var(--control-height)`.
   - Disabled: keep sizing; background `var(--snap-cloud)`; label in `var(--snap-gray-800)` at 60% opacity; **AA contrast**.

2. **Typography & casing**
   - Header: **“Select Your Device”** (Title Case), `var(--font-display)` with `--font-semibold` at `--text-xl` (closest token to the 20–22px hero range).
   - Body/labels: Sentence case, `var(--font-body)` at `--text-sm` for helper copy and `--text-base` for core labels.
   - Buttons: `var(--font-body)` at `--text-base` with `--font-semibold`.

3. **Segmented control (Apple | Samsung)**
   - True segmented control:  
     - Selected: Snap Violet fill (`var(--snap-violet)`) with `var(--snap-white)` text.  
     - Unselected: `var(--snap-cloud)` fill, `var(--snap-gray-800)` text, border `calc(var(--space-1) / 4)` in `var(--snap-cloud-border)`.
   - Height `var(--control-height)`; equal widths; Arrow-key cycle; `aria-selected`.

4. **Detect my phone**
   - **Outline** style (not filled) with `calc(var(--space-1) / 4)` border in `var(--snap-violet)` on `var(--snap-white)`. On tap, inline helper: “We only read your device info; no personal data.”
   - Success chip: “Detected: iPhone 15 Pro.”  
   - Failure toast: “Couldn’t detect your device.”

5. **Grid**
   - **2 columns**, fixed card height, `--radius-xl`, unified `var(--shadow-md)`.
   - Use **neutral silhouettes** (avoid wallpaper-style photos).  
   - Selection: border `calc(var(--space-1) / 2)` in `var(--snap-violet)` + subtle elevation via `var(--shadow-lg)`.
   - Persist selection when returning from editor.

6. **Pricing**
   - Remove per-card prices; **single helper** above grid: “From $34.99.”

7. **Sticky bar**
   - Left caption **“Back-only print”**; right primary **“Next: Design.”**
   - Safe-area padding (iOS), slight blur + divider `calc(var(--space-1) / 4)` in `var(--snap-cloud-border)`.
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


- All hit targets =`var(--control-height)`; AA contrast for all states.
