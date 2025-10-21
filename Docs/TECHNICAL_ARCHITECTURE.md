# Technical Architecture - SnapCase App

**Project**: SnapCase Custom Phone Case Platform  
**Version**: v1.0  
**Last Updated**: December 2024  
**Owner**: Ethan Trifari  

## 🏗️ System Architecture Overview

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Marketing     │    │   App Domain    │    │   External      │
│   (Squarespace) │    │  (app.snapcase.ai) │    │   Services     │
│   snapcase.ai   │    │   (Vercel)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DNS/CDN       │    │   Next.js 14    │    │   Stripe API    │
│   (GoDaddy)     │    │   (App Router)  │    │   Printful API  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context + localStorage
- **Image Processing**: Fabric.js (fallback editor)
- **Design Editor**: Printful EDM (primary) / Fabric.js (fallback)

#### Backend
- **Runtime**: Node.js 18+ (Vercel Serverless)
- **API Routes**: Next.js API Routes
- **Authentication**: Printful EDM nonces
- **Payment Processing**: Stripe Checkout
- **File Storage**: Printful (design templates)

#### Infrastructure
- **Hosting**: Vercel
- **CDN**: Vercel Edge Network
- **Domain**: app.snapcase.ai (CNAME to Vercel)
- **SSL**: Automatic (Vercel)
- **Monitoring**: Vercel Analytics + Function Logs

## 📊 Data Flow Architecture

### 1. Design Creation Flow
```
User Upload → Client Validation → EDM/Fabric.js → Template Storage → Checkout
     │              │                    │              │              │
     ▼              ▼                    ▼              ▼              ▼
localStorage → DPI Check → Printful API → Template ID → Stripe Session
```

### 2. Order Processing Flow
```
Stripe Checkout → Webhook → Order Creation → Printful API → Fulfillment
       │              │           │              │             │
       ▼              ▼           ▼              ▼             ▼
   Payment OK → Order Paid → Printful Order → Production → Shipping
       │              │           │              │             │
       ▼              ▼           ▼              ▼             ▼
   Idempotent → Retry Logic → Reconciliation → Status Sync → Tracking
```

### 3. Status Update Flow
```
Printful Webhook → Status Update → User Notification → Order Tracking
       │               │                │                   │
       ▼               ▼                ▼                   ▼
   Order Event → Database Update → Email/SMS → Tracking Link
```

## 🗄️ Data Architecture

### Data Storage Strategy

#### Client-Side Storage
```typescript
// localStorage structure
interface SnapcaseDraft {
  id: string;
  variantId: number;
  designData: {
    templateId?: string;        // Printful EDM template
    fabricData?: string;        // Fabric.js JSON
    previewImage: string;       // Base64 preview
  };
  createdAt: number;
  lastModified: number;
}

// Session storage for checkout
interface CheckoutSession {
  orderId: string;
  variantId: number;
  templateId?: string;
  price: number;
  shipping: 'standard' | 'express';
}
```

#### Server-Side Storage (Minimal)
```typescript
// Order tracking (temporary storage)
interface OrderRecord {
  id: string;
  printfulOrderId?: number;
  stripeSessionId: string;
  status: 'pending' | 'paid' | 'submitted' | 'shipped' | 'failed';
  variantId: number;
  templateId?: string;
  email?: string;
  tracking?: {
    carrier: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Database Strategy (v0)
- **Primary**: Vercel KV (Redis) for temporary order tracking
- **Backup**: Printful API for order persistence
- **Future**: PostgreSQL for user accounts and order history

**⚠️ Important KV Limitations**:
- Vercel KV is eventually consistent (not transactional)
- Race conditions possible with concurrent webhook updates
- Printful order ID is the single source of truth
- Reconciliation job runs hourly to sync states

## 🔌 API Architecture

### Internal API Routes
```
/api/
├── edm/
│   └── nonce          # POST - Generate Printful EDM nonce
├── catalog/
│   └── phones         # GET - Device catalog
├── checkout/
│   └── session        # POST - Create Stripe checkout session
├── order/
│   └── create         # POST - Create Printful order
└── webhooks/
    ├── stripe         # POST - Stripe webhook handler
    └── printful       # POST - Printful webhook handler
