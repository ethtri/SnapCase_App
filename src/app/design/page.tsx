"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type JSX } from "react";

import { EdmEditor } from "@/components/editor/edm-editor";
import { FabricEditor } from "@/components/editor/fabric-editor";
import { useDesignGuardrails } from "@/components/editor/use-design-guardrails";
import {
  type DeviceCatalogEntry,
  getDeviceCatalog,
} from "@/data/catalog";
import { logAnalyticsEvent } from "@/lib/analytics";
import type { GuardrailInput } from "@/lib/guardrails";
import { markCheckoutAttempt, saveDesignContext } from "@/lib/design-context";

declare global {
  interface Window {
    __snapcaseDesignHydrated?: boolean;
  }
}

type CatalogByBrand = {
  brand: DeviceCatalogEntry["brand"];
  items: DeviceCatalogEntry[];
};

const DEFAULT_PRINT_DIMENSIONS = {
  widthInches: 3.0,
  heightInches: 6.1,
};

const PLACEHOLDER_VARIANT_BANDS: Partial<
  Record<DeviceCatalogEntry["variantId"], "good" | "warn" | "block">
> = {
  632: "good",
  631: "warn",
  633: "warn",
  642: "block",
  712: "warn",
};

const PLACEHOLDER_SAFE_AREA_COLLISIONS = new Set<number>([633, 643, 712]);

function buildPlaceholderGuardrailInput(
  device: DeviceCatalogEntry,
): GuardrailInput {
  // TODO(guardrails): Replace placeholder DPI bands with live EDM/Fabric metrics when Printful data is wired up.
  const band = PLACEHOLDER_VARIANT_BANDS[device.variantId] ?? "good";

  const dpi =
    band === "good" ? 320 : band === "warn" ? 220 : 150;

  const imageWidth = Math.round(dpi * DEFAULT_PRINT_DIMENSIONS.widthInches);
  const imageHeight = Math.round(dpi * DEFAULT_PRINT_DIMENSIONS.heightInches);

  return {
    imageWidth,
    imageHeight,
    targetPrintWidthInches: DEFAULT_PRINT_DIMENSIONS.widthInches,
    targetPrintHeightInches: DEFAULT_PRINT_DIMENSIONS.heightInches,
    safeAreaCollisions: PLACEHOLDER_SAFE_AREA_COLLISIONS.has(device.variantId),
  };
}

function formatCaseType(caseType: DeviceCatalogEntry["caseType"]): string {
  return `${caseType.charAt(0).toUpperCase()}${caseType.slice(1)} case`;
}

