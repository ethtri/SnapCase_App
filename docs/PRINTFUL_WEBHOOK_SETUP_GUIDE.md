# Printful Webhook Setup Guide - Store 17088301

**Store ID**: 17088301  
**Date**: 2025-11-24

## Overview

**IMPORTANT**: Printful webhooks are **NOT configured through the dashboard UI**. They must be managed via the **Printful API** using REST endpoints.

This guide walks you through:
1. Checking current webhook configuration via API
2. Setting/updating webhook URLs via API
3. Understanding webhook secrets (Printful’s API does **not** expose a signing secret)
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

**Important**: For store `17088301`, Printful’s API does **NOT** expose a webhook signing secret. `GET /webhooks` and `POST /webhooks` return only `url`, `types`, and an empty `params` array—no `secret`/`secret_key` fields. There is no alternate endpoint documented to fetch one.

- If Printful ever publishes a secret, the signature will be in `X-PF-Signature` / `X-Printful-Signature`, and the handler can verify with `PRINTFUL_WEBHOOK_SECRET`.
- Until then, signature verification cannot be enabled.

### 4.2 Setting Your Webhook Secret

Leave `PRINTFUL_WEBHOOK_SECRET` **unset**. This is intentional given the current API surface. The handler already:

- Enforces JSON parsing and a 5 MB body cap.
- Derives event IDs from headers/body and short-circuits duplicates.
- Archives payloads under `Images/diagnostics/printful`.

If Printful later exposes a secret, set `PRINTFUL_WEBHOOK_SECRET` and re-run `tests/integration/printful-webhook-route.test.ts`.

---

## Step 5: Configure Environment Variables in Vercel

### 5.1 PRINTFUL_WEBHOOK_SECRET

- Leave **unset** in all environments (API does not provide a secret).
- If Printful publishes a secret in the future, add `PRINTFUL_WEBHOOK_SECRET` to preview + production and re-run the integration test.

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

- **Current limitation**: Printful does not expose a webhook secret for store `17088301`, so signature verification cannot be enabled today.
- Keep `PRINTFUL_WEBHOOK_SECRET` unset. If Printful later publishes a secret, set it in preview/prod and re-run the integration test.
- The handler already enforces JSON parsing, body-size caps, duplicate-event short-circuiting, and payload archiving.

---

## Next Steps

Once confirmed:

1. **Optional**: `npx --yes jest --runInBand tests/integration/printful-webhook-route.test.ts` (uses stubbed secrets inside the test)
2. **Update AgentReport**: Document the webhook URL and note that no signing secret is available from Printful
3. **Update PROGRESS.md**: Log the current posture and limitations

---

## What to Report Back

After completing the setup, report:

```
Webhook URLs set to:
- dev: https://dev.snapcase.ai/api/webhooks/printful (or production URL)
- prod: https://app.snapcase.ai/api/webhooks/printful

PRINTFUL_WEBHOOK_SECRET set in dev/prod: leave unset (Printful does not expose a secret).

PRINTFUL_WEBHOOK_ARCHIVE_DIR set: Images/diagnostics/printful.
```

**Do NOT share the actual secret value** - just confirm it's set.

