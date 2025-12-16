"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react";

import {
  EdmEditor,
  type EdmGuardrailSnapshot,
  type PrintfulPricingDetails,
} from "@/components/editor/edm-editor";
import { type DeviceCatalogEntry, getDeviceCatalog } from "@/data/catalog";
import { findPrintfulCatalogEntryByVariantId } from "@/data/printful-catalog";
import { logAnalyticsEvent } from "@/lib/analytics";
import {
  loadDesignContext,
  markCheckoutAttempt,
  saveDesignContext,
  type DesignContext,
} from "@/lib/design-context";

declare global {
  interface Window {
    __snapcaseDesignHydrated?: boolean;
  }
}

type BrandFilter = DeviceCatalogEntry["brand"] | "all";
type DesignView = "picker" | "designer";

type GuardrailSummary = {
  tone: "error" | "warn" | "success" | "neutral";
  message: string;
};

type DesignCtaStateId =
  | "select-device"
  | "ready-to-design"
  | "printful-blocked"
  | "printful-validating"
  | "printful-ready";

type DesignCtaState = {
  id: DesignCtaStateId;
  label: string;
  helperText: string;
  disabled: boolean;
  source: "snapcase" | "printful";
};

const BRAND_LABELS: Record<DeviceCatalogEntry["brand"], string> = {
  apple: "Apple",
  samsung: "Samsung",
};

function formatDeviceLabel(device: DeviceCatalogEntry | null): string | null {
  if (!device) {
    return null;
  }
  return device.model;
}

function formatPrice(
  amountCents: number | null | undefined,
  currency: string | null | undefined = "USD",
): string | null {
  if (amountCents == null || Number.isNaN(amountCents)) {
    return null;
  }
  const normalizedCurrency =
    typeof currency === "string" && currency.trim().length
      ? currency.toUpperCase()
      : "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
      minimumFractionDigits: 2,
    }).format(amountCents / 100);
  } catch {
    return `$${(amountCents / 100).toFixed(2)}`;
  }
}

