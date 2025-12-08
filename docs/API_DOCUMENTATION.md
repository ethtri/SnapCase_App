# API Documentation - SnapCase App

**Project**: SnapCase Custom Phone Case Platform  
**Version**: v1.0  
**Last Updated**: December 2024  
**Owner**: Ethan Trifari  

## 🌐 API Overview

The SnapCase API provides endpoints for device catalog management, design editor integration, payment processing, and order fulfillment. All endpoints are built using Next.js API Routes and follow RESTful conventions.

### Base URL
- **Production**: `https://app.snapcase.ai/api`
- **Development**: `http://localhost:3000/api`

### Authentication
- **Internal APIs**: No authentication required (server-side only)
- **External APIs**: Bearer token authentication for Printful and Stripe

### Response Format
All API responses follow a consistent format:

```typescript
// Success Response
{
  success: true,
  data: any,
  message?: string
}

// Error Response
{
  success: false,
  error: string,
  message: string,
  code?: string,
  details?: Record<string, any>
}
```

## 📱 Device Catalog API

### GET /api/catalog/phones

Retrieves the list of supported phone models and case variants.

#### Request
```http
GET /api/catalog/phones
```

#### Response
```typescript
{
  success: true,
  data: {
    brands: [
      {
        id: 'apple',
        name: 'Apple',
        models: [
          {
            id: 'iphone-15',
            name: 'iPhone 15',
            image: 'https://cdn.example.com/iphone-15.png',
            cases: [
              {
                id: 'snap',
                name: 'Snap Case',
                price: 3499,
                productId: 123,
                variantId: 456,
                available: true,
                estimatedShipping: '2-5 business days'
              }
            ]
          }
        ]
      }
    ]
  }
}
```

#### Error Responses
```typescript
// Service Unavailable
{
  success: false,
  error: 'SERVICE_UNAVAILABLE',
  message: 'Device catalog is temporarily unavailable',
  code: 'CATALOG_ERROR'
}
```

## 🎨 Design Editor API

### POST /api/edm/nonce

Generates a nonce for Printful Embedded Design Maker authentication.

#### Request
```http
POST /api/edm/nonce
Content-Type: application/json

{
  "externalProductId": "123",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.1"
}
```

#### Response
```typescript
{
  success: true,
  data: {
    nonce: "pf_nonce_abc123def456",
    expiresAt: "2024-12-25T12:00:00Z"
  }
}
```

#### Error Responses
```typescript
// Invalid Product ID
{
  success: false,
  error: 'INVALID_PRODUCT',
  message: 'Product ID not found in catalog',
  code: 'PRODUCT_NOT_FOUND'
}

// EDM Service Unavailable
{
  success: false,
  error: 'EDM_UNAVAILABLE',
  message: 'Design editor is temporarily unavailable',
  code: 'EDM_ERROR'
}
```

## 💳 Payment API

### POST /api/checkout

Creates a Stripe Checkout session for order payment.

#### Request
```http
POST /api/checkout
Content-Type: application/json

{
  "variantId": 456,
  "templateId": "template_789",
  "email": "customer@example.com",
  "shipping": {
    "method": "standard",
    "address": {
      "line1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94105",
      "country": "US"
    }
  },
  "metadata": {
    "source": "web_app",
    "campaign": "launch"
  }
}
```

#### Response
```typescript
{
  success: true,
  data: {
    sessionId: "cs_test_123456789",
    url: "https://checkout.stripe.com/pay/cs_test_123456789",
    expiresAt: "2024-12-25T13:00:00Z"
  }
}
```

#### Error Responses
```typescript
// Invalid Variant
{
  success: false,
  error: 'INVALID_VARIANT',
  message: 'Selected phone case variant is not available',
  code: 'VARIANT_NOT_FOUND'
}

// Stripe Error
{
  success: false,
  error: 'PAYMENT_ERROR',
  message: 'Unable to create payment session',
  code: 'STRIPE_ERROR',
  details: {
    stripeError: 'invalid_request_error'
  }
}
```

