# SnapCase Development Progress

**Project**: SnapCase Custom Phone Case Platform  
**Owner**: Ethan Trifari  
**Engineering Lead**: AI Assistant (Cursor)  
**Repository**: https://github.com/ethtri/SnapCase_App  
**Last Updated**: October 26, 2025

## Current Status: MVP Development Phase

### Project Overview
Building a web application at `app.snapcase.ai` that allows customers to design and order custom phone cases, extending the kiosk experience to the web through Printful's print-on-demand infrastructure.

### Current Blockers
- **Printful EDM Access**: Token + store ID configured; need live catalog products (external IDs) and end-to-end nonce tests before enabling production orders.
- **Domain Configuration**: app.snapcase.ai DNS still needs to point to Vercel.
- **Build Tooling**: ESLint config mismatch (Next 14 vs eslint-config-next 15) keeps `npm run lint` from finishing; align versions or pin legacy config.
- **Secrets in Vercel**: Production `STRIPE_SECRET_KEY` not yet stored in Vercel project settings.

### Recently Resolved
- **Design Continue CTA Disabled** *(Resolved 2025-10-26)*: Relaxed CSP `script-src` to permit Next bootstrap (dev adds `'unsafe-eval'` temporarily). Removed lingering CSP bypass so warn/good variants unlock Continue again. `npm run verify` now succeeds locally and in CI.

### Next 3 Actions
1. **Preview Routing** (AI): Implement `/` → `/design` redirect in the Next.js app to match the Squarespace CTA and storyboard Scene 1 entry.
2. **EDM Integration Spike** (AI): Wire Printful nonce request + iframe handshake behind `USE_EDM`, validating guardrail messaging within the EDM chrome.
3. **Printful Order Dry Run** (AI + Ethan): Capture live catalog external IDs and run a sandbox order/confirm cycle to validate fulfillment mapping and webhook handling.

## Sprint Log

### Sprint 0 - Testing Loop Setup *(Oct 25 - Nov 7, 2025)*

| Task | Owner | Status | Notes / Next Step |
| --- | --- | --- | --- |
| Provide Stripe production secret + webhook signing secret via secure channel | Ethan | DONE | Stripe sandbox keys + webhook secret confirmed; no further action until we swap to live. |
| Store Stripe and Printful secrets in Vercel + refresh `.env.local` | AI | DONE | Vercel env updated, redeploy triggered, and `.env.local` synced with Stripe sandbox values. |
| Verify Printful catalog external IDs align with curated data | AI | DONE | Catalog snapshot captured in `Docs/PRINTFUL_CATALOG.md`; ready to wire live Printful queries. |
| Point `app.snapcase.ai` CNAME at Vercel (`cname.vercel-dns.com`) | Ethan | DONE | DNS now validated in Vercel (see app.snapcase.ai domain dashboard). |
| Harden automated test harness (`test:unit`, `test:integration`, `test:e2e`) and add smoke stubs | AI | DONE | Jest unit/integration placeholders plus the Playwright smoke test now run locally; `npm run test:e2e` passes with mocked services. |
| Wire CI/local `npm run verify:mcp` + test suite into developer workflow | AI | DONE | Added `npm run verify` script chaining MCP + unit/integration/e2e tests and linked it into README and deployment checklist. |
| Draft Playwright happy-path scenario for design->checkout using mock services | AI | DONE | Smoke spec walks design → checkout flow with mocked EDM + Stripe endpoints. |
| Publish user-testing plan (participants, schedule, success criteria) | Ethan + AI | IN PROGRESS | Ethan will self-test each preview build; flesh out script & logging template before Sprint 1 demo. |

#### Blockers
- 2025-10-24: Runaway agent widened scope beyond the prompt and touched config defaults; diff was rolled back, workspace cleaned, and the guardrails now live in `Docs/PROJECT_MANAGEMENT.md` for future prompts.
- 2025-10-25: Playwright prompt exceeded timebox while fighting `.next` file locks on OneDrive; updated the playbook with timeboxing, cleanup, and no-stub guidance to prevent repeat overruns.
- 2025-10-25: Squarespace already handles the marketing hero; plan to redirect `/` → `/design` in the Next.js app so users land directly in Scene 1.
- 2025-10-26: CSP relaxation merged; both dev + prod builds hydrate `/design` correctly and unlock Continue for warn/good variants. Full `npm run verify` green.
- 2025-10-26: Follow-up review removed the legacy `NEXT_PUBLIC_E2E_MODE` CSP bypass branch to ensure playwright and preview builds always exercise the production headers.

