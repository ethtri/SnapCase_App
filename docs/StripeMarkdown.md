# Stripe Integration Guide - SnapCase App

**Project**: SnapCase Custom Phone Case Platform  
**Owner**: Ethan Trifari  
**Last Updated**: December 2024

## 🎯 Overview

This document provides comprehensive guidance for AI coding agents working on Stripe integration within the SnapCase application. It covers implementation patterns, error handling, webhook processing, and project-specific configurations.

**⚠️ CRITICAL**: Always cross-reference with the [official Stripe API documentation](https://docs.stripe.com/api) for the most up-to-date API specifications, parameters, and best practices.

## 🔧 Project Configuration

### Environment Variables
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### Dependencies
```json
{
  "dependencies": {
    "stripe": "^14.25.0"
  }
}
```

### Important Notes
- **API Version**: Using `2024-12-18.acacia` - the latest stable version
- **TypeScript Support**: Enabled with `typescript: true` option
- **SDK Version**: Stripe SDK v14.25.0 is compatible with the API version used
- **Webhook Security**: Always verify webhook signatures to prevent unauthorized requests

## 💳 Implementation Patterns

### 1. Checkout Session Creation

**File**: `src/app/api/checkout/route.ts`

```typescript
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

const checkoutSchema = z.object({
  variantId: z.number().int().positive(),
  templateId: z.string().optional(),
  designImage: z.string().url().optional(),
  email: z.string().email().optional(),
  quantity: z.number().int().positive().default(1),
}).refine(
  (data) => Boolean(data.templateId) || Boolean(data.designImage),
  "Either templateId (EDM) or designImage (Fabric export) must be provided."
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = checkoutSchema.parse(body);
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Custom Phone Case - Variant ${validatedData.variantId}`,
            images: validatedData.designImage ? [validatedData.designImage] : undefined,
          },
          unit_amount: 3499, // $34.99 in cents
        },
        quantity: validatedData.quantity,
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/design`,
      customer_email: validatedData.email,
      metadata: {
        variantId: validatedData.variantId.toString(),
        templateId: validatedData.templateId || '',
        designImage: validatedData.designImage || '',
        source: 'snapcase_web_app',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
        expiresAt: new Date(session.expires_at! * 1000).toISOString(),
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          issues: error.issues 
        },
        { status: 400 }
      );
    }

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'STRIPE_ERROR',
          message: 'Payment processing error',
          details: { 
            stripeError: error.code,
            type: error.type,
            requestId: error.requestId
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
```

### 2. Webhook Handling

