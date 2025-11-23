import { POST as edmNonceHandler } from "@/app/api/edm/nonce/route";

describe("POST /api/edm/nonce", () => {
  const originalToken = process.env.PRINTFUL_TOKEN;

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.PRINTFUL_TOKEN;
    } else {
      process.env.PRINTFUL_TOKEN = originalToken;
    }
    jest.restoreAllMocks();
  });

  it("returns 400 when externalProductId is missing", async () => {
    process.env.PRINTFUL_TOKEN = "test-token";
    const request = new Request("http://localhost/api/edm/nonce", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await edmNonceHandler(request);

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe("Invalid request body");
  });

  it("returns 503 when PRINTFUL_TOKEN is not configured", async () => {
    delete process.env.PRINTFUL_TOKEN;

    const request = new Request("http://localhost/api/edm/nonce", {
      method: "POST",
      body: JSON.stringify({ externalProductId: "SNAP_IPHONE15_SNAP" }),
    });

    const response = await edmNonceHandler(request);

    expect(response.status).toBe(503);
    const payload = await response.json();
    expect(payload.error).toContain("Printful token missing");
  });

  it("proxies the Printful nonce response on success", async () => {
    process.env.PRINTFUL_TOKEN = "test-token";
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 200,
            result: {
              nonce: "pf_nonce_123",
              template_id: 987654,
              expires_at: 1_700_000_000,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    const request = new Request("http://localhost/api/edm/nonce", {
      method: "POST",
      body: JSON.stringify({ externalProductId: "SNAP_IPHONE15_SNAP" }),
    });

    const response = await edmNonceHandler(request);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.printful.com/embedded-designer/nonces",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({
      nonce: "pf_nonce_123",
      templateId: 987654,
      expiresAt: 1_700_000_000,
    });
  });

  it("supports the v2 Printful response shape with nested nonce payload", async () => {
    process.env.PRINTFUL_TOKEN = "test-token";
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 200,
          result: {
            nonce: {
              nonce: "pf_nonce_nested",
              template_id: null,
              expires_at: 1_800_000_000,
            },
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const request = new Request("http://localhost/api/edm/nonce", {
      method: "POST",
      body: JSON.stringify({ externalProductId: "SNAP_IPHONE15_SNAP" }),
    });

    const response = await edmNonceHandler(request);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({
      nonce: "pf_nonce_nested",
      templateId: null,
      expiresAt: 1_800_000_000,
    });
  });

  it("returns an error payload when Printful responds with failure", async () => {
    process.env.PRINTFUL_TOKEN = "test-token";
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 400,
          error: { reason: "invalid product" },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const request = new Request("http://localhost/api/edm/nonce", {
      method: "POST",
      body: JSON.stringify({ externalProductId: "SNAP_BROKEN" }),
    });

    const response = await edmNonceHandler(request);

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe("Printful EDM request failed.");
    expect(payload.details).toEqual({
      code: 400,
      error: { reason: "invalid product" },
    });
  });
});

