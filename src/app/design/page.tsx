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
  clearDesignContext,
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
type CatalogStatus = "loading" | "ready" | "error";

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

const BRAND_LABELS: Record<Exclude<BrandFilter, "all">, string> = {
  apple: "Apple",
  samsung: "Samsung",
  google: "Pixel",
  other: "More",
};

const STOCK_LABELS: Record<DeviceCatalogEntry["stockStatus"], string> = {
  "in-stock": "In stock",
  "low-stock": "Low stock",
  backorder: "Out of stock",
  "coming-soon": "Coming soon",
};

const BRAND_ORDER: DeviceCatalogEntry["brand"][] = [
  "apple",
  "samsung",
  "google",
  "other",
];

const VARIANT_PRIORITIES = [
  "pro max",
  "ultra",
  "pro",
  "plus",
  "+",
  "air",
];

function deriveDisplayOrder(entry: DeviceCatalogEntry): number {
  if (Number.isFinite(entry.displayOrder)) {
    return entry.displayOrder as number;
  }
  const normalizedModel = entry.model.toLowerCase();
  const generationMatch = normalizedModel.match(/(\d{2}|\d)/);
  const generation = generationMatch ? Number(generationMatch[1]) : 0;
  const variantPriority =
    VARIANT_PRIORITIES.findIndex((keyword) => normalizedModel.includes(keyword)) ?? -1;
  const variantScore =
    variantPriority >= 0 ? variantPriority : VARIANT_PRIORITIES.length;
  return generation > 0
    ? generation * 10 + variantScore
    : Number.MAX_SAFE_INTEGER;
}

function compareCatalogEntries(
  a: DeviceCatalogEntry,
  b: DeviceCatalogEntry,
): number {
  const brandScore =
    BRAND_ORDER.indexOf(a.brand) - BRAND_ORDER.indexOf(b.brand);
  if (brandScore !== 0) return brandScore;

  const orderScore = deriveDisplayOrder(a) - deriveDisplayOrder(b);
  if (orderScore !== 0) return orderScore;

  return a.model.localeCompare(b.model);
}

function isSelectableDevice(entry: DeviceCatalogEntry): boolean {
  return (
    entry.selectable !== false &&
    entry.stockStatus !== "backorder" &&
    entry.stockStatus !== "coming-soon" &&
    Number.isFinite(entry.variantId)
  );
}

