# SnapCase Web App

SnapCase brings the in-mall custom case experience online. This Next.js 14 project powers the design-to-fulfillment flow that links Printful, Stripe, and Vercel.

## Current functionality
- Next.js App Router scaffold deployed to Vercel previews
- `/design` route with Printful EDM toggle and Fabric.js fallback placeholder
- `/checkout` and `/thank-you` stub flows ready for Stripe integration
- Placeholder device picker with sample state management
- API routes `/api/catalog/phones` and `/api/edm/nonce` using Printful-aware mock data

## Local development
```bash
npm install
cp .env.example .env.local
npm run dev
```

The dev server runs at <http://localhost:3000>.

## Environment variables

| Name | Description | Example |
| --- | --- | --- |
| `PRINTFUL_TOKEN` | Printful API token for EDM + orders | `pr_test_xxx` |
| `PRINTFUL_STORE_ID` | Printful store identifier | `1234567` |
| `STRIPE_SECRET_KEY` | Stripe API secret | `sk_test_xxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_xxx` |
| `NEXT_PUBLIC_APP_URL` | Public base URL for links | `https://app.snapcase.ai` |
| `USE_EDM` | Toggle between Printful EDM (`true`) and Fabric fallback (`false`) | `true` |

Remember to set the same variables in Vercel (`vercel env`) for preview and production environments.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Create a production build (used by Vercel) |
| `npm run start` | Run the built app locally |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript type checks |
| `npm run test` | Run Jest unit tests |
| `npm run test:e2e` | Run Playwright end-to-end tests |

## Next steps
- Swap mock Printful responses for live data once credentials are available
- Wire up Stripe Checkout session creation and webhook handlers
- Replace the Fabric placeholder with the full editor (safe areas, DPI checks)

---

This repo is tracked at <https://github.com/ethtri/SnapCase_App> and deploys to Vercel previews while we finish domain and credential setup.
