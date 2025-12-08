# Deployment Guide - SnapCase App

**Project**: SnapCase Custom Phone Case Platform  
**Version**: v1.1  
**Last Updated**: November 3, 2025  
**Owner**: Ethan Trifari  

## 🚀 Deployment Overview

This guide covers the complete deployment process for the SnapCase application, from initial setup to production deployment and ongoing maintenance.

### Deployment Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │     Staging     │    │   Production    │
│   Local/Vercel  │    │   Vercel Preview│    │  Vercel Prod    │
│   Preview       │    │   (Feature)     │    │ app.snapcase.ai │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔁 Preview → Alias Workflow (_vercel_share + dev.snapcase.ai)

Follow this workflow every time you need Printful to exercise a new build. It keeps preview slugs stable, creates review links, and ensures the EDM iframe no longer throws `invalid origin` (see `docs/TECHNICAL_ARCHITECTURE.md#🚀 Deployment Architecture` for the network layout).

1. **Push the feature branch** → Vercel automatically builds a preview with protection enabled.
2. **Generate a share link** → On the deployment page click **Share > Create link**. Distribute the resulting `https://<slug>.vercel.app?_vercel_share=<token>` URL to stakeholders who do *not* need Printful access (it respects preview protection while still surfacing the UI).
3. **Disable preview protection for Printful** → In Vercel: *Project > Settings > Deployment Protection*. Add an exception for `dev.snapcase.ai` and the specific `_vercel_share` token if support needs to inspect the raw preview. Protection must remain disabled (or skipped) before Printful requests a nonce, otherwise the EDM iframe raises `messageListener invalidOrigin`.
4. **Attach the dev alias** → From the CLI run `vercel alias set <deployment-url> dev.snapcase.ai` (or use the Dashboard → Preview Deployment → Aliases → **Assign**). This keeps a stable hostname that already sits on Printful’s allowlist.
5. **Verify the alias** → Run `curl https://dev.snapcase.ai/api/health`, load `/design` to confirm the in-app diagnostics panel shows `origin: https://dev.snapcase.ai`, and send the alias to Printful so their EDM team can test the Embedded Designer from a trusted domain.

> **Reminder:** Preview slugs (`snapcase-app-git-*.vercel.app`) change per push, but the `dev.snapcase.ai` alias persists. Always break the protection + alias steps before sharing links intended for Printful or Squarespace integrations to avoid another EDM lockout.
> `_vercel_share` links expire when the underlying deployment is replaced—regenerate and resend them whenever you push new commits or promote a different preview.

### Post-Alias Checklist
- [ ] `vercel alias ls` shows `dev.snapcase.ai` attached to the intended deployment.
- [ ] Run `npm run verify -- --base https://dev.snapcase.ai` (Playwright `design-to-checkout` uses this base URL when provided).
- [ ] Validate Printful EDM via `/design` diagnostics; copy the nonce payload snippet into `docs/Printful_EDM_InvalidOrigin.md` if support needs evidence.
- [ ] Notify Ethan + Printful via Slack/email with the `_vercel_share` link, the alias URL, and the date/time protection was disabled.

## 📋 Prerequisites

### Routing Rules
- `/` responds with a 307 redirect to `/design`, ensuring Squarespace handoffs land directly in the Scene 1 editor experience.
- `/api/*`, static assets, and other application routes bypass the redirect via the App Router middleware (`src/middleware.ts`).
- Verify the redirect during smoke tests with `npm run verify`; the `design-to-checkout` Playwright spec asserts the root redirect.

### Required Accounts
- [ ] **Vercel Account**: For hosting and deployment
- [ ] **GitHub Account**: For repository management
- [ ] **Stripe Account**: For payment processing
- [ ] **Printful Account**: For order fulfillment
- [ ] **GoDaddy Account**: For domain management