## 📦 Order Management API

### POST /api/order/create

Creates an order in Printful after successful payment.

#### Request
```http
POST /api/order/create
Content-Type: application/json

{
  "templateId": "template_789",
  "variantId": 456,
  "recipient": {
    "name": "John Doe",
    "email": "customer@example.com",
    "phone": "+1234567890",
    "address": {
      "line1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94105",
      "country": "US"
    }
  },
  "items": [
    {
      "variantId": 456,
      "quantity": 1,
      "retailPrice": "34.99"
    }
  ],
  "externalId": "order_abc123",
  "shipping": "standard"
}
```

#### Response
```typescript
{
  success: true,
  data: {
    printfulOrderId: 123456,
    status: "created",
    estimatedShipping: "2-5 business days",
    tracking: null
  }
}
```

#### Error Responses
```typescript
// Printful API Error
{
  success: false,
  error: 'ORDER_CREATION_FAILED',
  message: 'Unable to create order in fulfillment system',
  code: 'PRINTFUL_ERROR',
  details: {
    printfulError: 'insufficient_inventory'
  }
}

// Template Not Found
{
  success: false,
  error: 'TEMPLATE_NOT_FOUND',
  message: 'Design template not found or expired',
  code: 'TEMPLATE_EXPIRED'
}
```

### GET /api/order/[id]

Retrieves order status and tracking information.

#### Request
```http
GET /api/order/order_abc123
```

#### Response
```typescript
{
  success: true,
  data: {
    id: "order_abc123",
    printfulOrderId: 123456,
    status: "shipped",
    variantId: 456,
    templateId: "template_789",
    price: 3499,
    email: "customer@example.com",
    tracking: {
      carrier: "UPS",
      code: "1Z999AA1234567890",
      estimatedDelivery: "2024-12-30"
    },
    createdAt: "2024-12-25T10:00:00Z",
    updatedAt: "2024-12-26T14:30:00Z"
  }
}
```

## 🔔 Webhook APIs

### POST /api/webhooks/stripe

Handles Stripe webhook events for payment status updates.

#### Request
```http
POST /api/webhooks/stripe
Content-Type: application/json
Stripe-Signature: t=1234567890,v1=signature...

{
  "id": "evt_1234567890",
  "object": "event",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_123456789",
      "payment_status": "paid",
      "customer_email": "customer@example.com",
      "metadata": {
        "orderId": "order_abc123",
        "variantId": "456",
        "templateId": "template_789"
      }
    }
  }
}
```

#### Response
```typescript
{
  success: true,
  data: {
    processed: true,
    orderId: "order_abc123",
    status: "payment_confirmed"
  }
}
```

### POST /api/webhooks/printful

Handles Printful webhook events for order status updates.

#### Request
```http
POST /api/webhooks/printful
Content-Type: application/json
X-Printful-Webhook-Signature: signature...

{
  "type": "package_shipped",
  "created": 1640995200,
  "retailer": {
    "id": 12345,
    "name": "SnapCase Store"
  },
  "order": {
    "id": 123456,
    "external_id": "order_abc123",
    "status": "shipped"
  },
  "shipment": {
    "id": 789012,
    "carrier": "UPS",
    "service": "UPS Ground",
    "tracking_number": "1Z999AA1234567890",
    "tracking_url": "https://www.ups.com/track?trackingNumber=1Z999AA1234567890",
    "estimated_delivery_date": "2024-12-30"
  }
}
```

#### Response
```typescript
{
  success: true,
  data: {
    processed: true,
    orderId: "order_abc123",
    status: "shipped",
    tracking: {
      carrier: "UPS",
      code: "1Z999AA1234567890"
    }
  }
}
```

## 🛡️ Error Handling

