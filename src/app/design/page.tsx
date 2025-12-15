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
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleBrandSelect = useCallback((brand: string) => {
    setBrandFilter(brand);
    logAnalyticsEvent("design_brand_filter", { brand });
  }, []);

  const handleDetectDevice = useCallback(() => {
    const detectedBrand = seedDevice?.brand ?? "all";
    setBrandFilter(detectedBrand);
    logAnalyticsEvent("design_detect_device_clicked", {
      brand: detectedBrand,
      variantId: seedDevice?.variantId ?? null,
    });
  }, [seedDevice]);

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

  const brandOptions = useMemo(() => {
    const brands = Array.from(new Set(catalog.map((entry) => entry.brand))).sort(
      (a, b) => a.localeCompare(b),
    );
    return ["all", ...brands];
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return catalog.filter((entry) => {
      const matchesBrand = brandFilter === "all" || entry.brand === brandFilter;
      const matchesSearch =
        !normalizedSearch ||
        entry.model.toLowerCase().includes(normalizedSearch) ||
        entry.externalProductId.toLowerCase().includes(normalizedSearch);
      return matchesBrand && matchesSearch;
    });
  }, [brandFilter, catalog, searchTerm]);

  const visibleCatalog = filteredCatalog.length > 0 ? filteredCatalog : catalog;

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

  const lastAttemptLabel = designSummary?.lastCheckoutAttemptAt
    ? new Date(designSummary.lastCheckoutAttemptAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const proofImage = designSummary?.exportedImage ?? null;
  const designStatusLabel = lastTemplateId
    ? "Design saved"
    : "Save in the designer to keep checkout in sync";

  const stepperItems = useMemo(
    () => [
      {
        id: "device",
        label: "1. Device",
        helper: checkoutVariantLabel,
        status: activeDevice || seedDevice ? "complete" : "active",
      },
      {
        id: "design",
        label: "2. Design",
        helper:
          ctaState.id === "printful-ready"
            ? ownershipHelper
            : guardrailSummary.message,
        status: ctaState.id === "printful-ready" ? "complete" : "active",
      },
      {
        id: "review",
        label: "3. Review",
        helper: "Checkout stays locked to this pick",
        status: ctaState.id === "printful-ready" ? "active" : "pending",
      },
    ],
    [
      activeDevice,
      checkoutVariantLabel,
      ctaState.id,
      guardrailSummary.message,
      ownershipHelper,
      seedDevice,
    ],
  );

  return (
    <main
      className="relative pb-28 pt-12 lg:pb-24"
      style={{ backgroundColor: "var(--snap-gray-50)" }}
    >
      {isHydrated ? (
        <span data-testid="design-hydrated-marker" hidden />
      ) : null}

      <div className="px-safe-area">
        <div className="mx-auto w-full max-w-screen-2xl space-y-10 px-4 sm:px-6 lg:px-8 xl:px-10">
          <header className="space-y-4">
            <div className="space-y-2" style={{ fontFamily: "var(--font-display)" }}>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Snapcase designer
              </p>
              <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">
                Design your Snapcase
              </h1>
            </div>
            <p className="max-w-4xl text-base text-gray-700">
              Lock your device, upload your art, and keep the checkout proof in sync. The rail on the right follows you with the saved design, price, and CTA.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
                style={{ borderColor: "var(--snap-gray-200)", backgroundColor: "var(--snap-white)" }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--snap-gray-900)" }} aria-hidden="true" />
                Variant lock on
              </span>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
                style={{ borderColor: "var(--snap-gray-200)", backgroundColor: "var(--snap-white)" }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--snap-gray-900)" }} aria-hidden="true" />
                Proof mirrors checkout
              </span>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
                style={{ borderColor: "var(--snap-gray-200)", backgroundColor: "var(--snap-white)" }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--snap-gray-900)" }} aria-hidden="true" />
                CTA unlocks after checks
              </span>
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
            <section
              className="space-y-6 lg:col-span-8"
              style={{
                borderRadius: "var(--radius-2xl)",
                border: "1px solid var(--snap-gray-200)",
                backgroundColor: "var(--snap-white)",
                boxShadow: "var(--shadow-lg)",
                padding: "var(--space-6)",
              }}
            >
              <div
                className="space-y-4"
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
                      Compact picker with brand chips so checkout stays locked to your selection.
                    </p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700"
                    style={{ border: "1px solid var(--snap-gray-200)", backgroundColor: "var(--snap-gray-50)" }}
                  >
                    Locked to this pick
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {brandOptions.map((brand) => {
                    const isActive = brandFilter === brand;
                    const label =
                      brand === "all"
                        ? "All devices"
                        : `${brand.slice(0, 1).toUpperCase()}${brand.slice(1)}`;
                    return (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => handleBrandSelect(brand)}
                        className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition"
                        style={{
                          borderColor: isActive ? "var(--snap-violet)" : "var(--snap-gray-200)",
                          backgroundColor: isActive ? "var(--snap-violet-10, rgba(124,58,237,0.08))" : "var(--snap-white)",
                          color: isActive ? "var(--snap-violet)" : "var(--snap-gray-800)",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleDetectDevice}
                    className="inline-flex items-center gap-2 rounded-full border border-dashed px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700 md:hidden"
                    style={{ backgroundColor: "var(--snap-gray-50)" }}
                  >
                    Detect my device
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by model or product id"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-800 shadow-inner focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-200"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleCatalog.map((entry) => {
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
                {filteredCatalog.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    No matches yet - showing the full catalog while we add your device.
                  </p>
                ) : null}
              </div>

              <div
                className="space-y-2"
                style={{
                  borderRadius: "var(--radius-xl)",
                  border: "1px dashed var(--snap-gray-200)",
                  backgroundColor: "rgba(249, 250, 251, 0.9)",
                  padding: "var(--space-5)",
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-900"
                    data-testid="design-helper-pill"
                    style={{ border: "1px solid var(--snap-gray-300)", backgroundColor: "var(--snap-white)" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--snap-gray-900)" }} aria-hidden="true" />
                    Locked to {checkoutVariantLabel}
                  </span>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      guardrailSummary.tone === "error"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : guardrailSummary.tone === "warn"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    Designer {guardrailTitle.toLowerCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Keep uploads inside the frame. The CTA and checkout rail update as soon as the designer clears your proof.
                </p>
              </div>

              <div
                style={{
                  borderRadius: "var(--radius-xl)",
                  border: "1px solid var(--snap-gray-200)",
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  padding: "var(--space-3)",
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
                className="space-y-3 text-sm text-gray-600 lg:hidden"
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

              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:hidden">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Proof snapshot</p>
                  <span className="rounded-full border border-gray-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    Step 3
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-14 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    {proofImage ? (
                      <img src={proofImage} alt="Design proof" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="px-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Proof saves after upload
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">{checkoutVariantLabel}</p>
                    <p className="text-xs text-gray-600">{designStatusLabel}</p>
                    <p className="text-xs text-gray-600">{priceLabel ?? "Live price pending"}</p>
                  </div>
                </div>
              </div>
            </section>

            <aside
              className="hidden lg:block lg:col-span-4"
              style={{
                position: "relative",
              }}
            >
              <div
                className="space-y-4"
                style={{
                  borderRadius: "var(--radius-2xl)",
                  border: "1px solid var(--snap-gray-200)",
                  backgroundColor: "rgba(255,255,255,0.96)",
                  boxShadow: "var(--shadow-lg)",
                  padding: "var(--space-5)",
                  position: "sticky",
                  top: "var(--space-6)",
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Proof &amp; checkout
                    </p>
                    <p className="text-xs text-gray-600">Stays synced while you design.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700 shadow-sm">
                      Variant locked
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                        ctaState.id === "printful-ready"
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {ctaState.id === "printful-ready" ? "Ready" : "Running checks"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-20 w-16 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                      {proofImage ? (
                        <img
                          src={proofImage}
                          alt="Design proof preview"
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="px-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Proof saves after upload
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-800">
                      <p className="text-sm font-semibold text-gray-900">{checkoutVariantLabel}</p>
                      <p className="text-xs text-gray-600">{designStatusLabel}</p>
                      <p className="text-xs text-gray-600">{priceLabel ?? "Live price pending"}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 text-xs text-gray-700 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="font-semibold uppercase tracking-wide text-gray-500">Designer status</p>
                      <p
                        className={`text-sm font-semibold leading-tight ${
                          guardrailSummary.tone === "error"
                            ? "text-red-600"
                            : guardrailSummary.tone === "warn"
                              ? "text-amber-700"
                              : "text-emerald-700"
                        }`}
                      >
                        {guardrailSummary.message}
                      </p>
                    </div>
                    <div className="space-y-1 sm:text-right">
                      <p className="font-semibold uppercase tracking-wide text-gray-500">Next step</p>
                      <p className="text-sm font-medium leading-tight text-gray-900">{ctaState.helperText}</p>
                    </div>
                    {lastAttemptLabel ? (
                      <div className="col-span-2 flex items-start justify-between gap-3">
                        <p className="font-semibold uppercase tracking-wide text-gray-500">Last attempt</p>
                        <p className="text-sm text-gray-900">{lastAttemptLabel}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
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
              </div>
            </aside>
          </div>
        </div>
      </div>
      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden"
        style={{ boxShadow: "0 -8px 30px rgba(15,23,42,0.08)" }}
      >
        <div className="mx-auto flex max-w-screen-md items-center gap-3 px-4 py-3">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              {proofImage ? (
                <img src={proofImage} alt="Design proof" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Proof</span>
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-gray-900">{checkoutVariantLabel}</p>
              <p className="text-xs text-gray-600">
                {priceLabel ?? "Live price pending"} - {designStatusLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={ctaState.disabled}
            onClick={handleContinueToCheckout}
            className="inline-flex min-w-[140px] items-center justify-center rounded-full bg-[var(--snap-violet)] px-4 py-2 text-sm font-semibold text-white shadow-md transition disabled:cursor-not-allowed disabled:bg-gray-300"
            data-testid="continue-button-mobile"
          >
            {ctaState.disabled ? "Checks running" : ctaState.label}
          </button>
        </div>
      </div>

    </main>
  );
}