**Sprint Goal:** Establish a reliable build -> preview -> test loop so every feature increment can be exercised in Vercel previews and shared with testers before production deploys.

**Outcome Summary (2025-10-26):** Sprint 1 completed with the design → checkout → thank-you loop running in preview, `npm run verify` automated, and self-test checklist entries captured. Guardrail UX remains a stub pending EDM access and moves to Sprint 2.

### Sprint 2 - Redirect & EDM Integration *(Nov 22 - Dec 5, 2025)*

| Task | Owner | Status | Notes / Next Step |
| --- | --- | --- | --- |
| Add `/` → `/design` redirect and document Squarespace handoff | AI | NOT STARTED | Update App Router middleware/route and deployment checklist to reflect hero handoff. |
| Replace guardrail stub with EDM iframe nonce flow | AI | NOT STARTED | Implement Printful nonce API call, mount EDM under `USE_EDM=true`, map guardrail copy into iframe. |
| Run Printful sandbox order end-to-end using saved template | AI + Ethan | NOT STARTED | Validate variant mapping and webhook payloads; record in `Docs/PRINTFUL_CATALOG.md` and Sprint log. |
| Refine `/design` UX messaging per self-test feedback | Design/AI | NOT STARTED | Consolidate guardrail messaging and polish layout once EDM renders. |

### Sprint 1 - Design Flow v1 *(Nov 8 - Nov 21, 2025)*

| Task | Owner | Status | Notes / Next Step |
| --- | --- | --- | --- |
| Align `/design` device picker UX with storyboard scenes 1-3 (copy, pricing, analytics event) | AI | DONE | Catalog module powers the picker, Tailwind styling matches storyboard, and placeholder analytics logs `select_device`. |
| Implement EDM/Fabric guardrails (safe-area overlay, DPI warnings, template persistence) | AI | CARRY FORWARD | Guardrail state + session persistence stubbed with tests; awaiting live Printful metrics and EDM access to replace stub UI. |
| Wire Stripe cancel/resume loop with persisted design context | AI | DONE | Mock Stripe flow preserves session context, displays cancel/resume messaging, and thank-you summary mirrors storyboard scenes 9-10. |
| Extend Playwright spec to cover guardrail + cancel/resume behaviors | AI | DONE | Spec now drives the live design→checkout→thank-you flow with data-testid hooks, covering guardrail block/warn bands, cancel/resume banner, and thank-you context clear. |
| Prepare Sprint 1 self-test script and feedback log template | Ethan | DONE | Added `Docs/SELF_TEST_CHECKLIST.md` with step-by-step flow + session log template. |

**Sprint Goal:** Deliver a preview-ready design → checkout flow matching storyboard scenes 1-10 that can be exercised in moderated user tests.

### EDM Integration Work Plan
- Verify Printful store catalog metadata (external IDs, thumbnails) so live APIs stay in sync with fallback data.
- Continue Fabric.js fallback work: device picker, safe-area overlay, DPI validation, and local draft persistence.
- Implement Vercel KV order tracking plus Stripe/Printful webhook idempotency using sandbox payloads.
- Expand automated checks (e.g., `npm run verify:mcp`, Jest/Playwright stubs) to keep regressions visible.

### Latest Updates
  - 2025-10-24: `/api/catalog/phones` now queries Printful via the shared client and falls back to curated fixtures when live data is missing.
  - 2025-10-24: Printful EDM token regenerated for the Snapcase API store (V2); secrets stored locally and on Vercel.
  - 2025-10-24: Upgraded Stripe webhook endpoint to verify signatures and log key events while we stage downstream automation.
  - 2025-10-24: Documented MCP usage patterns so future agents know when to lean on GitHub, Vercel, and Stripe servers.
  - 2025-10-24: Wired `/api/checkout` to Stripe (with mock fallback), gated express shipping via feature flag, and added global security headers/CSP in Next.js.
  - 2025-10-24: Standardized the checkout route on `/api/checkout`, promoted EDM integration requirements into the PRD, and published the EDM storyboard companion doc for coding agents.