export default function DesignPage(): JSX.Element {
  const router = useRouter();
  const catalog = useMemo(() => getDeviceCatalog(), []);
  const catalogByBrand = useMemo<CatalogByBrand[]>(() => {
    return catalog.reduce<CatalogByBrand[]>((groups, item) => {
      const existing = groups.find((group) => group.brand === item.brand);
      if (existing) {
        existing.items.push(item);
        return groups;
      }
      return [...groups, { brand: item.brand, items: [item] }];
    }, []);
  }, [catalog]);

  const [selectedDevice, setSelectedDevice] =
    useState<DeviceCatalogEntry | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    window.__snapcaseDesignHydrated = true;
    document.body.dataset.snapcaseDesignHydrated = "true";
    return () => {
      delete window.__snapcaseDesignHydrated;
      delete document.body.dataset.snapcaseDesignHydrated;
    };
  }, []);

  const useEdm = useMemo(() => {
    const flag =
      (process.env.NEXT_PUBLIC_USE_EDM ??
        process.env.USE_EDM ??
        "").toLowerCase();
    return flag === "true";
  }, []);

  const guardrailInput = useMemo<GuardrailInput | null>(() => {
    if (!selectedDevice) {
      return null;
    }
    return buildPlaceholderGuardrailInput(selectedDevice);
  }, [selectedDevice]);

  const guardrailState = useDesignGuardrails(guardrailInput);

  const handleSelect = (entry: DeviceCatalogEntry) => {
    setSelectedDevice(entry);
    saveDesignContext({
      variantId: entry.variantId,
      externalProductId: entry.externalProductId,
      templateId: null,
      exportedImage: null,
      variantLabel: `${entry.brand.toUpperCase()} - ${entry.model}`,
    });
    logAnalyticsEvent("select_device", {
      variantId: entry.variantId,
      externalProductId: entry.externalProductId,
    });
  };

  const handleTemplateSaved = useCallback(
    ({ templateId, variantId }: { templateId: string; variantId: number }) => {
      if (!selectedDevice || selectedDevice.variantId !== variantId) {
        return;
      }
      const normalizedTemplateId = String(templateId);
      saveDesignContext({
        variantId,
        externalProductId: selectedDevice.externalProductId,
        templateId: normalizedTemplateId,
        exportedImage: null,
      });
    },
    [selectedDevice],
  );

  const handleContinueToCheckout = useCallback(() => {
    if (!selectedDevice || !guardrailState.allowProceed) {
      return;
    }

    markCheckoutAttempt({
      variantId: selectedDevice.variantId,
      externalProductId: selectedDevice.externalProductId,
      variantLabel: `${selectedDevice.brand.toUpperCase()} - ${selectedDevice.model}`,
    });
    router.push("/checkout");
  }, [guardrailState.allowProceed, router, selectedDevice]);

  const handleFabricExport = useCallback(
    ({
      exportedImage,
      variantId,
    }: {
      exportedImage: string;
      variantId: number;
    }) => {
      if (!selectedDevice || selectedDevice.variantId !== variantId) {
        return;
      }
      saveDesignContext({
        variantId,
        externalProductId: selectedDevice.externalProductId,
        templateId: null,
        exportedImage,
      });
    },
    [selectedDevice],
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-12">
      {isHydrated ? (
        <span data-testid="design-hydrated-marker" hidden />
      ) : null}
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
          Scene 1 - Start your design
        </p>
        <h1 className="text-3xl font-semibold text-gray-900">
          Choose your device and case style
        </h1>
        <p className="text-base text-gray-600">
          Select the phone you are designing for. Your editor experience and
          checkout summary will use this information to map the right Printful
          variant.
        </p>
      </header>

      <section className="space-y-8">
        {catalogByBrand.map((group) => (
          <div key={group.brand} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold capitalize text-gray-900">
                {group.brand}
              </h2>
              <span className="text-xs uppercase tracking-wide text-gray-400">
                Snap cases
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {group.items.map((entry) => {
                const isSelected =
                  selectedDevice?.variantId === entry.variantId;
                return (
                  <label
                    key={entry.variantId}
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gray-900 ${
                      isSelected
                        ? "border-gray-900 ring-2 ring-gray-900"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    data-testid={`variant-card-${entry.variantId}`}
                  >
                    <input
                      type="radio"
                      name="device"
                      value={entry.variantId}
                      checked={isSelected}
                      onChange={() => handleSelect(entry)}
                      className="h-4 w-4 accent-gray-900"
                    />
                    <div className="flex flex-col gap-1">
                      <span className="text-xs uppercase tracking-wide text-gray-500">
                        {entry.brand}
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        {entry.model}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatCaseType(entry.caseType)}
                      </span>
                      {/* TODO(scene 2 storyboard): Replace static price with live catalog pricing when available. */}
                      <span className="text-sm font-medium text-gray-900">
                        $34.99
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {selectedDevice ? (
        <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <header className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Scene 5 - Guardrails
            </p>
            <h2 className="text-xl font-semibold text-gray-900">
              DPI meter and safe-area overlay
            </h2>
            <p className="text-sm text-gray-600">
              These guardrails mirror the storyboard copy so both EDM and Fabric
              flows share the same messaging.
            </p>
          </header>
          {useEdm ? (
            <EdmEditor
              variantId={selectedDevice.variantId}
              externalProductId={selectedDevice.externalProductId}
              guardrailInput={guardrailInput}
              onTemplateSaved={handleTemplateSaved}
            />
          ) : (
            <FabricEditor
              variantId={selectedDevice.variantId}
              guardrailInput={guardrailInput}
              onExport={handleFabricExport}
            />
          )}
        </section>
      ) : null}

      <footer className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
        <div data-testid="selection-summary">
          {selectedDevice ? (
            <div className="space-y-1">
              <span className="font-medium text-gray-900">
                {selectedDevice.brand.toUpperCase()} &mdash;{" "}
                {selectedDevice.model}
              </span>
              <div className="text-xs text-gray-500">
                Variant ID {selectedDevice.variantId} /{" "}
                {selectedDevice.externalProductId}
              </div>
            </div>
          ) : (
            <span className="font-medium text-gray-900">
              No device selected yet
            </span>
          )}
          {selectedDevice ? (
            <div className="space-y-2 pt-2">
              <p>
                Guardrail status updates in real time as you upload artwork in the
                editor.
              </p>
              {!guardrailState.allowProceed ? (
                <p className="text-xs font-medium text-red-600">
                  {guardrailState.dpiStatus === "block"
                    ? guardrailState.dpiMessage.description
                    : guardrailState.safeAreaMessage.description}
                </p>
              ) : guardrailState.dpiStatus === "warn" ||
                guardrailState.safeAreaCollisions ? (
                <p className="text-xs font-medium text-amber-600">
                  {guardrailState.dpiMessage.description}
                </p>
              ) : (
                <p className="text-xs font-medium text-emerald-600">
                  {guardrailState.dpiMessage.description}
                </p>
              )}
            </div>
          ) : (
            <p>
              We will unlock the editor and checkout once you choose a device and
              confirm the case.
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={!selectedDevice || !guardrailState.allowProceed}
          onClick={handleContinueToCheckout}
          className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2 font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300 md:w-auto"
          data-testid="continue-button"
        >
          {/* TODO(scene 10): Revisit CTA copy if storyboard wording changes. */}
          Continue to design
        </button>
      </footer>
    </div>
  );
}