### Required Tools
- [ ] **Node.js 18+**: For local development
- [ ] **Git**: For version control
- [ ] **Vercel CLI**: For deployment management
- [ ] **Domain Access**: app.snapcase.ai subdomain

## 🏗️ Initial Setup

### 1. Repository Setup
```bash
# Clone the repository
git clone https://github.com/ethtri/SnapCase_App.git
cd SnapCase_App

# Install dependencies
npm install

# Install Vercel CLI globally
npm install -g vercel
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
# Add all required API keys and configuration
```

### 3. Vercel Project Setup
```bash
# Login to Vercel
vercel login

# Link project to Vercel
vercel link

# Configure project settings
vercel env add PRINTFUL_TOKEN
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add NEXT_PUBLIC_APP_URL
vercel env add USE_EDM
vercel env add NEXT_PUBLIC_USE_EDM
```
> **Important:** Always link to the existing Vercel project named `snapcase-app`. If the CLI or dashboard offers to create a new project, choose the "link existing" option and pick `snapcase-app`. New slugs such as `snap-case-app-v1` create duplicate projects that track the same repository and add maintenance overhead.

#### Verify Vercel <-> GitHub Link (do this once)
- **On Vercel:** Settings -> *snapcase-app* -> Git. Confirm `ethtri/SnapCase_App` is listed as the connected repository and `main` is the production branch. If the wrong repo appears, click *Connect Git Repository* and reselect `ethtri/SnapCase_App`.
- **On GitHub:** Settings -> Integrations -> GitHub Apps -> *Vercel*. The app should be installed for "Only select repositories" with `SnapCase_App` checked. Remove any extra Vercel installations that point at the same repo.
- **GitHub webhooks:** When the official Vercel GitHub App is installed, you may not see a webhook entry under Settings -> Webhooks; the app delivers events through GitHub's Checks API instead. Only add/delete webhooks here if you previously created manual Vercel deploy hooks.

##### 2025-10-22 Vercel Cleanup Summary
- Confirmed `snapcase-app` (slug `snapcase-app`) is the canonical project; duplicates (`snap-case-app`, `snap-case-app-v1`, `snap-case-appv1`) were removed.
- Production and preview deploys now originate from branch `main`. Always push release work to `main` (or execute `git push origin main`).
- During `vercel link`, select the existing `snapcase-app` project instead of creating a new import.

## 🔧 Environment Configuration

### Environment Variables

#### Production Environment
```env
# Printful Configuration
PRINTFUL_TOKEN=pr_live_your_live_token
PRINTFUL_STORE_ID=your_live_store_id
# Optional override for Printful file uploads (defaults to the production endpoint)
PRINTFUL_FILES_ENDPOINT=https://api.printful.com/v2/files

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
STRIPE_SHIPPING_RATE_STANDARD=shr_live_standard_rate_id
STRIPE_SHIPPING_RATE_EXPRESS=shr_live_express_rate_id

# Application Configuration
NEXT_PUBLIC_APP_URL=https://app.snapcase.ai
USE_EDM=true
# Flip to true once Printful EDM is production-ready
NEXT_PUBLIC_USE_EDM=false

# Feature Flags
SHOW_EXPRESS_SHIPPING=true
NEXT_PUBLIC_SHOW_EXPRESS_SHIPPING=true
ENABLE_ANALYTICS=true
```
> **Printful EDM scope:** Generate `PRINTFUL_TOKEN` only after Printful support enables the Embedded Designer API for the Snapcase store; the token must include the `product_templates/write` scope (listed as “View and manage store products”). Tokens without this scope cause `/api/edm/nonce` to return `403` and the EDM iframe will not load.

