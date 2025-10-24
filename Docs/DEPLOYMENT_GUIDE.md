# Deployment Guide - SnapCase App

**Project**: SnapCase Custom Phone Case Platform  
**Version**: v1.0  
**Last Updated**: October 22, 2025  
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

## 📋 Prerequisites

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

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
STRIPE_SHIPPING_RATE_STANDARD=shr_live_standard_rate_id
STRIPE_SHIPPING_RATE_EXPRESS=shr_live_express_rate_id

# Application Configuration
NEXT_PUBLIC_APP_URL=https://app.snapcase.ai
USE_EDM=true

# Feature Flags
SHOW_EXPRESS_SHIPPING=true
NEXT_PUBLIC_SHOW_EXPRESS_SHIPPING=true
ENABLE_ANALYTICS=true
```

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

# Feature Flags
SHOW_EXPRESS_SHIPPING=true
NEXT_PUBLIC_SHOW_EXPRESS_SHIPPING=true
ENABLE_ANALYTICS=false
```

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

# Feature Flags
SHOW_EXPRESS_SHIPPING=true
NEXT_PUBLIC_SHOW_EXPRESS_SHIPPING=true
ENABLE_ANALYTICS=false
```

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
**Last Updated**: October 21, 2025

## MCP Connectivity Checklist
- Ensure OS-level tokens (`GITHUB_PAT`, `VERCEL_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`) align with Docs/MCP_Credentials.md.
- Run `npm run verify:mcp` before deploys to confirm GitHub, Vercel, and Stripe servers respond; resolve failures before promoting builds.
- Document MCP automation gaps in PROGRESS.md so deploy runbooks stay current.