```

## 🔄 Webhook Reliability & Idempotency

### Webhook Event Processing
```typescript
interface WebhookEvent {
  id: string;                    // Unique event identifier
  processed: boolean;           // Processing status
  retryCount: number;           // Retry attempts
  lastAttempt: string;          // Last processing timestamp
  eventType: string;            // Stripe/Printful event type
  payload: any;                 // Event payload
  signature: string;            // Webhook signature
}

// Idempotency check
async function processWebhook(eventId: string, payload: any) {
  const existingEvent = await kv.get(`webhook:${eventId}`);
  
  if (existingEvent?.processed) {
    return { success: true, message: 'Already processed' };
  }
  
  // Process event with retry logic
  await processWithRetry(eventId, payload);
}
```

### Retry Strategy
```typescript
// Exponential backoff retry
async function processWithRetry(eventId: string, payload: any) {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await processWebhookEvent(payload);
      await kv.set(`webhook:${eventId}`, { processed: true, attempt });
      break;
    } catch (error) {
      if (attempt === maxRetries) {
        await kv.set(`webhook:${eventId}`, { 
          processed: false, 
          error: error.message,
          retryCount: attempt 
        });
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Reconciliation Job
```typescript
// Hourly reconciliation to sync states
export async function reconcileOrders() {
  const orders = await kv.keys('order:*');
  
  for (const orderKey of orders) {
    const order = await kv.get(orderKey);
    const printfulOrder = await getPrintfulOrder(order.printfulOrderId);
    
    if (printfulOrder.status !== order.status) {
      await kv.set(orderKey, {
        ...order,
        status: printfulOrder.status,
        lastReconciled: new Date().toISOString()
      });
    }
  }
}
```

### External API Integration

#### Printful API
```typescript
// EDM Integration
POST https://api.printful.com/embedded-designer/nonces
Headers: { Authorization: `Bearer ${PRINTFUL_TOKEN}` }
Body: { external_product_id: string, user_agent?: string, ip?: string }

// Order Creation
POST https://api.printful.com/orders
Headers: { Authorization: `Bearer ${PRINTFUL_TOKEN}` }
Body: { 
  external_id: string,
  shipping: AddressInfo,
  items: OrderItem[],
  confirm: true
}
```

#### Stripe API
```typescript
// Checkout Session
POST https://api.stripe.com/v1/checkout/sessions
Headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` }
Body: {
  mode: 'payment',
  line_items: LineItem[],
  success_url: string,
  cancel_url: string,
  metadata: Record<string, string>
}
```

## 🔒 Security Architecture

### Authentication & Authorization
- **No User Authentication**: Guest-only experience in v0
- **API Security**: Server-side only API keys
- **Rate Limiting**: Upstash Redis-based rate limiting with sliding windows
- **Input Validation**: Zod schemas for all API inputs

### Data Protection
```typescript
// Environment Variables (Server-side only)
PRINTFUL_TOKEN=pr_*           // Printful API token
STRIPE_SECRET_KEY=sk_*        // Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_* // Stripe webhook secret
NEXT_PUBLIC_APP_URL=https://app.snapcase.ai

// Client-side (Safe to expose)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_*
NEXT_PUBLIC_PRINTFUL_STORE_ID=12345
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
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://files.cdn.printful.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://files.cdn.printful.com https://cdn.snapcase.ai data:",
      "frame-src 'self' https://checkout.stripe.com https://files.cdn.printful.com",
      "connect-src 'self' https://api.stripe.com https://api.printful.com",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "frame-ancestors 'none'"
    ].join('; ')
  }
]

// Rate limiting implementation
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const rateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute
  analytics: true,
});

// API route rate limiting middleware
export async function rateLimitMiddleware(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success, limit, reset, remaining } = await rateLimiter.limit(ip);
  
  if (!success) {
    return new Response("Rate limit exceeded", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": new Date(reset).toISOString(),
      },
    });
  }
  
  return null; // Continue processing
}
```

### Data Privacy & Compliance
```typescript
// Privacy compliance configuration
const privacyConfig = {
  // Data retention policy
  dataRetention: {
    orderData: '7 years',      // Tax/compliance requirements
    emailAddresses: '30 days', // Transient for notifications only
    designTemplates: '90 days', // Temporary storage
    analyticsData: '2 years'   // Business intelligence
  },
  
  // GDPR/CCPA compliance
  compliance: {
    dataController: 'Bloomjoy',
    dataProcessor: 'Printful (fulfillment), Stripe (payments)',
    lawfulBasis: 'Contract performance (order fulfillment)',
    dataMinimization: true,
    purposeLimitation: true
  },
  
  // User rights implementation
  userRights: {
    rightToAccess: true,       // Order history access
    rightToRectification: true, // Order modification
    rightToErasure: true,      // Account deletion
    rightToPortability: true   // Data export
  }
};

