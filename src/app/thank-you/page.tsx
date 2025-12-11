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
  type MouseEvent,
} from "react";

import { logAnalyticsEvent } from "@/lib/analytics";
import {
  clearDesignContext,
  loadDesignContext,
  saveDesignContext,
  type DesignContext,
} from "@/lib/design-context";
import {
  ORDER_SUPPORT_URL,
  generateOrderId,
  getShippingCopy,
  loadOrderConfirmationSnapshot,
  mapPrintfulStatusToTimelineState,
  persistOrderConfirmationSnapshot,
  type FulfillmentTimelineState,
  type OrderConfirmationSnapshot,
  type ShippingOption,
} from "@/lib/order-confirmation";

const HANDOFF_PARAM = "handoff";
const TIMELINE_SEQUENCE: FulfillmentTimelineState[] = [
  "submitted",
  "print_files",
  "in_production",
  "shipped",
];

const TIMELINE_LABELS: Record<
  FulfillmentTimelineState,
  { label: string; helper: string }
> = {
  submitted: {
    label: "Submitted",
    helper: "Stripe confirmed your payment.",
  },
  print_files: {
    label: "Print files",
    helper: "We are generating production files.",
  },
  in_production: {
    label: "In production",
    helper: "Our partner is printing your case.",
  },
  shipped: {
    label: "Shipped",
    helper: "Tracking details are on the way.",
  },
};

export default function ThankYouPage(): JSX.Element {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-sm text-gray-600">Loading your confirmation...</div>}>
      <ThankYouScreen />
    </Suspense>
  );
}