function formatDateTime(timestamp: number | null | undefined): string | null {
  if (!timestamp) {
    return null;
  }
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DesignPage(): JSX.Element {
  const router = useRouter();
  const catalog = useMemo(() => getDeviceCatalog(), []);
  const deviceLookup = useMemo(() => {
    const map = new Map<number, DeviceCatalogEntry>();
    for (const entry of catalog) {
      map.set(entry.variantId, entry);
    }
    return map;
  }, [catalog]);

  const [view, setView] = useState<DesignView>("picker");
  const [selectedDevice, setSelectedDevice] =
    useState<DeviceCatalogEntry | null>(null);
  const [edmSnapshot, setEdmSnapshot] =
    useState<EdmGuardrailSnapshot | null>(null);
  const [designSummary, setDesignSummary] = useState<DesignContext | null>(
    null,
  );
  const [pricingDetails, setPricingDetails] =
    useState<PrintfulPricingDetails | null>(null);
  const [lastTemplateId, setLastTemplateId] = useState<string | null>(null);
  const [designerResetToken, setDesignerResetToken] = useState(0);
  const [brandFilter, setBrandFilter] = useState<BrandFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [, setIsHydrated] = useState(false);

  const lastPersistedVariantRef = useRef<number | null>(null);
  const lastCtaStateRef = useRef<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== "undefined") {
      window.__snapcaseDesignHydrated = true;
      document.body.dataset.snapcaseDesignHydrated = "true";
    }
    return () => {
      if (typeof window !== "undefined") {
        delete window.__snapcaseDesignHydrated;
        delete document.body.dataset.snapcaseDesignHydrated;
      }
    };
  }, []);

  useEffect(() => {
    const context = loadDesignContext();
    if (!context) {
      return;
    }
    setDesignSummary(context);
    if (context.templateId) {
      setLastTemplateId(context.templateId);
    }
    const matchByVariant =
      typeof context.variantId === "number"
        ? deviceLookup.get(context.variantId) ?? null
        : null;
    const matchByExternal =
      !matchByVariant && context.externalProductId
        ? catalog.find(
            (entry) => entry.externalProductId === context.externalProductId,
          ) ?? null
        : null;
    const match = matchByVariant ?? matchByExternal ?? null;
    if (match) {
      setSelectedDevice(match);
      lastPersistedVariantRef.current = match.variantId;
      setView("designer");
    }
  }, [catalog, deviceLookup]);

  useEffect(() => {
    if (
      designSummary &&
      pricingDetails == null &&
      designSummary.unitPriceCents != null
    ) {
      setPricingDetails({
        amountCents: designSummary.unitPriceCents,
        currency: designSummary.unitPriceCurrency ?? "USD",
        source:
          designSummary.pricingSource === "pricing_status"
            ? "pricing_status"
            : designSummary.pricingSource === "catalog"
              ? "catalog"
              : "unknown",
        rawPayload: null,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [designSummary, pricingDetails]);

  const handleDeviceSelected = useCallback((entry: DeviceCatalogEntry) => {
    setSelectedDevice(entry);
    setEdmSnapshot(null);
    setPricingDetails(null);
    setLastTemplateId(null);
    setDesignerResetToken((token) => token + 1);
    lastPersistedVariantRef.current = entry.variantId;

    const context = saveDesignContext({
      variantId: entry.variantId,
      externalProductId: entry.externalProductId,
      variantLabel: formatDeviceLabel(entry),
      templateId: null,
      templateStoreId: null,
      templateStoredAt: null,
      exportedImage: null,
      designFileId: null,
      designFileUrl: null,
      unitPriceCents: null,
      unitPriceCurrency: null,
      pricingSource: null,
      printfulProductId: entry.productId ?? null,
    });
    if (context) {
      setDesignSummary(context);
    }
    logAnalyticsEvent("design_device_selected", {
      variantId: entry.variantId,
      externalProductId: entry.externalProductId,
    });
  }, []);
  const persistTemplateForVariant = useCallback(
    async (variantId: number, templateId: string, previewUrl: string | null) => {
      const entry = deviceLookup.get(variantId) ?? selectedDevice;
      const externalProductId =
        entry?.externalProductId ?? designSummary?.externalProductId ?? null;
      const variantLabel = formatDeviceLabel(entry ?? null);
      const priceCents =
        pricingDetails?.amountCents ?? designSummary?.unitPriceCents ?? null;
      const priceCurrency =
        pricingDetails?.currency ?? designSummary?.unitPriceCurrency ?? "USD";
      const pricingSource =
        pricingDetails?.source ?? designSummary?.pricingSource ?? null;
      const printfulProductId =
        designSummary?.printfulProductId ?? entry?.productId ?? null;

      const persistLocally = (overrides: Partial<DesignContext> = {}) => {
        const context = saveDesignContext({
          variantId,
          externalProductId,
          templateId,
          exportedImage: previewUrl ?? null,
          designFileId: null,
          designFileUrl: null,
          variantLabel,
          unitPriceCents: priceCents,
          unitPriceCurrency: priceCurrency,
          pricingSource,
          printfulProductId,
          ...overrides,
        });
        if (context) {
          setDesignSummary(context);
        }
      };

      if (!externalProductId) {
        persistLocally();
      } else {
        try {
          const response = await fetch("/api/edm/templates", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              templateId,
              variantId,
              externalProductId,
              designUrl: previewUrl ?? undefined,
              source: "edm_save",
              filename: previewUrl ? `${externalProductId}.png` : undefined,
            }),
          });
          let rawPayload: unknown = null;
          try {
            rawPayload = await response.json();
          } catch {
            rawPayload = null;
          }
          if (!response.ok) {
            const errorMessage =
              rawPayload &&
              typeof rawPayload === "object" &&
              "error" in rawPayload &&
              typeof (rawPayload as { error?: unknown }).error === "string"
                ? (rawPayload as { error: string }).error
                : "Failed to persist design.";
            throw new Error(errorMessage);
          }
          const payload = (rawPayload ?? {}) as {
            templateStoreId?: string;
            storedAt?: string;
            designUrl?: string | null;
            printfulFileId?: number | null;
            printfulFileUrl?: string | null;
          };
          persistLocally({
            templateStoreId: payload.templateStoreId ?? null,
            templateStoredAt: payload.storedAt
              ? Date.parse(payload.storedAt)
              : Date.now(),
            exportedImage: previewUrl ?? payload.designUrl ?? null,
            designFileId: payload.printfulFileId ?? null,
            designFileUrl:
              payload.printfulFileUrl ?? payload.designUrl ?? null,
          });
        } catch (error) {
          console.warn("[design] Failed to sync design with server", error);
          persistLocally();
        }
      }

      setLastTemplateId(templateId);
      if (entry) {
        setSelectedDevice(entry);
      }
    },
    [designSummary, deviceLookup, pricingDetails, selectedDevice],
  );

  const handleTemplateSaved = useCallback(
    ({
      templateId,
      variantId,
      previewUrl,
    }: {
      templateId: string;
      variantId: number;
      previewUrl: string | null;
    }) => {
      void persistTemplateForVariant(
        variantId,
        String(templateId),
        previewUrl ?? null,
      );
    },
    [persistTemplateForVariant],
  );

  const handleTemplateHydrated = useCallback(
    ({ templateId, variantId }: { templateId: string; variantId: number }) => {
      void persistTemplateForVariant(variantId, String(templateId), null);
    },
    [persistTemplateForVariant],
  );

  useEffect(() => {
    const variantFromPrintful = edmSnapshot?.selectedVariantIds?.[0];
    if (!variantFromPrintful) {
      return;
    }
    const catalogMatch = findPrintfulCatalogEntryByVariantId(variantFromPrintful);
    const deviceMatch = deviceLookup.get(variantFromPrintful) ?? null;
    const derivedDevice: DeviceCatalogEntry | null =
      deviceMatch ??
      (catalogMatch
        ? {
            brand: catalogMatch.brand,
            model: catalogMatch.model,
            caseType: catalogMatch.caseType,
            variantId: variantFromPrintful,
            externalProductId: catalogMatch.externalProductId,
            productId: catalogMatch.printfulProductId,
          }
        : selectedDevice);

    if (derivedDevice) {
      setSelectedDevice((previous) =>
        previous?.variantId === derivedDevice.variantId
          ? previous
          : derivedDevice,
      );
    }
    const hasVariantChanged =
      lastPersistedVariantRef.current !== variantFromPrintful;
    const nextUnitPriceCents =
      pricingDetails?.amountCents ?? designSummary?.unitPriceCents ?? null;
    const nextUnitPriceCurrency =
      pricingDetails?.currency ?? designSummary?.unitPriceCurrency ?? null;
    const nextPricingSource =
      pricingDetails?.source ?? designSummary?.pricingSource ?? null;
    const priceChanged =
      pricingDetails != null &&
      ((pricingDetails.amountCents ?? null) !==
        (designSummary?.unitPriceCents ?? null) ||
        (pricingDetails.currency ?? null) !==
          (designSummary?.unitPriceCurrency ?? null) ||
        (pricingDetails.source ?? null) !==
          (designSummary?.pricingSource ?? null));
    if (!hasVariantChanged && !priceChanged) {
      return;
    }
    lastPersistedVariantRef.current = variantFromPrintful;
    const context = saveDesignContext({
      variantId: variantFromPrintful,
      externalProductId:
        derivedDevice?.externalProductId ?? designSummary?.externalProductId ?? null,
      variantLabel: formatDeviceLabel(derivedDevice ?? null),
      unitPriceCents: nextUnitPriceCents,
      unitPriceCurrency: nextUnitPriceCurrency,
      pricingSource: nextPricingSource,
      printfulProductId:
        catalogMatch?.printfulProductId ??
        derivedDevice?.productId ??
        designSummary?.printfulProductId ??
        null,
    });
    if (context) {
      setDesignSummary(context);
    }
  }, [
    designSummary,
    deviceLookup,
    edmSnapshot,
    pricingDetails,
    selectedDevice,
  ]);

  const filteredCatalog = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return catalog.filter((entry) => {
      const matchesBrand = brandFilter === "all" || entry.brand === brandFilter;
      const matchesQuery =
        !normalizedQuery ||
        `${entry.model} ${entry.externalProductId}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesBrand && matchesQuery;
    });
  }, [brandFilter, catalog, searchQuery]);

  const guardrailSummary = useMemo<GuardrailSummary>(() => {
    if (!edmSnapshot) {
      return {
        tone: "neutral",
        message: "Waiting on your upload. We will check it automatically.",
      };
    }
    if (
      edmSnapshot.designValid === false ||
      edmSnapshot.blockingIssues.length > 0
    ) {
      return {
        tone: "error",
        message:
          edmSnapshot.blockingIssues[0] ??
          "Resolve the Printful banner above to continue.",
      };
    }
    if (edmSnapshot.variantMismatch) {
      return {
        tone: "warn",
        message:
          "Printful reported a different device. Change it in Snapcase before saving.",
      };
    }
    if (edmSnapshot.warningMessages.length > 0) {
      return {
        tone: "warn",
        message: edmSnapshot.warningMessages[0],
      };
    }
    if (edmSnapshot.designValid) {
      return {
        tone: "success",
        message: "Ready to checkout. Your device and design stay locked.",
      };
    }
    return {
      tone: "neutral",
      message: "Waiting on your upload. We will check it automatically.",
    };
  }, [edmSnapshot]);

  const priceLabel = formatPrice(
    pricingDetails?.amountCents ?? designSummary?.unitPriceCents ?? null,
    pricingDetails?.currency ?? designSummary?.unitPriceCurrency ?? undefined,
  );

  const summaryDeviceLabel =
    formatDeviceLabel(selectedDevice ?? null) ??
    formatDeviceLabel(
      designSummary?.variantId
        ? deviceLookup.get(designSummary.variantId) ?? null
        : null,
    ) ??
    "Pick a supported device";

  const ctaState = useMemo<DesignCtaState>(() => {
    if (view === "picker") {
      if (!selectedDevice) {
        return {
          id: "select-device",
          label: "Select a device",
          helperText: "Pick your phone to start designing.",
          disabled: true,
          source: "snapcase",
        };
      }
      return {
        id: "ready-to-design",
        label: "Continue to design",
        helperText: "Device locked. Continue to the designer.",
        disabled: false,
        source: "snapcase",
      };
    }
    if (
      edmSnapshot &&
      (edmSnapshot.designValid === false ||
        edmSnapshot.blockingIssues.length > 0 ||
        edmSnapshot.variantMismatch)
    ) {
      return {
        id: "printful-blocked",
        label: "Resolve the Printful banner above",
        helperText: "Fix the banner, then continue to checkout.",
        disabled: true,
        source: "printful",
      };
    }
    if (!edmSnapshot || edmSnapshot.designValid !== true) {
      return {
        id: "printful-validating",
        label: "Waiting on your upload",
        helperText: "We check your art automatically.",
        disabled: true,
        source: "printful",
      };
    }
    return {
      id: "printful-ready",
      label: "Continue to checkout",
      helperText: "Design saved and device locked for checkout.",
      disabled: false,
      source: "printful",
    };
  }, [edmSnapshot, selectedDevice, view]);

  const currentVariantId =
    edmSnapshot?.selectedVariantIds?.[0] ??
    selectedDevice?.variantId ??
    designSummary?.variantId ??
    null;

  useEffect(() => {
    const key = `${view}:${ctaState.id}:${currentVariantId ?? "none"}`;
    if (lastCtaStateRef.current === key) {
      return;
    }
    lastCtaStateRef.current = key;
    logAnalyticsEvent("design_cta_state_change", {
      state: ctaState.id,
      variantId: currentVariantId,
      source: ctaState.source,
    });
  }, [ctaState, currentVariantId, view]);
  const handleContinueToCheckout = useCallback(() => {
    if (view !== "designer" || ctaState.disabled) {
      return;
    }
    const entry = selectedDevice;
    const variantIdForCheckout =
      currentVariantId ?? entry?.variantId ?? designSummary?.variantId ?? null;
    const context = markCheckoutAttempt({
      variantId: variantIdForCheckout,
      externalProductId:
        entry?.externalProductId ?? designSummary?.externalProductId ?? null,
      variantLabel:
        formatDeviceLabel(entry ?? null) ?? designSummary?.variantLabel ?? undefined,
      unitPriceCents:
        designSummary?.unitPriceCents ?? pricingDetails?.amountCents ?? null,
      unitPriceCurrency:
        designSummary?.unitPriceCurrency ?? pricingDetails?.currency ?? null,
      pricingSource:
        designSummary?.pricingSource ?? pricingDetails?.source ?? null,
      printfulProductId: designSummary?.printfulProductId ?? entry?.productId ?? null,
    });
    if (context) {
      setDesignSummary(context);
    }
    router.push("/checkout");
  }, [
    ctaState.disabled,
    currentVariantId,
    designSummary,
    pricingDetails,
    router,
    selectedDevice,
    view,
  ]);

  const handlePrimaryCta = useCallback(() => {
    if (view === "picker") {
      if (!selectedDevice) {
        return;
      }
      setView("designer");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    handleContinueToCheckout();
  }, [handleContinueToCheckout, selectedDevice, view]);

  const guardrailToneClass =
    guardrailSummary.tone === "error"
      ? "text-red-700"
      : guardrailSummary.tone === "warn"
        ? "text-amber-700"
        : guardrailSummary.tone === "success"
          ? "text-emerald-700"
          : "text-gray-700";

  const shouldShowDesignSummary =
    Boolean(lastTemplateId ?? designSummary?.templateId) ||
    Boolean(designSummary?.exportedImage) ||
    pricingDetails?.amountCents != null ||
    designSummary?.unitPriceCents != null ||
    Boolean(designSummary?.lastCheckoutAttemptAt);

  const lastSavedLabel = designSummary?.templateStoredAt
    ? formatDateTime(designSummary.templateStoredAt)
    : null;

  const lastAttemptLabel = formatDateTime(designSummary?.lastCheckoutAttemptAt);

  const actionBar = (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-screen-lg items-center justify-between gap-3">
          <p className="text-xs text-gray-600">{ctaState.helperText}</p>
          <button
            type="button"
            onClick={handlePrimaryCta}
            disabled={ctaState.disabled}
            className="inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            data-testid="continue-button"
          >
            {ctaState.label}
          </button>
        </div>
      </div>
      <div className="fixed bottom-6 right-6 z-30 hidden lg:flex">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/95 px-5 py-4 text-sm shadow-2xl shadow-slate-900/10">
          <p className="text-xs text-gray-600">{ctaState.helperText}</p>
          <button
            type="button"
            onClick={handlePrimaryCta}
            disabled={ctaState.disabled}
            className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            data-testid="continue-button-desktop"
          >
            {ctaState.label}
          </button>
        </div>
      </div>
    </>
  );

  const deviceCards = (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {filteredCatalog.map((entry) => {
        const selected = selectedDevice?.variantId === entry.variantId;
        return (
          <button
            key={entry.variantId}
            type="button"
            onClick={() => handleDeviceSelected(entry)}
            className={`flex h-full flex-col justify-between rounded-2xl border px-4 py-3 text-left transition hover:border-gray-300 hover:shadow-sm ${
              selected
                ? "border-gray-900 shadow-md"
                : "border-gray-200 bg-white"
            }`}
            data-testid={`device-option-${entry.variantId}`}
          >
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {BRAND_LABELS[entry.brand]}
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {entry.model}
              </p>
              <p className="text-sm text-gray-600">Snap Case</p>
            </div>
            <div className="flex items-center justify-between pt-3">
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700">
                {selected ? "Selected" : "Tap to lock"}
              </span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  selected ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white"
                }`}
                aria-hidden="true"
              >
                {selected ? (
                  <span className="block h-2.5 w-2.5 rounded-full bg-current" />
                ) : null}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );

  const pickerView = (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Step 1: Pick your device
        </p>
        <h1 className="text-3xl font-semibold text-gray-900">
          Choose your phone and case.
        </h1>
        <p className="text-base text-gray-600">
          Lock your Snapcase variant, then jump into the designer. Continue when you&apos;re ready.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-1 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4 text-gray-500"
          >
            <path
              fill="currentColor"
              d="M10 4a6 6 0 0 1 4.898 9.237l3.932 3.933-1.414 1.414-3.933-3.932A6 6 0 1 1 10 4Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
            />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-500"
            placeholder="Search by model or ID"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "apple", "samsung"] as BrandFilter[]).map(
            (brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => setBrandFilter(brand)}
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                  brandFilter === brand
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 bg-white text-gray-800 hover:border-gray-300"
                }`}
              >
                {brand === "all" ? "All devices" : BRAND_LABELS[brand]}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white/80 p-5 shadow-sm">
        {filteredCatalog.length > 0 ? (
          deviceCards
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-700">
            <p className="font-semibold text-gray-900">No devices match that search.</p>
            <p className="max-w-md text-gray-600">
              Clear filters or switch brands to see the full Apple, Samsung, and Pixel lineup.
            </p>
          </div>
        )}
      </div>
    </div>
  );
  const designerView = (
    <div className="mx-auto flex max-w-screen-2xl flex-col gap-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Step 2: Design
        </p>
        <div className="space-y-1 sm:flex sm:items-center sm:justify-between">
          <h1 className="text-3xl font-semibold text-gray-900">
            Design your Snapcase.
          </h1>
          <p className="text-base text-gray-600">
            Upload your art and let Printful clear checks. Your device stays locked.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm">
          <div className="flex flex-wrap items-center gap-2 font-medium text-gray-900">
            <span>{`Your device: ${summaryDeviceLabel}`}</span>
            <span aria-hidden="true" className="text-gray-400">
              ·
            </span>
            <button
              type="button"
              onClick={() => setView("picker")}
              className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-800 transition hover:bg-gray-100"
            >
              Change device
            </button>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            Locked for checkout
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-md">
        {selectedDevice ? (
          <EdmEditor
            key={`${selectedDevice.variantId}-${designerResetToken}`}
            variantId={selectedDevice.variantId}
            externalProductId={selectedDevice.externalProductId}
            onTemplateSaved={handleTemplateSaved}
            onTemplateHydrated={handleTemplateHydrated}
            onDesignStatusChange={setEdmSnapshot}
            onPricingChange={setPricingDetails}
          />
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 p-10 text-center text-sm text-gray-700">
            <p className="text-base font-semibold text-gray-900">
              Pick a device to load the designer.
            </p>
            <p className="max-w-md text-gray-600">
              We only launch Printful after you choose a phone. Return to the picker to lock your Snapcase.
            </p>
            <button
              type="button"
              onClick={() => setView("picker")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Back to picker
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div
          className="space-y-2 rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4 text-sm text-gray-700"
          data-testid="guardrail-card"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Design status
          </p>
          <p className={`text-base font-medium ${guardrailToneClass}`}>
            {guardrailSummary.message}
          </p>
          <p className="text-xs text-gray-500">
            {ctaState.helperText}
          </p>
        </div>

        {shouldShowDesignSummary ? (
          <div className="space-y-4 rounded-3xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Design summary
                </p>
                <p className="text-sm text-gray-700">
                  Snapshot for checkout. We only show it once data is available.
                </p>
              </div>
              <button
                type="button"
                onClick={handleContinueToCheckout}
                disabled={ctaState.disabled}
                className="inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {ctaState.disabled ? "Waiting on your upload" : "Continue to checkout"}
              </button>
            </div>
            {designSummary?.exportedImage ? (
              <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                <Image
                  src={designSummary.exportedImage}
                  alt="Saved proof preview"
                  fill
                  sizes="(min-width: 1024px) 480px, 100vw"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : null}
            <dl className="grid gap-3 sm:grid-cols-2 sm:gap-4 text-sm text-gray-800">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Device
                </dt>
                <dd className="text-right font-semibold text-gray-900">
                  {summaryDeviceLabel}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Design state
                </dt>
                <dd className="text-right text-gray-900">
                  {lastTemplateId ? "Design saved" : "Save in the designer"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Price
                </dt>
                <dd className="text-right text-gray-900">
                  {priceLabel ?? "Waiting on designer"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Last saved
                </dt>
                <dd className="text-right text-gray-900">
                  {lastSavedLabel ?? "Pending"}
                </dd>
              </div>
              {lastAttemptLabel ? (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Last checkout attempt
                  </dt>
                  <dd className="text-right text-gray-900">{lastAttemptLabel}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[var(--snap-gray-50)] pb-28 lg:pb-32">
      <div className="px-4 py-8 sm:px-6 lg:px-10">
        {view === "picker" ? pickerView : designerView}
      </div>
      {actionBar}
    </main>
  );
}
