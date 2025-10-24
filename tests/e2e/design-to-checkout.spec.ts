import { expect, test } from "@playwright/test";

const designStubHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Snapcase E2E Design Stub</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      }

      body {
        margin: 0;
        padding: 32px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-width: 520px;
      }

      button {
        font-size: 16px;
        padding: 12px 16px;
        border-radius: 8px;
        border: 1px solid #cbd5f5;
        cursor: pointer;
        background: #f1f5ff;
      }

      button[disabled] {
        cursor: not-allowed;
        opacity: 0.5;
      }
    </style>
  </head>
  <body data-testid="design-page">
    <h1>Mock Design Surface</h1>
    <p>Select a device to unlock checkout.</p>
    <button type="button" data-testid="device-iphone-15-pro">
      iPhone 15 Pro Snap Case
    </button>
    <div data-testid="selection-status">No device selected</div>
    <button type="button" data-testid="continue-button" disabled>
      Continue to checkout
    </button>
    <script type="module" src="/__snapcase-e2e-stub.js"></script>
  </body>
</html>
`;

test("design to checkout smoke path", async ({ page }) => {
  const designContextPayload = {
    variantId: 632,
    externalProductId: "prod_mock_device",
    templateId: "tmpl_mock_123",
    exportedImage: null,
    timestamp: Date.now(),
  };
  const designStubScript = `(() => {
    const payload = ${JSON.stringify(designContextPayload)};
    const deviceButton = document.querySelector('[data-testid="device-iphone-15-pro"]');
    const continueButton = document.querySelector('[data-testid="continue-button"]');
    const status = document.querySelector('[data-testid="selection-status"]');

    deviceButton?.addEventListener("click", async () => {
      deviceButton.setAttribute("data-selected", "true");
      if (status) {
        status.textContent = "Selected: iPhone 15 Pro Snap Case";
      }
      if (continueButton) {
        continueButton.disabled = false;
      }

      try {
        await fetch("/api/edm/nonce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            externalProductId: payload.externalProductId,
          }),
        });
      } catch (error) {
        console.error("Mock nonce request failed", error);
      }
    });

    continueButton?.addEventListener("click", () => {
      const nextPayload = { ...payload, timestamp: Date.now() };
      sessionStorage.setItem(
        "snapcase:design-context",
        JSON.stringify(nextPayload),
      );
      window.location.assign("/checkout");
    });
  })();`;

  await page.route("**/api/edm/nonce", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ nonce: "mock-edm-nonce" }),
    });
  });

  await page.route("**/api/checkout", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        mock: true,
        message: "Mock checkout session created",
        url: "https://dashboard.stripe.com/test/payments/mock-session",
      }),
    });
  });

  await page.route("**/__snapcase-e2e-stub.js", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: designStubScript,
    });
  });

  await page.route("**/design", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: designStubHtml,
    });
  });

  await page.context().addInitScript((payload) => {
    if (window.location.pathname === "/checkout") {
      sessionStorage.setItem(
        "snapcase:design-context",
        JSON.stringify(payload),
      );
    }
  }, designContextPayload);

  await page.goto("/design");

  const deviceOption = page.getByTestId("device-iphone-15-pro");
  const continueButton = page.getByTestId("continue-button");

  await expect(continueButton).toBeDisabled();

  const nonceRequest = page.waitForRequest("**/api/edm/nonce");
  await deviceOption.click();
  await nonceRequest;

  await expect(continueButton).toBeEnabled();
  await expect(page.getByTestId("selection-status")).toHaveText(
    "Selected: iPhone 15 Pro Snap Case",
  );

  await Promise.all([
    page.waitForNavigation(),
    continueButton.click(),
  ]);

  await expect(page).toHaveURL(/\/checkout$/);
  await page.waitForFunction(() => {
    return Boolean(sessionStorage.getItem("snapcase:design-context"));
  });
  const storedContext = await page.evaluate(() => {
    return sessionStorage.getItem("snapcase:design-context");
  });
  expect(storedContext).not.toBeNull();
  if (storedContext) {
    const parsed = JSON.parse(storedContext) as {
      variantId: number;
      externalProductId: string;
      templateId: string | null;
    };
    expect(parsed.variantId).toBe(designContextPayload.variantId);
    expect(parsed.externalProductId).toBe(
      designContextPayload.externalProductId,
    );
    expect(parsed.templateId).toBe(designContextPayload.templateId);
  }

  await expect(
    page.getByRole("heading", { level: 2, name: "Order summary prototype" }),
  ).toBeVisible();
  const variantValue = page
    .locator("span.font-mono")
    .filter({ hasText: "prod_mock_device" });
  await expect(variantValue).toBeVisible();
  const templateValue = page
    .locator("span.font-mono")
    .filter({ hasText: "tmpl_mock_123" });
  await expect(templateValue).toBeVisible();

  const proceedButton = page.getByRole("button", { name: "Proceed to Stripe" });
  const checkoutRequest = page.waitForRequest("**/api/checkout");
  await proceedButton.click();
  await checkoutRequest;

  await expect(
    page.getByText("A mock checkout URL is available for testing:", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "https://dashboard.stripe.com/test/payments/mock-session",
    }),
  ).toBeVisible();
});
