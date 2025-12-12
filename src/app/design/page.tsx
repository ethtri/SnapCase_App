"use client";

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

type GuardrailCopySource = "printful" | "snapcase" | "system";

type GuardrailSummary = {
  tone: "error" | "warn" | "success" | "neutral";
  message: string;
  source: GuardrailCopySource;
};

type DesignCtaStateId =
  | "select-device"
  | "printful-blocked"
  | "printful-validating"
  | "printful-ready";

type DesignCtaState = {
  id: DesignCtaStateId;
  label: string;
  helperText: string;
  disabled: boolean;
  source: GuardrailCopySource;
};

function formatDeviceLabel(device: DeviceCatalogEntry | null): string | null {
  if (!device) {
    return null;
  }
  return `${device.brand.toUpperCase()} - ${device.model}`;
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
  const initialDevice = catalog[0] ?? null;

  const [seedDevice, setSeedDevice] = useState<DeviceCatalogEntry | null>(
    initialDevice,
  );
  const [activeDevice, setActiveDevice] =
    useState<DeviceCatalogEntry | null>(initialDevice);
  const [edmSnapshot, setEdmSnapshot] =
    useState<EdmGuardrailSnapshot | null>(null);
  const [designSummary, setDesignSummary] = useState<DesignContext | null>(null);
  const [lastTemplateId, setLastTemplateId] = useState<string | null>(null);
  const [pricingDetails, setPricingDetails] =
    useState<PrintfulPricingDetails | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [didHydrateContext, setDidHydrateContext] = useState(false);
  const [designerResetToken, setDesignerResetToken] = useState(0);

  const lastPersistedVariantRef = useRef<number | null>(null);
  const lastCtaStateRef = useRef<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
    window.__snapcaseDesignHydrated = true;
    document.body.dataset.snapcaseDesignHydrated = "true";
    return () => {
      delete window.__snapcaseDesignHydrated;
      delete document.body.dataset.snapcaseDesignHydrated;
    };
  }, []);

  useEffect(() => {
    const context = loadDesignContext();
    if (!context) {
      if (!seedDevice && initialDevice) {
        setSeedDevice(initialDevice);
      }
      setDidHydrateContext(true);
      return;
    }
    const byVariant =
      typeof context.variantId === "number"
        ? deviceLookup.get(context.variantId) ?? null
        : null;
    const byExternal =
      !byVariant && context.externalProductId
        ? catalog.find(
            (entry) => entry.externalProductId === context.externalProductId,
          ) ?? null
        : null;
    const match = byVariant ?? byExternal ?? null;
    if (match) {
      setSeedDevice(match);
    } else if (initialDevice) {
      setSeedDevice(initialDevice);
    }
    setDesignSummary(context);
    if (context?.templateId) {
      setLastTemplateId(context.templateId);
    }
    setDidHydrateContext(true);
  }, [catalog, deviceLookup, initialDevice, seedDevice]);

  useEffect(() => {
    if (!didHydrateContext || designSummary || !seedDevice) {
      return;
    }
    lastPersistedVariantRef.current = seedDevice.variantId;
    const context = saveDesignContext({
      variantId: seedDevice.variantId,
      externalProductId: seedDevice.externalProductId,
      variantLabel: formatDeviceLabel(seedDevice),
    });
    if (context) {
      setDesignSummary(context);
    }
  }, [designSummary, didHydrateContext, seedDevice]);

  useEffect(() => {
    if (seedDevice) {
      setActiveDevice(seedDevice);
    }
  }, [seedDevice]);

  useEffect(() => {
    if (
      designSummary &&
      pricingDetails == null &&
      designSummary.unitPriceCents != null
    ) {
      const normalizedSource: PrintfulPricingDetails["source"] =
        designSummary.pricingSource === "pricing_status"
          ? "pricing_status"
          : designSummary.pricingSource === "catalog"
            ? "catalog"
            : "unknown";
      setPricingDetails({
        amountCents: designSummary.unitPriceCents,
        currency: designSummary.unitPriceCurrency ?? "USD",
        source: normalizedSource,
        rawPayload: null,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [designSummary, pricingDetails]);

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
        : seedDevice);

    if (derivedDevice) {
      setActiveDevice((previous) =>
        previous?.variantId === derivedDevice.variantId ? previous : derivedDevice,
      );
    }
    const hasVariantChanged = lastPersistedVariantRef.current !== variantFromPrintful;
    const nextUnitPriceCents =
      pricingDetails?.amountCents ?? designSummary?.unitPriceCents ?? null;
    const nextUnitPriceCurrency =
      pricingDetails?.currency ?? designSummary?.unitPriceCurrency ?? null;
    const nextPricingSource =
      pricingDetails?.source ?? designSummary?.pricingSource ?? null;
    const priceChanged =
      pricingDetails != null &&
      ((pricingDetails.amountCents ?? null) !== (designSummary?.unitPriceCents ?? null) ||
        (pricingDetails.currency ?? null) !== (designSummary?.unitPriceCurrency ?? null) ||
        (pricingDetails.source ?? null) !== (designSummary?.pricingSource ?? null));
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
        (catalogMatch?.printfulProductId ??
          derivedDevice?.productId ??
          designSummary?.printfulProductId ??
          null) ?? null,
    });
    if (context) {
      setDesignSummary(context);
    }
  }, [deviceLookup, designSummary, edmSnapshot, pricingDetails, seedDevice]);

  const handleDeviceSelected = useCallback(
    (entry: DeviceCatalogEntry) => {
      setSeedDevice(entry);
      setActiveDevice(entry);
      setEdmSnapshot(null);
      setLastTemplateId(null);
      setPricingDetails(null);
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
        printfulProductId: null,
      });
      if (context) {
        setDesignSummary(context);
      }
      logAnalyticsEvent("design_device_selected", {
        variantId: entry.variantId,
        externalProductId: entry.externalProductId,
      });
    },
    [],
  );

  const persistTemplateForVariant = useCallback(
    async (
      variantId: number,
      templateId: string,
      previewUrl: string | null,
    ) => {
      const entry = deviceLookup.get(variantId) ?? activeDevice ?? seedDevice;
      const externalProductId = entry?.externalProductId ?? null;
      const variantLabel = formatDeviceLabel(entry ?? null);
      const priceCents =
        pricingDetails?.amountCents ?? designSummary?.unitPriceCents ?? null;
      const priceCurrency =
        pricingDetails?.currency ?? designSummary?.unitPriceCurrency ?? "USD";
      const pricingSource = pricingDetails?.source ?? designSummary?.pricingSource ?? null;
      const printfulProductId =
        designSummary?.printfulProductId ??
        entry?.productId ??
        seedDevice?.productId ??
        null;

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
        console.warn(
          "[design] Missing externalProductId for variant",
          variantId,
        );
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
        setActiveDevice(entry);
        setSeedDevice((previous) => previous ?? entry);
      }
    },
    [activeDevice, designSummary, deviceLookup, pricingDetails, seedDevice],
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

  const deviceLabel = formatDeviceLabel(activeDevice ?? seedDevice);
  const helperLabel =
    deviceLabel != null
      ? `Locked to ${deviceLabel}`
      : "Variant locked to your Snapcase pick";

  const currentVariantId =
    edmSnapshot?.selectedVariantIds?.[0] ??
    activeDevice?.variantId ??
    seedDevice?.variantId ??
    null;

  const priceLabel = formatPrice(
    pricingDetails?.amountCents ?? designSummary?.unitPriceCents ?? null,
    pricingDetails?.currency ?? designSummary?.unitPriceCurrency ?? undefined,
  );

  const ownershipHelper =
    priceLabel != null
      ? `Designer cleared. Live price ${priceLabel}.`
      : "Designer is validating your upload.";

  const guardrailSummary = useMemo<GuardrailSummary>(() => {
    if (!edmSnapshot) {
      return {
        tone: "neutral",
        message: "Designer is loading. Checks will appear once it finishes.",
        source: "printful",
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
          "Resolve the designer banner above before continuing.",
        source: "printful",
      };
    }
    if (edmSnapshot.warningMessages.length > 0) {
      return {
        tone: "warn",
        message: edmSnapshot.warningMessages[0],
        source: "printful",
      };
    }
    if (edmSnapshot.designValid) {
      return {
        tone: "success",
        message: "Designer cleared. You can continue when you are ready.",
        source: "printful",
      };
    }
    return {
      tone: "neutral",
      message: "Waiting for the designer to finish validating.",
      source: "printful",
    };
  }, [edmSnapshot]);

  const ctaState = useMemo<DesignCtaState>(() => {
    if (!edmSnapshot) {
      return {
        id: "printful-validating",
        label: "Loading designer...",
        helperText: guardrailSummary.message,
        disabled: true,
        source: "printful",
      };
    }
    if (edmSnapshot.designValid === false || edmSnapshot.blockingIssues.length > 0) {
      return {
        id: "printful-blocked",
        label: "Resolve checks to continue",
        helperText: guardrailSummary.message,
        disabled: true,
        source: "printful",
      };
    }
    if (edmSnapshot.designValid !== true) {
      return {
        id: "printful-validating",
        label: "Validating design...",
        helperText: guardrailSummary.message,
        disabled: true,
        source: "printful",
      };
    }
    return {
      id: "printful-ready",
      label: "Continue to checkout",
      helperText: ownershipHelper,
      disabled: false,
      source: "printful",
    };
  }, [edmSnapshot, guardrailSummary.message, ownershipHelper]);

  useEffect(() => {
    const key = `${ctaState.id}:${currentVariantId ?? "none"}`;
    if (lastCtaStateRef.current === key) {
      return;
    }
    lastCtaStateRef.current = key;
    logAnalyticsEvent("design_cta_state_change", {
      state: ctaState.id,
      variantId: currentVariantId,
      source: ctaState.source,
    });
  }, [ctaState, currentVariantId]);

  const guardrailTitle = useMemo(() => {
    if (guardrailSummary.tone === "error") {
      return "Designer needs changes";
    }
    if (guardrailSummary.tone === "warn") {
      return "Heads up from the designer";
    }
    if (guardrailSummary.tone === "success") {
      return "Design cleared";
    }
    return "Designer checks running";
  }, [guardrailSummary]);

  const handleContinueToCheckout = useCallback(() => {
    if (ctaState.disabled) {
      return;
    }
    const entry = activeDevice ?? seedDevice;
    const variantIdForCheckout =
      currentVariantId ?? entry?.variantId ?? designSummary?.variantId ?? null;
    const context = markCheckoutAttempt({
      variantId: variantIdForCheckout,
      externalProductId: entry?.externalProductId ?? designSummary?.externalProductId ?? null,
      variantLabel:
        formatDeviceLabel(entry ?? null) ?? designSummary?.variantLabel ?? undefined,
      unitPriceCents:
        designSummary?.unitPriceCents ?? pricingDetails?.amountCents ?? null,
      unitPriceCurrency:
        designSummary?.unitPriceCurrency ?? pricingDetails?.currency ?? null,
      pricingSource:
        designSummary?.pricingSource ?? pricingDetails?.source ?? null,
      printfulProductId:
        designSummary?.printfulProductId ?? entry?.productId ?? null,
    });
    if (context) {
      setDesignSummary(context);
    }
    router.push("/checkout");
  }, [activeDevice, ctaState.disabled, router, seedDevice]);

  const checkoutVariantLabel =
    formatDeviceLabel(activeDevice ?? seedDevice) ??
    designSummary?.variantLabel ??
    "Pick a supported device in Snapcase";

  const templateSummaryLabel = lastTemplateId
    ? "Design saved in Snapcase"
    : "Save in the designer to reuse at checkout";

  const lastAttemptLabel = designSummary?.lastCheckoutAttemptAt
    ? new Date(designSummary.lastCheckoutAttemptAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <main
      className="relative pb-28 pt-8 lg:pb-24 lg:pt-12"
      style={{ backgroundColor: "var(--snap-gray-50)" }}
    >
      {isHydrated ? (
        <span data-testid="design-hydrated-marker" hidden />
      ) : null}

      <div className="px-safe-area">
        <div className="mx-auto w-full max-w-screen-xl space-y-8 px-4 sm:px-6 lg:max-w-screen-2xl lg:space-y-10 lg:px-8 xl:px-10">
          <header
            className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm lg:hidden"
            style={{ border: "1px solid var(--snap-gray-200)" }}
          >
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-700"
            >
              <span aria-hidden="true">&lt;</span>
              Back
            </button>
            <div className="flex flex-col items-center">
              <p className="text-sm font-semibold text-gray-900">Design your case</p>
              <p className="text-[11px] font-medium text-gray-500">Step 2 of 2</p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700"
              style={{ border: "1px solid var(--snap-gray-200)", backgroundColor: "var(--snap-gray-50)" }}
            >
              Locked
            </span>
          </header>
          <header className="hidden space-y-3 lg:block">
            <div className="space-y-2" style={{ fontFamily: "var(--font-display)" }}>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Snapcase designer
              </p>
              <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">
                Design your Snapcase
              </h1>
            </div>
            <p className="max-w-3xl text-base text-gray-700">
              Pick your device, drop in your art, and continue once the designer clears your upload.
              Checkout mirrors everything you see here so the handoff stays locked.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
                style={{ borderColor: "var(--snap-gray-200)", backgroundColor: "var(--snap-white)" }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--snap-gray-900)" }} aria-hidden="true" />
                Device locked
              </span>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
                style={{ borderColor: "var(--snap-gray-200)", backgroundColor: "var(--snap-white)" }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--snap-gray-900)" }} aria-hidden="true" />
                Live price + saved design
              </span>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
                style={{ borderColor: "var(--snap-gray-200)", backgroundColor: "var(--snap-white)" }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--snap-gray-900)" }} aria-hidden="true" />
                Checkout stays in sync
              </span>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
            <section
              className="space-y-5 lg:col-span-8 lg:space-y-6"
              style={{
                borderRadius: "var(--radius-2xl)",
                border: "1px solid var(--snap-gray-200)",
                backgroundColor: "var(--snap-white)",
                boxShadow: "var(--shadow-lg)",
                padding: "var(--space-6)",
              }}
            >
              <div className="space-y-3 lg:hidden">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Pick your device</p>
                    <span
                      className="max-w-[180px] truncate rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700"
                      style={{ border: "1px solid var(--snap-gray-200)", backgroundColor: "var(--snap-gray-50)" }}
                    >
                      {helperLabel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Swap brands here. We keep the designer and checkout locked to your pick.
                  </p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {catalog.map((entry) => {
                    const selected = seedDevice?.variantId === entry.variantId;
                    return (
                      <button
                        key={entry.variantId}
                        type="button"
                        onClick={() => handleDeviceSelected(entry)}
                        className={`flex min-w-[180px] flex-col gap-1 rounded-2xl border px-4 py-3 text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                          selected ? "border-[var(--snap-violet)] bg-[var(--snap-violet)] text-white" : "border-gray-200 bg-white text-gray-900"
                        }`}
                        data-testid={`device-chip-${entry.variantId}`}
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-wide">
                          {entry.brand}
                        </span>
                        <span className="text-sm font-semibold leading-tight">
                          {entry.model}
                        </span>
                        <span
                          className={`text-xs font-semibold ${selected ? "text-white/80" : "text-gray-500"}`}
                        >
                          Locked for checkout
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className="hidden space-y-3 lg:block"
                style={{
                  borderRadius: "var(--radius-xl)",
                  border: "1px solid var(--snap-gray-200)",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  padding: "var(--space-5)",
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Device
                    </p>
                    <p className="text-sm text-gray-700">
                      Choose where you want this printed. We keep the designer locked to your pick so
                      checkout can&apos;t drift.
                    </p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700"
                    style={{ border: "1px solid var(--snap-gray-200)", backgroundColor: "var(--snap-gray-50)" }}
                  >
                    Locked to this pick
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {catalog.map((entry) => {
                    const selected = seedDevice?.variantId === entry.variantId;
                    return (
                      <button
                        key={entry.variantId}
                        type="button"
                        onClick={() => handleDeviceSelected(entry)}
                        className="flex w-full items-start justify-between border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{
                          borderRadius: "var(--radius-xl)",
                          borderColor: selected ? "var(--snap-violet)" : "var(--snap-gray-200)",
                          backgroundColor: selected ? "var(--snap-violet)" : "var(--snap-white)",
                          color: selected ? "var(--snap-white)" : "var(--snap-gray-900)",
                          boxShadow: selected ? "var(--shadow-md)" : "none",
                        }}
                        data-testid={`device-option-${entry.variantId}`}
                      >
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide">
                            {entry.brand}
                          </p>
                          <p className="text-base font-semibold">{entry.model}</p>
                        </div>
                        <span
                          className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border"
                          style={{
                            borderColor: selected ? "var(--snap-white)" : "var(--snap-gray-300)",
                            backgroundColor: selected ? "var(--snap-white)" : "transparent",
                            color: selected ? "var(--snap-violet)" : "inherit",
                          }}
                          aria-hidden="true"
                        >
                          {selected ? (
                            <span
                              className="block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: "currentColor" }}
                            />
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className="hidden space-y-2 lg:block"
                style={{
                  borderRadius: "var(--radius-xl)",
                  border: "1px dashed var(--snap-gray-200)",
                  backgroundColor: "rgba(249, 250, 251, 0.8)",
                  padding: "var(--space-5)",
                }}
              >
                <span
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-900"
                  data-testid="design-helper-pill"
                  style={{ border: "1px solid var(--snap-gray-300)", backgroundColor: "var(--snap-white)" }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--snap-gray-900)" }} aria-hidden="true" />
                  {helperLabel}
                </span>
                <p className="text-sm text-gray-600">
                  We load your pick into the designer and keep it locked. Swap devices above to change
                  what is handed to checkout.
                </p>
              </div>

              <div
                style={{
                  borderRadius: "var(--radius-xl)",
                  border: "1px solid var(--snap-gray-200)",
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  padding: "var(--space-2)",
                  boxShadow: "var(--shadow-sm) inset",
                }}
              >
                {seedDevice ? (
                  <EdmEditor
                    key={`${seedDevice.variantId}-${designerResetToken}`}
                    variantId={seedDevice.variantId}
                    externalProductId={seedDevice.externalProductId}
                    onTemplateSaved={handleTemplateSaved}
                    onTemplateHydrated={handleTemplateHydrated}
                    onDesignStatusChange={setEdmSnapshot}
                    onPricingChange={setPricingDetails}
                  />
                ) : (
                  <div
                    className="text-center text-sm text-gray-600"
                    style={{
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid var(--snap-gray-200)",
                      backgroundColor: "var(--snap-gray-50)",
                      padding: "var(--space-6)",
                    }}
                  >
                    We do not have a supported device to preload yet. Please contact support to add your
                    catalog entry.
                  </div>
                )}
              </div>

              <div
                className="hidden space-y-3 text-sm text-gray-600 lg:block"
                data-testid="guardrail-card"
                style={{
                  borderRadius: "var(--radius-xl)",
                  border: "1px solid var(--snap-gray-100)",
                  backgroundColor: "var(--snap-cloud)",
                  padding: "var(--space-6)",
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                  data-testid="guardrail-title"
                >
                  {guardrailTitle}
                </p>
                <p
                  className={`text-base font-medium ${
                    guardrailSummary.tone === "error"
                      ? "text-red-600"
                      : guardrailSummary.tone === "warn"
                        ? "text-amber-600"
                        : guardrailSummary.tone === "success"
                          ? "text-emerald-600"
                          : "text-gray-700"
                  }`}
                  data-testid="guardrail-description"
                >
                  {guardrailSummary.message}
                </p>
                <p className="text-xs text-gray-500" data-testid="guardrail-footnote">
                  {ctaState.helperText}
                </p>
              </div>

              <div
                className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-700 shadow-sm lg:hidden"
                data-testid="guardrail-card"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {guardrailTitle}
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      guardrailSummary.tone === "error"
                        ? "bg-red-50 text-red-700"
                        : guardrailSummary.tone === "warn"
                          ? "bg-amber-50 text-amber-700"
                          : guardrailSummary.tone === "success"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {guardrailSummary.tone === "success" ? "Cleared" : "In review"}
                  </span>
                </div>
                <p
                  className={`text-base font-medium ${
                    guardrailSummary.tone === "error"
                      ? "text-red-600"
                      : guardrailSummary.tone === "warn"
                        ? "text-amber-600"
                        : guardrailSummary.tone === "success"
                          ? "text-emerald-600"
                          : "text-gray-700"
                  }`}
                  data-testid="guardrail-description"
                >
                  {guardrailSummary.message}
                </p>
                <p className="text-xs text-gray-500" data-testid="guardrail-footnote">
                  {ctaState.helperText}
                </p>
              </div>
            </section>

            <aside
              className="hidden space-y-5 lg:col-span-4 lg:block"
              style={{
                position: "relative",
              }}
            >
              <div
                className="space-y-2"
                style={{
                  borderRadius: "var(--radius-2xl)",
                  border: "1px solid var(--snap-gray-200)",
                  backgroundColor: "rgba(255,255,255,0.96)",
                  boxShadow: "var(--shadow-lg)",
                  padding: "var(--space-6)",
                  position: "sticky",
                  top: "var(--space-8)",
                }}
              >
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Checkout preview
                  </p>
                  <p className="text-sm text-gray-600">
                    Continue unlocks after the designer clears your upload. We carry the locked device,
                    price, and saved design straight into checkout.
                  </p>
                </div>

                <dl className="space-y-4 text-sm text-gray-600">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Device lock
                    </dt>
                    <dd className="text-right text-base font-semibold text-gray-900">
                      {checkoutVariantLabel}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Price
                    </dt>
                    <dd className="text-right text-base font-semibold text-gray-900">
                      {priceLabel ?? "Waiting on designer"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Design state
                    </dt>
                    <dd className="text-right text-sm text-gray-900">{templateSummaryLabel}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Designer status
                    </dt>
                    <dd
                      className={`text-right text-sm font-medium ${
                        guardrailSummary.tone === "error"
                          ? "text-red-600"
                          : guardrailSummary.tone === "warn"
                            ? "text-amber-600"
                            : guardrailSummary.tone === "success"
                              ? "text-emerald-600"
                              : "text-gray-900"
                      }`}
                    >
                      {guardrailSummary.message}
                    </dd>
                  </div>
                  {lastAttemptLabel ? (
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Last checkout attempt
                      </dt>
                      <dd className="text-right text-sm text-gray-900">{lastAttemptLabel}</dd>
                    </div>
                  ) : null}
                </dl>

                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={ctaState.disabled}
                    onClick={handleContinueToCheckout}
                    className="inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed"
                    style={{
                      borderRadius: "var(--radius-pill)",
                      minHeight: "var(--control-height)",
                      backgroundColor: ctaState.disabled
                        ? "var(--snap-gray-300)"
                        : "var(--snap-violet)",
                      boxShadow: "var(--shadow-md)",
                      padding: "12px 20px",
                    }}
                    data-testid="continue-button"
                  >
                    <span className="inline-flex items-center gap-2">{ctaState.label}</span>
                  </button>
                  <p className="text-xs text-gray-500">{ctaState.helperText}</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-safe-area backdrop-blur">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-2 px-4 py-3">
          <button
            type="button"
            disabled={ctaState.disabled}
            onClick={handleContinueToCheckout}
            className="inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed"
            style={{
              borderRadius: "var(--radius-pill)",
              minHeight: "var(--control-height)",
              backgroundColor: ctaState.disabled ? "var(--snap-gray-300)" : "var(--snap-violet)",
              boxShadow: "var(--shadow-md)",
              padding: "12px 20px",
            }}
            data-testid="continue-button-mobile"
          >
            <span className="inline-flex items-center gap-2">{ctaState.label}</span>
          </button>
          <p className="text-center text-[11px] text-gray-600">{ctaState.helperText}</p>
        </div>
      </div>
    </main>
  );
}
