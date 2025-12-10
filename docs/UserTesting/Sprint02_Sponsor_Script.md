# Sprint02 Sponsor Walk-through (updated 2025-12-10)

## Overview
- Purpose: capture sponsor-ready screenshots for `/design` → `/checkout` → `/thank-you` using the live Printful embed (no “Please add a design!” guardrail).
- Host: `https://dev.snapcase.ai` (alias currently points to `snapcase-qnb2d99br-snapcase.vercel.app`).
- Assets: keep `tmp/task45-design.png` handy for quick uploads.

## Latest run (2025-12-10 @ 01:26Z)
- Desktop/mobile captures: `Images/diagnostics/20251210T012645-{design,checkout,thankyou}-{desktop,mobile}.png`.
- Analytics evidence: `Images/diagnostics/20251210T012645-analytics.json` (designValid=true on variant 17726; Segment preview empty because sink is console-only, but CSP now whitelists Segment hosts).
- Checkout: mock Stripe flow returns `order_id` `cs_live_b1A5dzZVYWR0OVUTkl0A8msXkgzm21KLKJPWJncI0Fh9WBujhUCaujp0D2`.

## Script (desktop)
1. Open `https://dev.snapcase.ai/design`; default device preloaded via SnapCase catalog (variant lock enforced in Printful).
2. Inside the Printful frame, click **File** → **Add image** and upload `tmp/task45-design.png` (or a sponsor-provided asset). Wait for the Printful banner to clear; CTA should flip to **Continue to checkout** (designValid=true).
3. Click **Continue to checkout**; on `/checkout`, click **Pay with Stripe** (mock). Expect the mock banner (no live redirect) and preserved pricing.
4. Navigate to `/thank-you` (or stay on checkout mock) to confirm the order timeline and order ID.

## Script (mobile quick check)
- Revisit `/design`, `/checkout`, and `/thank-you` on a ~390px viewport after the desktop flow; session storage preserves the captured design. Confirm responsive layout and the locked helper pill remain visible.

## Notes
- Segment: CSP allows `cdn.segment.com` / `api.segment.io` / `cdn-settings.segment.com`; the sink remains console so Segment preview is empty in analytics JSON.
- Stash reminder: previous WIP in `SnapCase_App_task45_run2` is stashed as `Task45 WIP stub editor + diagnostics`; leave untouched.
