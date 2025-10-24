# Resource Library - SnapCase

## Deployment References
- [Vercel x Next.js guide](https://vercel.com/docs/frameworks/full-stack/nextjs?utm_source=chatgpt.com)
- [Vercel domain configuration](https://vercel.com/docs/domains/working-with-domains/add-a-domain?utm_source=chatgpt.com)

## Integration References
- [Printful API docs](https://developers.printful.com/docs/)
- [Printful API status page](https://status.printful.com/)
- [SnapCase Printful Catalog Snapshot](./PRINTFUL_CATALOG.md)
- [Project Management Playbook](./PROJECT_MANAGEMENT.md)

## Upcoming Implementation Focus
- Configure Vercel environment variables (PRINTFUL_TOKEN, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, etc.) once access is granted.
- Add request/response logging (pino) and rate limiting strategy for API routes.
- Prepare Playwright/Jest configs to match added test scripts.

## Engineering Notes (2025-10-21)
- Added .env.example to align with Vercel env configuration.
- Scaffolded editor routes with EDM toggle and fallback placeholders.
- Home page now communicates milestone status for quick stakeholder reference.
- Created /api/catalog/phones and /api/edm/nonce endpoints with Printful-aware fallbacks; design + checkout now exchange context via session storage.

## Engineering Notes (2025-10-22)
- Hardened /api/edm/nonce and /api/catalog/phones with Zod validation and request size guardrails.
- Implemented Fabric.js fallback editor foundation with safe-area overlay, DPI guidance, and export callback.


