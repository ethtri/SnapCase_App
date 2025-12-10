"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react";

import { logAnalyticsEvent } from "@/lib/analytics";
import {
  clearDesignContext,
  loadDesignContext,
  markCheckoutAttempt,
  type DesignContext,
} from "@/lib/design-context";
import {
  generateOrderId,
  persistOrderConfirmationSnapshot,
} from "@/lib/order-confirmation";

type ShippingOption = "standard" | "express";

type ShippingCopy = {
  label: string;
  description: string;
  eta: string;
  price: number;
};

type PricingSnapshot = {
  quantity: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
};

const SHIPPING_DETAILS: Record<ShippingOption, ShippingCopy> = {
  standard: {
    label: "Standard",
    description: "Arrives in 3-5 business days.",
    eta: "3 to 5 business days",
    price: 4.99,
  },
  express: {
    label: "Express",
    description: "Arrives in 1-2 business days.",
    eta: "1 to 2 business days",
    price: 14.99,
  },
};

const CHECKOUT_BASE_PRICE = 34.99;
const CHECKOUT_TAX_RATE = 0.0825;
const CHECKOUT_QUANTITY = 1;

const showExpressShipping =
  (process.env.NEXT_PUBLIC_SHOW_EXPRESS_SHIPPING ?? "false").toLowerCase() ===
  "true";

const allowCancelBannerDismiss =
  (process.env.NEXT_PUBLIC_ALLOW_CANCEL_BANNER_DISMISS ?? "false").toLowerCase() ===
  "true";

const CHECKOUT_CANCEL_STORAGE_KEY = "snapcase:checkout-cancelled-at";

const encodeDesignHandoff = (
  context: DesignContext | null,
): string | null => {
  if (!context) {
    return null;
  }

  const payload = {
    variantId: context.variantId ?? null,
    externalProductId: context.externalProductId ?? null,
    templateId: context.templateId ?? null,
    templateStoreId: context.templateStoreId ?? null,
    templateStoredAt: context.templateStoredAt ?? null,
    designFileId: context.designFileId ?? null,
    designFileUrl: context.designFileUrl ?? null,
    exportedImage: context.exportedImage ?? null,
    variantLabel: context.variantLabel ?? null,
    unitPriceCents: context.unitPriceCents ?? null,
    unitPriceCurrency: context.unitPriceCurrency ?? null,
    pricingSource: context.pricingSource ?? null,
    printfulProductId: context.printfulProductId ?? null,
  };

  try {
    return encodeURIComponent(JSON.stringify(payload));
  } catch {
    return null;
  }
};

