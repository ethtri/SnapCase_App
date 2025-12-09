import { NextResponse } from "next/server";
import { z } from "zod";

import { getTemplateRecord } from "@/lib/template-registry";

const requestSchema = z.object({
  variantId: z.number().int().positive(),
  templateStoreId: z.string().optional(),
  templateId: z.string().optional(),
  externalProductId: z.string().optional(),
  designUrl: z.string().url().optional(),
  quantity: z.number().int().positive().default(1),
  unitPriceCents: z.number().int().positive().optional(),
  currency: z.string().optional().default("USD"),
});

const DEFAULT_UNIT_PRICE_CENTS = 3_499;

export async function POST(request: Request) {
  let payload: z.infer<typeof requestSchema>;

  try {
    const json = await request.json();
    payload = requestSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  let resolvedTemplateId = payload.templateId ?? null;
  let resolvedTemplateStoreId = payload.templateStoreId ?? null;
  let resolvedDesignUrl = payload.designUrl ?? null;

  if (payload.templateStoreId) {
    const record = getTemplateRecord(payload.templateStoreId);
    if (!record) {
      return NextResponse.json(
        { error: "Saved template not found or expired." },
        { status: 404 },
      );
    }
    if (record.variantId && record.variantId !== payload.variantId) {
      return NextResponse.json(
        {
          error:
            "Template variant mismatch. Re-save your design in the editor before ordering.",
        },
        { status: 409 },
      );
    }
    resolvedTemplateId = record.templateId ?? resolvedTemplateId;
    resolvedTemplateStoreId = record.templateStoreId;
    resolvedDesignUrl = record.designUrl ?? resolvedDesignUrl;
  }

  const unitPriceCents = payload.unitPriceCents ?? DEFAULT_UNIT_PRICE_CENTS;
  const totalCents = unitPriceCents * payload.quantity;
  const currency = (payload.currency ?? "USD").toUpperCase();
  const timestamp = new Date().toISOString();

  // Full Printful order submission is out of scope for this task; return a mock payload.
  const printfulOrderId = `printful-mock-${Date.now()}`;

  return NextResponse.json(
    {
      mock: true,
      printfulOrderId,
      createdAt: timestamp,
      variantId: payload.variantId,
      quantity: payload.quantity,
      unitPriceCents,
      currency,
      totalCents,
      templateId: resolvedTemplateId,
      templateStoreId: resolvedTemplateStoreId,
      designUrl: resolvedDesignUrl,
      externalProductId: payload.externalProductId ?? null,
      message:
        "PRINTFUL_TOKEN not provided; returning mock order payload with pricing/threaded template data.",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
