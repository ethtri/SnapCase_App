import { expect, test } from "@playwright/test";

const DESIGN_CONTEXT_KEY = "snapcase:design-context";

test("design guardrails enforce block/warn flows and checkout cancel/resume", async ({
  page,
}) => {
  await page.goto("/design");
  await page.waitForFunction(() => {
    return window.__snapcaseDesignHydrated === true;
  });

  const continueButton = page.getByTestId("continue-button");
  const selectionSummary = page.getByTestId("selection-summary");

  await expect(continueButton).toBeDisabled();
  await expect(selectionSummary).toContainText("No device selected yet");

  const guardrailTitle = page.getByTestId("guardrail-title");
  const guardrailDescription = page.getByTestId("guardrail-description");
  const guardrailFootnote = page.getByTestId("guardrail-footnote");

  const blockVariantRadio = page.locator('input[name="device"][value="642"]');
  await blockVariantRadio.scrollIntoViewIfNeeded();
  await blockVariantRadio.check({ force: true });
  await blockVariantRadio.evaluate((node) => {
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForFunction((key) => {
    return window.sessionStorage.getItem(key) !== null;
  }, DESIGN_CONTEXT_KEY);

  await expect(guardrailTitle).toHaveText("Image too low-resolution");
  await expect(guardrailDescription).toContainText("below 180 DPI");
  await expect(guardrailFootnote).toContainText("Continue is disabled");
  await expect(continueButton).toBeDisabled();

  const warnVariantRadio = page.locator('input[name="device"][value="631"]');
  await warnVariantRadio.scrollIntoViewIfNeeded();
  await warnVariantRadio.check({ force: true });
  await warnVariantRadio.evaluate((node) => {
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await expect(selectionSummary).toContainText("Variant ID 631");
  await expect(guardrailTitle).toHaveText("Heads up on DPI");
  await expect(guardrailDescription).toContainText("between 180-299 DPI");
  await expect(guardrailFootnote).toContainText("You can continue");
  await expect(continueButton).toBeEnabled();

  const mockTemplateButton = page.getByRole("button", {
    name: "Mock save template",
  });
  await mockTemplateButton.click();

  await Promise.all([
    page.waitForURL(/\/checkout$/),
    continueButton.click(),
  ]);

  await expect(page).toHaveURL(/\/checkout$/);
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Order summary prototype",
    }),
  ).toBeVisible();
  await expect(
    page.getByTestId("checkout-variant-label"),
  ).toHaveText("APPLE - iPhone 15");

  const proceedToStripe = page.getByRole("button", {
    name: "Proceed to Stripe",
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

  await expect(page.getByTestId("checkout-cancel-banner")).toBeVisible();

  const resumeButton = page.getByTestId("resume-checkout-button");
  await Promise.all([
    page.waitForURL(/\/checkout$/),
    resumeButton.click(),
  ]);
  await expect(page.getByTestId("checkout-cancel-banner")).toHaveCount(0);

  await Promise.all([
    page.waitForResponse("**/api/checkout"),
    proceedToStripe.click(),
  ]);
  await expect(
    page.getByRole("link", { name: "Open mock checkout" }),
  ).toHaveAttribute("href", expect.stringContaining("https://dashboard.stripe.com/test/payments"));

  await page.goto("/thank-you");
  await expect(page).toHaveURL(/\/thank-you$/);
  const designSummary = page.getByTestId("design-summary");
  await expect(designSummary).toContainText("APPLE - iPhone 15");

  await page.waitForFunction((key) => {
    return window.sessionStorage.getItem(key) === null;
  }, DESIGN_CONTEXT_KEY);
});

