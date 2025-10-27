import { NextResponse } from "next/server";
import { z } from "zod";

const PRINTFUL_NONCE_ENDPOINT =
  "https://api.printful.com/embedded-designer/nonces";

const requestSchema = z.object({
  externalProductId: z
    .string()
    .min(1, "externalProductId is required and must be a non-empty string."),
  externalCustomerId: z.string().nullish(),
});

const printfulResponseSchema = z.object({
  code: z.number(),
  result: z.object({
    nonce: z.string(),
    template_id: z.number().nullable().optional(),
    expires_at: z.number().optional(),
  }),
});

export async function POST(request: Request) {
  let payload: z.infer<typeof requestSchema>;

  try {
    const json = await request.json();
    payload = requestSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const token = process.env.PRINTFUL_TOKEN;

  if (!token) {
    return NextResponse.json(
      {
        error:
          "Printful token missing. Set PRINTFUL_TOKEN to enable EDM integration.",
      },
      { status: 503 },
    );
  }

  const body = {
    external_product_id: payload.externalProductId,
    external_customer_id: payload.externalCustomerId ?? null,
  };

  let response: Response;
  try {
    response = await fetch(PRINTFUL_NONCE_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "Snapcase-EDM-Proxy/1.0",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to reach Printful EDM service.",
        details:
          error instanceof Error ? error.message : "Unknown network error.",
      },
      { status: 502 },
    );
  }

  if (!response.ok) {
    let details: unknown = null;
    try {
      details = await response.json();
    } catch {
      // Ignore JSON parse errors.
    }

    return NextResponse.json(
      {
        error: "Printful EDM request failed.",
        status: response.status,
        details,
      },
      { status: response.status === 401 ? 502 : response.status },
    );
  }

  let parsed: z.infer<typeof printfulResponseSchema>;
  try {
    const json = await response.json();
    parsed = printfulResponseSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Unexpected Printful response shape.",
          issues: error.issues,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to parse Printful response.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      nonce: parsed.result.nonce,
      templateId:
        typeof parsed.result.template_id === "number"
          ? parsed.result.template_id
          : null,
      expiresAt: parsed.result.expires_at ?? null,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

