import Stripe from "stripe";
import { NextResponse } from "next/server";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

const stripe =
  STRIPE_SECRET_KEY !== ""
    ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
    : null;

export async function POST(request: Request) {
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      {
        message:
          "Stripe webhook secret missing. Configure STRIPE_WEBHOOK_SECRET to verify signatures.",
      },
      { status: 200 },
    );
  }

  if (!stripe) {
    return NextResponse.json(
      {
        message:
          "Stripe secret key missing. Configure STRIPE_SECRET_KEY to enable webhook verification.",
      },
      { status: 200 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature header." },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json(
      {
        error: "Invalid Stripe signature.",
      },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed":
      console.info("Stripe webhook received checkout.session.completed", {
        id: event.id,
        sessionId: (event.data.object as Stripe.Checkout.Session).id,
      });
      break;
    case "checkout.session.async_payment_failed":
    case "checkout.session.async_payment_succeeded":
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed":
      console.info("Stripe webhook received event", {
        type: event.type,
        id: event.id,
      });
      break;
    default:
      console.debug("Stripe webhook event ignored (no handler yet)", {
        type: event.type,
        id: event.id,
      });
  }

  return NextResponse.json({ received: true, id: event.id }, { status: 200 });
}
