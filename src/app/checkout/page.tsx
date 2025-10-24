"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DesignContext = {
  variantId: number;
  externalProductId: string;
  templateId: string | null;
  exportedImage: string | null;
  timestamp: number;
};

type ShippingOption = "standard" | "express";

const showExpressShipping =
  (process.env.NEXT_PUBLIC_SHOW_EXPRESS_SHIPPING ?? "false").toLowerCase() ===
  "true";

export default function CheckoutPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [designContext, setDesignContext] = useState<DesignContext | null>(null);
  const [shippingOption, setShippingOption] =
    useState<ShippingOption>("standard");
  const [error, setError] = useState<string | null>(null);
  const [mockCheckoutUrl, setMockCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("snapcase:design-context");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as DesignContext;
      setDesignContext(parsed);
    } catch (err) {
      console.error("Failed to parse design context", err);
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

  const clearDesign = () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("snapcase:design-context");
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
            <div className="flex items-center justify-between">
              <span className="font-medium">Variant</span>
              <span className="font-mono text-xs">
                {designContext.variantId} / {designContext.externalProductId}
              </span>
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
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Stripe secrets are not configured. A mock checkout URL is available
            for testing:{" "}
            <a
              href={mockCheckoutUrl}
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              {mockCheckoutUrl}
            </a>
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
