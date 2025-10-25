# Testing Strategy - SnapCase App

**Project**: SnapCase Custom Phone Case Platform  
**Version**: v1.0  
**Last Updated**: December 2024  
**Owner**: Ethan Trifari  

## 🎯 Testing Philosophy

Our testing strategy focuses on **user confidence** and **business continuity**. We prioritize testing the critical path from design creation to order fulfillment, ensuring a seamless experience that builds trust in our brand.

### Testing Principles
1. **User-Centric**: Test from the user's perspective, not just technical functionality
2. **Risk-Based**: Focus on high-impact, high-probability failure scenarios
3. **Continuous**: Testing integrated into development workflow
4. **Automated**: Where possible, automate repetitive testing tasks
5. **Realistic**: Use real-world data and scenarios

## 🧪 Testing Pyramid

### 1. Unit Tests (70%)
**Scope**: Individual functions and components  
**Tools**: Jest, React Testing Library  
**Coverage Target**: 80%+ for critical business logic  

```typescript
// Example: DPI validation function
describe('DPI Validation', () => {
  it('should warn when DPI is below 300', () => {
    const image = { width: 1000, height: 1000, printSize: 5 };
    const result = validateDPI(image);
    expect(result.warning).toBe(true);
    expect(result.message).toContain('may print blurry');
  });

  it('should block when DPI is below 180', () => {
    const image = { width: 500, height: 500, printSize: 5 };
    const result = validateDPI(image);
    expect(result.blocked).toBe(true);
    expect(result.message).toContain('too small');
  });
});
```

#### Guardrail Threshold Checks
- Guardrail constants are defined in `src/lib/guardrails.ts`. Adjust `DPI_GOOD_THRESHOLD` and `DPI_WARN_THRESHOLD` there when Printful sends live specs.
- `tests/unit/guardrails.test.ts` covers the allow/block bands and safe-area overrides from the storyboard.
- Session storage helpers and Stripe cancel/resume persistence are exercised in `tests/integration/design-context.test.ts` to confirm template/export payloads persist and `markCheckoutAttempt()` keeps context intact when `/checkout?cancelled=1` (or `stripe=cancelled`) returns from Stripe.

### 2. Integration Tests (20%)
**Scope**: API routes, component interactions  
**Tools**: Jest, Supertest  
**Coverage Target**: All API endpoints and critical user flows  

```typescript
// Example: Checkout API integration
describe('/api/checkout', () => {
  it('should create Stripe session with correct parameters', async () => {
    const response = await request(app)
      .post('/api/checkout')
      .send({
        price: 3499,
        variantId: 123,
        templateId: 'template_456'
      })
      .expect(200);

    expect(response.body.url).toContain('checkout.stripe.com');
  });
});
```

### 3. End-to-End Tests (10%)
**Scope**: Complete user journeys  
**Tools**: Playwright, Cypress  
**Coverage Target**: Critical business flows  

```typescript
// Example: Complete design and order flow
describe('Design and Order Flow', () => {
  it('should complete full user journey', async () => {
    await page.goto('/design');
    
    // Select device
    await page.click('[data-testid="device-iphone-15"]');
    await page.click('[data-testid="case-snap"]');
    
    // Upload image
    await page.setInputFiles('[data-testid="image-upload"]', 'test-image.jpg');
    
    // Continue to checkout
    await page.click('[data-testid="continue-button"]');
    await expect(page).toHaveURL('/checkout');
    
    // Complete payment
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.click('[data-testid="pay-button"]');
    
    // Verify success
    await expect(page).toHaveURL('/thank-you');
    await expect(page.locator('h1')).toContainText('Your case is in the works!');
  });
});
```

#### Playwright Flow Notes
- `tests/e2e/design-to-checkout.spec.ts` drives the real `/design → /checkout → /thank-you` pages, using component `data-testid` hooks (variant cards, guardrail copy, cancel banner, thank-you summary) to cover guardrail allow/deny bands and the cancel/resume banner before validating the stored variant label clears on thank-you.
- `npm run verify` automatically wipes the local `.next` build directory before Playwright boots its dev server, preventing OneDrive file locks from breaking repeated runs.

## 🔄 Testing Workflow

Run `npm run verify` before merging to confirm MCP connectivity and the full automated suite still passes.