#### Staging Environment
```env
# Printful Configuration (Test Store)
PRINTFUL_TOKEN=pr_test_your_test_token
PRINTFUL_STORE_ID=your_test_store_id

# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_test_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret
STRIPE_SHIPPING_RATE_STANDARD=shr_test_standard_rate_id
STRIPE_SHIPPING_RATE_EXPRESS=shr_test_express_rate_id

# Application Configuration
NEXT_PUBLIC_APP_URL=https://snapcase-app-git-develop-username.vercel.app
USE_EDM=true
NEXT_PUBLIC_USE_EDM=true

# Feature Flags
SHOW_EXPRESS_SHIPPING=true
NEXT_PUBLIC_SHOW_EXPRESS_SHIPPING=true
ENABLE_ANALYTICS=false
```

> **EDM toggle:** `/api/edm/nonce` now proxies Printful nonce requests using `PRINTFUL_TOKEN`. When the token is absent the route returns `503`, so keep `NEXT_PUBLIC_USE_EDM=false` (Fabric fallback) until staging validates the Printful handshake. Flip the flag to `true` once the iframe loads reliably with live credentials.
>
> **EDM file uploads:** `/api/edm/templates` now uploads EDM exports to Printful's `/v2/files` API. Missing or invalid `PRINTFUL_TOKEN` means the server falls back to storing the preview URL only, which blocks `/api/order/create` from hitting the live Printful sandbox. Always confirm the token before staging orders.

#### Development Environment
```env
# Printful Configuration (Test Store)
PRINTFUL_TOKEN=pr_test_your_test_token
PRINTFUL_STORE_ID=your_test_store_id

# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_test_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret
STRIPE_SHIPPING_RATE_STANDARD=shr_dev_standard_rate_id
STRIPE_SHIPPING_RATE_EXPRESS=shr_dev_express_rate_id

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
USE_EDM=false
NEXT_PUBLIC_USE_EDM=false

# Feature Flags
SHOW_EXPRESS_SHIPPING=true
NEXT_PUBLIC_SHOW_EXPRESS_SHIPPING=true
ENABLE_ANALYTICS=false
```

### Segment Analytics Promotion (Sprint02-Task21)
The preview + production Segment credentials now live in Segment Connections + 1Password. Use this checklist whenever you promote or rotate them:

1. **Pull redacted snapshots** so nothing leaks into git: `vercel env pull .env.preview` and `vercel env pull .env.production`. These files should stay ignored but give you a safe diff.
2. **Preview scope (safe mode):**
   ```bash
   vercel env add SEGMENT_WRITE_KEY preview
   vercel env add NEXT_PUBLIC_SEGMENT_WRITE_KEY preview
   vercel env add NEXT_PUBLIC_ANALYTICS_TEMPLATE_SALT preview
   vercel env add NEXT_PUBLIC_ANALYTICS_SINK preview # "segment"
   vercel env add NEXT_PUBLIC_ANALYTICS_SAMPLE_RATE preview # "1"
   vercel env add NEXT_PUBLIC_SEGMENT_PREVIEW_ONLY preview # "1" keeps traffic local
   ```
   Preview deployments should always run with `NEXT_PUBLIC_SEGMENT_PREVIEW_ONLY=1` so telemetry stays in `window.__snapcaseSegmentPreview` and cannot hit Segment accidentally.
3. **Production scope (live mode):** repeat the commands targeting `production`, using the prod write key + salt pulled from 1Password. **Do not** set `NEXT_PUBLIC_SEGMENT_PREVIEW_ONLY` (or set it to `0`) so `analytics.js` forwards events downstream.
4. **Cross-check:** `vercel env ls` plus `vercel env diff preview` / `production` must show the same key set as `.env.preview` / `.env.production`. Any mismatch means a redeploy would ship stale keys.
5. **Verification:** after redeploying each environment, run `/design?forceEdm=1` → `/thank-you` and capture:
   - DevTools → Console showing `window.__snapcaseSegmentPreview` entries (preview) or Network calls to `api.segment.io/v1/track` (production).
   - Segment Debugger screenshot highlighting `design_loaded` + `thank_you_viewed` with hashed `templateFingerprint`.
   - Note the deployment + evidence path in the corresponding Agent Report.