### HTTP Status Codes
- **200**: Success
- **400**: Bad Request (invalid input)
- **401**: Unauthorized (missing or invalid authentication)
- **404**: Not Found (resource doesn't exist)
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error (unexpected error)
- **503**: Service Unavailable (external service down)

### Error Response Format
```typescript
interface APIError {
  success: false;
  error: string;           // Machine-readable error code
  message: string;         // Human-readable error message
  code?: string;          // Specific error code for debugging
  details?: Record<string, any>; // Additional error context
  timestamp: string;      // ISO 8601 timestamp
  requestId: string;      // Unique request identifier
}
```

### Common Error Codes
```typescript
enum APIErrorCodes {
  // Validation Errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Business Logic Errors
  VARIANT_NOT_FOUND = 'VARIANT_NOT_FOUND',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  
  // External Service Errors
  STRIPE_ERROR = 'STRIPE_ERROR',
  PRINTFUL_ERROR = 'PRINTFUL_ERROR',
  EDM_ERROR = 'EDM_ERROR',
  
  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}
```

## 🔒 Security

### Rate Limiting
```typescript
// Rate limit configuration
const rateLimits = {
  '/api/checkout': {
    window: '15m',
    max: 10, // 10 requests per 15 minutes per IP
    message: 'Too many checkout attempts'
  },
  '/api/order/create': {
    window: '1h',
    max: 5, // 5 orders per hour per IP
    message: 'Too many order creation attempts'
  },
  '/api/webhooks/*': {
    window: '1m',
    max: 100, // 100 webhook calls per minute
    message: 'Webhook rate limit exceeded'
  }
};
```

### Input Validation
All API endpoints use Zod schemas for input validation:

```typescript
import { z } from 'zod';

const checkoutSchema = z.object({
  variantId: z.number().positive(),
  templateId: z.string().optional(),
  email: z.string().email().optional(),
  shipping: z.object({
    method: z.enum(['standard', 'express']),
    address: z.object({
      line1: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(2),
      postalCode: z.string().min(5),
      country: z.string().length(2)
    })
  }),
  metadata: z.record(z.string()).optional()
});
```

### CORS Configuration
```typescript
// CORS settings for API routes
const corsConfig = {
  origin: [
    'https://app.snapcase.ai',
    'https://snapcase.ai',
    'http://localhost:3000' // Development only
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
};
```

## 📊 API Monitoring

### Request Logging
```typescript
interface APILog {
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  userAgent?: string;
  ip?: string;
  requestId: string;
  error?: string;
}
```

### Performance Metrics
```typescript
interface APIMetrics {
  endpoint: string;
  averageResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  requestCount: number;
  successRate: number;
}
```

### Health Check Endpoint
```http
GET /api/health
```

Response:
```typescript
{
  status: "healthy",
  timestamp: "2024-12-25T12:00:00Z",
  services: {
    stripe: "healthy",
    printful: "healthy",
    database: "healthy"
  },
  version: "1.0.0"
}
```

## 🧪 Testing

### API Testing Examples
```typescript
// Unit test example
describe('/api/checkout', () => {
  it('should create checkout session with valid input', async () => {
    const response = await request(app)
      .post('/api/checkout')
      .send({
        variantId: 456,
        templateId: 'template_789',
        email: 'test@example.com'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.url).toContain('checkout.stripe.com');
  });

  it('should reject invalid variant ID', async () => {
    const response = await request(app)
      .post('/api/checkout')
      .send({
        variantId: 'invalid',
        templateId: 'template_789'
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('INVALID_INPUT');
  });
});
```

### Mock Data for Testing
```typescript
// Mock Stripe response
export const mockStripeCheckout = {
  id: 'cs_test_123456789',
  url: 'https://checkout.stripe.com/pay/cs_test_123456789',
  expires_at: 1640995200
};

// Mock Printful order
export const mockPrintfulOrder = {
  id: 123456,
  status: 'pending',
  shipping: 'standard',
  items: [
    {
      variant_id: 456,
      quantity: 1,
      retail_price: '34.99'
    }
  ]
};
```

---

**Document Owner**: Ethan Trifari  
**API Lead**: AI Assistant  
**Last Updated**: December 2024