### Pre-Development Testing
- [ ] **Requirements Review**: Ensure acceptance criteria are testable
- [ ] **Test Planning**: Define test scenarios and data requirements
- [ ] **Environment Setup**: Prepare test environments and data

### During Development
- [ ] **Test-Driven Development**: Write tests before implementation
- [ ] **Continuous Integration**: Automated test execution on every commit
- [ ] **Code Review**: Include test coverage in review process

### Pre-Release Testing
- [ ] **Integration Testing**: Full system testing in staging environment
- [ ] **User Acceptance Testing**: Stakeholder validation of functionality
- [ ] **Performance Testing**: Load testing and optimization validation

### Post-Release Testing
- [ ] **Smoke Testing**: Critical functionality verification in production
- [ ] **Monitoring**: Automated monitoring of key metrics and errors
- [ ] **Regression Testing**: Ensure new changes don't break existing functionality

## 📋 Test Scenarios

### Critical Path Testing

#### 1. Design Creation Flow
```typescript
describe('Design Creation', () => {
  const testScenarios = [
    {
      name: 'Happy Path - High Quality Image',
      image: 'high-quality-300dpi.jpg',
      expectedResult: 'success'
    },
    {
      name: 'Low DPI Warning',
      image: 'low-dpi-200dpi.jpg',
      expectedResult: 'warning'
    },
    {
      name: 'Very Low DPI Block',
      image: 'very-low-dpi-100dpi.jpg',
      expectedResult: 'blocked'
    },
    {
      name: 'Large File Upload',
      image: 'large-file-25mb.jpg',
      expectedResult: 'error'
    },
    {
      name: 'Unsupported Format',
      image: 'unsupported.svg',
      expectedResult: 'error'
    }
  ];

  testScenarios.forEach(scenario => {
    it(`should handle ${scenario.name}`, async () => {
      // Test implementation
    });
  });
});
```

#### 2. Payment Processing Flow
```typescript
describe('Payment Processing', () => {
  const paymentScenarios = [
    {
      name: 'Successful Payment',
      card: '4242424242424242',
      expectedResult: 'success'
    },
    {
      name: 'Declined Card',
      card: '4000000000000002',
      expectedResult: 'declined'
    },
    {
      name: 'Insufficient Funds',
      card: '4000000000009995',
      expectedResult: 'insufficient_funds'
    },
    {
      name: 'Network Error',
      card: '4000000000000119',
      expectedResult: 'network_error'
    }
  ];
});
```

#### 3. Order Fulfillment Flow
```typescript
describe('Order Fulfillment', () => {
  it('should create Printful order after successful payment', async () => {
    // Mock successful Stripe webhook
    await simulateStripeWebhook('checkout.session.completed');
    
    // Verify Printful order creation
    const printfulOrder = await getPrintfulOrder(orderId);
    expect(printfulOrder).toBeDefined();
    expect(printfulOrder.status).toBe('pending');
  });

  it('should handle Printful order failure gracefully', async () => {
    // Mock Printful API failure
    await mockPrintfulFailure();
    
    // Verify error handling
    const order = await getOrder(orderId);
    expect(order.status).toBe('failed');
    expect(order.errorMessage).toBeDefined();
  });
});
```

### Edge Case Testing

#### 1. Browser Compatibility
```typescript
const browsers = [
  'chrome',
  'firefox',
  'safari',
  'edge'
];

const mobileBrowsers = [
  'Mobile Chrome',
  'Mobile Safari',
  'Samsung Internet'
];

browsers.forEach(browser => {
  describe(`${browser} Compatibility`, () => {
    it('should support core functionality', async () => {
      // Browser-specific testing
    });
  });
});
```

#### 2. Network Conditions
```typescript
describe('Network Conditions', () => {
  const networkConditions = [
    { name: 'Fast 3G', download: 1.6, upload: 0.768 },
    { name: 'Slow 3G', download: 0.5, upload: 0.5 },
    { name: 'Offline', download: 0, upload: 0 }
  ];

  networkConditions.forEach(condition => {
    it(`should handle ${condition.name} gracefully`, async () => {
      await page.emulateNetworkConditions(condition);
      // Test offline behavior
    });
  });
});
```

