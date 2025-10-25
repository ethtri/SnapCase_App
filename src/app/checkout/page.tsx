"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type JSX } from "react";

import {
  clearDesignContext,
  loadDesignContext,
  markCheckoutAttempt,
  type DesignContext,
} from "@/lib/design-context";

type ShippingOption = "standard" | "express";

const showExpressShipping =
  (process.env.NEXT_PUBLIC_SHOW_EXPRESS_SHIPPING ?? "false").toLowerCase() ===
  "true";

type CheckoutCancelBannerProps = {
  onResume: () => void;
};

function CheckoutCancelBanner({ onResume }: CheckoutCancelBannerProps): JSX.Element | null {
  const searchParams = useSearchParams();
  const isCheckoutCancelled = useMemo(() => {
    const stripeParam = searchParams.get("stripe");
    if (stripeParam?.toLowerCase() === "cancelled") {
      return true;
    }
    if (!searchParams.has("cancelled")) {
      return false;
    }
    const cancelledValue = searchParams.get("cancelled");
    if (!cancelledValue) {
      return true;
    }
    const normalized = cancelledValue.toLowerCase();
    return (
      normalized !== "0" &&
      normalized !== "false" &&
      normalized !== "no"
    );
  }, [searchParams]);

  if (!isCheckoutCancelled) {
    return null;
  }

  return (
    <aside
      className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"
      data-testid="checkout-cancel-banner"
    >
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-amber-900">
          Stripe checkout was cancelled
        </h2>
        <p>
          Your latest design is still saved below. Jump back into checkout
          whenever you&rsquo;re ready or head to the editor to tweak the
          artwork.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onResume}
          className="inline-flex items-center justify-center rounded-md bg-amber-900 px-3 py-2 text-sm font-medium text-amber-50 transition hover:bg-amber-800"
          data-testid="resume-checkout-button"
        >
          Resume checkout
        </button>
        <Link
          href="/design"
          className="text-sm font-medium text-amber-900 underline"
          data-testid="return-to-design-link"
        >
          Return to design
        </Link>
      </div>
    </aside>
  );
}

