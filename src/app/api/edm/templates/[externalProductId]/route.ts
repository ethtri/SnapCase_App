import { NextResponse } from "next/server";
import { z } from "zod";

import { findPrintfulCatalogEntry } from "@/data/printful-catalog";
import { getTemplateRecordByExternalProductId } from "@/lib/template-registry";

const paramsSchema = z.object({
  externalProductId: z
    .string()
    .min(1, "externalProductId is required and must be a non-empty string."),
});

export async function GET(
  _request: Request,
  context: { params: { externalProductId: string } },
) {
  const parsed = paramsSchema.safeParse(context.params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid externalProductId", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { externalProductId } = parsed.data;
  const catalogEntry = findPrintfulCatalogEntry(externalProductId);
  const templateRecord = getTemplateRecordByExternalProductId(externalProductId);

  return NextResponse.json(
    {
      externalProductId,
      printfulProductId: catalogEntry?.printfulProductId ?? null,
      template: {
        exists: Boolean(templateRecord?.templateId),
        templateId: templateRecord?.templateId ?? null,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
