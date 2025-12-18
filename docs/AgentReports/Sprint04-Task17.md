# Sprint04-Task17 – Design shell cleanup

## Scope & Files
- Refreshed the /design shell: transparent picker guard overlay with an sr-only label, dual Change device affordances (header text button + summary chip), merged design status into the summary card with tokenized chips/metadata, skeleton loader for the editor shell, and padding/height tweaks so the Printful toolbar stays visible.
- Files: src/app/design/page.tsx, src/components/editor/edm-editor.tsx, Images/diagnostics/20251218T113816-design-shell-desktop.png, Images/diagnostics/20251218T113816-design-shell-mobile.png.

## Verification
- `npm run lint`
- `npm run build`
- Manual: desktop + mobile flows (select device → continue to design) show the new change-device controls, skeleton during editor boot, uncropped toolbar without blocker badge, merged status chip in the summary card, and CTA gating unchanged.

## Diagnostics
- Images/diagnostics/20251218T113816-design-shell-desktop.png
- Images/diagnostics/20251218T113816-design-shell-mobile.png

## Follow-ups
- None.
