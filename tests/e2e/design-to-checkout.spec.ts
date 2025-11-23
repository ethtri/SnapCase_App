import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const DESIGN_CONTEXT_KEY = "snapcase:design-context";
const TEMPLATE_CACHE_STORAGE_KEY = "snapcase:edm-template-cache";
const TEMPLATE_MOCK_FILE = path.resolve(
  __dirname,
  "../fixtures/printful-template-mock.json",
);
const TEST_EXTERNAL_PRODUCT_ID = "SNAP_IP15PRO_SNAP";
const TEST_TEMPLATE_ID = 987654;
const DIAGNOSTICS_DIR = path.resolve(__dirname, "../../Images/diagnostics");
const RUN_STAMP = new Date().toISOString().replace(/[:.]/g, "-");
type AnalyticsEventEntry = {
  name: string;
  payload: {
    variantId?: number;
    timestamp?: string;
    errorSummaries?: {
      blockingIssues?: string[];
      warningMessages?: string[];
    };
    templateId?: string;
    [key: string]: unknown;
  };
};

async function readTemplateMockFile(): Promise<
  Record<string, { exists: boolean; templateId: number | null }>
> {
  try {
    const raw = await fs.readFile(TEMPLATE_MOCK_FILE, "utf8");
    const parsed = JSON.parse(raw) as Record<
      string,
      { exists?: boolean; templateId?: number | string | null }
    >;
    const result: Record<
      string,
      { exists: boolean; templateId: number | null }
    > = {};
    for (const [key, value] of Object.entries(parsed)) {
      const templateId =
        typeof value?.templateId === "number"
          ? value.templateId
          : typeof value?.templateId === "string"
            ? Number(value.templateId)
            : null;
      result[key] = {
        exists: Boolean(value?.exists),
        templateId: Number.isFinite(templateId) ? templateId : null,
      };
    }
    return result;
  } catch {
    return {};
  }
}

async function updateTemplateMock(
  externalProductId: string,
  data: { exists: boolean; templateId?: number | null },
): Promise<void> {
  const current = await readTemplateMockFile();
  current[externalProductId] = {
    exists: data.exists,
    templateId: data.templateId ?? null,
  };
  await fs.writeFile(TEMPLATE_MOCK_FILE, JSON.stringify(current, null, 2));
}

async function resetTemplateMock(externalProductId: string): Promise<void> {
  await updateTemplateMock(externalProductId, { exists: false, templateId: null });
}

async function clearDesignState(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(
    ({ designKey, cacheKey }) => {
      try {
        window.sessionStorage.removeItem(designKey);
        window.sessionStorage.removeItem(cacheKey);
        window.sessionStorage.clear();
      } catch {
        // Ignore storage errors in private browsing.
      }
      try {
        window.localStorage.clear();
      } catch {
        // Ignore storage errors.
      }
    },
    {
      designKey: DESIGN_CONTEXT_KEY,
      cacheKey: TEMPLATE_CACHE_STORAGE_KEY,
    },
  );
}

async function setupEdmDesignerStub(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const hooks = (window.__snapcaseTestHooks = window.__snapcaseTestHooks || {});
    window.PFDesignMaker = class {
      constructor(options: Record<string, any>) {
        hooks.lastInit = options;
        hooks.triggerTemplateSaved = (templateId?: string) => {
          options.onTemplateSaved?.({
            templateId: templateId ?? "999000",
          });
        };
        hooks.triggerDesignStatusUpdate = (payload?: unknown) => {
          options.onDesignStatusUpdate?.(payload);
        };
        hooks.triggerPricingStatusUpdate = (payload?: unknown) => {
          options.onPricingStatusUpdate?.(payload);
        };
      }
      destroy() {}
    };
  });
  await page.route("https://files.cdn.printful.com/embed/embed.js", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `
        (() => {
          const hooks = (window.__snapcaseTestHooks = window.__snapcaseTestHooks || {});
          window.PFDesignMaker = class {
            constructor(options) {
              hooks.lastInit = options;
              hooks.triggerTemplateSaved = (templateId) => {
                options.onTemplateSaved?.({
                  templateId: templateId ?? "999000",
                });
              };
              hooks.triggerDesignStatusUpdate = (payload) => {
                options.onDesignStatusUpdate?.(payload);
              };
              hooks.triggerPricingStatusUpdate = (payload) => {
                options.onPricingStatusUpdate?.(payload);
              };
            }
            destroy() {}
          };
        })();
      `,
    });
  });
}