function ThankYouScreen(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [designContext, setDesignContext] = useState<DesignContext | null>(null);
  const [orderSnapshot, setOrderSnapshot] =
    useState<OrderConfirmationSnapshot | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasLoadedContext, setHasLoadedContext] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const hasClearedContextRef = useRef(false);
  const hasLoggedViewRef = useRef(false);
  const timelineLoggedRef = useRef(new Set<FulfillmentTimelineState>());

  const sessionIdParam = searchParams?.get("session_id");
  const statusParam = searchParams?.get("status");
  const rawShippingParam = searchParams?.get("shipping");
  const shippingOption: ShippingOption =
    rawShippingParam === "express" ? "express" : "standard";

  useEffect(() => {
    let context = loadDesignContext();
    let loadedViaHandoff = false;

    if (!context && typeof window !== "undefined" && searchParams) {
      const encodedHandoff = searchParams.get(HANDOFF_PARAM);

      if (encodedHandoff) {
        try {
          const decoded = decodeURIComponent(encodedHandoff);
          const parsed = JSON.parse(decoded) as Partial<DesignContext>;
          const sanitized: Partial<DesignContext> = {
            variantId:
              typeof parsed.variantId === "number" ? parsed.variantId : null,
            externalProductId:
              typeof parsed.externalProductId === "string"
                ? parsed.externalProductId
                : null,
            templateId:
              typeof parsed.templateId === "string" ? parsed.templateId : null,
            templateStoreId:
              typeof parsed.templateStoreId === "string"
                ? parsed.templateStoreId
                : null,
            templateStoredAt:
              typeof parsed.templateStoredAt === "number"
                ? parsed.templateStoredAt
                : null,
            variantLabel:
              typeof parsed.variantLabel === "string"
                ? parsed.variantLabel
                : null,
            exportedImage:
              typeof parsed.exportedImage === "string"
                ? parsed.exportedImage
                : null,
            designFileId:
              typeof parsed.designFileId === "number"
                ? parsed.designFileId
                : null,
            designFileUrl:
              typeof parsed.designFileUrl === "string"
                ? parsed.designFileUrl
                : null,
            unitPriceCents:
              typeof parsed.unitPriceCents === "number"
                ? parsed.unitPriceCents
                : null,
            unitPriceCurrency:
              typeof parsed.unitPriceCurrency === "string"
                ? parsed.unitPriceCurrency
                : null,
            pricingSource:
              typeof parsed.pricingSource === "string"
                ? parsed.pricingSource
                : null,
            printfulProductId:
              typeof parsed.printfulProductId === "number"
                ? parsed.printfulProductId
                : null,
          };

          const restored = saveDesignContext(sanitized);
          if (restored) {
            context = restored;
            loadedViaHandoff = true;
          }
        } catch (error) {
          console.error("Failed to hydrate design context handoff", error);
        }
      }
    }

    if (context) {
      setDesignContext(context);
      setHasLoadedContext(true);

      if (loadedViaHandoff && typeof window !== "undefined") {
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete(HANDOFF_PARAM);
          const nextSearch = url.searchParams.toString();
          window.history.replaceState(
            null,
            "",
            `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${url.hash}`,
          );
        } catch {
          // Ignore URL manipulation errors.
        }
      }
    }

    setIsLoaded(true);
  }, [searchParams]);

  useEffect(() => {
    if (hasLoadedContext && !hasClearedContextRef.current) {
      clearDesignContext();
      hasClearedContextRef.current = true;
    }
  }, [hasLoadedContext]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const snapshot =
      loadOrderConfirmationSnapshot() ??
      persistOrderConfirmationSnapshot({
        orderId: sessionIdParam ? generateOrderId(sessionIdParam) : undefined,
        shippingOption,
        timelineState: mapPrintfulStatusToTimelineState(statusParam),
        printfulStatus: statusParam ?? null,
      }) ??
      ((): OrderConfirmationSnapshot => {
        const shippingCopy = getShippingCopy(shippingOption);
        return {
          orderId: generateOrderId(sessionIdParam),
          placedAt: new Date().toISOString(),
          shippingOption,
          shippingSpeedLabel: shippingCopy.speedLabel,
          shippingEtaLabel: shippingCopy.etaLabel,
          shippingEtaRange: shippingCopy.etaRange,
          timelineState: mapPrintfulStatusToTimelineState(statusParam),
          trackUrl: null,
          supportUrl: ORDER_SUPPORT_URL,
          printfulStatus: statusParam ?? null,
        };
      })();
    setOrderSnapshot(snapshot);
  }, [sessionIdParam, shippingOption, statusParam]);

  useEffect(() => {
    if (!orderSnapshot || hasLoggedViewRef.current) {
      return;
    }
    logAnalyticsEvent("thank_you_viewed", {
      order_id: orderSnapshot.orderId,
      shipping_method: orderSnapshot.shippingOption,
      template_id: designContext?.templateId ?? null,
      variant_id: designContext?.variantId ?? null,
      timeline_state: orderSnapshot.timelineState,
    });
    hasLoggedViewRef.current = true;
  }, [orderSnapshot, designContext]);

  useEffect(() => {
    if (!orderSnapshot) {
      return;
    }
    const activeIndex = TIMELINE_SEQUENCE.indexOf(orderSnapshot.timelineState);
    TIMELINE_SEQUENCE.forEach((step, index) => {
      if (index <= activeIndex && !timelineLoggedRef.current.has(step)) {
        timelineLoggedRef.current.add(step);
        logAnalyticsEvent("timeline_step_revealed", {
          order_id: orderSnapshot.orderId,
          step,
        });
      }
    });
  }, [orderSnapshot]);

  const timelineSteps = useMemo(() => {
    const activeIndex = orderSnapshot
      ? Math.max(TIMELINE_SEQUENCE.indexOf(orderSnapshot.timelineState), 0)
      : 0;
    return TIMELINE_SEQUENCE.map((step, index) => {
      const status =
        index < activeIndex
          ? "complete"
          : index === activeIndex
            ? "active"
            : "upcoming";
      return {
        id: step,
        status,
        label: TIMELINE_LABELS[step].label,
        helper: TIMELINE_LABELS[step].helper,
      };
    });
  }, [orderSnapshot]);

  const orderIdDisplay = orderSnapshot ? `#${orderSnapshot.orderId}` : "—";
  const trackHref =
    orderSnapshot?.trackUrl ??
    `/order/preview?from=thank-you&order=${encodeURIComponent(
      orderSnapshot?.orderId ?? "pending",
    )}`;

  const handleCopyOrderId = async () => {
    if (!orderSnapshot?.orderId || typeof navigator === "undefined") {
      return;
    }
    try {
      await navigator.clipboard.writeText(orderSnapshot.orderId);
      setCopyState("copied");
      logAnalyticsEvent("copy_order_id", {
        order_id: orderSnapshot.orderId,
      });
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      // Ignore clipboard errors (e.g., denied permissions).
    }
  };

  const handleDesignAnother = () => {
    if (designContext) {
      saveDesignContext(designContext);
    }
    if (orderSnapshot) {
      logAnalyticsEvent("design_another_clicked", {
        order_id: orderSnapshot.orderId,
        template_id: designContext?.templateId ?? null,
        variant_id: designContext?.variantId ?? null,
      });
    }
    router.push("/design");
  };

  const handleTrackOrder = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!orderSnapshot) {
      event.preventDefault();
      return;
    }
    logAnalyticsEvent("track_order_clicked", {
      order_id: orderSnapshot.orderId,
      origin: "thank_you",
    });
  };

  const handleSupportClick = () => {
    if (!orderSnapshot) {
      return;
    }
    logAnalyticsEvent("support_link_clicked", {
      order_id: orderSnapshot.orderId,
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="space-y-8">
          <header
            className="space-y-6 rounded-3xl border border-violet-100 bg-gradient-to-b from-violet-50 to-white p-6 shadow-sm lg:p-8"
            data-testid="thank-you-hero"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-4">
              <span className="inline-flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
                <svg
                  aria-hidden="true"
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
              <div className="space-y-2 text-gray-900">
                <p className="text-sm font-semibold uppercase tracking-widest text-violet-700">
                  Order confirmed
                </p>
                <h1 className="text-3xl font-semibold lg:text-4xl">
                  Order placed!
                </h1>
                <p className="text-base text-gray-700">
                  Your custom case is officially in motion. We&rsquo;ll email
                  tracking details as your order moves from print files to
                  shipping.
                </p>
                <p className="text-sm text-gray-600">
                  Keep this order ID handy in case support needs it:{" "}
                  <span className="font-semibold text-gray-900">
                    {orderIdDisplay}
                  </span>
                </p>
              </div>
            </div>
          </header>

          <section
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
            data-testid="fulfillment-timeline"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500">
                  Fulfillment timeline
                </p>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Submitted to shipped
                </h2>
              </div>
              <span className="text-xs font-mono uppercase tracking-wide text-gray-400">
                Production feed
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Statuses update as your order moves through production. Refresh or visit
              tracking for the latest milestones.
            </p>
            <div className="mt-6 space-y-6 lg:hidden">
              {timelineSteps.map((step, index) => {
                const isLast = index === timelineSteps.length - 1;
                const connector =
                  step.status === "complete" ? "bg-violet-600" : "bg-gray-200";
                return (
                  <div
                    key={step.id}
                    className="flex items-start gap-4"
                    data-step-id={step.id}
                    data-step-status={step.status}
                  >
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                          step.status === "complete"
                            ? "border-violet-600 bg-violet-600 text-white"
                            : step.status === "active"
                              ? "border-violet-600 bg-white text-violet-700"
                              : "border-gray-300 bg-gray-50 text-gray-400"
                        }`}
                        aria-current={step.status === "active" ? "step" : false}
                      >
                        {index + 1}
                      </span>
                      {!isLast ? (
                        <span
                          className={`mt-2 w-px flex-1 ${connector}`}
                          aria-hidden="true"
                        />
                      ) : null}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {step.label}
                      </p>
                      <p className="text-sm text-gray-600">{step.helper}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <ol className="mt-6 hidden items-center gap-4 lg:flex">
              {timelineSteps.map((step, index) => {
                const isLast = index === timelineSteps.length - 1;
                const connector =
                  step.status === "complete" ? "bg-violet-600" : "bg-gray-200";
                return (
                  <li
                    key={step.id}
                    className="flex flex-1 flex-col items-center text-center"
                    data-step-id={step.id}
                    data-step-status={step.status}
                  >
                    <div className="relative flex items-center justify-center">
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-base font-semibold ${
                          step.status === "complete"
                            ? "border-violet-600 bg-violet-600 text-white"
                            : step.status === "active"
                              ? "border-violet-600 bg-white text-violet-700"
                              : "border-gray-300 bg-gray-50 text-gray-400"
                        }`}
                        aria-current={step.status === "active" ? "step" : false}
                      >
                        {index + 1}
                      </span>
                      {!isLast ? (
                        <span
                          className={`absolute left-full top-1/2 hidden h-0.5 w-full translate-x-2 lg:block ${connector}`}
                          aria-hidden="true"
                        />
                      ) : null}
                    </div>
                    <div className="mt-4 space-y-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {step.label}
                      </p>
                      <p className="text-sm text-gray-600">{step.helper}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </section>

        <section className="space-y-6">
          <article
            className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
            data-testid="order-summary-card"
          >
            <div className="flex flex-col gap-2">
              <p className="text-sm uppercase tracking-wide text-gray-500">
                Order summary
              </p>
              <h2 className="text-2xl font-semibold text-gray-900">
                Saved for your records
              </h2>
              <p className="text-sm text-gray-600">
                We&rsquo;ll clear this data after you leave. Copy your ID if you
                need to follow up with support.
              </p>
            </div>
            <dl className="space-y-4 text-sm text-gray-700">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <dt className="text-gray-500">Order ID</dt>
                  <dd
                    className="font-mono text-base font-semibold text-gray-900"
                    data-testid="thank-you-order-id"
                  >
                    {orderIdDisplay}
                  </dd>
                </div>
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 transition hover:border-violet-200 hover:text-violet-700"
                  aria-label="Copy order ID"
                  data-testid="copy-order-id"
                >
                  <span>{copyState === "copied" ? "Copied" : "Copy ID"}</span>
                </button>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <dt className="text-gray-500">Fulfillment status</dt>
                  <dd className="font-semibold text-gray-900">
                    {orderSnapshot
                      ? TIMELINE_LABELS[orderSnapshot.timelineState].label
                      : "Pending"}
                  </dd>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Production
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <dt className="text-gray-500">Shipping</dt>
                  <dd className="font-semibold text-gray-900">
                    {orderSnapshot?.shippingSpeedLabel ?? "Standard shipping"}
                  </dd>
                </div>
                <div className="text-right text-xs text-gray-500">
                  {orderSnapshot?.shippingEtaRange}
                </div>
              </div>
            </dl>
            <div className="space-y-3">
              <Link
                href={trackHref}
                onClick={handleTrackOrder}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-violet-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
                data-testid="track-order-cta"
              >
                Track order
              </Link>
              <button
                type="button"
                onClick={handleDesignAnother}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-base font-semibold text-violet-700 transition hover:border-violet-200 hover:bg-violet-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
                data-testid="design-another-cta"
              >
                Design another case
              </button>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 text-emerald-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Estimated delivery:{" "}
                  {orderSnapshot?.shippingEtaLabel ??
                    getShippingCopy("standard").etaLabel}
                </span>
                <Link
                  href={orderSnapshot?.supportUrl ?? ORDER_SUPPORT_URL}
                  className="text-sm font-semibold text-gray-900 underline decoration-dotted hover:text-violet-700"
                  onClick={handleSupportClick}
                >
                  Need help? Contact support
                </Link>
              </div>
            </div>
          </article>

          {designContext ? (
            <article
              className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
              data-testid="design-summary"
            >
              <div className="space-y-1">
                <p className="text-sm uppercase tracking-wide text-gray-500">
                  Design summary
                </p>
                <h2 className="text-xl font-semibold text-gray-900">
                  Saved snapshot
                </h2>
                <p className="text-sm text-gray-600">
                  We keep this snapshot in session only on this page. Click
                  &ldquo;Design another&rdquo; to reload it in the editor.
                </p>
              </div>
              <dl className="space-y-3 text-sm text-gray-700">
                {designContext.variantLabel ? (
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-gray-500">Device</dt>
                    <dd className="font-semibold text-gray-900">
                      {designContext.variantLabel}
                    </dd>
                  </div>
                ) : null}
                <div className="flex flex-col gap-0.5">
                  <dt className="text-gray-500">Design status</dt>
                  <dd className="font-semibold text-gray-900">
                    {designContext.templateId
                      ? "Saved in Snapcase"
                      : "Saved for this order"}
                  </dd>
                </div>
                {designContext.exportedImage ? (
                  <div className="space-y-2">
                    <dt className="text-gray-500">Preview</dt>
                    <dd>
                      <Image
                        src={designContext.exportedImage}
                        alt="Design preview"
                        width={512}
                        height={512}
                        className="h-48 w-full rounded-2xl border border-gray-200 object-cover"
                        unoptimized
                      />
                    </dd>
                  </div>
                ) : null}
              </dl>
            </article>
          ) : isLoaded ? (
            <article className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
              We couldn&rsquo;t locate a saved design. Start a new case from the
              editor to capture a new summary.
            </article>
          ) : null}
        </section>
      </div>
    </div>
  );
}