// Email data handling
interface EmailData {
  email: string;
  purpose: 'order_notification' | 'marketing' | 'support';
  retentionPeriod: string;
  canDelete: boolean;
  source: 'stripe_checkout' | 'manual_input';
}
```

## ⚡ Performance Architecture

### Caching Strategy
```typescript
// API Route Caching
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
}

// Static Asset Optimization
// next.config.js
module.exports = {
  images: {
    domains: ['files.cdn.printful.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  }
}
```

### Bundle Optimization
```typescript
// Dynamic imports for heavy components
const DesignEditor = dynamic(() => import('./DesignEditor'), {
  loading: () => <EditorSkeleton />,
  ssr: false
})

// Code splitting by route
const CheckoutPage = dynamic(() => import('./CheckoutPage'), {
  loading: () => <CheckoutSkeleton />
})
```

### Performance Targets
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Editor Load Time**: < 2s after route navigation

## 🔄 Error Handling Architecture

### Error Boundaries
```typescript
// Global error boundary
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="error-container">
          <h2>Something went wrong!</h2>
          <button onClick={() => reset()}>Try again</button>
        </div>
      </body>
    </html>
  )
}
```

### API Error Handling
```typescript
// Standardized error response
interface APIError {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Enhanced error logging with correlation IDs
interface LogContext {
  requestId: string;
  userId?: string;
  orderId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
}

export function logError(error: Error, context: LogContext) {
  const errorLog = {
    level: 'error',
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    service: 'snapcase-app',
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
  };
  
  // Console logging for development
  console.error(JSON.stringify(errorLog));
  
  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry, Logtail, or Axiom
    sendToMonitoringService(errorLog);
  }
}

// Correlation ID middleware
export function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getCorrelationId(request: Request): string {
  return request.headers.get('x-correlation-id') || generateCorrelationId();
}
```

## 📊 Monitoring & Observability

### Application Monitoring
```typescript
// Performance monitoring
export function trackPerformance(event: string, data: any) {
  if (typeof window !== 'undefined') {
    // Vercel Analytics
    va.track(event, data)
    
    // Custom analytics
    gtag('event', event, {
      event_category: 'performance',
      ...data
    })
  }
}

// Error tracking
export function trackError(error: Error, context: any) {
  console.error('Application Error:', {
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  })
  
  // Send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Add error tracking service
  }
}
```

### Key Metrics
- **Conversion Rate**: editor_start → payment_succeeded
- **Performance**: Core Web Vitals
- **Errors**: API failures, client-side errors
- **Business**: Order volume, AOV, fulfillment success rate

## 🚀 Deployment Architecture

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
    "STRIPE_SECRET_KEY": "@stripe-secret-key"
  }
}
```

### Environment Strategy
- **Development**: Local environment with test APIs
- **Preview**: Vercel preview deployments for feature branches
- **Production**: Vercel production with live APIs

### Rollback Strategy
1. **Code Rollback**: Git revert + Vercel redeploy
2. **Database Rollback**: Vercel KV backup/restore
3. **API Rollback**: Feature flags for API endpoints
4. **Domain Rollback**: DNS CNAME switch to backup deployment

## 🔮 Future Architecture Considerations

### Scalability Improvements
- **Database Migration**: Move from KV to PostgreSQL
- **CDN Enhancement**: Custom CDN for design assets
- **Microservices**: Split into design, order, and fulfillment services
- **Caching Layer**: Redis for session and template caching

### Feature Additions
- **User Accounts**: Authentication system
- **Design Library**: Template management
- **Analytics Dashboard**: Business intelligence
- **Mobile App**: React Native or PWA

---

**Document Owner**: Ethan Trifari  
**Technical Review**: AI Assistant  
**Last Updated**: December 2024