> **Status (2025-10-24):** The live endpoint at `src/app/api/webhooks/stripe/route.ts` verifies signatures using `stripe.webhooks.constructEvent`, requires both `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, and logs key event types (`checkout.session.completed`, payment intent events). Handlers for order creation and idempotency storage remain TODO items.

**File**: `src/app/api/webhooks/stripe/route.ts`

```typescript
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Missing Stripe signature header');
    return NextResponse.json(
      { error: 'Missing signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Extract order data from session metadata
  const { variantId, templateId, designImage } = session.metadata || {};
  
  // Create order in Printful
  // TODO: Implement Printful order creation
  
  console.log('Checkout completed:', {
    sessionId: session.id,
    customerEmail: session.customer_email,
    variantId,
    templateId,
    designImage,
  });
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Handle successful payment
  console.log('Payment succeeded:', paymentIntent.id);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Handle failed payment
  console.log('Payment failed:', paymentIntent.id);
}
```

## 🛡️ Error Handling Patterns

### Stripe Error Types
```typescript
// Common Stripe errors to handle
const STRIPE_ERRORS = {
  CARD_DECLINED: 'card_declined',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  EXPIRED_CARD: 'expired_card',
  PROCESSING_ERROR: 'processing_error',
  INVALID_REQUEST_ERROR: 'invalid_request_error',
} as const;

// Error response format
interface StripeErrorResponse {
  success: false;
  error: 'STRIPE_ERROR';
  message: string;
  code: string;
  details: {
    stripeError: string;
    declineCode?: string;
  };
}
```

### Validation Patterns
```typescript
// Input validation for checkout requests
const validateCheckoutRequest = (data: unknown) => {
  const schema = z.object({
    variantId: z.number().int().positive(),
    templateId: z.string().optional(),
    designImage: z.string().url().optional(),
    email: z.string().email().optional(),
    quantity: z.number().int().positive().default(1),
  }).refine(
    (data) => Boolean(data.templateId) || Boolean(data.designImage),
    "Either templateId or designImage must be provided"
  );

  return schema.parse(data);
};
```

## 🔔 Webhook Events

### Required Webhook Events
Configure these events in your Stripe Dashboard:

1. **checkout.session.completed** - When customer completes checkout
2. **payment_intent.succeeded** - When payment is successful
3. **payment_intent.payment_failed** - When payment fails
4. **invoice.payment_succeeded** - For subscription payments (if applicable)

### Webhook Endpoint
```
https://app.snapcase.ai/api/webhooks/stripe
```

## 🧪 Testing

### Test Cards
```typescript
// Stripe test card numbers
const TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINED: '4000000000000002',
  INSUFFICIENT_FUNDS: '4000000000009995',
  EXPIRED_CARD: '4000000000000069',
} as const;
```

### Mock Implementation
```typescript
// For development without Stripe keys
if (!process.env.STRIPE_SECRET_KEY) {
  return NextResponse.json({
    mock: true,
    message: "Stripe secret key missing. Returning mock checkout session.",
    checkoutUrl: "https://dashboard.stripe.com/test/payments",
  });
}
```

## 📊 Monitoring & Logging

### Logging Patterns
```typescript
// Log successful operations
console.log('Stripe operation completed:', {
  operation: 'checkout_session_created',
  sessionId: session.id,
  amount: session.amount_total,
  timestamp: new Date().toISOString(),
});

// Log errors with context
console.error('Stripe error occurred:', {
  error: error.message,
  code: error.code,
  type: error.type,
  requestId: error.requestId,
  timestamp: new Date().toISOString(),
});
```

## 🔗 Integration Points

### With Printful
- Use Stripe metadata to pass order information to Printful
- Handle webhook events to trigger Printful order creation
- Sync payment status with Printful order status

### With Frontend
- Redirect to Stripe Checkout from `/checkout` page
- Handle success/failure redirects on `/thank-you` page
- Display payment status and order information

## 📚 Essential References

### Primary Documentation
- **[Stripe API Reference](https://docs.stripe.com/api)** - **CRITICAL**: The authoritative source for all Stripe API endpoints, parameters, and responses
- [Stripe Checkout Documentation](https://docs.stripe.com/payments/checkout) - Checkout session creation and management
- [Stripe Webhooks Documentation](https://docs.stripe.com/webhooks) - Webhook setup and event handling
- [Stripe Testing Guide](https://docs.stripe.com/testing) - Test cards and testing strategies

### Important Note for AI Coding Agents
**Always reference the [official Stripe API documentation](https://docs.stripe.com/api) when implementing Stripe features.** This document provides:
- Complete API endpoint specifications
- Request/response schemas
- Error codes and handling
- Authentication requirements
- Rate limiting information
- Latest API changes and deprecations

## ⚠️ Important API Considerations (December 2024)

### Recent Changes
- **API Version**: `2024-12-18.acacia` is the current stable version
- **TypeScript Support**: Always enable `typescript: true` for better type safety
- **Webhook Verification**: Use `request.headers.get()` instead of `headers()` in Next.js 14 App Router
- **Images Array**: Use `undefined` instead of empty array `[]` for optional product images

### Security Best Practices
- Always verify webhook signatures before processing events
- Use environment variables for all sensitive keys
- Implement proper error handling for all Stripe operations
- Log all webhook events for debugging and monitoring

### Performance Considerations
- Cache product data when possible to reduce API calls
- Use Stripe's idempotency keys for retry operations
- Implement proper timeout handling for webhook processing

---

**⚠️ IMPORTANT**: This documentation is specific to the SnapCase application and provides implementation patterns. **Always refer to the [official Stripe API documentation](https://docs.stripe.com/api) for the most up-to-date API information, parameter specifications, and official best practices.**

**Last Verified**: December 2024 against [Stripe API Reference](https://docs.stripe.com/api)
