import { defineConfig, devices } from "@playwright/test";

const webServerPort = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const webServerUrl = `http://127.0.0.1:${webServerPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: webServerUrl,
    trace: "on-first-retry",
    bypassCSP: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `node ./scripts/run-playwright-server.mjs --hostname 127.0.0.1 --port ${webServerPort}`,
    url: webServerUrl,
    reuseExistingServer: false,
    env: {
      PLAYWRIGHT_SKIP_BUILD: "0",
      PORT: String(webServerPort),
      USE_EDM: "true",
      NEXT_PUBLIC_USE_EDM: "true",
      STRIPE_SHIPPING_RATE_STANDARD: "rate_mock_standard",
      STRIPE_SECRET_KEY: "",
      STRIPE_WEBHOOK_SECRET: "",
      PRINTFUL_NONCE_MOCK: "stub",
      PRINTFUL_TOKEN: "stub-token",
      PRINTFUL_TEMPLATE_MOCK: "always-missing",
      PRINTFUL_TEMPLATE_MOCK_FILE: "tests/fixtures/printful-template-mock.json",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: [["list"]],
});

