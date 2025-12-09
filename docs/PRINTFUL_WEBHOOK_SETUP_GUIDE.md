# Printful Webhook Setup Guide - Store 17088301

**Store ID**: 17088301  
**Date**: 2025-11-24

## Overview

**IMPORTANT**: Printful webhooks are **NOT configured through the dashboard UI**. They must be managed via the **Printful API** using REST endpoints.

This guide walks you through:
1. Checking current webhook configuration via API
2. Setting/updating webhook URLs via API
3. Understanding webhook secrets (Printful doesn't provide a separate secret - signatures use HMAC)
4. Configuring environment variables in Vercel
5. Creating the archive directory

## Expected Webhook URLs

- **Development**: `https://dev.snapcase.ai/api/webhooks/printful`
- **Production**: `https://app.snapcase.ai/api/webhooks/printful`

---

## Step 1: Get Your Printful API Token

### 1.1 Access Printful Developers

1. Go to [Printful Developers](https://developers.printful.com/)
2. Log in with your Printful account
3. Click **"Create a token"** (or use an existing token)

### 1.2 Create/Verify Token

- **Store-level token**: Ensure the token is scoped to store `17088301`
- **Required scopes**: The token needs webhook management permissions
- **Copy the token**: You'll need it for the API calls below

> **Note**: If you already have `PRINTFUL_TOKEN` in your environment, you can use that. Make sure it's a store-level token for store 17088301.

---

## Step 2: Check Current Webhook Configuration

### 2.1 Retrieve Current Webhook Settings

Use this API call to see what's currently configured:

```bash
curl --location --request GET 'https://api.printful.com/webhooks' \
--header 'Authorization: Bearer YOUR_PRINTFUL_TOKEN' \
--header 'X-PF-Store-Id: 17088301'
```

**Response format:**
```json
{
  "code": 200,
  "result": {
    "url": "https://current-webhook-url.com/endpoint",
    "types": ["order_created", "order_updated", "package_shipped"]
  }
}
```

If no webhook is configured, you'll get an error or empty result.

### 2.2 What to Look For

- **Current URL**: Check if it matches your expected endpoints
- **Event types**: Verify which events are subscribed to
- **Missing configuration**: If the response shows no webhook, you'll need to set one up

---

## Step 3: Set/Update Webhook URL

### 3.1 Choose Your Webhook URL

**Option A: Use Production URL (Recommended)**
- URL: `https://app.snapcase.ai/api/webhooks/printful`
- Handles both dev and prod events

**Option B: Use Development URL (For Testing)**
- URL: `https://dev.snapcase.ai/api/webhooks/printful`
- Switch to production URL when ready

### 3.2 Set Webhook via API

**Important**: Printful allows **only one webhook URL per store**. Setting a new URL will replace any existing configuration.

```bash
curl --location --request POST 'https://api.printful.com/webhooks' \
--header 'Authorization: Bearer YOUR_PRINTFUL_TOKEN' \
--header 'X-PF-Store-Id: 17088301' \
--header 'Content-Type: application/json' \
--data-raw '{
  "url": "https://app.snapcase.ai/api/webhooks/printful",
  "types": [
    "order_created",
    "order_updated",
    "order_failed",
    "package_shipped",
    "package_returned"
  ]
}'
```

**Response:**
```json
{
  "code": 200,
  "result": {
    "url": "https://app.snapcase.ai/api/webhooks/printful",
    "types": ["order_created", "order_updated", "order_failed", "package_shipped", "package_returned"]
  }
}
```

### 3.3 Available Event Types

Common event types you may want to subscribe to:
- `order_created` - New order created
- `order_updated` - Order status changed
- `order_failed` - Order failed
- `package_shipped` - Package shipped (includes tracking)
- `package_returned` - Package returned
- `stock_updated` - Inventory changed

---

## Step 4: Understanding Webhook Secrets

### 4.1 Printful Webhook Signatures

**Important**: Printful does **NOT** provide a separate "webhook secret" like Stripe does. Instead:

- Printful signs webhooks using **HMAC-SHA256**
- The signature is sent in the `X-PF-Signature` or `X-Printful-Signature` header
- Your handler verifies signatures using a secret you generate yourself

### 4.2 Setting Your Webhook Secret

**Important Clarification**: Printful's webhook signature verification works differently than Stripe:

- Printful signs webhooks with HMAC-SHA256
- The signature is in the `X-PF-Signature` or `X-Printful-Signature` header
- **However**, Printful doesn't explicitly document what secret they use to generate signatures

**Options for signature verification:**

1. **Leave it unset (current behavior)**: Your handler works without signature verification when `PRINTFUL_WEBHOOK_SECRET` is not set. This is fine for development but not recommended for production.

2. **Test with your API token**: Some webhook providers use the API token as the secret. You can try setting `PRINTFUL_WEBHOOK_SECRET` to your `PRINTFUL_TOKEN` value and test if signatures validate.

3. **Contact Printful support**: Ask them how webhook signatures are generated and what secret/key is used.

4. **Generate your own (if Printful supports custom secrets)**: If Printful allows you to set a custom signing secret when registering the webhook, generate one:
   ```bash
   # On Linux/Mac
   openssl rand -hex 32
   
   # On Windows PowerShell
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
   ```

> **Current Status**: Your webhook handler (`src/app/api/webhooks/printful/route.ts`) supports signature verification when `PRINTFUL_WEBHOOK_SECRET` is set, but will work without it (fallback mode). For now, you can proceed without setting the secret and enable it later once you confirm how Printful generates signatures.

---

## Step 5: Configure Environment Variables in Vercel

### 5.1 Set PRINTFUL_WEBHOOK_SECRET (Optional)

**Note**: This is optional for now. Your handler works without it, but signature verification is recommended for production security.

If you want to enable signature verification:

```bash
# For Preview/Development
vercel env add PRINTFUL_WEBHOOK_SECRET preview
# Try using your PRINTFUL_TOKEN value first, or generate a random secret

# For Production
vercel env add PRINTFUL_WEBHOOK_SECRET production
# Use the same value as preview
```

**Important**: 
- Start by testing with your `PRINTFUL_TOKEN` value to see if Printful uses it for signatures
- If that doesn't work, you may need to contact Printful support to understand their signing mechanism
- Your handler will work without this variable set (fallback mode), but won't verify signatures

### 5.2 Set PRINTFUL_WEBHOOK_ARCHIVE_DIR

```bash
# For Preview/Development
vercel env add PRINTFUL_WEBHOOK_ARCHIVE_DIR preview
# Value: Images/diagnostics/printful

# For Production
vercel env add PRINTFUL_WEBHOOK_ARCHIVE_DIR production
# Value: Images/diagnostics/printful
```

### 5.3 Verify Environment Variables

```bash
# List all environment variables
vercel env ls

# Check specific variables
vercel env ls | grep PRINTFUL_WEBHOOK
```

You should see:
- `PRINTFUL_WEBHOOK_SECRET` (value hidden)
- `PRINTFUL_WEBHOOK_ARCHIVE_DIR` = `Images/diagnostics/printful`

---

## Step 6: Create Archive Directory

The webhook handler will automatically create the directory, but let's ensure it exists:

```bash
# From your project root
mkdir -p Images/diagnostics/printful
```

Or on Windows PowerShell:
```powershell
New-Item -ItemType Directory -Force -Path "Images\diagnostics\printful"
```

---

## Step 7: Test the Webhook (Optional)

### 7.1 Use Printful Webhook Simulator

Printful provides a webhook simulator for testing:

1. Go to [Printful Webhook Simulator](https://www.printful.com/api/webhook-simulator)
2. Enter your webhook URL: `https://app.snapcase.ai/api/webhooks/printful`
3. Select an event type (e.g., `package_shipped`)
4. Click **"Send test webhook"**
5. Check your application logs or the archive directory for the test payload
6. Verify the webhook handler responds with `200 OK`

### 7.2 Manual Verification

After saving the webhook URL, Printful may send a test event. Check:

1. **Archive directory**: `Images/diagnostics/printful/printful-webhook-*.json`
2. **Vercel logs**: `vercel logs` or Vercel dashboard → Deployments → Logs
3. **Handler response**: Should return `{ received: true, eventId: "...", ... }`

---

## Step 8: Confirmation Checklist

After completing all steps, confirm:

- [ ] **Webhook URL set to**: `https://app.snapcase.ai/api/webhooks/printful` (or dev equivalent)
- [ ] **PRINTFUL_WEBHOOK_SECRET set** in both preview and production (don't share the value)
- [ ] **PRINTFUL_WEBHOOK_ARCHIVE_DIR set** to `Images/diagnostics/printful` in both environments
- [ ] **Archive directory exists**: `Images/diagnostics/printful/`
- [ ] **Test webhook received** (optional but recommended)

---

## Troubleshooting

### API Authentication Errors

- **401 Unauthorized**: Check that your `PRINTFUL_TOKEN` is valid and has the correct scopes
- **403 Forbidden**: Ensure the token is scoped to store `17088301`
- **Token expired**: Generate a new token in Printful Developers portal

### Webhook Not Receiving Events

1. **Check URL is correct**: No typos, includes `https://`, ends with `/api/webhooks/printful`
2. **Check Vercel deployment**: Ensure latest code is deployed
3. **Check environment variables**: `vercel env ls` to confirm secrets are set
4. **Check Printful logs**: Some dashboards show webhook delivery status
5. **Test manually**: Use Printful's test button if available

### Signature Validation Failing

- **Important**: Printful doesn't provide a webhook secret - you generate your own
- Ensure `PRINTFUL_WEBHOOK_SECRET` is set in your environment variables
- Check for extra spaces or newlines when setting the secret
- Verify the secret is set in the correct Vercel environment (preview vs production)
- Your handler will work without signature validation if `PRINTFUL_WEBHOOK_SECRET` is not set (fallback mode), but it's recommended to enable it for security

---

## Next Steps

Once confirmed:

1. **Rerun integration test**: `npx --yes jest --runInBand tests/integration/printful-webhook-route.test.ts`
2. **Update AgentReport**: Document the webhook URLs (domains/paths only, no secrets)
3. **Update PROGRESS.md**: Mark Task44 as complete
4. **Merge Task44**: If all tests pass

---

## What to Report Back

After completing the setup, report:

```
Webhook URLs set to:
- dev: https://dev.snapcase.ai/api/webhooks/printful (or production URL)
- prod: https://app.snapcase.ai/api/webhooks/printful

PRINTFUL_WEBHOOK_SECRET set in dev/prod: ✅

PRINTFUL_WEBHOOK_ARCHIVE_DIR set: ✅
```

**Do NOT share the actual secret value** - just confirm it's set.