6. **Rollback / maintenance:** If analytics must pause, set `NEXT_PUBLIC_SEGMENT_PREVIEW_ONLY=1` for both scopes, redeploy, and confirm Segment stops receiving events. Rotate salts quarterly alongside the write keys; document the new alias (e.g., `snapcase-prod-salt-2026-02-01`) in `docs/MCP_Credentials.md`.

### Secrets Management (PRINTFUL_TOKEN & STRIPE_SECRET_KEY)

| Secret | Development | Preview | Production | Owner / Rotation | Verification |
| --- | --- | --- | --- | --- | --- |
| `PRINTFUL_TOKEN` | `.env.local` (test token) | Vercel → **Preview** env variable | Vercel → **Production** env variable | Ethan (Printful) rotates quarterly or on incident | `node scripts/check-printful-nonce.js` + `/design` diagnostics |
| `STRIPE_SECRET_KEY` | `.env.local` (test key) | Vercel → **Preview** env variable (`sk_test`) | Vercel → **Production** env variable (`sk_live`) | Ethan (Stripe) rotates every 6 months | `npm run verify` (Stripe smoke) + `stripe trigger checkout.session.completed` |

Management flow:
1. Use `vercel env add PRINTFUL_TOKEN preview` / `production` (same for Stripe). Confirm via `vercel env ls`.
2. Run `vercel env pull .env.preview` after each rotation and copy values into `.env.local` for parity (never commit files containing secrets).
3. For previews, double-check that the **dev alias** references the deployment that already has refreshed secrets; run `vercel env diff preview` if unsure.
4. Document every rotation (date, token nickname, allowlist domains) in `docs/Printful_EDM_InvalidOrigin.md` and `PROGRESS.md`.

> **Why this matters:** Printful EDM validates the *domain* **and** the nonce signing token. A stale token + new alias will still fail with `invalidOrigin`. Stripe live/test keys must only exist in their matching Vercel environments to avoid accidental live charges during preview testing.

### Vercel Configuration
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "PRINTFUL_TOKEN": "@printful-token",
    "STRIPE_SECRET_KEY": "@stripe-secret-key",
    "STRIPE_WEBHOOK_SECRET": "@stripe-webhook-secret",
    "NEXT_PUBLIC_APP_URL": "@next-public-app-url",
    "USE_EDM": "@use-edm"
  },
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

## 🌐 Domain Configuration

### DNS Setup (GoDaddy)
```dns
# Create CNAME record
Type: CNAME
Name: app
Value: cname.vercel-dns.com
TTL: 3600

# Optional: Create www redirect
Type: CNAME
Name: www.app
Value: cname.vercel-dns.com
TTL: 3600
```

### Vercel Domain Configuration
```bash
# Add custom domain to Vercel project
vercel domains add app.snapcase.ai

# Verify domain configuration
vercel domains ls
```

#### dev.snapcase.ai Preview Alias
1. **DNS** (GoDaddy): `dev.snapcase.ai` → `2cceb30524b3f38d.vercel-dns-017.com` (already provisioned—only update if Vercel rotates the target).
2. **Attach the alias**: `vercel alias set <deployment-url> dev.snapcase.ai`.
3. **Confirm SSL + protection**: `vercel certs ls dev.snapcase.ai` should show the latest LetsEncrypt cert; in the dashboard, verify Deployment Protection lists `dev.snapcase.ai` under *Unprotected Domains*.
4. **Regression checks**: Run `npm run verify -- --base https://dev.snapcase.ai`, load `/design` (watch the EDM diagnostics panel), and capture a screenshot for Printful if they are validating EDM postMessage flows.