#### 3. Accessibility Testing
```typescript
describe('Accessibility', () => {
  it('should meet WCAG AA standards', async () => {
    const results = await axe.run(page);
    expect(results.violations).toHaveLength(0);
  });

  it('should be navigable via keyboard', async () => {
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });

  it('should support screen readers', async () => {
    const altTexts = await page.locator('img').allTextContents();
    altTexts.forEach(alt => {
      expect(alt).toBeTruthy();
    });
  });
});
```

## 🛠️ Testing Tools & Setup

### Unit Testing Stack
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0"
  }
}
```

### E2E Testing Stack
```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "axe-playwright": "^1.1.0"
  }
}
```

### Test Configuration
```typescript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## 📊 Test Data Management

### Test Images
```typescript
// test-data/images/
const testImages = {
  highQuality: {
    path: 'test-data/images/high-quality-300dpi.jpg',
    width: 3000,
    height: 3000,
    dpi: 300,
    size: '2.5MB'
  },
  lowQuality: {
    path: 'test-data/images/low-quality-200dpi.jpg',
    width: 1000,
    height: 1000,
    dpi: 200,
    size: '800KB'
  },
  veryLowQuality: {
    path: 'test-data/images/very-low-quality-100dpi.jpg',
    width: 500,
    height: 500,
    dpi: 100,
    size: '200KB'
  },
  largeFile: {
    path: 'test-data/images/large-file-25mb.jpg',
    width: 8000,
    height: 8000,
    dpi: 300,
    size: '25MB'
  }
};
```

### Mock Data
```typescript
// test-data/mocks/
export const mockStripeWebhook = {
  checkout_session_completed: {
    id: 'cs_test_123',
    object: 'checkout.session',
    payment_status: 'paid',
    customer_email: 'test@example.com',
    metadata: {
      orderId: 'order_123',
      variantId: '123',
      templateId: 'template_456'
    }
  }
};

export const mockPrintfulOrder = {
  id: 123456,
  status: 'pending',
  shipping: 'standard',
  items: [
    {
      variant_id: 123,
      quantity: 1,
      retail_price: '34.99'
    }
  ]
};
```

## 🚀 Continuous Integration Testing

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

### Test Commands
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:accessibility": "playwright test --grep accessibility"
  }
}
```

## 📈 Testing Metrics & KPIs

### Test Coverage Targets
- **Unit Tests**: 80%+ coverage for business logic
- **Integration Tests**: 100% coverage for API endpoints
- **E2E Tests**: 100% coverage for critical user journeys

### Quality Gates
- [ ] All tests must pass before merge
- [ ] Coverage must not decrease
- [ ] No critical accessibility violations
- [ ] Performance budgets met
- [ ] Security scan passes

### Test Metrics Dashboard
```typescript
interface TestMetrics {
  coverage: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
  performance: {
    testExecutionTime: number;
    flakyTestRate: number;
  };
  quality: {
    bugEscapeRate: number;
    testEffectiveness: number;
  };
}
```

## 🐛 Bug Tracking & Test Results

### Bug Classification
```typescript
enum BugSeverity {
  CRITICAL = 'critical',    // Blocks core functionality
  HIGH = 'high',           // Major feature impact
  MEDIUM = 'medium',       // Minor feature impact
  LOW = 'low'             // Cosmetic or edge case
}

enum BugPriority {
  P1 = 1,  // Fix immediately
  P2 = 2,  // Fix within 24 hours
  P3 = 3,  // Fix within 1 week
  P4 = 4   // Fix in next release
}
```

### Test Result Reporting
```typescript
interface TestResult {
  testId: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
  browser: string;
  timestamp: string;
}
```

## 🔄 Test Maintenance

### Regular Maintenance Tasks
- [ ] **Weekly**: Review and update test data
- [ ] **Bi-weekly**: Analyze flaky tests and fix
- [ ] **Monthly**: Review test coverage and add missing tests
- [ ] **Quarterly**: Evaluate testing tools and update as needed

### Test Documentation Updates
- [ ] Update test scenarios when requirements change
- [ ] Document new test patterns and best practices
- [ ] Maintain test data and mock configurations
- [ ] Update CI/CD pipeline configurations

---

**Document Owner**: Ethan Trifari  
**Testing Lead**: AI Assistant  
**Last Updated**: December 2024