async function waitForDesignerInit(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    return Boolean(window.__snapcaseTestHooks?.lastInit);
  });
}

async function waitForDesignHydrated(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="design-helper-pill"]', {
    state: "visible",
  });
}

async function captureDiagnostic(page: Page, slug: string): Promise<string> {
  await fs.mkdir(DIAGNOSTICS_DIR, { recursive: true });
  const fileName = `${slug}.png`;
  const filePath = path.join(DIAGNOSTICS_DIR, fileName);
  await page.screenshot({ path: filePath, fullPage: true });
  test.info().annotations.push({
    type: "diagnostic",
    description: path.relative(process.cwd(), filePath),
  });
  return filePath;
}

test.beforeEach(async ({ page }) => {
  page.on("console", (message) => {
    console.log(`[console:${message.type()}] ${message.text()}`);
  });
});

test("design guardrails enforce block/warn flows and checkout cancel/resume", async ({
  page,
}) => {
  await setupEdmDesignerStub(page);
  await clearDesignState(page);

  await test.step("capture edm helper messaging state", async () => {
    await page.goto("/design");
    await waitForDesignHydrated(page);
    await waitForDesignerInit(page);
    await page.evaluate(() => {
      window.__snapcaseTestHooks?.triggerDesignStatusUpdate?.({
        designValid: false,
        status: "blocking",
        errors: ["Mock Printful blocking issue"],
        blockingIssues: ["Mock Printful blocking issue"],
        warnings: [],
        selectedVariantIds: [632],
      });
    });
    await page.waitForTimeout(200);
    await captureDiagnostic(page, `design-messaging-${RUN_STAMP}`);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    await captureDiagnostic(page, `design-messaging-mobile-${RUN_STAMP}`);
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  await page.evaluate(() => {
    window.__snapcaseTestHooks?.triggerDesignStatusUpdate?.({
      designValid: true,
      status: "ready",
      errors: [],
      blockingIssues: [],
      warnings: [],
      selectedVariantIds: [632],
    });
  });
  await page.waitForFunction(() => {
    const helper = document.querySelector(
      '[data-testid="design-helper-pill"]',
    );
    const text = helper?.textContent ?? "";
    return text.includes("APPLE") && text.includes("iPhone 15 Pro");
  });
  const syncedDesignContext = await page.evaluate((key) => {
    return window.sessionStorage.getItem(key);
  }, DESIGN_CONTEXT_KEY);
  expect(syncedDesignContext).toContain('"variantId":632');

  await clearDesignState(page);
  const redirectResponse = await page.request.get("/", { maxRedirects: 0 });
  expect(redirectResponse.status()).toBe(307);
  expect(redirectResponse.headers().location).toContain("/design");

  await page.goto("/design");
  await waitForDesignHydrated(page);
  await waitForDesignerInit(page);

  const continueButton = page.getByTestId("continue-button");
  const guardrailTitle = page.getByTestId("guardrail-title");
  const guardrailDescription = page.getByTestId("guardrail-description");
  const guardrailFootnote = page.getByTestId("guardrail-footnote");

  await expect(continueButton).toBeDisabled();
  await expect(guardrailTitle).toHaveText("Printful is validating");

  await page.evaluate(() => {
    window.__snapcaseTestHooks?.triggerDesignStatusUpdate?.({
      designValid: false,
      status: "blocking",
      errors: ["Mock Printful blocking issue"],
      blockingIssues: ["Mock Printful blocking issue"],
      warnings: [],
      selectedVariantIds: [632],
    });
  });
  await page.waitForTimeout(50);

  await expect(guardrailTitle).toHaveText("Resolve the Printful banner above");
  await expect(guardrailDescription).toContainText("Mock Printful blocking issue");
  await expect(guardrailFootnote).toContainText("Printful");
  await expect(continueButton).toBeDisabled();

  await page.evaluate(() => {
    window.__snapcaseTestHooks?.triggerDesignStatusUpdate?.({
      designValid: true,
      status: "warning",
      errors: [],
      blockingIssues: [],
      warnings: ["Mock Printful warning"],
      selectedVariantIds: [632],
    });
  });
  await page.waitForTimeout(50);
  await expect(guardrailTitle).toHaveText("Heads up from Printful");
  await expect(guardrailDescription).toContainText("Mock Printful");
  await expect(guardrailFootnote).toContainText("Printful");
  await expect(continueButton).toBeEnabled();

  await page.evaluate(() => {
    window.__snapcaseTestHooks?.triggerDesignStatusUpdate?.({
      designValid: true,
      status: "ready",
      errors: [],
      blockingIssues: [],
      warnings: [],
      selectedVariantIds: [632],
    });
  });
  await page.waitForTimeout(50);
  await expect(guardrailTitle).toHaveText("Printful approved your design");
  await expect(guardrailDescription).toContainText("Printful approved this design");
  await expect(guardrailFootnote).toContainText("Printful");
  await expect(continueButton).toBeEnabled();

  await page.evaluate(() => {
    window.__snapcaseTestHooks?.triggerTemplateSaved?.("999777");
  });

  await Promise.all([
    page.waitForURL(/\/checkout$/),
    continueButton.click(),
  ]);

  await expect(page).toHaveURL(/\/checkout$/);
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Design summary",
    }),
  ).toBeVisible();
  await expect(
    page.getByTestId("checkout-variant-label"),
  ).toHaveText("APPLE - iPhone 15 Pro");

  const proceedToStripe = page.getByRole("button", {
    name: "Pay with Stripe",
  });
  await Promise.all([
    page.waitForResponse("**/api/checkout"),
    proceedToStripe.click(),
  ]);
  await expect(
    page.getByText("Stripe secrets are not configured", { exact: false }),
  ).toBeVisible();

  const cancelLink = page.getByTestId("mock-cancel-link");
  await Promise.all([
    page.waitForURL(/\/checkout\?stripe=cancelled$/),
    cancelLink.click(),
  ]);

  const checkoutBanner = page.getByTestId("checkout-cancel-banner");
  await expect(checkoutBanner).toBeVisible();

  const resumeButton = page.getByTestId("resume-checkout-button");
  await Promise.all([
    page.waitForURL(/\/checkout$/),
    resumeButton.click(),
  ]);
  await expect(checkoutBanner).toBeVisible();
  await captureDiagnostic(page, `checkout-cancel-banner-${RUN_STAMP}`);

  const expressRadio = page.locator('input[name="shipping"][value="express"]');
  if (await expressRadio.count()) {
    await expressRadio.check({ force: true });
  }
  await page.waitForTimeout(200);
  await captureDiagnostic(page, `checkout-desktop-review-${RUN_STAMP}`);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await captureDiagnostic(page, `checkout-mobile-review-${RUN_STAMP}`);
  await page.setViewportSize({ width: 1280, height: 720 });

  await Promise.all([
    page.waitForResponse("**/api/checkout"),
    proceedToStripe.click(),
  ]);
  await expect(
    page.getByRole("link", { name: "Open mock checkout" }),
  ).toHaveAttribute("href", expect.stringContaining("https://dashboard.stripe.com/test/payments"));

  const handoffToken = await page.evaluate((key) => {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as {
        variantId?: number | null;
        externalProductId?: string | null;
        templateId?: string | null;
        variantLabel?: string | null;
      };
      const payload = {
        variantId: parsed.variantId ?? null,
        externalProductId: parsed.externalProductId ?? null,
        templateId: parsed.templateId ?? null,
        variantLabel: parsed.variantLabel ?? null,
      };
      return encodeURIComponent(JSON.stringify(payload));
    } catch {
      return null;
    }
  }, DESIGN_CONTEXT_KEY);

  expect(handoffToken).not.toBeNull();

  await page.goto(
    `/thank-you${handoffToken ? `?handoff=${handoffToken}` : ""}`,
  );
  await expect(page).toHaveURL(/\/thank-you/);
  const designSummary = page.getByTestId("design-summary");
  await expect(designSummary).toContainText("APPLE - iPhone 15");
  await expect(
    page.getByTestId("thank-you-hero"),
  ).toBeVisible();
  await expect(
    page.getByTestId("thank-you-order-id"),
  ).toContainText("SC-");
  await expect(
    page.getByTestId("fulfillment-timeline"),
  ).toBeVisible();
  await expect(
    page.getByTestId("track-order-cta"),
  ).toBeVisible();
  await expect(
    page.getByTestId("design-another-cta"),
  ).toBeVisible();

  await captureDiagnostic(page, `thank-you-desktop-${RUN_STAMP}`);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  await captureDiagnostic(page, `thank-you-mobile-${RUN_STAMP}`);

  await page.waitForFunction((key) => {
    return window.sessionStorage.getItem(key) === null;
  }, DESIGN_CONTEXT_KEY);
});

