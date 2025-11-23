# BUSINESS_CONTEXT.md — Rationale & Operating Frame

## 0) One‑liner

**Snapcase** lets people design and print custom phone cases - turning their photos and images into custom phone cases—**instantly at kiosks** (using an AI-powered editor) and **fast online**.

## 1) Why this, why now

* Kiosk traction proves demand; online expands beyond foot traffic and enables gifting/occasions.
* Print‑on‑demand APIs make web fulfillment capital‑light; we don’t need factory ops to launch.

## 2) Target Customers & Jobs‑to‑Be‑Done

* **Impulse & events:** mall traffic, friends day out, couples, team spirit.
* **Gifting:** birthdays, holidays, graduations.
* **Identity:** pets, hobbies, creator fandom, travel.

## 3) Value Prop

* **Make it yours in minutes** (simple editor, real‑time preview).
* **Looks premium** (gloss UV print, clean mockups).
* **Omnichannel** (design anywhere; print now or ship fast).
* **Quality Promise** (defect reprints).

## 4) Brand

* Friendly maker; confident, optimistic; short sentences, verbs first.
* Visuals: Snap Violet primary, clean white space, real‑photo showcases.
* Single name: **Snapcase** (capitalize S). “by Bloomjoy” optional.

## 5) Competitive Notes (web)

* Etsy/Redbubble/Society6: huge catalogs but generic experiences.
* Phone‑case PODs (Printful/Printify/Prodigi/Gelato): infra only; brands own UX.
* Our edge: **kiosk + web loop**, local presence, faster feedback, and curated templates.

## 6) Success Metrics

* Web funnel: editor start → purchase **≥ 4%** (goal), AOV **$35–$45**.
* Reprint/defect rate **< 2%**.
* 30‑day repeat **≥ 10%** (after accounts & templates).
* 30%+ of web traffic sourced from kiosk QR/receipts.

## 7) Economics (illustrative)

* Snap case COGS via POD ~$13–15; shipping ~$4–5; payment fee ~3%.
* Retail $34.99–$44.99 → gross margin ~38–45% depending on SKU/plan.
* Express shipping upsell improves AOV.

## 8) Risks & Mitigations

* **EDM access delayed:** ship with Plan‑B editor.
* **Quality variance:** sample orders; lock best suppliers.
* **IP misuse:** UGC policy + filters; DMCA workflow; manual review queue.
* **Trademark collision:** confirm “Snapcase” clearance; keep backup mark.

## 9) Legal/Policy (customer‑facing)

* **UGC/IP:** upload only content you own/are licensed to use; we block hate imagery.
* **Returns:** custom items final sale; **defect reprints within 7 days**.
* **Privacy:** clear data handling; Stripe for payments; Printful for fulfillment.

## 10) Operating Model

* **Squarespace** for marketing (snapcase.ai); **Vercel** for app (app.snapcase.ai); **Stripe** for payments; **Printful** for fulfillment.
* **Support** via email form + FAQ; turnaround < 24h; reprint flow documented.

## 11) RACI (v0)

* **Product/Brand:** Ethan (A/R)
* **Engineering:** Coding Agent + Reviewer (R)
* **Design:** AI (R) + Ethan (A)
* **Ops/Fulfillment:** Ethan (A)
* **Legal/Policy:** Advisor (C)

## 12) Milestones

* M0: Repo + Vercel + domain live (Day 1).
* M1: /design with EDM or Plan‑B editor saving template/export (Day 2–3).
* M2: Stripe Checkout wired (Day 3–4).
* M3: Printful order creation + webhook (Day 4–5).
* M4: Polish, accessibility pass, go‑live (Day 6–7).

## 13) Prompts for Coding Agent (Cursor) — copy/paste

1. **Scaffold & Deploy**

> Create a Next.js 14 (App Router) TypeScript app with Tailwind & shadcn/ui. Add pages `/design`, `/checkout`, `/thank-you`. Add API routes `/api/edm/nonce`, `/api/catalog/phones`, `/api/checkout`, `/api/order/create`, `/api/webhooks/stripe`, `/api/webhooks/printful`. Prepare `.env.example` with `PRINTFUL_TOKEN`, `PRINTFUL_STORE_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`, `USE_EDM`. Push to GitHub and deploy on Vercel.

2. **EDM Embed**

> On `/design`, load `https://files.cdn.printful.com/embed/embed.js`. Call `/api/edm/nonce` to get `{nonce}`. Instantiate `PFDesignMaker` with `elemId`, `nonce`, and handler `onTemplateSaved(templateId)` that stores `templateId` and routes to `/checkout`.

3. **Plan‑B Editor**

> If `USE_EDM=false`, render a Fabric.js canvas with safe‑area overlay. Accept image upload, allow crop/zoom, enforce min 300DPI at print size, and export a PNG. Store PNG as data URL for order creation.

4. **Stripe Checkout**

> Implement `/api/checkout` to create a Stripe Checkout Session (mode payment) and return its URL. After redirect success, land on `/thank-you` and show an order summary.

5. **Create Printful Order**

> Implement `/api/order/create` that accepts `{ templateId?, variantId, recipient }` and posts to Printful Orders API with `confirm=true`. Return `printfulOrderId`. Wire `/api/webhooks/printful` to update status and tracking.

6. **Validation & Errors**

> Use Zod to validate all request bodies; return 400 on invalid inputs; log errors with a compact, consistent structure.

7. **Design Tokens**

> Add CSS variables for Snapcase colors, radii, fonts from the brand guide. Use them in Button, Input, Card, and CTA components.

## 14) Definition of Done

* Deployed at `app.snapcase.ai`.
* Stripe test purchase completes; Printful shows a created order; webhook updates status.
* Lighthouse ≥ 90 (Perf/Access/Best Practices/SEO).
* README with run/deploy instructions and env var descriptions.