export default function CheckoutPage(): JSX.Element {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [designContext, setDesignContext] = useState<DesignContext | null>(null);
  const [shippingOption, setShippingOption] =
    useState<ShippingOption>("standard");
  const [error, setError] = useState<string | null>(null);
  const [mockCheckoutUrl, setMockCheckoutUrl] = useState<string | null>(null);


  useEffect(() => {
    const context = loadDesignContext();
    if (context) {
      setDesignContext(context);
    }
  }, []);

  const availableShippingOptions = useMemo<ShippingOption[]>(() => {
    return showExpressShipping ? ["standard", "express"] : ["standard"];
  }, [showExpressShipping]);

  useEffect(() => {
    if (!availableShippingOptions.includes(shippingOption)) {
      setShippingOption("standard");
    }
  }, [availableShippingOptions, shippingOption]);

  const handleSubmit = async () => {
    if (!designContext) {
      setError("Missing design context. Return to the editor to start checkout.");
      return;
    }

    setError(null);
    setMockCheckoutUrl(null);
    setIsSubmitting(true);

    try {
      const updatedContext = markCheckoutAttempt();
      if (updatedContext) {
        setDesignContext(updatedContext);
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: designContext.variantId,
          templateId: designContext.templateId ?? undefined,
          designImage: designContext.exportedImage ?? undefined,
          quantity: 1,
          shippingOption,
        }),
      });

      const data = (await response.json()) as {
        id?: string;
        url?: string;
        mock?: boolean;
        message?: string;
        error?: string;
      };

      if (response.ok && data.url) {
        if (data.mock) {
          setMockCheckoutUrl(data.url);
        } else {
          window.location.href = data.url;
        }
      } else {
        const message =
          data?.message ??
          data?.error ??
          "Unable to create a Stripe Checkout session.";
        setError(message);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected checkout error.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resumeCheckout = () => {
    setError(null);
    setMockCheckoutUrl(null);
router.replace("/checkout");
  };

  const clearDesign = () => {
    clearDesignContext();
    setDesignContext(null);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-12">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-gray-500">
          Checkout
        </p>
        <h1 className="text-3xl font-semibold text-gray-900">
          Review and complete your order
        </h1>
        <p className="text-base text-gray-600">
          This page collects your saved design context and calls{" "}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
            /api/checkout
          </code>{" "}
          to create a Stripe Checkout session.
        </p>
      </header>

      <Suspense fallback={null}>
        <CheckoutCancelBanner onResume={resumeCheckout} />
      </Suspense>

      <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-gray-900">
            Order summary prototype
          </h2>
          <p className="text-sm text-gray-600">
            The summary below is sourced from session storage when you arrive
            from the editor. Persistence will move to a draft order store once
            the backend is wired to Printful.
          </p>
        </div>

        {designContext ? (
          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <div className="flex items-start justify-between gap-3">
              <span className="font-medium">Variant</span>
              <div className="flex flex-col items-end text-right">
                {designContext.variantLabel ? (
                  <span
                    className="text-xs font-semibold text-gray-900"
                    data-testid="checkout-variant-label"
                  >
                    {designContext.variantLabel}
                  </span>
                ) : null}
                <span className="font-mono text-xs text-gray-600">
                  {designContext.variantId ?? "—"}
                  {designContext.externalProductId
                    ? ` / ${designContext.externalProductId}`
                    : ""}
                </span>
              </div>
            </div>
            {designContext.templateId ? (
              <div className="flex items-center justify-between">
                <span className="font-medium">EDM template</span>
                <span className="font-mono text-xs">
                  {designContext.templateId}
                </span>
              </div>
            ) : null}
            {designContext.exportedImage ? (
              <div className="space-y-2">
                <span className="font-medium">Fabric export preview</span>
                <img
                  src={designContext.exportedImage}
                  alt="Design preview"
                  className="h-48 w-full rounded-lg border border-gray-200 object-cover"
                />
              </div>
            ) : null}
            <button
              type="button"
              onClick={clearDesign}
              className="text-xs font-medium text-gray-500 underline"
            >
              Clear stored design
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
            No design context found. Return to the editor, save a template or
            export, then continue to checkout.
          </div>
        )}

        <fieldset className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <legend className="text-sm font-medium text-gray-900">
            Shipping speed
          </legend>
          <p className="text-xs text-gray-500">
            Options shown reflect the current feature flag configuration.
          </p>
          <div className="space-y-2">
            <label className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
              <span className="flex flex-col">
                <span className="font-medium text-gray-900">Standard</span>
                <span className="text-xs text-gray-500">
                  Arrives in 5-7 business days.
                </span>
              </span>
              <input
                type="radio"
                name="shipping"
                value="standard"
                checked={shippingOption === "standard"}
                onChange={() => setShippingOption("standard")}
              />
            </label>
            {availableShippingOptions.includes("express") ? (
              <label className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
                <span className="flex flex-col">
                  <span className="font-medium text-gray-900">Express</span>
                  <span className="text-xs text-gray-500">
                    Arrives in 2-3 business days.
                  </span>
                </span>
                <input
                  type="radio"
                  name="shipping"
                  value="express"
                  checked={shippingOption === "express"}
                  onChange={() => setShippingOption("express")}
                />
              </label>
            ) : null}
          </div>
        </fieldset>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {mockCheckoutUrl ? (
          <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p>
              Stripe secrets are not configured. Use the mock checkout URL to
              demo the flow without leaving the prototype.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <a
                href={mockCheckoutUrl}
                className="font-medium text-amber-900 underline"
                target="_blank"
                rel="noreferrer"
              >
                Open mock checkout
              </a>
              <Link
                href="/checkout?stripe=cancelled"
                className="font-medium text-amber-900 underline"
                data-testid="mock-cancel-link"
              >
                Simulate Stripe cancel
              </Link>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          disabled={isSubmitting || !designContext}
        >
          {isSubmitting ? "Creating checkout session..." : "Proceed to Stripe"}
        </button>

        <p className="text-xs text-gray-500">
          Successful completion will redirect to the Stripe-hosted checkout. A
          cancel from Stripe will return here with your design preserved.
        </p>
      </section>

      <footer className="flex items-center justify-between text-sm text-gray-600">
        <Link href="/design" className="text-gray-900 underline">
          &larr; Back to design
        </Link>
        <span>
          Thank-you page:{" "}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
            /thank-you
          </code>
        </span>
      </footer>
    </div>
  );
}

