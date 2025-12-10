We currently disable the Printful "Product" tab in the EDM embed using a host-side CSS overlay (in `src/components/editor/edm-editor.tsx`) because we need the variant locked to the Snapcase pick. The overlay is a small, textless block that sits over the Product tab area so users can't click it, but it is somewhat hacky and requires breakpoint tuning to avoid covering toolbar controls or leaking text on different screen sizes (desktop/mobile, varying viewport widths).

Could you propose a cleaner, first-party way to hide/disable the Product tab or lock variant selection within the Printful EDM API (embed.js)? Relevant context:
- We pass `isVariantSelectionDisabled`/`lockVariant=true` and set navigation/style overrides via `buildPrintfulConfig`.
- We theme the iframe using `iframeClassName="snapcase-edm-frame"` and CSS in `globals.css`.
- Goal: Prevent users from reopening the Product tab/variant picker while keeping the embed fully functional and responsive, ideally without DOM overlays.

Please suggest the best approach (API flags, supported hooks, CSS targeting, or Printful support requests) and call out any documented limitations or risks.