function getDisabledReason(entry: DeviceCatalogEntry): string | null {
  if (entry.stockStatus === "coming-soon" || entry.selectable === false) {
    return "Coming soon";
  }
  if (entry.stockStatus === "backorder") {
    return "Out of stock";
  }
  return null;
}

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
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>("loading");
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<DeviceCatalogEntry[]>([]);
  const deviceLookup = useMemo(() => {
    const map = new Map<number, DeviceCatalogEntry>();
    for (const entry of catalog) {
      if (!isSelectableDevice(entry)) {
        continue;
      }
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
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const lastPersistedVariantRef = useRef<number | null>(null);
  const lastCtaStateRef = useRef<string | null>(null);
  const searchBlurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const loadCatalog = useCallback(async () => {
    setCatalogStatus("loading");
    setCatalogError(null);
    try {
      const entries = getDeviceCatalog();
      setCatalog(entries);
      setCatalogStatus("ready");
    } catch (error) {
      console.error("[design] Failed to load catalog", error);
      setCatalogStatus("error");
      setCatalogError(
        error && typeof error === "object" && "message" in error
          ? String((error as Error).message)
          : "Unable to load the catalog. Please try again.",
      );
    }
  }, []);

  const clearSearchBlurTimeout = useCallback(() => {
    if (searchBlurTimeoutRef.current) {
      clearTimeout(searchBlurTimeoutRef.current);
      searchBlurTimeoutRef.current = null;
    }
  }, []);

  const handleSearchFocus = useCallback(() => {
    clearSearchBlurTimeout();
    setSearchFocused(true);
    setShowSearchSuggestions(true);
  }, [clearSearchBlurTimeout]);

  const handleSearchBlur = useCallback(() => {
    clearSearchBlurTimeout();
    searchBlurTimeoutRef.current = setTimeout(() => {
      setShowSearchSuggestions(false);
    }, 120);
    setSearchFocused(false);
  }, [clearSearchBlurTimeout]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setShowSearchSuggestions(true);
  }, []);

  const resetPickerControls = useCallback(() => {
    setSearchQuery("");
    setBrandFilter("all");
    setShowSearchSuggestions(false);
  }, []);

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
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    return () => {
      clearSearchBlurTimeout();
    };
  }, [clearSearchBlurTimeout]);

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
    if (entry.selectable === false || !Number.isFinite(entry.variantId)) {
      return;
    }
    setShowSearchSuggestions(false);
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

  const handleClearSelection = useCallback(() => {
    setSelectedDevice(null);
    setEdmSnapshot(null);
    setPricingDetails(null);
    setLastTemplateId(null);
    setDesignerResetToken((token) => token + 1);
    setDesignSummary(null);
    lastPersistedVariantRef.current = null;
    setShowSearchSuggestions(false);
    clearDesignContext();
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

  const handleSuggestionSelect = useCallback(
    (entry: DeviceCatalogEntry) => {
      if (entry.selectable === false || !Number.isFinite(entry.variantId)) {
        return;
      }
      handleDeviceSelected(entry);
      setShowSearchSuggestions(false);
    },
    [handleDeviceSelected],
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
            magsafe: false,
            stockStatus: "in-stock",
            templateReady: false,
            selectable: true,
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
    if (catalogStatus !== "ready") {
      return [];
    }
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesQuery = (entry: DeviceCatalogEntry) => {
      if (!normalizedQuery) return true;
      return `${entry.model} ${entry.externalProductId} ${BRAND_LABELS[entry.brand]}`
        .toLowerCase()
        .includes(normalizedQuery);
    };
    const matchesBrand = (entry: DeviceCatalogEntry) =>
      brandFilter === "all" || entry.brand === brandFilter;

    return catalog
      .filter((entry) => matchesBrand(entry) && matchesQuery(entry))
      .sort(compareCatalogEntries);
  }, [brandFilter, catalog, catalogStatus, searchQuery]);

  const brandCounts = useMemo(() => {
    const counts: Record<Exclude<BrandFilter, "all">, number> = {
      apple: 0,
      samsung: 0,
      google: 0,
      other: 0,
    };
    for (const entry of catalog) {
      counts[entry.brand] += 1;
    }
    return counts;
  }, [catalog]);

  const selectableCatalogCount = useMemo(() => catalog.length, [catalog]);

  const searchSuggestions = useMemo(() => {
    if (catalogStatus !== "ready") {
      return [];
    }
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const pool =
      normalizedQuery.length > 0
        ? filteredCatalog
        : catalog.filter((entry) =>
            brandFilter === "all" ? entry.featured : entry.brand === brandFilter,
          );
    const unique: DeviceCatalogEntry[] = [];
    for (const entry of pool) {
      if (unique.find((item) => item.variantId === entry.variantId)) {
        continue;
      }
      unique.push(entry);
      if (unique.length >= 6) {
        break;
      }
    }
    return unique;
  }, [brandFilter, catalog, catalogStatus, filteredCatalog, searchQuery]);

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
        helperText: "Your device is ready. Continue to design.",
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
        label: "Resolve the banner above",
        helperText: "Fix the issues, then continue to checkout.",
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
      helperText: "Design saved. Continue to checkout.",
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
            className="inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
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
            className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
            data-testid="continue-button-desktop"
          >
            {ctaState.label}
          </button>
        </div>
      </div>
    </>
  );

  const deviceCards = (
    <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {filteredCatalog.map((entry) => {
        const selected = selectedDevice?.variantId === entry.variantId;
        const selectable = isSelectableDevice(entry);
        const disabledReason = getDisabledReason(entry);
        const selectedStyle =
          selected && selectable
            ? {
                borderColor: "var(--snap-violet)",
                boxShadow: "0 0 0 2px var(--snap-violet)",
                backgroundColor: "var(--snap-violet-50)",
              }
            : undefined;
        const disabledStyle = !selectable
          ? {
              borderColor: "var(--snap-cloud-border)",
              backgroundColor: "var(--snap-cloud)",
              filter: "saturate(0.75)",
            }
          : undefined;
        return (
          <button
            key={entry.variantId}
            type="button"
            onClick={selectable ? () => handleDeviceSelected(entry) : undefined}
            disabled={!selectable}
            aria-disabled={!selectable}
            aria-pressed={selected}
            className={`relative flex h-full flex-col gap-3 rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
              selected && selectable ? "shadow-md" : ""
            } ${
              selectable
                ? "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--snap-violet)] focus-visible:ring-offset-2"
                : "cursor-not-allowed"
            }`}
            data-testid={`device-option-${entry.variantId}`}
            style={{ ...(disabledStyle ?? {}), ...(selectedStyle ?? {}) }}
            aria-label={`${entry.model} - ${BRAND_LABELS[entry.brand]}${disabledReason ? ` (${disabledReason})` : ""}`}
            title={disabledReason ?? undefined}
            tabIndex={selectable ? 0 : -1}
            onKeyDown={(event) => {
              if ((event.key === "Enter" || event.key === " ") && selectable) {
                event.preventDefault();
                handleDeviceSelected(entry);
              }
            }}
            onFocus={() => setShowSearchSuggestions(false)}
          >
            {selected && selectable ? (
              <span className="absolute right-3 top-3 inline-flex items-center justify-center rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-[var(--snap-violet)] ring-1 ring-[var(--snap-violet)] shadow-sm">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="h-3.5 w-3.5"
                  fill="currentColor"
                >
                  <path d="M6.707 10.293 4.414 8l-.828.828 3.121 3.121a1 1 0 0 0 1.414 0l5.364-5.364-.828-.828-4.657 4.657z" />
                </svg>
              </span>
            ) : null}
            <div className="space-y-1">
              <p className="text-lg font-semibold text-gray-900">
                {entry.model}
              </p>
              <p className="text-sm text-gray-700">{BRAND_LABELS[entry.brand]}</p>
            </div>
            {disabledReason ? (
              <span className="inline-flex w-fit items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-800 ring-1 ring-[var(--snap-cloud-border)]">
                {disabledReason}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );

  const pickerView = (
    <div className="mx-auto max-w-screen-2xl space-y-7 pb-28 lg:pb-20">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Step 1: Pick your device
        </p>
        <h1 className="text-3xl font-semibold text-gray-900">
          Choose your phone and case.
        </h1>
        <p className="text-base text-gray-600">
          Pick your phone, then jump into the designer. Continue when you&apos;re ready.
        </p>
        {selectedDevice ? (
          <div
            className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[var(--snap-cloud-border)] bg-[var(--snap-cloud)] px-4 py-1.5 text-sm font-semibold text-gray-900 shadow-sm"
            role="status"
            aria-live="polite"
          >
            <span>{`Your device: ${formatDeviceLabel(selectedDevice)}`}</span>
            <span aria-hidden="true" className="text-gray-500">
              &middot;
            </span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="inline-flex items-center justify-center rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-[var(--snap-violet)] ring-1 ring-[var(--snap-cloud-border)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--snap-violet)] focus-visible:ring-offset-2"
            >
              Change device
            </button>
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <div
          className={`relative flex w-full flex-1 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm focus-within:border-gray-300 ${searchFocused ? "ring-1 ring-gray-200" : ""}`}
        >
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
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            onChange={(event) => handleSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && searchSuggestions[0]) {
                event.preventDefault();
                handleSuggestionSelect(searchSuggestions[0]);
              }
            }}
            className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-500"
            placeholder="Search by model or ID"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setShowSearchSuggestions(false);
              }}
              className="rounded-full px-2 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              Clear
            </button>
          ) : null}
          {showSearchSuggestions ? (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Suggested devices
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {searchSuggestions.length} result{searchSuggestions.length === 1 ? "" : "s"}
                </p>
              </div>
              {searchSuggestions.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {searchSuggestions.map((entry) => {
                    const selectable = isSelectableDevice(entry);
                    const disabledReason = getDisabledReason(entry) ?? "Unavailable";
                    return (
                      <li key={`suggestion-${entry.variantId}`}>
                        <button
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            if (selectable) {
                              handleSuggestionSelect(entry);
                            }
                          }}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={!selectable}
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {entry.model}
                            </p>
                            <p className="text-xs text-gray-600">
                              {BRAND_LABELS[entry.brand]} &middot; {STOCK_LABELS[entry.stockStatus]}
                            </p>
                          </div>
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-semibold text-gray-800">
                            {selectable ? "Select" : disabledReason}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-600">
                  No quick matches. Keep typing to search the full catalog.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div
          className="flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label="Device brands"
        >
          {(["all", ...BRAND_ORDER] as BrandFilter[]).map((brand) => {
            const count =
              brand === "all" ? selectableCatalogCount : brandCounts[brand as Exclude<BrandFilter, "all">];
            const isActive = brandFilter === brand;
            return (
              <button
                key={brand}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setBrandFilter(brand)}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-gray-900 text-white shadow-sm"
                    : "border border-gray-200 bg-white text-gray-800 hover:border-gray-300"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--snap-violet)] focus-visible:ring-offset-2`}
              >
                <span>{brand === "all" ? "All devices" : BRAND_LABELS[brand as Exclude<BrandFilter, "all">]}</span>
                <span className="rounded-full border border-gray-200 bg-[var(--snap-cloud)] px-2 py-0.5 text-[11px] font-semibold text-gray-800">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl border border-[var(--snap-cloud-border)] bg-[var(--snap-cloud)] p-5 shadow-sm lg:p-6">
          {catalogStatus === "loading" ? (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-white"
                />
              ))}
            </div>
          ) : catalogStatus === "error" ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-red-200 bg-red-50/70 p-6 text-sm text-red-800">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-700">
                  !
                </span>
                <p className="text-base font-semibold text-red-900">
                  We couldn&apos;t load the catalog.
                </p>
              </div>
              <p className="text-sm text-red-800">
                {catalogError ?? "Please retry. Your selection stays saved."}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={loadCatalog}
                  className="inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : filteredCatalog.length > 0 ? (
            deviceCards
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-700">
              <p className="font-semibold text-gray-900">No devices match that search.</p>
              <p className="max-w-md text-gray-600">
                Try another brand or clear your search to see the full lineup.
              </p>
              <button
                type="button"
                onClick={resetPickerControls}
                className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                Reset search
              </button>
            </div>
          )}
        </div>
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
            Upload your art and let Printful clear checks. Your device stays selected.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-[var(--snap-cloud-border)] bg-[var(--snap-cloud)] px-4 py-2 text-sm shadow-sm">
          <div className="flex flex-wrap items-center gap-2 font-medium text-gray-900">
            <span>{`Your device: ${summaryDeviceLabel}`}</span>
            <span aria-hidden="true" className="text-gray-500">
              &middot;
            </span>
            <button
              type="button"
              onClick={() => setView("picker")}
              className="inline-flex items-center justify-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--snap-violet)] ring-1 ring-[var(--snap-cloud-border)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--snap-violet)] focus-visible:ring-offset-2"
            >
              Change device
            </button>
          </div>
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
              We only launch Printful after you choose a phone. Return to the picker to choose your Snapcase.
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
      <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-10">
        {view === "picker" ? pickerView : designerView}
      </div>
      {actionBar}
    </main>
  );
}
