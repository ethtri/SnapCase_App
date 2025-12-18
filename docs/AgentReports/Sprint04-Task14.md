# Sprint04-Task14 - Device picker screen

## Summary
- Cleaned the picker UI per UX/CX feedback: cards now show model + subtitle only, selection uses a violet ring + subtle check chip, and disabled/coming-soon cards stay visible with desaturated styling.
- Helper chip at the top shows `Selected: <device> - Change` and toggles selection without hiding the grid; other cards remain visible when selected.
- Retired noisy tags/lock copy; kept tabs/filters but with lighter chrome and concise helpers.

## Changes
- `src/app/design/page.tsx`: simplified card content, added selection ring + check chip, kept cards visible on selection, added top helper chip, disabled styling for coming-soon/non-selectable, cleared "locked" language, and ensured helper/CTA copy stays concise.
- Diagnostics captured for desktop/mobile showing selected and disabled states.

## Tests
- `npm run lint`
- `npm run build`
- Manual smoke: Samsung/Pixel selection; cards stay visible, selection ring and helper chip reflect state; disabled coming-soon remains unselectable.

## Diagnostics
- Picker screenshots/JSON: `Images/diagnostics/20251217T205155-picker-clean-desktop.{png,json}`, `Images/diagnostics/20251217T205155-picker-clean-mobile.{png,json}`, `Images/diagnostics/20251217T212200-picker-clean-desktop.{png,json}`, `Images/diagnostics/20251217T212200-picker-clean-mobile.{png,json}`.

## Deployment
- Preview: `https://snapcase-nb3vubwbf-snapcase.vercel.app`
- Alias: `https://dev.snapcase.ai` (updated for sponsor test)

## Links
- Compare: https://github.com/ethtri/SnapCase_App/compare/main...task/Sprint04-Task14-device-picker-screen

## Sprint04-Task14D - Picker polish

### Summary
- Simplified the picker surface (no chips) and refreshed spacing to keep search, tabs, and the grid separated with a cloud-tinted container while the helper chip uses the approved “Your device: <model> · Change device” copy.
- Card styling now uses the thinner violet outline + tint with a compact check chip; coming-soon/backorder items stay visible but unfocusable with sentence-case helpers and desaturated cloud styling.
- Deterministic ordering now relies on catalog displayOrder metadata so brands group consistently (Apple → Samsung → Pixel → More, newest to oldest).

### Changes
- `src/app/design/page.tsx`: Removed filter state, adjusted helper/CTA copy, updated selection/disabled card affordances and focus states, retuned spacing, and ensured disabled items are non-focusable while keeping the grid visible.
- `src/data/catalog.ts`: Added `displayOrder` metadata per variant to drive stable brand-first, newest-first sorting without touching IDs/contracts.
- Diagnostics captured for desktop/mobile picker showing selected and coming-soon states with updated spacing/chrome.
- Deployment: https://dev.snapcase.ai (alias for https://snapcase-3em4i93vi-snapcase.vercel.app).

### Tests
- `npm run lint`
- `npm run build`

### Diagnostics
- Picker screenshots/JSON: `Images/diagnostics/20251217T232857-picker-polish-desktop.{png,json}`, `Images/diagnostics/20251217T232857-picker-polish-mobile.{png,json}`

## Sprint04-Task14H - Picker parity simple

### Summary
- Hid coming-soon/backorder/non-selectable devices from the grid and search; cards now show only model + brand subtitle with a thinner violet outline, light tint, and compact check chip.
- Simplified search/brand tabs (no counts/badges), added breathing room with the cloud panel, and refreshed the sticky CTA with consistent control heights on desktop/mobile.
- Sorting now locks to brand + catalog displayOrder for deterministic newest-to-oldest ordering.

### Changes
- `src/app/design/page.tsx`: filtered the catalog to available devices, refreshed card/selection styling, streamlined search suggestions and brand tabs, and updated CTA/helper copy to the sponsor-approved voice.
- Diagnostics captured for desktop/mobile showing a selected Apple device with unavailable devices removed from the grid.

### Tests
- `npm run lint`
- `npm run build`
- Manual smoke: search/tabs on desktop/mobile, only available devices surface, selection/CTA states update, sticky CTA stays reachable.

### Diagnostics
- Picker screenshots/JSON: `Images/diagnostics/20251218T093126-picker-parity-simple-desktop.{png,json}`, `Images/diagnostics/20251218T093126-picker-parity-simple-mobile.{png,json}` (supersedes `20251217T214250-*`).
- Latest tweaks: brand subtitles removed from cards; sticky CTA enlarged with no helper banner.
- Compare: https://github.com/ethtri/SnapCase_App/compare/main...task/Sprint04-Task14-device-picker-screen