test("edm template cache transitions from create to edit mode after save", async ({
  page,
}) => {
  await setupEdmDesignerStub(page);
  await resetTemplateMock(TEST_EXTERNAL_PRODUCT_ID);
  await clearDesignState(page);

  const runTest = async () => {
    await page.goto("/design");
    await waitForDesignHydrated(page);
    await waitForDesignerInit(page);

    const templateState = page.getByTestId("edm-template-state");
    await expect(templateState).toHaveAttribute("data-template-mode", "create");
    await expect(templateState).toHaveAttribute("data-init-product", "true");

    const firstInitUsesInitProduct = await page.evaluate(() => {
      return Boolean(
        window.__snapcaseTestHooks?.lastInit?.initProduct?.productId,
      );
    });
    expect(firstInitUsesInitProduct).toBe(true);

    await page.evaluate(() => {
      window.__snapcaseTestHooks?.triggerTemplateSaved?.("987654");
    });
    await updateTemplateMock(TEST_EXTERNAL_PRODUCT_ID, {
      exists: true,
      templateId: TEST_TEMPLATE_ID,
    });

    await expect(templateState).toHaveAttribute("data-template-mode", "edit");

    await page.reload();
    await waitForDesignHydrated(page);
    await waitForDesignerInit(page);

    await expect(templateState).toHaveAttribute("data-template-mode", "edit");
    await expect(templateState).toHaveAttribute("data-init-product", "false");

    const secondInitUsesInitProduct = await page.evaluate(() => {
      return Boolean(window.__snapcaseTestHooks?.lastInit?.initProduct);
    });
    expect(secondInitUsesInitProduct).toBe(false);
  };

  try {
    await runTest();
  } finally {
    await resetTemplateMock(TEST_EXTERNAL_PRODUCT_ID);
  }
});

