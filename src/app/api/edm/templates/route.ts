import { NextResponse } from "next/server";
import { z } from "zod";

import { upsertTemplateRecord } from "@/lib/template-registry";

const requestSchema = z.object({
  templateId: z.string().min(1, "templateId is required."),
  variantId: z.number().int().positive(),
  externalProductId: z.string().min(1, "externalProductId is required."),
  designUrl: z.string().url().optional(),
  source: z.string().optional(),
  filename: z.string().optional(),
});

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

  const record = upsertTemplateRecord({
    templateId: payload.templateId,
    variantId: payload.variantId,
    externalProductId: payload.externalProductId,
    designUrl: payload.designUrl ?? null,
  });

  return NextResponse.json(
    {
      templateId: record.templateId,
      templateStoreId: record.templateStoreId,
      storedAt: new Date(record.createdAt).toISOString(),
      designUrl: record.designUrl,
      printfulFileId: record.printfulFileId,
      printfulFileUrl: record.printfulFileUrl,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
