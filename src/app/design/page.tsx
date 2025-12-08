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
} from "@/components/editor/edm-editor";
import { type DeviceCatalogEntry, getDeviceCatalog } from "@/data/catalog";
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
  | "variant-mismatch"
  | "printful-blocked"
  | "printful-validating"
  | "printful-ready"
  | "unsupported-variant";

type DesignCtaState = {
  id: DesignCtaStateId;
  label: string;
  helperText: string;
  disabled: boolean;
  source: GuardrailCopySource;
};

const SCENE_HIGHLIGHTS = [
  {
    id: "Scene 1",
    title: "SnapCase device lock",
    description:
      "Pick once inside SnapCase. We lock the Printful picker to your catalog variant so checkout never drifts.",
  },
  {
    id: "Scene 2",
    title: "Embedded designer",
    description:
      "EDM handles guardrails, DPI, and template saves. We listen for its status updates inside this shell.",
  },
  {
    id: "Scene 3",
    title: "Route to checkout",
    description:
      "Once Printful clears the banner we push you into /checkout with the captured template metadata.",
  },
] as const;

function formatDeviceLabel(device: DeviceCatalogEntry | null): string | null {
  if (!device) {
    return null;
  }
  return `${device.brand.toUpperCase()} - ${device.model}`;
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
    if (!edmSnapshot?.selectedVariantIds?.length) {
      return;
    }
    const lockedVariantId = seedDevice?.variantId ?? null;
    const variantFromPrintful = edmSnapshot.selectedVariantIds[0];
    if (!variantFromPrintful) {
      return;
    }
    if (lockedVariantId && variantFromPrintful !== lockedVariantId) {
      return;
    }
    const entry = deviceLookup.get(variantFromPrintful) ?? null;
    if (entry) {
      setActiveDevice((previous) =>
        previous?.variantId === entry.variantId ? previous : entry,
      );
    }
    if (lastPersistedVariantRef.current === variantFromPrintful) {
      return;
    }
    lastPersistedVariantRef.current = variantFromPrintful;
    const context = saveDesignContext({
      variantId: variantFromPrintful,
      externalProductId: entry?.externalProductId ?? null,
      variantLabel: formatDeviceLabel(entry ?? null),
    });
    if (context) {
      setDesignSummary(context);
    }
  }, [deviceLookup, edmSnapshot, seedDevice]);

  const handleDeviceSelected = useCallback(
    (entry: DeviceCatalogEntry) => {
      setSeedDevice(entry);
      setActiveDevice(entry);
      setEdmSnapshot(null);
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

  const handleResetDesigner = useCallback(() => {
    setEdmSnapshot(null);
    setLastTemplateId(null);
    setDesignerResetToken((token) => token + 1);
    logAnalyticsEvent("design_designer_reset", {
      variantId: seedDevice?.variantId ?? null,
      reason: "variant_mismatch",
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

      const persistLocally = (overrides: Partial<DesignContext> = {}) => {
        const context = saveDesignContext({
          variantId,
          externalProductId,
          templateId,
          exportedImage: previewUrl ?? null,
          designFileId: null,
          designFileUrl: null,
          variantLabel,
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
    [activeDevice, deviceLookup, seedDevice],
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

  const helperLabel =
    formatDeviceLabel(activeDevice ?? seedDevice) ??
    "Select your device to lock the designer";

  const currentVariantId =
    edmSnapshot?.selectedVariantIds?.[0] ??
    activeDevice?.variantId ??
    seedDevice?.variantId ??
    null;

  const variantMismatch = Boolean(
    seedDevice &&
      edmSnapshot?.selectedVariantIds?.length &&
      !edmSnapshot.selectedVariantIds.includes(seedDevice.variantId),
  );

  const unsupportedVariantSelected = Boolean(
    edmSnapshot?.selectedVariantIds?.length &&
      edmSnapshot.selectedVariantIds.some(
        (variantId) => !deviceLookup.has(variantId),
      ),
  );

  const guardrailSummary = useMemo<GuardrailSummary>(() => {
    if (!seedDevice) {
      return {
        tone: "neutral",
        message: "Pick your device in SnapCase before opening the designer.",
        source: "snapcase",
      };
    }
    if (variantMismatch) {
      return {
        tone: "warn",
        message:
          "Printful reported a different device. Restart the designer to re-lock to your SnapCase pick.",
        source: "snapcase",
      };
    }
    if (unsupportedVariantSelected) {
      return {
        tone: "error",
        message:
          "This device is not in the beta catalog yet. Pick an iPhone 14-15 or Galaxy S24 inside Printful to continue.",
        source: "system",
      };
    }
    if (!edmSnapshot) {
      return {
        tone: "neutral",
        message:
          "Printful is loading the designer. Guardrails appear once it finishes.",
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
          "Printful is blocking this design until you resolve the banner above.",
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
        message: "Printful approved this design. Continue when you are ready.",
        source: "printful",
      };
    }
    return {
      tone: "neutral",
      message: "Waiting for Printful to finish validating the design.",
      source: "printful",
    };
  }, [edmSnapshot, seedDevice, unsupportedVariantSelected, variantMismatch]);

  const printfulBlocking = Boolean(
    edmSnapshot &&
      (edmSnapshot.designValid === false ||
        edmSnapshot.blockingIssues.length > 0),
  );

  const ctaState = useMemo<DesignCtaState>(() => {
    if (!seedDevice) {
      return {
        id: "select-device",
        label: "Select your device to start",
        helperText:
          "SnapCase owns the picker. Choose a device to launch the designer.",
        disabled: true,
        source: "snapcase",
      };
    }
    if (variantMismatch) {
      return {
        id: "variant-mismatch",
        label: "Restart to re-lock device",
        helperText:
          "Printful must match your SnapCase selection. Reload the designer to continue.",
        disabled: true,
        source: "snapcase",
      };
    }
    if (unsupportedVariantSelected) {
      return {
        id: "unsupported-variant",
        label: "Select a supported device",
        helperText:
          "SnapCase beta currently supports iPhone 14-15 and Galaxy S24 models inside Printful.",
        disabled: true,
        source: "system",
      };
    }
    if (!edmSnapshot) {
      return {
        id: "printful-validating",
        label: "Waiting on Printful...",
        helperText: guardrailSummary.message,
        disabled: true,
        source: "printful",
      };
    }
    if (printfulBlocking) {
      return {
        id: "printful-blocked",
        label: "Resolve the Printful banner",
        helperText: guardrailSummary.message,
        disabled: true,
        source: "printful",
      };
    }
    if (edmSnapshot.designValid !== true) {
      return {
        id: "printful-validating",
        label: "Waiting on Printful...",
        helperText: guardrailSummary.message,
        disabled: true,
        source: "printful",
      };
    }
    return {
      id: "printful-ready",
      label: "Continue to checkout",
      helperText: guardrailSummary.message,
      disabled: false,
      source: guardrailSummary.source,
    };
  }, [
    edmSnapshot,
    guardrailSummary,
    printfulBlocking,
    seedDevice,
    variantMismatch,
    unsupportedVariantSelected,
  ]);

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
    if (!seedDevice) {
      return "Select your device";
    }
    if (variantMismatch) {
      return "Device mismatch detected";
    }
    if (unsupportedVariantSelected) {
      return "Select a supported device";
    }
    if (guardrailSummary.source === "printful") {
      if (guardrailSummary.tone === "error") {
        return "Resolve the Printful banner above";
      }
      if (guardrailSummary.tone === "warn") {
        return "Heads up from Printful";
      }
      if (guardrailSummary.tone === "success") {
        return "Printful approved your design";
      }
      return "Printful is validating";
    }
    return "Design status";
  }, [guardrailSummary, unsupportedVariantSelected, variantMismatch, seedDevice]);

  const handleContinueToCheckout = useCallback(() => {
    if (ctaState.disabled) {
      return;
    }
    const entry = activeDevice ?? seedDevice;
    if (!entry) {
      return;
    }
    const context = markCheckoutAttempt({
      variantId: entry.variantId,
      externalProductId: entry.externalProductId,
      variantLabel: formatDeviceLabel(entry) ?? undefined,
    });
    if (context) {
      setDesignSummary(context);
    }
    router.push("/checkout");
  }, [activeDevice, ctaState.disabled, router, seedDevice]);

  const checkoutVariantLabel =
    formatDeviceLabel(activeDevice ?? seedDevice) ??
    "Pick a supported device in SnapCase";

  const templateSummaryLabel = lastTemplateId
    ? `Template #${lastTemplateId}`
    : "Save inside Printful to capture a template ID";

  const lastAttemptLabel = designSummary?.lastCheckoutAttemptAt
    ? new Date(designSummary.lastCheckoutAttemptAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <main className="relative bg-gray-50 pb-16 pt-12 lg:pb-24">
      {isHydrated ? (
        <span data-testid="design-hydrated-marker" hidden />
      ) : null}

      <div className="px-safe-area">
        <div className="mx-auto w-full max-w-[1400px] space-y-10 px-4 sm:px-5 md:px-6 lg:px-8 xl:px-10">
          <header className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              <span className="rounded-full border border-gray-300 px-3 py-1 text-xs">
                Flow 1 / Scenes 1-3
              </span>
              <span className="rounded-full border border-gray-300 px-3 py-1 text-xs">
                docs/Responsive_Blueprint.md
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-gray-900">
                SnapCase owns the picker. Printful stays locked to your choice.
              </h1>
              <p className="text-base text-gray-600">
                Pick your device once in SnapCase. We preload Printful with that variant, hide its
                picker chrome, and keep template + pricing telemetry in sync so the Scene 3 checkout
                route stays accurate without Fabric-era rails.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SCENE_HIGHLIGHTS.map((scene) => (
                <div
                  key={scene.id}
                  className="rounded-3xl border border-gray-200 bg-white/80 p-4 shadow-sm"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {scene.id}
                  </p>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {scene.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{scene.description}</p>
                </div>
              ))}
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,2.5fr),minmax(320px,1fr)]">
            <section className="space-y-6 rounded-[40px] border border-gray-200 bg-white/80 p-6 shadow-xl">
              <div className="space-y-3 rounded-3xl border border-gray-200 bg-white/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Scene 1 / SnapCase picker
                    </p>
                    <p className="text-sm text-gray-700">
                      SnapCase locks the Printful designer to the device you pick here. We hide the
                      Printful picker row and keep it read-only behind the scenes.
                    </p>
                  </div>
                  <span className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                    Single selection
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
                        className={`flex w-full items-start justify-between rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-gray-900/60 ${
                          selected
                            ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                            : "border-gray-200 bg-white text-gray-800 hover:border-gray-300"
                        }`}
                        data-testid={`device-option-${entry.variantId}`}
                      >
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide">
                            {entry.brand}
                          </p>
                          <p className="text-base font-semibold">{entry.model}</p>
                          <p className="text-xs text-gray-500">
                            Catalog ID {entry.variantId} / {entry.caseType} case
                          </p>
                        </div>
                        <span
                          className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                            selected ? "border-white bg-white text-gray-900" : "border-gray-300"
                          }`}
                          aria-hidden="true"
                        >
                          {selected ? (
                            <span className="block h-2.5 w-2.5 rounded-full bg-current" />
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 rounded-3xl border border-dashed border-gray-200 bg-gray-50/70 px-5 py-4">
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-900"
                  data-testid="design-helper-pill"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-900" aria-hidden="true" />
                  {helperLabel}
                </span>
                <p className="text-sm text-gray-600">
                  SnapCase preloads your pick into Printful and suppresses their picker row. Change
                  devices above; we mirror the locked variant once the designer confirms it.
                </p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white/90 p-2 shadow-inner">
                {seedDevice ? (
                  <EdmEditor
                    key={`${seedDevice.variantId}-${designerResetToken}`}
                    variantId={seedDevice.variantId}
                    externalProductId={seedDevice.externalProductId}
                    onTemplateSaved={handleTemplateSaved}
                    onTemplateHydrated={handleTemplateHydrated}
                    onDesignStatusChange={setEdmSnapshot}
                  />
                ) : (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-600">
                    We do not have a supported device to preload yet. Please contact support to add
                    your catalog entry.
                  </div>
                )}
              </div>

              <div
                className="space-y-3 rounded-3xl border border-gray-100 bg-gray-50 p-6 text-sm text-gray-600"
                data-testid="guardrail-card"
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
                {variantMismatch ? (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResetDesigner}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-900 transition hover:border-gray-400"
                    >
                      Restart designer
                    </button>
                  </div>
                ) : null}
              </div>
            </section>

            <aside className="space-y-5 rounded-[32px] border border-gray-200 bg-white/95 p-6 shadow-xl">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Scene 3 / Checkout preview
                </p>
                <p className="text-sm text-gray-600">
                  Once Printful clears the banner, Continue unlocks and routes you to /checkout with
                  your variant and template preserved.
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
                    Template state
                  </dt>
                  <dd className="text-right text-sm text-gray-900">{templateSummaryLabel}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Guardrail status
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
                  className="inline-flex w-full items-center justify-center rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                  data-testid="continue-button"
                >
                  {ctaState.label}
                </button>
                <p className="text-xs text-gray-500">{ctaState.helperText}</p>
              </div>

              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-4 text-xs text-gray-600">
                <p className="font-semibold text-gray-900">Blueprint callout</p>
                <p className="mt-1">
                  Mirrors Responsive_Blueprint Scenes 2-3: Printful guardrails drive the CTA without
                  any Fabric rails, so checkout inherits live template data.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}