test("edm analytics events fire when EDM is forced", async ({ page }) => {
  await setupEdmDesignerStub(page);
  await clearDesignState(page);
  await page.goto("/design");
  await waitForDesignHydrated(page);
  await waitForDesignerInit(page);
  await page.waitForFunction(() => {
    return Array.isArray(window.__snapcaseAnalyticsEvents);
  });

  await page.waitForFunction(() => {
    return (
      window.__snapcaseAnalyticsEvents?.some(
        (entry) => entry?.name === "edm_variant_locked",
      ) ?? false
    );
  });

  await page.evaluate(() => {
    window.__snapcaseTestHooks?.triggerDesignStatusUpdate?.({
      designValid: false,
      errors: [{ message: "Test block" }],
      warnings: [],
      selectedVariantIds: [632],
    });
  });

  await page.waitForFunction(() => {
    return (
      window.__snapcaseAnalyticsEvents?.some(
        (entry) => entry?.name === "edm_guardrail_blocked",
      ) ?? false
    );
  });

  await page.evaluate(() => {
    window.__snapcaseTestHooks?.triggerDesignStatusUpdate?.({
      designValid: true,
      errors: [],
      warnings: [{ message: "Heads up" }],
      selectedVariantIds: [632],
    });
  });

  await page.evaluate(() => {
    window.__snapcaseTestHooks?.triggerPricingStatusUpdate?.({
      currency: "USD",
      total: 1999,
      breakdown: [{ type: "base", amount: 1499 }],
    });
  });

  await page.evaluate(() => {
    window.__snapcaseTestHooks?.triggerTemplateSaved?.("999777");
  });

  const analyticsEvents = (await page.evaluate(() => {
    return window.__snapcaseAnalyticsEvents ?? [];
  })) as AnalyticsEventEntry[];

  const expectEvent = (eventName: string): AnalyticsEventEntry => {
    const entry = analyticsEvents.find((event) => event.name === eventName);
    expect(entry).toBeTruthy();
    expect(entry?.payload?.variantId).toBe(632);
    expect(entry?.payload?.timestamp).toBeTruthy();
    expect(entry?.payload?.errorSummaries).toBeDefined();
    return entry!;
  };

  const designStatusEvent = expectEvent("edm_design_status");
  expect(
    designStatusEvent.payload.errorSummaries?.blockingIssues ?? [],
  ).toContain("Test block");

  expectEvent("edm_guardrail_blocked");
  expectEvent("edm_guardrail_warning");
  expectEvent("edm_variant_locked");
  expectEvent("edm_pricing_update");
  const templateSaved = expectEvent("edm_template_saved");
  expect(templateSaved.payload.templateId).toBe("999777");
});