- 2025-10-23: Documented MCP credential workflow and added `npm run verify:mcp` to validate GitHub/Vercel/Stripe MCP servers.
- 2025-10-22: Fabric.js fallback editor foundation implemented (image upload, safe-area overlay, export pipeline).
- 2025-10-22: Added Zod validation and request size limits to /api/edm/nonce; added query filters with validation to /api/catalog/phones.
- 2025-10-22: Verified `snapcase-app` as the sole Vercel project, removed duplicate slugs, and confirmed `main` branch auto-deploys after cleanup.
- 2025-10-21: Vercel preview deployment succeeded after converting Next.js config to next.config.mjs and swapping to Inter/Roboto Mono fonts to unblock builds.
- 2025-10-21: Added .env.example, editor scaffolding (/design, /checkout, /thank-you), and refreshed landing copy to align with MVP milestones.
- 2025-10-21: Implemented /api/catalog/phones + /api/edm/nonce with mock fallbacks and hooked the design editor to consume them, persisting state into checkout stub.

### [Notes] Documentation Status
- **Last Updated**: October 24, 2025
- **Next Review**: Daily (as part of sprint discipline)
- **Current Status**: Up to date with latest changes
- **Pending Updates**: Monitor MCP automation adoption and update guides as new servers come online.

## [Metrics] Milestone Progress

### [Done] Completed Milestones

#### M0: Repository & Infrastructure Setup
- [x] GitHub repository created and configured
- [x] README.md with comprehensive documentation
- [x] PROGRESS.md for tracking development
- [x] Basic project structure established
- [x] Next.js 14 project scaffolded ([Done] Already exists)
- [x] Vercel deployment configured (preview build successful on Vercel)
- [ ] Custom domain (app.snapcase.ai) setup

#### Documentation & Planning
- [x] Business context documented
- [x] Technical prototype specification completed
- [x] UX/CX guidelines established
- [x] Development progress tracking system implemented

### [In Progress] In Progress

#### M1: Design Editor Implementation (Days 2-3)
- [ ] Printful EDM integration setup
- [ ] Fallback Fabric.js editor implementation
- [ ] Device picker component
- [ ] Safe area overlay system
- [ ] DPI validation and warnings

## [Team] Accountability Matrix

### **Ethan's Tasks (Product Owner)**
- [ ] **Printful Account**: Create account, request EDM access, get API tokens
- [ ] **Stripe Account**: Create account, configure webhooks, get API keys
- [ ] **Vercel Account**: Create account, connect GitHub, configure environment
- [ ] **Domain Setup**: Configure app.snapcase.ai DNS (CNAME to Vercel)
- [ ] **Content**: Provide final copy, logo, pricing, legal policies

### **AI Assistant Tasks (Technical Lead)**
- [ ] **Next.js Enhancement**: Improve project structure, add missing dependencies
- [ ] **Design System Implementation**: Implement design system matching SnapCase.ai homepage
- [ ] **API Routes**: Implement all API endpoints (EDM, checkout, orders, webhooks)
- [ ] **UI Components**: Build device picker, checkout flow, order tracking
- [ ] **Design Editor**: Implement EDM integration + Fabric.js fallback
- [ ] **Testing**: Set up testing framework and implement test suite

## [Notes] Definition of Done (Sprint Requirements)

### **Every Sprint Must Include:**
- [ ] **Code Complete**: All planned features implemented and tested
- [ ] **Documentation Updated**: PROGRESS.md reflects current status
- [ ] **Progress Logged**: Completed tasks marked with [Done] and timestamps
- [ ] **Blockers Documented**: Any new blockers added to current blockers section
- [ ] **Next Actions Updated**: Next 3 actions reflect current priorities
- [ ] **Technical Docs Updated**: API docs, architecture docs updated if changed
- [ ] **Testing Complete**: All tests passing, new tests added for new features
- [ ] **Deployment Ready**: Code deployed to staging/preview environment

### **Documentation Discipline:**
- **Daily**: Update PROGRESS.md with completed tasks and blockers
- **Sprint End**: Full documentation review and update
- **Before Merge**: Ensure all relevant docs are current
- **After Deployment**: Update deployment status and any configuration changes