const formatCurrency = (
  value: number,
  currency: string = "USD",
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

const calculatePricingSnapshot = (
  context: DesignContext | null,
  shippingOption: ShippingOption,
): PricingSnapshot => {
  const unitPriceCents =
    context?.unitPriceCents != null
      ? context.unitPriceCents
      : Math.round(CHECKOUT_BASE_PRICE * 100);
  const basePrice = unitPriceCents / 100;
  const subtotal = Number(
    (basePrice * CHECKOUT_QUANTITY).toFixed(2),
  );
  const shipping = SHIPPING_DETAILS[shippingOption]?.price ?? 0;
  const taxBase = subtotal + shipping;
  const tax = Number((taxBase * CHECKOUT_TAX_RATE).toFixed(2));
  const total = Number((subtotal + shipping + tax).toFixed(2));
  const currency =
    (context?.unitPriceCurrency &&
      context.unitPriceCurrency.toUpperCase()) ||
    "USD";

  return {
    quantity: CHECKOUT_QUANTITY,
    subtotal,
    shipping,
    tax,
    total,
    currency,
  };
};

type CheckoutCancelBannerProps = {
  onResume: () => void;
};

function CheckoutCancelBanner({ onResume }: CheckoutCancelBannerProps): JSX.Element | null {
  const searchParams = useSearchParams();
  const [persistedCancelled, setPersistedCancelled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const existing = window.sessionStorage.getItem(CHECKOUT_CANCEL_STORAGE_KEY);
    setPersistedCancelled(Boolean(existing));
  }, []);

  const isCheckoutCancelled = useMemo(() => {
    if (!searchParams) {
      return false;
    }
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

  useEffect(() => {
    if (!isCheckoutCancelled || typeof window === "undefined") {
      return;
    }
    setPersistedCancelled(true);
    window.sessionStorage.setItem(
      CHECKOUT_CANCEL_STORAGE_KEY,
      new Date().toISOString(),
    );
  }, [isCheckoutCancelled]);

  const shouldShow = persistedCancelled || isCheckoutCancelled;
  if (!shouldShow) {
    return null;
  }

  const handleDismiss = () => {
    if (!allowCancelBannerDismiss || typeof window === "undefined") {
      return;
    }
    window.sessionStorage.removeItem(CHECKOUT_CANCEL_STORAGE_KEY);
    setPersistedCancelled(false);
  };

  return (
    <aside
      className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"
      data-testid="checkout-cancel-banner"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
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
        {allowCancelBannerDismiss ? (
          <button
            type="button"
            onClick={handleDismiss}
            className="self-start rounded-full border border-amber-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900 transition hover:bg-amber-100"
          >
            Dismiss
          </button>
        ) : null}
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

function QualityPromiseBanner(): JSX.Element {
  return (
    <section
      className="flex items-start gap-4 rounded-3xl border border-transparent p-5 shadow-sm"
      data-testid="quality-promise-banner"
      style={{
        backgroundColor: "var(--snap-violet-50, rgba(124, 58, 237, 0.1))",
      }}
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-purple-700"
        style={{ color: "var(--snap-violet, #7c3aed)" }}
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="currentColor"
          role="presentation"
        >
          <path d="M12 2 4 5v6c0 5.55 3.84 10.74 8 11 4.16-.26 8-5.45 8-11V5l-8-3Zm0 2.18L18 6.1v4.9c0 4.4-2.94 8.77-6 9-3.06-.23-6-4.6-6-9V6.1l6-1.92Zm3.3 4.27-4.59 4.58-2-1.99-1.42 1.41 3.41 3.42 6-6Z" />
        </svg>
      </span>
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-gray-900">
          Snapcase Quality Promise
        </h2>
        <p className="text-sm text-gray-700">
          If anything&rsquo;s off, we remake it on us. You&rsquo;ll see this promise echoed
          on support replies and post-purchase screens so there&rsquo;s never conflicting copy.
        </p>
      </div>
    </section>
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
  const [pricingSnapshot, setPricingSnapshot] = useState<PricingSnapshot>(() =>
    calculatePricingSnapshot(null, "standard"),
  );
  const [pricingLiveMessage, setPricingLiveMessage] = useState("");
  const [shippingLiveMessage, setShippingLiveMessage] = useState("");
  const pricingSignatureRef = useRef<string>("");

  useEffect(() => {
    const context = loadDesignContext();
    if (context) {
      setDesignContext(context);
    }
  }, []);

  const availableShippingOptions = useMemo<ShippingOption[]>(() => {
    return showExpressShipping ? ["standard", "express"] : ["standard"];
  }, []);

  useEffect(() => {
    if (!availableShippingOptions.includes(shippingOption)) {
      setShippingOption("standard");
    }
  }, [availableShippingOptions, shippingOption]);

  useEffect(() => {
    const nextSnapshot = calculatePricingSnapshot(designContext, shippingOption);
    setPricingSnapshot(nextSnapshot);

    const shippingCopy = SHIPPING_DETAILS[shippingOption]
      ? `Shipping ${SHIPPING_DETAILS[shippingOption].label} (${SHIPPING_DETAILS[shippingOption].eta}) now costs ${formatCurrency(nextSnapshot.shipping)}.`
      : "";
    const totalsCopy = `Totals updated: subtotal ${formatCurrency(nextSnapshot.subtotal)}, shipping ${formatCurrency(nextSnapshot.shipping)}, estimated tax ${formatCurrency(nextSnapshot.tax)}, total ${formatCurrency(nextSnapshot.total)}.`;

    setShippingLiveMessage(shippingCopy);
    setPricingLiveMessage(totalsCopy);

    const signature = [
      nextSnapshot.subtotal,
      nextSnapshot.shipping,
      nextSnapshot.tax,
      nextSnapshot.total,
      shippingOption,
      designContext?.variantId ?? "na",
    ].join("|");

    if (pricingSignatureRef.current !== signature) {
      pricingSignatureRef.current = signature;
      logAnalyticsEvent("checkout_pricing_update", {
        shippingOption,
        subtotal: nextSnapshot.subtotal,
        shipping: nextSnapshot.shipping,
        tax: nextSnapshot.tax,
        total: nextSnapshot.total,
        quantity: nextSnapshot.quantity,
        currency: nextSnapshot.currency,
        variantId: designContext?.variantId ?? null,
        templateId: designContext?.templateId ?? null,
      });
    }
  }, [designContext, shippingOption]);

  const handleShippingChange = (option: ShippingOption) => {
    setShippingOption(option);
    logAnalyticsEvent("checkout_shipping_selected", {
      option,
      price: SHIPPING_DETAILS[option]?.price ?? 0,
      variantId: designContext?.variantId ?? null,
      templateId: designContext?.templateId ?? null,
    });
  };

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
      const contextForRequest = updatedContext ?? designContext;

      if (!contextForRequest || contextForRequest.variantId == null) {
        setError("Missing design context. Return to the editor to start checkout.");
        setIsSubmitting(false);
        return;
      }

      if (updatedContext) {
        setDesignContext(updatedContext);
      }

      const handoffToken = encodeDesignHandoff(contextForRequest);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: contextForRequest.variantId,
          templateStoreId: contextForRequest.templateStoreId ?? undefined,
          templateId: contextForRequest.templateId ?? undefined,
          designImage: contextForRequest.exportedImage ?? undefined,
          quantity: 1,
          shippingOption,
          pricing: {
            ...pricingSnapshot,
            source: contextForRequest.pricingSource ?? "printful",
          },
          unitPriceCents: Math.round(pricingSnapshot.subtotal * 100),
          currency: pricingSnapshot.currency,
          ...(handoffToken ? { handoffToken } : {}),
        }),
      });

      const data = (await response.json()) as {
        id?: string;
        url?: string;
        mock?: boolean;
        message?: string;
        error?: string;
      };

      if (response.ok) {
        persistOrderConfirmationSnapshot({
          orderId: data.id ?? generateOrderId(),
          shippingOption,
          timelineState: "submitted",
        });
        if (data.url) {
          if (data.mock) {
            setMockCheckoutUrl(data.url);
          } else {
            window.location.href = data.url;
          }
        } else {
          setError("Checkout session created without a redirect URL.");
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
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "var(--snap-gray-50, #f9fafb)" }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-gray-900">
            Review &amp; Shipping
          </h1>
          <p className="text-base text-gray-600">
            Confirm your design, shipping speed, and totals before handing off
            to Stripe. Everything shown here stays locked to your saved design.
          </p>
        </header>

        <Suspense fallback={null}>
          <CheckoutCancelBanner onResume={resumeCheckout} />
        </Suspense>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <QualityPromiseBanner />

            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Design summary
                  </h2>
                  <p className="text-sm text-gray-500">
                    Pulled from your latest EDM save so you can confirm details
                    without reopening the editor.
                  </p>
                </div>
                <Link
                  href="/design"
                  className="text-sm font-semibold text-violet-700 underline"
                  style={{ color: "var(--snap-violet, #7c3aed)" }}
                >
                  Edit design
                </Link>
              </div>

              {designContext ? (
                <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium">Device</span>
                    <div className="flex flex-col items-end text-right">
                      <span
                        className="text-xs font-semibold text-gray-900"
                        data-testid="checkout-variant-label"
                      >
                        {designContext.variantLabel ?? "Locked to your Snapcase pick"}
                      </span>
                    </div>
                  </div>
                  {designContext.templateId ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-600">
                        EDM template
                      </span>
                      <span className="font-mono text-gray-900">
                        {designContext.templateId}
                      </span>
                    </div>
                  ) : null}
                  {designContext.exportedImage ? (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-gray-600">
                        Design preview
                      </span>
                      <Image
                        src={designContext.exportedImage}
                        alt="Design preview"
                        width={512}
                        height={512}
                        className="h-48 w-full rounded-xl border border-gray-200 object-cover"
                        unoptimized
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
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                  No design context found. Return to the editor, save a template
                  or export, then continue to checkout.
                </div>
              )}
            </section>

            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Shipping speed
                </h2>
                <p className="text-sm text-gray-500">
                  Options reflect the current flag configuration. Selecting an
                  option recalculates totals via the polite live regions.
                </p>
              </div>
              <fieldset
                role="radiogroup"
                aria-label="Shipping speed"
                className="space-y-3"
              >
                {availableShippingOptions.map((option) => {
                  const isSelected = shippingOption === option;
                  const details = SHIPPING_DETAILS[option];
                  return (
                    <label
                      key={option}
                      className={`flex items-center justify-between gap-4 rounded-2xl border bg-white px-4 py-3 text-sm transition focus-within:ring-2 focus-within:ring-offset-2 ${isSelected ? "border-2 shadow-sm" : "border"}`}
                      style={
                        isSelected
                          ? {
                              borderColor:
                                "var(--snap-violet, rgba(124,58,237,.8))",
                              boxShadow:
                                "0 0 0 2px rgba(124,58,237,0.15) inset",
                            }
                          : undefined
                      }
                    >
                      <span className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {details.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {details.description}
                        </span>
                      </span>
                      <span className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(details.price)}
                        </span>
                        <input
                          type="radio"
                          name="shipping"
                          value={option}
                          checked={isSelected}
                          onChange={() => handleShippingChange(option)}
                          aria-label={details.label}
                        />
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            </section>

            <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Ship to
                </h2>
                <p className="text-sm text-gray-500">
                  Address capture connects to order creation in a later
                  milestone.
                </p>
              </div>
                <button
                  type="button"
                  className="text-sm font-semibold text-gray-700 underline"
                  disabled
                >
                  Change
                </button>
              </div>
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                Shipping address will sync with your saved details once the
                backend order draft is active.
              </div>
            </section>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <section
              className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              aria-live="polite"
              aria-atomic="true"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Cost summary
                </h2>
                <p className="text-sm text-gray-500">
                  Updates anytime your variant or shipping selections change.
                </p>
              </div>
              <dl className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <dt>Subtotal</dt>
                  <dd className="font-medium text-gray-900">
                    {formatCurrency(pricingSnapshot.subtotal)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Shipping ({SHIPPING_DETAILS[shippingOption]?.label})</dt>
                  <dd className="font-medium text-gray-900">
                    {formatCurrency(pricingSnapshot.shipping)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Est. tax</dt>
                  <dd className="font-medium text-gray-900">
                    {formatCurrency(pricingSnapshot.tax)}
                  </dd>
                </div>
                <div className="h-px w-full bg-gray-200" />
                <div className="flex items-center justify-between text-base font-semibold text-gray-900">
                  <dt>Total</dt>
                  <dd>{formatCurrency(pricingSnapshot.total)}</dd>
                </div>
              </dl>
            </section>

            <div aria-live="polite" className="sr-only" data-testid="shipping-live-region">
              {shippingLiveMessage}
            </div>
            <div aria-live="polite" className="sr-only" data-testid="pricing-live-region">
              {pricingLiveMessage}
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">
                  Stripe handoff
                </p>
                <p className="text-xs text-gray-600">
                  We charge your card after production checks clear. The Quality
                  Promise covers free reprints if anything slips.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor: "var(--snap-violet, #7c3aed)",
                  }}
                  disabled={isSubmitting || !designContext}
                  aria-busy={isSubmitting}
                >
                  <span>
                    {isSubmitting
                      ? "Creating checkout session..."
                      : "Pay with Stripe"}
                  </span>
                  <Image
                    src="/stripe/lockup.svg"
                    alt=""
                    width={96}
                    height={28}
                    className="h-4 w-auto"
                    aria-hidden="true"
                  />
                </button>
                <Link
                  href="/design"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  Back to design
                </Link>
              </div>
              <p className="text-xs text-gray-500">
                Successful payment redirects to Stripe. Cancel from Stripe any
                time to come back here with your design preserved.
              </p>
            </section>

            {mockCheckoutUrl ? (
              <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p>
                  Stripe secrets are not configured. Use the mock checkout URL to
                  demo the flow without leaving the prototype.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <a
                    href={mockCheckoutUrl}
                    className="font-semibold underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open mock checkout
                  </a>
                  <Link
                    href="/checkout?stripe=cancelled"
                    className="font-semibold underline"
                    data-testid="mock-cancel-link"
                  >
                    Simulate Stripe cancel
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