#### DNS Cutover Plan (app.snapcase.ai)
| Step | Owner | Status | Notes / Checks |
| --- | --- | --- | --- |
| Confirm GoDaddy access + delegation | Ethan | ✅ | Account: `ethan@snapcase.ai`. MFA hardware key stored in SnapCase vault. |
| Prep Vercel records | AI Assist | ✅ | `app.snapcase.ai` already added to `snapcase-app` project (see `vercel domains ls`). |
| Create/verify CNAME | Ethan | 🔄 | Point `app.snapcase.ai` → `cname.vercel-dns.com`. TTL 600 recommended during cutover. |
| Smoke test staging alias before switch | Ethan | 🔄 | Use `curl https://dev.snapcase.ai/api/health` + manual `/design` test with Printful diagnostics. |
| Cutover window | Ethan + Printful | 🔄 | Target: Week of Nov 4. Coordinate on #infra Slack channel. |
| Post-cutover validation | Ethan | 🔄 | `dig app.snapcase.ai`, Vercel domain status = `Ready`, Printful EDM handshake from production alias successful, Stripe test checkout hits new origin. |

> **If rollback is required:** change the CNAME back to the legacy Squarespace endpoint and redeploy the previous Vercel build. Keep the updated DNS plan mirrored in `docs/TECHNICAL_ARCHITECTURE.md#🌐 Domain Configuration`.

## 🚀 Deployment Process

### 1. Development Deployment
```bash
# Start development server
npm run dev

# Deploy to Vercel preview
vercel

# Deploy specific branch
vercel --prod
```

### 2. Staging Deployment
```bash
# Create staging branch
git checkout -b staging

# Push to staging branch
git push origin staging

# Deploy staging environment
vercel --target staging
```

### 3. Production Deployment
```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Deploy to production
vercel --prod

# Verify deployment
curl https://app.snapcase.ai/api/health
```

### 4. Automated Deployment (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 🔄 Deployment Strategies

### Blue-Green Deployment
```bash
# Deploy to staging first
vercel --target staging

# Test staging deployment
npm run test:staging

# Promote to production
vercel --prod
```

### Canary Deployment
```bash
# Deploy with traffic splitting
vercel --prod --traffic-split=10

# Monitor metrics
vercel analytics

# Increase traffic gradually
vercel --prod --traffic-split=50
vercel --prod --traffic-split=100
```

### Rollback Strategy
```bash
# View deployment history
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]

# Rollback to specific version
vercel rollback v1.0.0
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
```typescript
// /api/health
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      stripe: await checkStripeHealth(),
      printful: await checkPrintfulHealth(),
      database: await checkDatabaseHealth()
    },
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
  };

  return Response.json(health);
}
```

### Monitoring Setup
```bash
# Install monitoring tools
npm install --save-dev @vercel/analytics

# Configure analytics
// In your app
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

### Performance Monitoring
```typescript
// Performance monitoring setup
export function trackPerformance(event: string, data: any) {
  if (typeof window !== 'undefined') {
    // Vercel Analytics
    va.track(event, data);
    
    // Custom metrics
    gtag('event', event, {
      event_category: 'performance',
      ...data
    });
  }
}
```

## 🔒 Security Configuration

### SSL/TLS Setup
```bash
# Vercel automatically provides SSL certificates
# Verify SSL configuration
curl -I https://app.snapcase.ai

# Check certificate validity
openssl s_client -connect app.snapcase.ai:443 -servername app.snapcase.ai
```

### Security Headers
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Environment Security
```bash
# Verify environment variables are not exposed
vercel env ls

# Rotate secrets regularly
vercel env rm PRINTFUL_TOKEN
vercel env add PRINTFUL_TOKEN
```

## 🧪 Testing in Deployment

### Pre-Deployment Testing
```bash
# Run full test suite
npm run test

# Run E2E tests against staging
npm run test:e2e:staging

# Performance testing
npm run test:performance

# Security scanning
npm audit
```

### Post-Deployment Testing
```bash
# Smoke tests
curl https://app.snapcase.ai/api/health
curl https://app.snapcase.ai/api/catalog/phones

# Functional testing
npm run test:smoke:production

# Performance validation
lighthouse https://app.snapcase.ai --output=json
```

