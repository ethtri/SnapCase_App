# Account Setup Guide - SnapCase App

**Project**: SnapCase Custom Phone Case Platform  
**Owner**: Ethan Trifari  
**Last Updated**: December 2024

## 🎯 Quick Setup Checklist

### 1. Printful Account Setup
- [ ] Create Printful account at [printful.com](https://printful.com)
- [ ] Request EDM (Embedded Design Maker) access
- [ ] Get API token from [Printful Developers](https://developers.printful.com/)
- [ ] Note your Store ID from dashboard
- [ ] Set up test store for development

### 2. Stripe Account Setup
- [ ] Create Stripe account at [stripe.com](https://stripe.com)
- [ ] Get test API keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
- [ ] Configure webhook endpoint: `https://app.snapcase.ai/api/webhooks/stripe`
- [ ] Test webhook with Stripe CLI or dashboard

### 3. Vercel Account Setup
- [ ] Create Vercel account at [vercel.com](https://vercel.com)
- [ ] Connect GitHub repository
- [ ] Add environment variables:
  - `PRINTFUL_TOKEN`
  - `PRINTFUL_STORE_ID`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_APP_URL=https://app.snapcase.ai`
  - `USE_EDM=true`

### 4. Domain Configuration
- [ ] In Squarespace DNS settings, create CNAME record:
  - Name: `app`
  - Value: `cname.vercel-dns.com`
- [ ] In Vercel, add custom domain: `app.snapcase.ai`
- [ ] Verify SSL certificate

## 🔑 Environment Variables Template

```env
# Printful Configuration
PRINTFUL_TOKEN=pr_test_your_token_here
PRINTFUL_STORE_ID=your_store_id_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application Configuration
NEXT_PUBLIC_APP_URL=https://app.snapcase.ai
USE_EDM=true
```

## 📞 Support Contacts

- **Printful Support**: [help.printful.com](https://help.printful.com)
- **Stripe Support**: [support.stripe.com](https://support.stripe.com)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)

---

**Note**: Keep all API keys secure and never commit them to Git. Use Vercel environment variables for production secrets.