### [Checklist] Documentation Checklist (Every Sprint)
- [ ] **PROGRESS.md Updated**: Current status, completed tasks, new blockers
- [ ] **Technical Docs Current**: Architecture, API, deployment docs updated if changed
- [ ] **Progress Logged**: All completed tasks marked with [Done] and timestamps
- [ ] **Next Actions Updated**: Next 3 actions reflect current priorities
- [ ] **Blockers Documented**: Any new blockers added to current blockers section
- [ ] **Testing Docs Updated**: Test strategy and results documented
- [ ] **Deployment Status**: Current deployment status and any changes noted

### [Alert] Documentation is NOT Optional
**Every sprint MUST include documentation updates. No exceptions.**
- Documentation is part of the Definition of Done
- Incomplete documentation = incomplete sprint
- Use the Sprint Update Template for consistency
- AI agents depend on current documentation for context

### [Checklist] Upcoming Milestones

#### M2: Payment Integration (Days 3-4)
- [ ] Stripe Checkout implementation
- [ ] Payment flow testing
- [ ] Error handling for payment failures
- [ ] Receipt and confirmation system

#### M3: Order Fulfillment (Days 4-5)
- [ ] Printful order creation API
- [ ] Webhook integration for status updates
- [ ] Order tracking system
- [ ] Fulfillment error handling

#### M4: Polish & Launch (Days 6-7)
- [ ] Accessibility audit (WCAG AA compliance)
- [ ] Performance optimization (Lighthouse >=90)
- [ ] Security review
- [ ] Production deployment
- [ ] Go-live checklist completion

## [Growth] Success Metrics & KPIs

### Target Metrics
- **Conversion Rate**: >=4% (editor start -> purchase)
- **Average Order Value**: $35-$45
- **Reprint/Defect Rate**: <2%
- **30-day Repeat Rate**: >=10%
- **Performance Score**: Lighthouse >=90
- **Uptime**: 99.9%

### Current Performance
- **Conversion Rate**: TBD (not yet measured)
- **Average Order Value**: TBD
- **Performance Score**: TBD
- **Uptime**: TBD

## [Cycle] Development Backlog

### High Priority
1. **Core Application Setup**
   - Next.js 14 project initialization
   - TypeScript configuration
   - Tailwind CSS + shadcn/ui setup
   - Environment configuration

2. **Design Editor**
   - Printful EDM integration
   - Fallback editor with Fabric.js
   - Device catalog integration
   - Image upload and processing

3. **Payment System**
   - Stripe Checkout integration
   - Payment success/failure handling
   - Order confirmation system

### Medium Priority
4. **Order Management**
   - Printful API integration
   - Webhook handling
   - Order status tracking
   - Email notifications

5. **User Experience**
   - Mobile responsiveness
   - Loading states and error handling
   - Accessibility improvements
   - Performance optimization

### Low Priority
6. **Advanced Features**
   - User accounts and profiles
   - Design templates and galleries
   - Referral system
   - Analytics and reporting

## [Warning] Risks & Issues

### High Risk Items

#### Technical Risks
- **EDM Access Delayed**: Printful EDM may not be immediately available
  - **Mitigation**: Fallback Fabric.js editor implemented
  - **Status**: Monitoring Printful EDM access
  - **Owner**: Development Team

- **API Integration Complexity**: Stripe and Printful webhook reliability
  - **Mitigation**: Comprehensive error handling and retry logic
  - **Status**: Under development
  - **Owner**: Development Team

#### Business Risks
- **Quality Control**: Print quality variance across orders
  - **Mitigation**: Sample orders, supplier vetting, defect reprint policy
  - **Status**: Pending supplier evaluation
  - **Owner**: Ethan Trifari

- **Trademark Issues**: "Snapcase" name clearance
  - **Mitigation**: Legal review, backup trademark options
  - **Status**: In progress
  - **Owner**: Legal Advisor

### Medium Risk Items

- **Performance Under Load**: Vercel serverless function limits
  - **Mitigation**: Performance monitoring, optimization
  - **Status**: Monitoring

- **Mobile UX**: Touch interface optimization
  - **Mitigation**: Extensive mobile testing
  - **Status**: Pending

