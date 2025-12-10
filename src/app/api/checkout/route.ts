import Stripe from "stripe";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getTemplateRecord } from "@/lib/template-registry";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
const stripeClient = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
    })
  : null;

const MAX_BODY_SIZE_BYTES = 50_000; // 50 KB is plenty for metadata payloads.
const DEFAULT_UNIT_AMOUNT_CENTS = 3_499;

const requestSchema = z
  .object({
    variantId: z.number().int().positive(),
    templateId: z.string().optional(),
    templateStoreId: z.string().max(128).optional(),
    designImage: z
      .string()
      .optional()
      .refine(
        (value) =>
          !value ||
          /^data:image\/[a-z0-9.+-]+;base64,/i.test(value) ||
          (() => {
            try {
              new URL(value);
              return true;
            } catch {
              return false;
            }
          })(),
        { message: "designImage must be a valid URL or base64 data URL." },
      ),
    email: z.string().email().optional(),
    quantity: z.number().int().positive().optional().default(1),
    shippingOption: z.enum(["standard", "express"]).optional().default("standard"),
    handoffToken: z
      .string()
      .max(2048)
      .optional(),
    unitPriceCents: z.number().int().positive().optional(),
    currency: z.string().optional(),
    pricing: z
      .object({
        subtotal: z.number().optional(),
        shipping: z.number().optional(),
        tax: z.number().optional(),
        total: z.number().optional(),
        quantity: z.number().optional(),
        currency: z.string().optional(),
        source: z.string().optional(),
      })
      .optional(),
  });

const toBoolean = (value: string | undefined | null) =>
  value?.toLowerCase() === "true";

const showExpressShipping =
  toBoolean(process.env.SHOW_EXPRESS_SHIPPING) ||
  toBoolean(process.env.NEXT_PUBLIC_SHOW_EXPRESS_SHIPPING);

const STANDARD_SHIPPING_RATE = process.env.STRIPE_SHIPPING_RATE_STANDARD ?? "";
const EXPRESS_SHIPPING_RATE = process.env.STRIPE_SHIPPING_RATE_EXPRESS ?? "";

const buildShippingOptions = () => {
  const options: Array<{ shipping_rate: string }> = [];
  if (STANDARD_SHIPPING_RATE) {
    options.push({ shipping_rate: STANDARD_SHIPPING_RATE });
  }
  if (showExpressShipping && EXPRESS_SHIPPING_RATE) {
    options.push({ shipping_rate: EXPRESS_SHIPPING_RATE });
  }
  return options;
};

const resolveBaseUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export async function POST(request: Request) {
  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader) {
    const size = Number.parseInt(lengthHeader, 10);
    if (!Number.isNaN(size) && size > MAX_BODY_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 },
      );
    }
  }

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

  if (
    payload.shippingOption === "express" &&
    (!showExpressShipping || !EXPRESS_SHIPPING_RATE)
  ) {
    return NextResponse.json(
      { error: "Express shipping is not currently available." },
      { status: 400 },
    );
  }

  let templateRecord = null;
  if (payload.templateStoreId) {
    templateRecord = await getTemplateRecord(payload.templateStoreId);
    if (
      templateRecord &&
      templateRecord.variantId !== payload.variantId
    ) {
      return NextResponse.json(
        {
          error:
            "The saved template does not match the selected variant. Save your design again inside the editor.",
        },
        { status: 409 },
      );
    }
  }

  const resolvedTemplateId =
    templateRecord?.templateId ?? payload.templateId ?? null;

  const currency =
    (payload.currency ??
      payload.pricing?.currency ??
      "usd")
      .toString()
      .toLowerCase();

  const unitAmountCents =
    payload.unitPriceCents ??
    (payload.pricing?.subtotal != null
      ? Math.max(1, Math.round(payload.pricing.subtotal * 100))
      : null) ??
    DEFAULT_UNIT_AMOUNT_CENTS;

  const hasDesignArtifact =
    Boolean(payload.templateStoreId) ||
    Boolean(payload.templateId) ||
    Boolean(payload.designImage);

  if (!hasDesignArtifact) {
    // Keep the flow unblocked, but log the missing artifact so we can
    // backfill or request a re-save if Printful does not return a template.
    console.warn("[checkout] Missing design artifact for checkout payload", {
      variantId: payload.variantId,
      templateStoreId: payload.templateStoreId,
      templateId: payload.templateId,
    });
  }

  if (!stripeClient || !stripeSecretKey) {
    const shippingOptions = buildShippingOptions();
    return NextResponse.json(
      {
        mock: true,
        message:
          "Stripe secret key missing. Returning mock checkout session for local development.",
        url: "https://dashboard.stripe.com/test/payments",
        shippingOptions,
        unitAmountCents,
        currency,
      },
      { status: 200 },
    );
  }

  if (!STANDARD_SHIPPING_RATE) {
    return NextResponse.json(
      {
        error:
          "Stripe shipping rate (standard) is not configured. Set STRIPE_SHIPPING_RATE_STANDARD.",
      },
      { status: 500 },
    );
  }

  const shippingOptions = buildShippingOptions();
  const baseUrl = resolveBaseUrl();
  const handoffParam = payload.handoffToken
    ? `&handoff=${payload.handoffToken}`
    : "";
  const successUrl = `${baseUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}${handoffParam}`;

  try {
    const session = await stripeClient.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: unitAmountCents,
            product_data: {
              name: "Custom phone case",
              metadata: {
                variantId: String(payload.variantId),
                pricingSource: payload.pricing?.source ?? "printful",
                unitPriceCents: String(unitAmountCents),
              },
            },
          },
          quantity: payload.quantity,
        },
      ],
      success_url: successUrl,
      cancel_url: `${baseUrl}/checkout?cancelled=1`,
      customer_email: payload.email,
      metadata: {
        variantId: String(payload.variantId),
        templateId: resolvedTemplateId ?? "",
        templateStoreId: payload.templateStoreId ?? "",
        hasDesignImage: payload.designImage ? "true" : "false",
        shippingOption: payload.shippingOption,
        unitPriceCents: String(unitAmountCents),
        currency,
      },
      shipping_options: shippingOptions.length ? shippingOptions : undefined,
      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json(
      {
        id: session.id,
        url: session.url,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stripe session creation failed.";
    return NextResponse.json(
      {
        error: message,
      },
      { status: 502 },
    );
  }
}