## 📈 Performance Optimization

### Build Optimization
```typescript
// next.config.js
module.exports = {
  // Optimize bundle size
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons']
  },
  
  // Image optimization
  images: {
    domains: ['files.cdn.printful.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },
  
  // Compression
  compress: true,
  
  // Static generation
  output: 'standalone'
};
```

### Caching Strategy
```typescript
// API route caching
export async function GET() {
  const data = await fetchData();
  
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'CDN-Cache-Control': 'max-age=3600',
      'Vercel-CDN-Cache-Control': 'max-age=86400'
    }
  });
}
```

## 🔧 Troubleshooting

### Common Deployment Issues

#### 1. Build Failures
```bash
# Check build logs
vercel logs [deployment-url]

# Common fixes
npm ci --only=production
npm run build
```

#### 2. Environment Variable Issues
```bash
# Verify environment variables
vercel env ls

# Check variable values (without exposing secrets)
vercel env pull .env.local
```

#### 3. Domain Issues
```bash
# Check domain configuration
vercel domains ls

# Verify DNS propagation
nslookup app.snapcase.ai
dig app.snapcase.ai
```

#### 4. Performance Issues
```bash
# Check function execution times
vercel logs --follow

# Monitor resource usage
vercel analytics
```

### Debug Commands
```bash
# View deployment details
vercel inspect [deployment-url]

# Check function logs
vercel logs [function-name]

# Debug environment
vercel env pull .env.debug
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Run `npm run verify` (required before staging and production promotions)
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Domain DNS configured
- [ ] SSL certificate valid
- [ ] Performance budgets met
- [ ] Security scan passed

### Deployment
- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Verify all endpoints working
- [ ] Check error rates
- [ ] Monitor performance metrics

### Post-Deployment
- [ ] Health check passing
- [ ] Analytics tracking
- [ ] Error monitoring active
- [ ] Performance monitoring active
- [ ] Backup procedures verified

### Rollback Plan
- [ ] Previous deployment identified
- [ ] Rollback procedure documented
- [ ] Monitoring for issues
- [ ] Communication plan ready

## 📌 Outstanding Infra To-Dos

| Task | Owner | Status | Details / Reference |
| --- | --- | --- | --- |
| Verify `dev.snapcase.ai` with Printful support | Ethan | 🔄 | Provide `_vercel_share` link + alias URL, confirm EDM no longer logs `invalidOrigin`. |
| Complete `app.snapcase.ai` DNS cutover | Ethan | 🔄 | See **DNS Cutover Plan (app.snapcase.ai)** in this guide plus `docs/TECHNICAL_ARCHITECTURE.md#🌐 Domain Configuration`. |
| Store production `STRIPE_SECRET_KEY` in Vercel | Ethan | 🔄 | Add to `snapcase-app` project → Production env, update rotation log in `PROGRESS.md`. |
| Align ESLint/Next versions before GA release | AI Assist | 🟡 | Blocks automated `npm run lint` gate in deployment checklist. Track progress in `PROGRESS.md`. |

## 📚 Additional Resources

### Documentation Links
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Printful API](https://developers.printful.com/)

### Support Contacts
- **Vercel Support**: [Vercel Support](https://vercel.com/support)
- **Stripe Support**: [Stripe Support](https://support.stripe.com/)
- **Printful Support**: [Printful Support](https://www.printful.com/help)

---

**Document Owner**: Ethan Trifari  
**Deployment Lead**: AI Assistant  
**Last Updated**: November 3, 2025

## MCP Connectivity Checklist
- Ensure OS-level tokens (`GITHUB_PAT`, `VERCEL_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`) align with docs/MCP_Credentials.md.
- Run `npm run verify:mcp` before deploys to confirm GitHub, Vercel, and Stripe servers respond; resolve failures before promoting builds.
- Document MCP automation gaps in PROGRESS.md so deploy runbooks stay current.
