const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('@playwright/test');

const baseUrl = (process.env.SNAPCASE_BASE_URL || 'https://dev.snapcase.ai').replace(/\/$/, '');
const designUrl = `${baseUrl}/design`;
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const diagnosticsDir = path.resolve('Images', 'diagnostics');

const SUPPORTED_VARIANTS = [
  { label: 'iPhone 15 Pro/Glossy', variantId: 632 },
  { label: 'iPhone 15/Glossy', variantId: 631 },
  { label: 'iPhone 14 Pro/Glossy', variantId: 642 },
  { label: 'iPhone 14/Glossy', variantId: 641 },
  { label: 'Galaxy S24 Ultra/Glossy', variantId: 712 },
  { label: 'Galaxy S24+/Glossy', variantId: 711 },
  { label: 'Galaxy S24/Glossy', variantId: 710 },
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function textContentOrNull(page, selector) {
  const handle = await page.$(selector);
  if (!handle) return null;
  const value = await handle.textContent();
  return value ? value.trim() : null;
}

async function selectVariant(frame, label) {
  const button = frame.getByRole('button', { name: label });
  const count = await button.count();
  if (!count) {
    return { clicked: false, reason: 'button-not-found' };
  }
  try {
    await button.first().scrollIntoViewIfNeeded();
    await button.first().click({ timeout: 20000 });
    return { clicked: true, reason: 'clicked' };
  } catch (error) {
    return { clicked: false, reason: error.message };
  }
}

async function captureScenario(browser, label, contextOptions) {
  const context = await browser.newContext(contextOptions);
  await context.addInitScript(() => {
    const hooks = (window.__snapcaseTestHooks = window.__snapcaseTestHooks || {});
    hooks.messageEvents = hooks.messageEvents || [];
    window.addEventListener('message', (event) => {
      try {
        hooks.messageEvents.push({
          at: new Date().toISOString(),
          origin: event.origin,
          data: event.data,
        });
        if (hooks.messageEvents.length > 200) {
          hooks.messageEvents.shift();
        }
      } catch {
        // Swallow errors when serializing cross-origin payloads.
      }
    });
  });

  const page = await context.newPage();
  await page.goto(designUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="design-helper-pill"]', { timeout: 60000 });

  const continueButton = page.locator('[data-testid="continue-button"]');
  await continueButton.waitFor({ timeout: 60000 });
  await page.waitForSelector('iframe#design-maker-embed', { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(6000);

  const printfulFrame = page.frames().find((f) => f.url().includes('printful.com'));
  let variantAttempted = null;
  let variantClickResult = null;
  if (printfulFrame) {
    for (const candidate of SUPPORTED_VARIANTS) {
      variantAttempted = candidate;
      variantClickResult = await selectVariant(printfulFrame, candidate.label);
      if (variantClickResult.clicked) {
        await page.waitForTimeout(6000);
        if (await continueButton.isEnabled()) {
          break;
        }
      }
    }
  }

  const helperChip = await textContentOrNull(page, '[data-testid="design-helper-pill"]');
  const guardrailCard = await textContentOrNull(page, '[data-testid="guardrail-description"]');
  const guardrailFootnote = await textContentOrNull(page, '[data-testid="guardrail-footnote"]');
  const errorBanner = await textContentOrNull(page, '[data-testid="error-banner"]');
  const continueCta = await continueButton.innerText();
  const ctaEnabled = await continueButton.isEnabled();

  const screenshotName = `task43-design-${label}-${stamp}.png`;
  const screenshotPath = path.join(diagnosticsDir, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const visibleIframes = await page.evaluate(() =>
    Array.from(document.querySelectorAll('iframe')).map((frame) => ({
      src: frame.src,
      id: frame.id || null,
      dataset: frame.dataset ? { ...frame.dataset } : {},
    })),
  );
  const printfulFrames = visibleIframes.filter((frame) => frame.src.includes('printful.com')).map((f) => f.src);

  const postMessageLog = await page.evaluate(() => {
    const hooks = window.__snapcaseTestHooks;
    if (hooks && Array.isArray(hooks.messageEvents)) {
      return hooks.messageEvents;
    }
    return null;
  });

  const windowOrigin = await page.evaluate(() => window.origin);

  await context.close();

  return {
    label,
    helperChip,
    guardrailCard,
    guardrailFootnote,
    errorBanner,
    continueCta,
    continueEnabled: ctaEnabled,
    variantAttempted,
    variantClickResult,
    printfulFrames,
    visibleIframes,
    windowOrigin,
    postMessageLog,
    screenshotPath: path.relative(process.cwd(), screenshotPath),
  };
}

(async () => {
  ensureDir(diagnosticsDir);
  const browser = await chromium.launch({ headless: true });
  const runs = [];
  runs.push(
    await captureScenario(browser, 'desktop', {
      viewport: { width: 1400, height: 900 },
    }),
  );
  runs.push(
    await captureScenario(browser, 'mobile', {
      ...devices['iPhone 14 Pro'],
    }),
  );

  const payload = {
    baseUrl: designUrl,
    capturedAt: new Date().toISOString(),
    runs,
  };
  const jsonPath = path.join(diagnosticsDir, `task43-edm-live-${stamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));
  console.log(`Saved diagnostics to ${jsonPath}`);
  await browser.close();
})();