### Low Risk Items

- **Third-party Dependencies**: External service reliability
  - **Mitigation**: Service monitoring, fallback options
  - **Status**: Monitoring

## [Bug] Known Issues

### Critical Issues
- None currently identified

### High Priority Issues
- None currently identified

### Medium Priority Issues
- None currently identified

### Low Priority Issues
- None currently identified

## [Tools] Technical Debt

### Code Quality
- [ ] Implement comprehensive error boundaries
- [ ] Add unit tests for critical functions
- [ ] Set up automated testing pipeline
- [ ] Implement proper logging system

### Performance
- [ ] Optimize image loading and processing
- [ ] Implement caching strategies
- [ ] Bundle size optimization
- [ ] CDN configuration

### Security
- [ ] Implement rate limiting
- [ ] Add input sanitization
- [ ] Security headers configuration
- [ ] Regular dependency updates

## [Metrics] Development Velocity

### Recent Sprints
- **Sprint 1** (Week 1): Project setup and documentation
- **Sprint 2** (Week 2): Core application development (planned)

### Team Capacity
- **Development**: 1 AI Assistant (Full-time equivalent)
- **Product**: Ethan Trifari (Part-time)
- **Design**: AI + Ethan collaboration
- **QA**: Manual testing by team

## Next Actions

### Immediate (This Week)
1. Ship `/` → `/design` redirect and validate Squarespace CTA flow.
2. Kick off EDM integration spike (nonce fetch, iframe mount, guardrail parity).
3. Refresh Printful catalog snapshot with latest external IDs ahead of order testing.

### Short Term (Next 2 Weeks)
1. Complete EDM handshake and migrate guardrail UI into the iframe.
2. Execute Printful order dry run; document webhook mappings and timelines.
3. Polish `/design` layout and copy per Sprint 1 self-test feedback.
4. Plan `/order/[id]` status timeline scaffold leveraging webhook outputs.
5. Align ESLint config to unblock `npm run lint`.

### Medium Term (Next Month)
1. Ship Fabric.js fallback parity (if EDM remains gated) with safe-area + export tooling.
2. Instrument analytics and error monitoring across the funnel.
3. Advance checkout polish (shipping options, copy refinement, cancel/resume UX).
4. Coordinate marketing integrations and launch content.

## [Communication] Communication & Updates

### Daily Standups
- **Format**: Async updates via this document
- **Participants**: Development team, Product owner
- **Focus**: Progress, blockers, next steps

### Weekly Reviews
- **Format**: Progress assessment and planning
- **Participants**: Full team
- **Deliverables**: Updated progress, risk assessment, next week planning

### Monthly Retrospectives
- **Format**: Process improvement discussion
- **Focus**: What worked, what didn't, process improvements

## [Resources] Resources & References

### Documentation
- [Business Context](./Docs/BusinessContext.Md)
- [Technical Prototype](./Docs/SnapCase_App_Prototype.MD)
- [UX/CX Guidelines](./Docs/UXCX_Guidelines.MD)
- [Design System](./Docs/DESIGN_SYSTEM.md)
- [Visual Consistency Guide](./Docs/VISUAL_CONSISTENCY_GUIDE.md)
- [Design Implementation Guide](./Docs/DESIGN_IMPLEMENTATION_GUIDE.md)
- [EDM Storyboard](./Docs/Storyboard_EDM.md)
- [MCP Credentials](./Docs/MCP_Credentials.md)
- [Account Setup Guide](./Docs/ACCOUNT_SETUP_GUIDE.md)
- [Sprint Update Template](./Docs/SPRINT_UPDATE_TEMPLATE.md)
- [Documentation Reminder](./Docs/DOCUMENTATION_REMINDER.md)

### External Resources
- [Printful API Documentation](https://developers.printful.com/)
- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)

### Tools & Services
- **Development**: Cursor AI, GitHub, Vercel
- **Marketing Site**: Squarespace (snapcase.ai)
- **App Hosting**: Vercel (app.snapcase.ai)
- **Payments**: Stripe
- **Fulfillment**: Printful
- **Analytics**: TBD
- **Monitoring**: Vercel Analytics

---

**Last Updated**: December 2024  
**Next Review**: Weekly  
**Document Owner**: Ethan Trifari



