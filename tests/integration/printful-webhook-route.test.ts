import crypto from "crypto";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { POST as printfulWebhookHandler } from "@/app/api/webhooks/printful/route";

const buildRequest = (
  body: unknown,
  headers: Record<string, string> = {},
) => {
  const rawBody = JSON.stringify(body);
  const request = new Request("http://localhost/api/webhooks/printful", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: rawBody,
  });

  return { request, rawBody };
};

describe("POST /api/webhooks/printful", () => {
  const originalSecret = process.env.PRINTFUL_WEBHOOK_SECRET;
  const originalArchiveDir = process.env.PRINTFUL_WEBHOOK_ARCHIVE_DIR;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "printful-webhook-test-"),
    );
    process.env.PRINTFUL_WEBHOOK_ARCHIVE_DIR = tempDir;
  });

  afterEach(async () => {
    if (originalSecret === undefined) {
      delete process.env.PRINTFUL_WEBHOOK_SECRET;
    } else {
      process.env.PRINTFUL_WEBHOOK_SECRET = originalSecret;
    }

    if (originalArchiveDir === undefined) {
      delete process.env.PRINTFUL_WEBHOOK_ARCHIVE_DIR;
    } else {
      process.env.PRINTFUL_WEBHOOK_ARCHIVE_DIR = originalArchiveDir;
    }

    await fs.rm(tempDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it("rejects missing signature when a secret is configured", async () => {
    process.env.PRINTFUL_WEBHOOK_SECRET = "secret";
    const { request } = buildRequest({ type: "package_shipped" });

    const response = await printfulWebhookHandler(request);

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toMatch(/signature/i);
  });

  it("accepts a valid signature and archives only once per event id", async () => {
    const secret = "printful-secret";
    process.env.PRINTFUL_WEBHOOK_SECRET = secret;
    const body = { id: "evt_sample", type: "package_shipped" };
    const { rawBody } = buildRequest(body);
    const signature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    const firstRequest = buildRequest(body, {
      "x-pf-event-id": "evt_sample",
      "x-printful-signature": signature,
    }).request;

    const firstResponse = await printfulWebhookHandler(firstRequest);
    const firstPayload = await firstResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(firstPayload.signatureValidated).toBe(true);
    expect(firstPayload.eventId).toBe("evt_sample");
    expect(firstPayload.archivedPath).toContain("evt_sample");

    const filesAfterFirst = await fs.readdir(tempDir);
    expect(filesAfterFirst.length).toBe(1);

    const duplicateRequest = buildRequest(body, {
      "x-pf-event-id": "evt_sample",
      "x-printful-signature": signature,
    }).request;

    const duplicateResponse = await printfulWebhookHandler(duplicateRequest);
    const duplicatePayload = await duplicateResponse.json();

    expect(duplicateResponse.status).toBe(200);
    expect(duplicatePayload.duplicateOf).toBeDefined();

    const filesAfterDuplicate = await fs.readdir(tempDir);
    expect(filesAfterDuplicate.length).toBe(1);
  });

  it("archives without signature when secret is not set", async () => {
    delete process.env.PRINTFUL_WEBHOOK_SECRET;

    const { request } = buildRequest(
      { orderId: 1234, status: "draft" },
      { "x-pf-event-id": "evt_no_secret" },
    );

    const response = await printfulWebhookHandler(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.signatureValidated).toBe(false);
    expect(payload.usingUnverifiedFallback).toBe(true);
    expect(payload.eventId).toBe("evt_no_secret");

    const [archive] = await fs.readdir(tempDir);
    const stored = JSON.parse(
      await fs.readFile(path.join(tempDir, archive), "utf8"),
    );
    expect(stored.eventId).toBe("evt_no_secret");
    expect(stored.payload).toMatchObject({ orderId: 1234, status: "draft" });
  });
});
