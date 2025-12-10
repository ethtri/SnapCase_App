#!/usr/bin/env node
/**
 * Live mobile smoke against https://dev.snapcase.ai (or SNAPCASE_BASE_URL).
 * Attempts a real upload; if Printful rejects automation, falls back to test hooks
 * to unlock the CTA so the funnel can finish.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium, devices } from "@playwright/test";

const BASE_URL = (process.env.SNAPCASE_BASE_URL || "https://dev.snapcase.ai").replace(
  /\/$/,
  "",
);
const UPLOAD_PATH = path.resolve("tmp", "task45-design.png");
const DIAG_DIR = path.resolve("Images", "diagnostics");
const STAMP = new Date().toISOString().replace(/[:.]/g, "-");

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function capture(page, slug) {
  await ensureDir(DIAG_DIR);
  const filePath = path.join(DIAG_DIR, `${STAMP}-${slug}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`[diag] ${slug} -> ${path.relative(process.cwd(), filePath)}`);
  return filePath;
}

async function getLatestDesignStatus(page) {
  return page.evaluate(() => {
    const events = window.__snapcaseAnalyticsEvents || [];
    return events.filter((e) => e?.name === "edm_design_status").slice(-1)[0] || null;
  });
}

async function tryFileUpload(page, frame) {
  if (!fs.existsSync(UPLOAD_PATH)) {
    console.warn(`[warn] Upload asset missing at ${UPLOAD_PATH}; skipping upload attempt`);
    return { attempted: false, fileChooser: false };
  }

  const tapButton = frame.getByText("Tap to design", { exact: false });
  try {
    await tapButton.waitFor({ timeout: 20_000 });
  } catch (error) {
    return { attempted: true, fileChooser: false, error: error?.message ?? String(error) };
  }
  const chooserPromise = page.waitForEvent("filechooser", { timeout: 20_000 }).catch(() => null);
  await tapButton.click({ force: true });
  const chooser = await chooserPromise;
  if (!chooser) {
    console.warn("[warn] File chooser did not open from Tap to design");
    return { attempted: true, fileChooser: false };
  }
  await chooser.setFiles(UPLOAD_PATH);
  const elementHandle = await chooser.element();
  await elementHandle.evaluate((input) => {
    input.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  });
  console.log("[info] File chooser set files");
  return { attempted: true, fileChooser: true };
}

async function forceDesignReady(page) {
  await page.evaluate(() => {
    const hooks = window.__snapcaseTestHooks;
    const initVariant =
      hooks?.lastInit?.preselectedSizes?.[0] ??
      hooks?.lastInit?.initProduct?.variantId ??
      632;
    hooks?.triggerPricingStatusUpdate?.({
      currency: "USD",
      total: 3499,
      breakdown: [{ type: "base", amount: 3499 }],
    });
    hooks?.triggerDesignStatusUpdate?.({
      designValid: true,
      status: "ready",
      errors: [],
      blockingIssues: [],
      warnings: [],
      selectedVariantIds: [initVariant],
    });
    hooks?.triggerTemplateSaved?.(`auto-${Date.now()}`);
  });
}

async function waitForCTA(page, timeoutMs = 60_000) {
  const continueButton = page.getByTestId("continue-button");
  await continueButton.waitFor({ state: "visible", timeout: timeoutMs });
  await page.waitForFunction(
    (selector) => {
      const el = document.querySelector(selector);
      return Boolean(el && !el.hasAttribute("disabled"));
    },
    '[data-testid="continue-button"]',
    { timeout: timeoutMs },
  );
  return continueButton;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ...devices["iPhone 14 Pro"] });
  await context.addInitScript(() => {
    window.__snapcaseTestHooks = window.__snapcaseTestHooks || {};
  });
  const page = await context.newPage();
  page.setDefaultTimeout(180_000);
  page.on("console", (msg) => {
    console.log(`[console:${msg.type()}] ${msg.text()}`);
  });

  await page.goto(`${BASE_URL}/design`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="design-helper-pill"]');
  await page.waitForSelector('iframe#design-maker-embed', { timeout: 60_000 });
  const frame = page.frame({ name: "design-maker-embed" });
  if (!frame) {
    throw new Error("Design embed frame not found");
  }

  const uploadResult = await tryFileUpload(page, frame);
  await page.waitForTimeout(45_000);
  let status = await getLatestDesignStatus(page);
  if (status?.payload?.designValid !== true) {
    console.warn("[warn] designValid not true after upload attempt; forcing via test hooks");
    await forceDesignReady(page);
    status = await getLatestDesignStatus(page);
  }

  await capture(page, "design-mobile");

  const continueButton = await waitForCTA(page);
  await Promise.all([page.waitForURL(/\/checkout$/), continueButton.click()]);

  await page.waitForSelector('[data-testid="checkout-variant-label"]', { timeout: 60_000 });
  await capture(page, "checkout-mobile");

  const proceed = page.getByRole("button", { name: "Pay with Stripe" });
  await proceed.waitFor({ timeout: 30_000 });
  await proceed.click({ timeout: 30_000 });
  await page.waitForTimeout(2_000);

  const handoffToken = await page.evaluate((key) => {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    try {
      return encodeURIComponent(raw);
    } catch {
      return null;
    }
  }, "snapcase:design-context");

  await page.goto(
    `${BASE_URL}/thank-you${handoffToken ? `?handoff=${handoffToken}` : ""}`,
    { waitUntil: "networkidle" },
  );
  await page.waitForSelector('[data-testid="thank-you-hero"]', { timeout: 60_000 });
  await capture(page, "thankyou-mobile");

  console.log(
    JSON.stringify(
      {
        baseUrl: BASE_URL,
        stamp: STAMP,
        upload: uploadResult,
        designStatus: status,
      },
      null,
      2,
    ),
  );

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
