import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react";

import { findPrintfulCatalogEntry } from "@/data/printful-catalog";
import { logAnalyticsEvent } from "@/lib/analytics";
import {
  getCachedTemplate,
  upsertTemplateCache,
} from "@/lib/template-cache";

import {
  buildPrintfulConfig,
  SNAPCASE_EMBED_THEME,
  type PrintfulConfigDiagnosticsSnapshot,
} from "./printful-config";

type EdmEditorProps = {
  variantId: number;
  externalProductId: string;
  onTemplateSaved?: (payload: {
    templateId: string;
    variantId: number;
    previewUrl: string | null;
  }) => void;
  onTemplateHydrated?: (payload: {
    templateId: string;
    variantId: number;
    source: TemplateSource | null;
  }) => void;
  onDesignStatusChange?: (snapshot: EdmGuardrailSnapshot | null) => void;
  onPricingChange?: (pricing: PrintfulPricingDetails | null) => void;
};

type GuardrailMode = "snapcase" | "printful";

type PFDesignMakerInstance = {
  destroy?: () => void;
};

type PFDesignMakerOptions = {
  elemId: string;
  nonce: string;
  externalProductId: string;
  templateId?: string;
  initProduct?: {
    productId: number;
    technique?: string;
    forceOrientation?: string;
  };
  featureConfig?: Record<string, boolean | string | number | undefined>;
  style?: {
    variables?: Record<string, string>;
    navigation?: Record<
      string,
      string | Record<string, string | undefined> | undefined
    >;
  };
  disabledPlacements?: string[];
  isVariantSelectionDisabled?: boolean;
  allowOnlyOneColorToBeSelected?: boolean;
  allowOnlyOneSizeToBeSelected?: boolean;
  preselectedColors?: string[];
  preselectedSizes?: string[];
  useUserConfirmationErrors?: boolean;
  iframeClassName?: string;
  onTemplateSaved?: (payload: unknown) => void;
  onDesignStatusUpdate?: (payload: unknown) => void;
  onPricingStatusUpdate?: (payload: unknown) => void;
  onError?: (error: unknown) => void;
};

type PFDesignMakerConstructor = new (
  options: PFDesignMakerOptions,
) => PFDesignMakerInstance;

type TemplateProbeResponse = {
  externalProductId: string;
  printfulProductId: number | null;
  template: {
    exists: boolean;
    templateId: number | null;
  };
};

type TemplateMode = "create" | "edit" | "unknown";
type TemplateSource = "cache" | "probe" | "edm_save" | null;
type BootstrapPhase =
  | "idle"
  | "probing-template"
  | "loading-script"
  | "requesting-nonce"
  | "initializing-designer";

type DesignStatusSnapshot = {
  at: string;
  designValid: boolean | null;
  status: string | null;
  blockingIssues: string[];
  warningMessages: string[];
  rawPayload: string | null;
  selectedVariantIds: number[];
  variantMismatch: boolean;
  guardrailMode: GuardrailMode;
};

export type EdmGuardrailSnapshot = {
  designValid: boolean | null;
  blockingIssues: string[];
  warningMessages: string[];
  selectedVariantIds: number[];
  variantMismatch: boolean;
  guardrailMode: GuardrailMode;
  updatedAt: string;
  rawPayload: string | null;
};

type EdmAnalyticsBasePayload = {
  variantId: number;
  designValid: boolean | null;
  errorSummaries: {
    blockingIssues: string[];
    warningMessages: string[];
  };
  timestamp: string;
};

type EdmDiagnostics = {
  requestedAt: string;
  variantId: number;
  externalProductId: string;
  requestOrigin: string;
  referer: string | null;
  nonce?: string | null;
  nonceExpiresAt?: string | null;
  lastErrorMessage?: string | null;
  lastErrorEvent?: string | null;
  rawErrorPayload?: string | null;
  errorCapturedAt?: string | null;
  reportedOrigin?: string | null;
  expectedOrigin?: string | null;
  printfulProductId?: number | null;
  templateMode?: TemplateMode;
  templateSource?: TemplateSource;
  templateCacheHit?: boolean;
  templateIdFromProbe?: string | null;
  templateIdFromCache?: string | null;
  activeTemplateId?: string | null;
  templateProbeCompletedAt?: string | null;
  templateProbeError?: string | null;
  cacheHydratedAt?: string | null;
  initProductUsed?: boolean | null;
  forcedInitProduct?: boolean | null;
  scriptLoadStartedAt?: string | null;
  scriptLoadCompletedAt?: string | null;
  scriptLoadFailedAt?: string | null;
  messageEvents: Array<{
    at: string;
    event: string;
    origin: string | null;
  }>;
  configSnapshot?: PrintfulConfigDiagnosticsSnapshot | null;
  designStatus?: DesignStatusSnapshot | null;
  guardrailMode?: GuardrailMode;
};

export type PrintfulPricingDetails = {
  amountCents: number | null;
  currency: string | null;
  source: "pricing_status" | "catalog" | "unknown";
  rawPayload: string | null;
  updatedAt: string;
};

declare global {
  interface Window {
    PFDesignMaker?: PFDesignMakerConstructor;
    __snapcaseTestHooks?: Record<string, unknown>;
  }
}

const EDM_SCRIPT_SRC = "https://files.cdn.printful.com/embed/embed.js";
// Per Printful EDM docs, create-mode flows need an explicit technique.
const PRINTFUL_DEFAULT_TECHNIQUE = "SUBLIMATION";

let edmScriptPromise: Promise<void> | null = null;

function safeSerialize(value: unknown): string | null {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return null;
  }
}

function ensureEdmScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("EDM script can only be loaded in a browser environment."),
    );
  }

  if (window.PFDesignMaker) {
    return Promise.resolve();
  }

  if (!edmScriptPromise) {
    edmScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${EDM_SCRIPT_SRC}"]`,
      );

      if (existing) {
        const readyState =
          "readyState" in existing
            ? (existing as HTMLScriptElement & { readyState?: string })
                .readyState
            : undefined;

        if (
          existing.dataset.snapcaseEdmLoaded === "true" ||
          readyState === "complete" ||
          readyState === "loaded"
        ) {
          existing.dataset.snapcaseEdmLoaded = "true";
          resolve();
          return;
        }
      }

      const script = existing ?? document.createElement("script");
      const requestId =
        script.dataset.snapcaseEdmRequestId ??
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now()));
      script.dataset.snapcaseEdmRequestId = requestId;

      let settled = false;
      const cleanup = () => {
        window.clearTimeout(timeoutId);
        script.removeEventListener("load", handleLoad);
        script.removeEventListener("error", handleError);
      };

      const handleLoad = () => {
        if (settled) {
          return;
        }
        settled = true;
        script.dataset.snapcaseEdmLoaded = "true";
        cleanup();
        resolve();
      };

      const handleError = () => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        edmScriptPromise = null;
        const error = new Error(
          "Failed to load Printful EDM script (embed.js). Check CSP/network.",
        );
        script.dataset.snapcaseEdmFailed = "true";
        reject(error);
      };

      const timeoutId = window.setTimeout(() => {
        handleError();
      }, 15000);

      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });

      if (!existing) {
        script.src = EDM_SCRIPT_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
    });
  }

  return edmScriptPromise;
}

function resolveTemplateId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const direct = data.templateId ?? data.template_id;

  if (typeof direct === "string" && direct.trim()) {
    return direct;
  }

  if (typeof direct === "number") {
    return String(direct);
  }

  const nested = data.template ?? data.result;
  if (nested && typeof nested === "object") {
    const nestedRecord = nested as Record<string, unknown>;
    const nestedId =
      nestedRecord.id ?? nestedRecord.templateId ?? nestedRecord.template_id;
    if (typeof nestedId === "string" && nestedId.trim()) {
      return nestedId;
    }
    if (typeof nestedId === "number") {
      return String(nestedId);
    }
  }

  return null;
}

function resolveDesignPreviewUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const candidateKeys = [
    "mockupUrl",
    "mockup_url",
    "previewUrl",
    "preview_url",
    "designUrl",
    "design_url",
    "url",
  ];
  for (const key of candidateKeys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().startsWith("http")) {
      return value.trim();
    }
  }

  if (Array.isArray((record.files as unknown[] | undefined))) {
    for (const item of (record.files as unknown[]) ?? []) {
      const nestedUrl = resolveDesignPreviewUrl(item);
      if (nestedUrl) {
        return nestedUrl;
      }
    }
  }

  const nestedKeys = ["template", "result", "design", "data"];
  for (const key of nestedKeys) {
    const nested = record[key];
    if (nested && typeof nested === "object") {
      const nestedUrl = resolveDesignPreviewUrl(nested);
      if (nestedUrl) {
        return nestedUrl;
      }
    }
  }

  return null;
}

function captureDiagnosticsContext(
  variantId: number,
  externalProductId: string,
): EdmDiagnostics | null {
  if (typeof window === "undefined") {
    return null;
  }

  return {
    requestedAt: new Date().toISOString(),
    variantId,
    externalProductId,
    requestOrigin: window.location.origin,
    referer: document.referrer || null,
    messageEvents: [],
    templateMode: "unknown",
    templateSource: null,
    templateCacheHit: false,
    templateIdFromCache: null,
    templateIdFromProbe: null,
    activeTemplateId: null,
    printfulProductId: null,
    templateProbeCompletedAt: null,
    templateProbeError: null,
    cacheHydratedAt: null,
    initProductUsed: null,
  };
}

function analyzePrintfulError(payload: unknown): {
  event: string | null;
  message: string | null;
  origin: string | null;
  expectedOrigin: string | null;
  raw: string | null;
} {
  let eventName: string | null = null;
  let message: string | null = null;
  let origin: string | null = null;
  let expectedOrigin: string | null = null;

  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;

    if (typeof data.event === "string") {
      eventName = data.event;
    }
    if (typeof data.message === "string") {
      message = data.message;
    }
    if ("reason" in data && typeof data.reason === "string") {
      if (!message) {
        message = data.reason;
      }
    }
    if ("origin" in data && typeof data.origin === "string") {
      origin = data.origin;
    }
    if ("expected_origin" in data && typeof data.expected_origin === "string") {
      expectedOrigin = data.expected_origin;
    }

    if (
      "data" in data &&
      data.data &&
      typeof data.data === "object" &&
      "response" in (data.data as Record<string, unknown>)
    ) {
      const response = (data.data as Record<string, unknown>)
        .response as Record<string, unknown> | undefined;
      if (response && typeof response === "object") {
        if (typeof response.message === "string" && !message) {
          message = response.message;
        }
        if (typeof response.reason === "string" && !message) {
          message = response.reason;
        }
        if (typeof response.origin === "string" && !origin) {
          origin = response.origin;
        }
        if (
          typeof response.expected_origin === "string" &&
          !expectedOrigin
        ) {
          expectedOrigin = response.expected_origin;
        }
      }
    }
  }

  return {
    event: eventName,
    message,
    origin,
    expectedOrigin,
    raw: safeSerialize(payload),
  };
}

function formatTemplateSource(
  source: TemplateSource | null | undefined,
): string {
  switch (source) {
    case "cache":
      return "cache";
    case "probe":
      return "probe";
    case "edm_save":
      return "edm save";
    default:
      return "unknown";
  }
}

function formatDiagnosticsValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "[]";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (value == null) {
    return "null";
  }
  if (typeof value === "object") {
    return safeSerialize(value) ?? "[object]";
  }
  return String(value);
}

function formatDiagnosticsRecord(
  record: Record<string, unknown> | null | undefined,
): string {
  if (!record) {
    return "(none)";
  }
  const entries = Object.entries(record);
  if (entries.length === 0) {
    return "(empty)";
  }
  return entries
    .map(([key, value]) => `${key}=${formatDiagnosticsValue(value)}`)
    .join(", ");
}

function parsePrintfulPricing(payload: unknown): PrintfulPricingDetails | null {
  const updatedAt = new Date().toISOString();
  const candidates = Array.isArray(payload) ? payload : [payload];
  for (const entry of candidates) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const totalCandidate =
      record.total ?? record.price ?? record.amount ?? record.subtotal;
    let amountCents: number | null = null;
    if (typeof totalCandidate === "number" && Number.isFinite(totalCandidate)) {
      amountCents =
        totalCandidate > 1000 && Number.isInteger(totalCandidate)
          ? Math.round(totalCandidate)
          : Math.round(totalCandidate * 100);
    } else if (typeof totalCandidate === "string") {
      const parsed = Number(totalCandidate);
      if (!Number.isNaN(parsed)) {
        amountCents =
          parsed > 1000 && Number.isInteger(parsed)
            ? Math.round(parsed)
            : Math.round(parsed * 100);
      }
    }
    const currency =
      typeof record.currency === "string" && record.currency.trim()
        ? record.currency
        : null;
    if (amountCents != null || currency) {
      return {
        amountCents,
        currency,
        source: "pricing_status",
        rawPayload: safeSerialize(payload),
        updatedAt,
      };
    }
  }
  return null;
}

function normalizeDesignStatus(
  payload: unknown,
  options: { expectedVariantId: number; detectVariantMismatch: boolean },
): DesignStatusSnapshot {
  const { expectedVariantId, detectVariantMismatch } = options;
  const at = new Date().toISOString();
  let designValid: boolean | null = null;
  let status: string | null = null;
  const blockingIssues: string[] = [];
  const warningMessages: string[] = [];
  let selectedVariantIds: number[] = [];

  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    if (typeof data.designValid === "boolean") {
      designValid = data.designValid;
    } else if (typeof data.isValid === "boolean") {
      designValid = data.isValid;
    }

    if (typeof data.status === "string") {
      status = data.status;
    } else if (typeof data.designStatus === "string") {
      status = data.designStatus;
    }

    const possibleErrors = Array.isArray(data.errors)
      ? data.errors
      : Array.isArray(data.blockingIssues)
        ? data.blockingIssues
        : [];
    for (const entry of possibleErrors) {
      if (typeof entry === "string") {
        blockingIssues.push(entry);
      } else if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        if (typeof record.message === "string") {
          blockingIssues.push(record.message);
        } else if (
          typeof record.code === "string" ||
          typeof record.reason === "string"
        ) {
          blockingIssues.push(
            [record.code, record.reason].filter(Boolean).join(": "),
          );
        } else {
          const serialized = safeSerialize(record);
          if (serialized) {
            blockingIssues.push(serialized);
          }
        }
      }
    }

    const possibleWarnings = Array.isArray(data.warnings)
      ? data.warnings
      : [];
    for (const entry of possibleWarnings) {
      if (typeof entry === "string") {
        warningMessages.push(entry);
      } else if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        if (typeof record.message === "string") {
          warningMessages.push(record.message);
        }
      }
    }

    const variantCandidates =
      data.selectedVariantIds ??
      data.selected_variants ??
      data.selectedVariants ??
      data.variantIds ??
      data.selectedVariantId ??
      data.variantId;

    if (Array.isArray(variantCandidates)) {
      for (const candidate of variantCandidates) {
        if (typeof candidate === "number" && Number.isFinite(candidate)) {
          selectedVariantIds.push(candidate);
        } else if (typeof candidate === "string") {
          const parsed = Number(candidate);
          if (!Number.isNaN(parsed)) {
            selectedVariantIds.push(parsed);
          }
        }
      }
    } else if (typeof variantCandidates === "number") {
      selectedVariantIds.push(variantCandidates);
    } else if (typeof variantCandidates === "string") {
      const parsed = Number(variantCandidates);
      if (!Number.isNaN(parsed)) {
        selectedVariantIds.push(parsed);
      }
    }
  }

  const normalizedExpectedVariantId =
    typeof expectedVariantId === "number" && Number.isFinite(expectedVariantId)
      ? expectedVariantId
      : null;
  const uniqueVariants = Array.from(
    new Set(
      selectedVariantIds.filter(
        (variant) => typeof variant === "number" && Number.isFinite(variant),
      ),
    ),
  );
  const hasExpectedVariant =
    normalizedExpectedVariantId != null &&
    uniqueVariants.includes(normalizedExpectedVariantId);
  selectedVariantIds =
    normalizedExpectedVariantId != null
      ? [
          normalizedExpectedVariantId,
          ...uniqueVariants.filter(
            (variant) => variant !== normalizedExpectedVariantId,
          ),
        ]
      : uniqueVariants;

  const variantMismatch =
    detectVariantMismatch &&
    normalizedExpectedVariantId != null &&
    uniqueVariants.length > 0 &&
    !hasExpectedVariant;

  const guardrailMode: GuardrailMode =
    typeof designValid === "boolean" ||
    blockingIssues.length > 0 ||
    warningMessages.length > 0
      ? "printful"
      : "snapcase";

  return {
    at,
    designValid,
    status,
    blockingIssues,
    warningMessages,
    rawPayload: safeSerialize(payload),
    selectedVariantIds,
    variantMismatch,
    guardrailMode,
  };
}

function buildErrorSummaries(
  snapshot: DesignStatusSnapshot | null,
): EdmAnalyticsBasePayload["errorSummaries"] {
  return {
    blockingIssues: snapshot?.blockingIssues ?? [],
    warningMessages: snapshot?.warningMessages ?? [],
  };
}

function createEdmAnalyticsBasePayload(
  variantId: number,
  snapshot: DesignStatusSnapshot | null,
  timestampOverride?: string,
): EdmAnalyticsBasePayload {
  const timestamp =
    timestampOverride ?? snapshot?.at ?? new Date().toISOString();
  return {
    variantId,
    designValid: snapshot?.designValid ?? null,
    errorSummaries: buildErrorSummaries(snapshot),
    timestamp,
  };
}

export function EdmEditor({
  variantId,
  externalProductId,
  onTemplateSaved,
  onTemplateHydrated,
  onDesignStatusChange,
  onPricingChange,
}: EdmEditorProps): JSX.Element {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [forceInitProduct, setForceInitProduct] = useState(false);
  const [showSlowLoaderHint, setShowSlowLoaderHint] = useState(false);
  const [bootstrapPhase, setBootstrapPhase] =
    useState<BootstrapPhase>("idle");
  const [diagnostics, setDiagnostics] = useState<EdmDiagnostics | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const designerRef = useRef<PFDesignMakerInstance | null>(null);
  const latestDesignSnapshotRef = useRef<DesignStatusSnapshot | null>(null);
  const onTemplateSavedRef =
    useRef<EdmEditorProps["onTemplateSaved"] | null>(null);
  const onTemplateHydratedRef =
    useRef<EdmEditorProps["onTemplateHydrated"] | null>(null);
  const onDesignStatusChangeRef =
    useRef<EdmEditorProps["onDesignStatusChange"] | null>(null);
  const onPricingChangeRef =
    useRef<EdmEditorProps["onPricingChange"] | null>(null);
  const templateTelemetry = useMemo(() => {
    const mode =
      templateId != null
        ? "edit"
        : diagnostics?.templateMode ?? "unknown";
    const fallbackSource =
      (diagnostics?.templateCacheHit || Boolean(templateId)) && !diagnostics?.templateSource
        ? "cache"
        : "none";
    const source = diagnostics?.templateSource ?? fallbackSource;
    const initProduct =
      diagnostics && typeof diagnostics.initProductUsed === "boolean"
        ? diagnostics.initProductUsed
        : false;
    const activeTemplateId =
      diagnostics?.activeTemplateId ?? (templateId ?? null);

    return {
      mode,
      source,
      initProduct,
      activeTemplateId,
    };
  }, [diagnostics, templateId]);

  const canvasId = useMemo(
    () => `snapcase-edm-canvas-${variantId}`,
    [variantId],
  );

  const loaderMessage = useMemo(() => {
    switch (bootstrapPhase) {
      case "probing-template":
        return "Checking Printful template status...";
      case "loading-script":
        return "Loading the Printful designer...";
      case "requesting-nonce":
        return "Requesting a fresh Printful nonce...";
      case "initializing-designer":
        return "Initializing the Printful designer...";
      default:
        return "Preparing Printful designer...";
    }
  }, [bootstrapPhase]);

  const getAnalyticsBasePayload = useCallback(
    (
      snapshot?: DesignStatusSnapshot | null,
      timestamp?: string,
    ): EdmAnalyticsBasePayload => {
      return createEdmAnalyticsBasePayload(
        variantId,
        snapshot ?? latestDesignSnapshotRef.current,
        timestamp,
      );
    },
    [variantId],
  );

  const debug = useCallback((message: string, extra?: unknown) => {
    if (typeof window === "undefined") {
      return;
    }
    if (!window.__snapcaseTestHooks) {
      return;
    }
    // eslint-disable-next-line no-console
    console.log("[edm-test]", message, extra ?? "");
  }, []);

  useEffect(() => {
    onTemplateSavedRef.current = onTemplateSaved;
  }, [onTemplateSaved]);

  useEffect(() => {
    onTemplateHydratedRef.current = onTemplateHydrated;
  }, [onTemplateHydrated]);

  useEffect(() => {
    onDesignStatusChangeRef.current = onDesignStatusChange;
  }, [onDesignStatusChange]);

  useEffect(() => {
    onPricingChangeRef.current = onPricingChange;
  }, [onPricingChange]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const cached = getCachedTemplate(externalProductId);
    if (cached?.templateId) {
      setTemplateId(cached.templateId);
      return;
    }
    setTemplateId(null);
  }, [externalProductId]);

  useEffect(() => {
    onPricingChangeRef.current?.(null);
  }, [variantId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      // Uses getAnalyticsBasePayload inside; memoized helper lives in deps.
      const shouldForceInit = forceInitProduct;
      setStatus("loading");
      setBootstrapPhase("probing-template");
      setError(null);
      const catalogEntry = findPrintfulCatalogEntry(externalProductId);
      const designerVariantId =
        typeof catalogEntry?.catalogVariantId === "number" &&
        Number.isFinite(catalogEntry.catalogVariantId)
          ? catalogEntry.catalogVariantId
          : catalogEntry?.defaultVariantId ?? variantId;
      const baseDiagnostics = captureDiagnosticsContext(
        designerVariantId,
        externalProductId,
      );
      setDiagnostics(
        baseDiagnostics
          ? {
              ...baseDiagnostics,
              forcedInitProduct: shouldForceInit,
            }
          : baseDiagnostics,
      );

      let printfulProductId = catalogEntry?.printfulProductId ?? null;
      debug("bootstrap:start", {
        variantId,
        designerVariantId,
        externalProductId,
        retryToken,
        forceInitProduct: shouldForceInit,
      });
      if (catalogEntry?.retailPriceCents) {
        onPricingChangeRef.current?.({
          amountCents: catalogEntry.retailPriceCents,
          currency: catalogEntry.currency,
          source: "catalog",
          rawPayload: null,
          updatedAt: new Date().toISOString(),
        });
      }
      const cachedTemplate = getCachedTemplate(externalProductId);
      const cacheHit = Boolean(cachedTemplate?.templateId);
      let templateIdForDesigner = cachedTemplate?.templateId ?? null;
      let templateMode: TemplateMode = templateIdForDesigner ? "edit" : "unknown";
      let templateSource: TemplateSource = templateIdForDesigner ? "cache" : null;
      let templateIdFromProbe: string | null = null;
      let templateProbeError: string | null = null;
      let templateProbeCompletedAt: string | null = null;
      let requiresInitProduct = shouldForceInit;

      if (cacheHit) {
        setDiagnostics((prev) => {
          const base = prev ?? baseDiagnostics;
          if (!base) {
            return prev;
          }
          return {
            ...base,
            templateCacheHit: true,
            templateIdFromCache: cachedTemplate?.templateId ?? null,
            cacheHydratedAt: new Date().toISOString(),
            templateMode,
            templateSource,
            activeTemplateId: templateIdForDesigner,
            printfulProductId,
          };
        });
      }

      try {
        debug("bootstrap:probe:start", { externalProductId });
        const response = await fetch(
          `/api/edm/templates/${encodeURIComponent(externalProductId)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            credentials: "same-origin",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          const details = await response.json().catch(() => null);
          const message =
            (details?.error as string | undefined) ??
            "Unable to verify Printful template status.";
          throw new Error(message);
        }

        const payload = (await response.json()) as TemplateProbeResponse;
        templateProbeCompletedAt = new Date().toISOString();
        printfulProductId =
          payload.printfulProductId ?? printfulProductId ?? null;
        debug("bootstrap:probe:complete", {
          externalProductId,
          printfulProductId,
          exists: payload.template?.exists,
          templateId: payload.template?.templateId,
        });

        const exists = Boolean(payload.template?.exists);
        const remoteTemplateId =
          payload.template?.templateId != null
            ? String(payload.template.templateId)
            : null;

        if (exists && !shouldForceInit) {
          if (!remoteTemplateId) {
            throw new Error(
              "Printful reported an existing template but omitted the templateId.",
            );
          }
          templateIdFromProbe = remoteTemplateId;
          templateIdForDesigner = remoteTemplateId;
          templateMode = "edit";
          templateSource = "probe";
          upsertTemplateCache({
            externalProductId,
            templateId: remoteTemplateId,
            source: "probe",
          });
        } else {
          templateMode = "create";
          templateSource = "probe";
          templateIdForDesigner = null;
          requiresInitProduct = true;
        }
      } catch (probeError) {
        templateProbeError =
          probeError instanceof Error
            ? probeError.message
            : "Unable to validate Printful template availability.";
        templateProbeCompletedAt = new Date().toISOString();

        if (!templateIdForDesigner) {
          if (cancelled) {
            return;
          }
          setStatus("error");
          if (!cancelled) {
            setBootstrapPhase("idle");
          }
          setError(templateProbeError);
          setDiagnostics((prev) => {
            const base =
              prev ??
              captureDiagnosticsContext(designerVariantId, externalProductId);
            if (!base) {
              return prev;
            }
            return {
              ...base,
              lastErrorMessage: templateProbeError,
              lastErrorEvent: "template_probe_failed",
              templateProbeError,
              templateProbeCompletedAt,
              errorCapturedAt: new Date().toISOString(),
            };
          });
          return;
        }
      }

      if (cancelled) {
        return;
      }
      setDiagnostics((prev) => {
        const base = prev ?? baseDiagnostics;
        if (!base) {
          return prev;
        }
        return {
          ...base,
          templateMode,
          templateSource,
          templateCacheHit: cacheHit,
          templateIdFromCache: cachedTemplate?.templateId ?? null,
          templateIdFromProbe,
          activeTemplateId: templateIdForDesigner,
          templateProbeCompletedAt,
          templateProbeError,
          printfulProductId,
          initProductUsed: requiresInitProduct && Boolean(printfulProductId),
          forcedInitProduct: shouldForceInit || base.forcedInitProduct || false,
        };
      });
      if (templateIdForDesigner) {
        setTemplateId(templateIdForDesigner);
        onTemplateHydratedRef.current?.({
          templateId: templateIdForDesigner,
          variantId: designerVariantId,
          source: templateSource ?? null,
        });
      }

      if (requiresInitProduct && !printfulProductId) {
        if (cancelled) {
          return;
        }
        const message =
          "No Printful catalog mapping found; cannot launch EDM create mode.";
        setStatus("error");
        if (!cancelled) {
          setBootstrapPhase("idle");
        }
        setError(message);
        debug("bootstrap:missing-catalog", { externalProductId });
        setDiagnostics((prev) => {
          const base =
            prev ??
            captureDiagnosticsContext(designerVariantId, externalProductId);
          if (!base) {
            return prev;
          }
          return {
            ...base,
            lastErrorMessage: message,
            lastErrorEvent: "catalog_lookup_failed",
            errorCapturedAt: new Date().toISOString(),
          };
        });
        return;
      }

      const {
        diagnostics: configSnapshot,
        hooks: configHooks,
        ...designerOptions
      } = buildPrintfulConfig({
        variantId: designerVariantId,
        printfulProductId,
        shouldInitProduct: Boolean(requiresInitProduct && printfulProductId),
        technique: PRINTFUL_DEFAULT_TECHNIQUE,
        lockVariant: true,
        theme: SNAPCASE_EMBED_THEME,
        hooks: {
          onDesignStatusUpdate: (payload: unknown) => {
            debug("design-status:update", payload);
            logAnalyticsEvent("printful_design_status_raw", {
              variantId: designerVariantId,
              externalProductId,
              payload,
            });
          },
          onPricingStatusUpdate: (payload: unknown) => {
            debug("pricing-status:update", payload);
            logAnalyticsEvent("printful_pricing_status_raw", {
              variantId: designerVariantId,
              externalProductId,
              payload,
            });
          },
        },
      });
      setDiagnostics((prev) => {
        const base = prev ?? baseDiagnostics;
        if (!base) {
          return prev;
        }
        return {
          ...base,
          configSnapshot,
        };
      });

      logAnalyticsEvent("edm_variant_locked", {
        ...getAnalyticsBasePayload(),
        lockFlags: configSnapshot.variantLockFlags,
        lockEnabled: configSnapshot.variantLockEnabled,
        externalProductId,
        lockedVariantId: designerVariantId,
      });

      if (cancelled) {
        return;
      }
      setBootstrapPhase("loading-script");
      setDiagnostics((prev) => {
        const base = prev ?? baseDiagnostics;
        if (!base) {
          return prev;
        }
        return {
          ...base,
          scriptLoadStartedAt: new Date().toISOString(),
          scriptLoadCompletedAt: null,
          scriptLoadFailedAt: null,
        };
      });
      try {
        debug("bootstrap:script:load");
        await ensureEdmScript();
        setDiagnostics((prev) => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            scriptLoadCompletedAt: new Date().toISOString(),
          };
        });
      } catch (scriptError) {
        if (cancelled) {
          return;
        }
        setStatus("error");
        if (!cancelled) {
          setBootstrapPhase("idle");
        }
        const message =
          scriptError instanceof Error
            ? scriptError.message
            : "Unable to load the Printful designer script.";
        setError(message);
        setDiagnostics((prev) => {
          const base =
            prev ??
            captureDiagnosticsContext(designerVariantId, externalProductId);
          if (!base) {
            return prev;
          }
          return {
            ...base,
            lastErrorMessage: message,
            lastErrorEvent: "script_load_failed",
            errorCapturedAt: new Date().toISOString(),
            scriptLoadFailedAt: new Date().toISOString(),
          };
        });
        return;
      }

      if (cancelled) {
        return;
      }

      let nonce: string | null = null;
      let expiresAt: number | null = null;
      if (cancelled) {
        return;
      }
      setBootstrapPhase("requesting-nonce");

      try {
        const response = await fetch("/api/edm/nonce", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            externalProductId,
          }),
          credentials: "same-origin",
        });

        if (!response.ok) {
          const details = await response.json().catch(() => null);
          throw new Error(
            details?.error ??
              "Printful nonce request failed. Try again in a moment.",
          );
        }

        const payload = (await response.json()) as {
          nonce?: string;
          expiresAt?: number | null;
        };

        nonce = payload?.nonce ?? null;
        expiresAt = payload?.expiresAt ?? null;

        if (!nonce) {
          throw new Error("Nonce missing from Printful response.");
        }
        setDiagnostics((prev) => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            nonce,
            nonceExpiresAt: expiresAt
              ? new Date(expiresAt * 1000).toISOString()
              : null,
          };
        });
      } catch (nonceError) {
        if (cancelled) {
          return;
        }
        setStatus("error");
        if (!cancelled) {
          setBootstrapPhase("idle");
        }
        const message =
          nonceError instanceof Error
            ? nonceError.message
            : "Failed to request a Printful nonce.";
        setError(message);
        setDiagnostics((prev) => {
          const base =
            prev ??
            captureDiagnosticsContext(designerVariantId, externalProductId);
          if (!base) {
            return prev;
          }
          return {
            ...base,
            lastErrorMessage: message,
            lastErrorEvent: "nonce_request_failed",
            errorCapturedAt: new Date().toISOString(),
          };
        });
        return;
      }

      if (cancelled) {
        return;
      }

      const PFConstructor = window.PFDesignMaker;
      if (!PFConstructor) {
        setStatus("error");
        setError("Printful designer is unavailable in this environment.");
        setDiagnostics((prev) => {
          const base =
            prev ??
            captureDiagnosticsContext(designerVariantId, externalProductId);
          if (!base) {
            return prev;
          }
          return {
            ...base,
            lastErrorMessage:
              "Printful designer is unavailable in this environment.",
            lastErrorEvent: "pf_constructor_missing",
            errorCapturedAt: new Date().toISOString(),
          };
        });
        return;
      }

      debug("bootstrap:pf-constructor:ready", {
        hasCanvas: Boolean(containerRef.current),
      });
      const pfOptions = {
        elemId: canvasId,
        nonce,
        externalProductId,
        templateId: templateIdForDesigner ?? undefined,
        ...designerOptions,
        onTemplateSaved: (payload: unknown) => {
          const resolved = resolveTemplateId(payload);
          if (!resolved) {
            return;
          }
          const previewUrl = resolveDesignPreviewUrl(payload);
          setTemplateId(resolved);
          upsertTemplateCache({
            externalProductId,
            templateId: resolved,
            source: "edm_save",
          });
          setDiagnostics((prev) => {
            if (!prev) {
              return prev;
            }
            return {
              ...prev,
              templateMode: "edit",
              templateSource: "edm_save",
              activeTemplateId: resolved,
              templateIdFromCache: resolved,
              templateCacheHit: true,
            };
          });
          logAnalyticsEvent("edm_template_saved", {
            ...getAnalyticsBasePayload(),
            templateId: resolved,
            externalProductId,
          });
          const resolvedVariantId =
            latestDesignSnapshotRef.current?.selectedVariantIds?.[0] ??
            designerVariantId;
          onTemplateSavedRef.current?.({
            templateId: resolved,
            variantId: resolvedVariantId,
            previewUrl,
          });
        },
        onDesignStatusUpdate: (payload: unknown) => {
          if (cancelled) {
            return;
          }
          configHooks.onDesignStatusUpdate(payload);
          const snapshot = normalizeDesignStatus(payload, {
            expectedVariantId: designerVariantId,
            detectVariantMismatch: true,
          });
          latestDesignSnapshotRef.current = snapshot;
          const guardrailSnapshot: EdmGuardrailSnapshot = {
            designValid: snapshot.designValid,
            blockingIssues: snapshot.blockingIssues,
            warningMessages: snapshot.warningMessages,
            selectedVariantIds: snapshot.selectedVariantIds,
            variantMismatch: snapshot.variantMismatch,
            guardrailMode: snapshot.guardrailMode,
            updatedAt: snapshot.at,
            rawPayload: snapshot.rawPayload,
          };
          onDesignStatusChangeRef.current?.(guardrailSnapshot);
          const analyticsBase = getAnalyticsBasePayload(snapshot, snapshot.at);
          logAnalyticsEvent("edm_design_status", {
            ...analyticsBase,
            guardrailMode: snapshot.guardrailMode,
            blockingIssues: snapshot.blockingIssues,
            warningMessages: snapshot.warningMessages,
            selectedVariantIds: snapshot.selectedVariantIds,
            variantMismatch: snapshot.variantMismatch,
          });
          logAnalyticsEvent("edm_guardrail_summary_update", {
            variantId,
            guardrailMode: guardrailSnapshot.guardrailMode,
            designValid: guardrailSnapshot.designValid,
            blockingIssues: guardrailSnapshot.blockingIssues.length,
            warningCount: guardrailSnapshot.warningMessages.length,
            variantMismatch: guardrailSnapshot.variantMismatch,
          });
          if (snapshot.blockingIssues.length > 0) {
            logAnalyticsEvent("edm_guardrail_blocked", {
              ...analyticsBase,
              blockingIssues: snapshot.blockingIssues,
            });
          } else if (snapshot.warningMessages.length > 0) {
            logAnalyticsEvent("edm_guardrail_warning", {
              ...analyticsBase,
              warningMessages: snapshot.warningMessages,
            });
          }
          setDiagnostics((prev) => {
            if (!prev) {
              return prev;
            }
            return {
              ...prev,
              guardrailMode: snapshot.guardrailMode,
              designStatus: snapshot,
            };
          });
        },
        onPricingStatusUpdate: (payload: unknown) => {
          if (cancelled) {
            return;
          }
          configHooks.onPricingStatusUpdate(payload);
          const parsedPricing = parsePrintfulPricing(payload);
          if (parsedPricing) {
            onPricingChangeRef.current?.(parsedPricing);
          }
          logAnalyticsEvent("edm_pricing_update", {
            ...getAnalyticsBasePayload(),
            pricingPayload: payload,
          });
        },
        onError: (payload: unknown) => {
          if (cancelled) {
            return;
          }
          const details = analyzePrintfulError(payload);
          const templateMissingMessage =
            typeof details.message === "string" &&
            details.message.toLowerCase().includes("template not found");
          const canForceCreate =
            templateMissingMessage &&
            !shouldForceInit &&
            !requiresInitProduct &&
            Boolean(printfulProductId);
          if (canForceCreate) {
            setDiagnostics((prev) => {
              if (!prev) {
                return prev;
              }
              return {
                ...prev,
                forcedInitProduct: true,
                lastErrorMessage: details.message ?? prev.lastErrorMessage,
                lastErrorEvent: details.event ?? "printful_error",
                errorCapturedAt: new Date().toISOString(),
              };
            });
            setForceInitProduct(true);
            setRetryToken((token) => token + 1);
            return;
          }
          const fallbackMessage =
            details.message ??
            (details.event === "invalidOrigin"
              ? "Printful rejected this origin. Send the diagnostics below with your escalation."
              : "The Printful service reported an unexpected error. See diagnostics below.");
          setStatus("error");
          setError(fallbackMessage);
          setDiagnostics((prev) => {
            const base =
              prev ??
              captureDiagnosticsContext(designerVariantId, externalProductId);
            if (!base) {
              return prev;
            }
            return {
              ...base,
              lastErrorMessage: fallbackMessage,
              lastErrorEvent: details.event ?? "printful_error",
              rawErrorPayload: details.raw ?? base.rawErrorPayload ?? null,
              reportedOrigin: details.origin ?? base.reportedOrigin ?? null,
              expectedOrigin:
                details.expectedOrigin ?? base.expectedOrigin ?? null,
              errorCapturedAt: new Date().toISOString(),
            };
          });
          // eslint-disable-next-line no-console
          console.error("Snapcase EDM error", {
            event: details.event,
            message: details.message,
            origin: details.origin,
            expectedOrigin: details.expectedOrigin,
            raw: details.raw,
          });
        },
      };

      const testHooks =
        typeof window !== "undefined" && window.__snapcaseTestHooks
          ? window.__snapcaseTestHooks
          : null;
      if (testHooks && typeof testHooks === "object") {
        testHooks.lastInit = pfOptions;
        testHooks.triggerTemplateSaved = (templateId?: string) => {
          pfOptions.onTemplateSaved?.({
            templateId: templateId ?? "999000",
          });
        };
        testHooks.triggerDesignStatusUpdate = (payload?: unknown) => {
          pfOptions.onDesignStatusUpdate?.(payload);
        };
        testHooks.triggerPricingStatusUpdate = (payload?: unknown) => {
          pfOptions.onPricingStatusUpdate?.(payload);
        };
      }

      if (designerRef.current?.destroy) {
        designerRef.current.destroy();
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }

      if (cancelled) {
        return;
      }
      setBootstrapPhase("initializing-designer");

      try {
        designerRef.current = new PFConstructor(pfOptions);

        if (!cancelled) {
          if (shouldForceInit) {
            setForceInitProduct(false);
          }
          setStatus("ready");
          setBootstrapPhase("idle");
          if (expiresAt) {
            const normalized = new Date(expiresAt * 1000);
            // Store expiry for potential future debugging display.
            containerRef.current?.setAttribute(
              "data-nonce-expires",
              normalized.toISOString(),
            );
          }
        }
      } catch (initError) {
        if (cancelled) {
          return;
        }
        setStatus("error");
        setBootstrapPhase("idle");
        setError(
          initError instanceof Error
            ? initError.message
            : "Failed to initialize Printful designer.",
        );
      }
    }

    bootstrap();

    const cleanupDesigner = designerRef.current;
    const cleanupContainer = containerRef.current;

    return () => {
      cancelled = true;
      if (cleanupDesigner?.destroy) {
        cleanupDesigner.destroy();
      }
      designerRef.current = null;
      if (cleanupContainer) {
        cleanupContainer.innerHTML = "";
      }
    };
  }, [
    externalProductId,
    canvasId,
    variantId,
    retryToken,
    forceInitProduct,
    getAnalyticsBasePayload,
    debug,
  ]);

  const handleRetry = () => {
    setTemplateId(null);
    setRetryToken((token) => token + 1);
    setDiagnostics(null);
    setError(null);
    setBootstrapPhase("idle");
    setForceInitProduct(false);
    onDesignStatusChangeRef.current?.(null);
  };

  useEffect(() => {
    if (status !== "loading") {
      setShowSlowLoaderHint(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowSlowLoaderHint(true);
    }, 7000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [status]);

  const isLoading = status === "loading";
  const hasError = status === "error";
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleMessage = (event: MessageEvent) => {
      if (!event || !event.data || typeof event.data !== "object") {
        return;
      }

      const maybeEvent = (event.data as { event?: unknown }).event;
      if (typeof maybeEvent !== "string") {
        return;
      }

      const normalized = maybeEvent.toLowerCase();
      if (
        !normalized.includes("invalid") &&
        !normalized.includes("error")
      ) {
        return;
      }

      setDiagnostics((prev) => {
        if (!prev) {
          return prev;
        }

        const entry = {
          at: new Date().toISOString(),
          event: maybeEvent,
          origin: event.origin ?? null,
        };

        const history = [...prev.messageEvents, entry];
        const recent = history.slice(-6);

        return {
          ...prev,
          messageEvents: recent,
        };
      });
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <span
        data-testid="edm-template-state"
        data-template-mode={templateTelemetry.mode}
        data-template-source={templateTelemetry.source ?? "none"}
        data-init-product={templateTelemetry.initProduct ? "true" : "false"}
        data-template-id={templateTelemetry.activeTemplateId ?? ""}
        hidden
      />

      <div
        className="relative w-full overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
        data-testid="edm-designer-shell"
      >
        <div
          className="absolute left-0 top-0 z-[3] h-14 w-[220px] rounded-br-3xl bg-white/85 shadow-sm ring-1 ring-gray-200/70 backdrop-blur-sm"
          aria-hidden="true"
          data-testid="printful-product-guard"
          title="Device locked. Product tab disabled."
        >
          <div className="flex h-full items-center gap-2 px-4 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
            <span className="h-2 w-2 rounded-full bg-gray-900" aria-hidden="true" />
            <span>Device locked</span>
          </div>
        </div>
        <div
          id={canvasId}
          ref={containerRef}
          className="h-[min(90vh,900px)] min-h-[640px] w-full bg-gray-900/5"
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-14 bg-gradient-to-b from-white via-white/90 to-transparent"
          aria-hidden="true"
          data-testid="printful-picker-mask"
        />
        {isLoading ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85 text-sm text-gray-700"
            aria-live="polite"
          >
            <span
              aria-hidden="true"
              className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"
            />
            <span>{loaderMessage}</span>
            {showSlowLoaderHint ? (
              <span className="max-w-[280px] text-center text-xs text-gray-500">
                This is taking longer than usual. Printful keeps your progress once
                the designer finishes loading.
              </span>
            ) : null}
          </div>
        ) : null}
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/95 p-6 text-center text-sm text-gray-700">
            <p className="text-base font-semibold text-gray-900">
              We couldn&apos;t load the designer.
            </p>
            <p className="text-xs text-gray-500">
              {error ??
                "The Printful service did not respond. Please retry in a moment."}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-full border border-gray-900 px-4 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-900 hover:text-white"
            >
              Try again
            </button>
          </div>
        ) : null}
      </div>

      {templateId ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-900">Last saved template</p>
          <p className="mt-2 break-all font-mono text-xs text-gray-700">
            {templateId}
          </p>
        </div>
      ) : null}

      {hasError ? (
        <div
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          data-testid="edm-offline-banner"
        >
          <p className="font-semibold">Printful designer is offline</p>
          <p className="mt-1 text-amber-800">
            Retry in a moment or capture diagnostics below if Printful continues
            to block the editor.
          </p>
        </div>
      ) : null}
      {hasError && diagnostics ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-xs text-gray-700">
          <p className="text-sm font-semibold text-gray-900">
            Debug details for Printful
          </p>
          <dl className="mt-3 grid gap-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">Origin</dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.requestOrigin}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">Referer</dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.referer && diagnostics.referer.trim()
                  ? diagnostics.referer
                  : "(none)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                External product
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.externalProductId}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Printful product
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.printfulProductId ?? "(unknown)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Template mode
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.templateMode
                  ? `${diagnostics.templateMode} mode${
                      diagnostics.templateSource
                        ? ` via ${formatTemplateSource(diagnostics.templateSource)}`
                        : ""
                    }`
                  : "unknown"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Template cache
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.templateCacheHit
                  ? diagnostics.templateSource === "cache"
                    ? "cache hit (used cached template)"
                    : `cache hit (${formatTemplateSource(diagnostics.templateSource)} superseded)`
                  : "no cache entry"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Active template
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.activeTemplateId ?? "(none)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Template ID (probe)
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.templateIdFromProbe ?? "(none)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Template ID (cache)
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.templateIdFromCache ?? "(none)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Template probe
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.templateProbeError
                  ? `failed: ${diagnostics.templateProbeError}`
                  : diagnostics.templateProbeCompletedAt
                    ? `ok @ ${diagnostics.templateProbeCompletedAt}`
                    : "(not run)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Init product
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.initProductUsed
                  ? diagnostics.forcedInitProduct
                    ? "enabled (forced fallback)"
                    : "enabled (template missing)"
                  : diagnostics.forcedInitProduct
                    ? "forced pending retry"
                    : "not requested"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Variant lock
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.configSnapshot
                  ? diagnostics.configSnapshot.variantLockEnabled
                    ? `enabled (${formatDiagnosticsRecord(diagnostics.configSnapshot.variantLockFlags as Record<string, unknown>)})`
                    : "disabled"
                  : "(snapshot unavailable)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                featureConfig
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.configSnapshot
                  ? formatDiagnosticsRecord(diagnostics.configSnapshot.featureConfig)
                  : "(snapshot unavailable)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Disabled tools
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.configSnapshot
                  ? formatDiagnosticsValue(diagnostics.configSnapshot.disabledTools)
                  : "(snapshot unavailable)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Theme tokens
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.configSnapshot
                  ? formatDiagnosticsRecord(diagnostics.configSnapshot.styleVariables)
                  : "(snapshot unavailable)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Nav overrides
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.configSnapshot
                  ? formatDiagnosticsRecord(diagnostics.configSnapshot.navigationOverrides)
                  : "(snapshot unavailable)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Confirmation UX
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.configSnapshot
                  ? diagnostics.configSnapshot.useUserConfirmationErrors
                    ? "Printful confirmation modals"
                    : "SnapCase guardrails only"
                  : "(snapshot unavailable)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">Theme</dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.configSnapshot?.themeName ?? "(default)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Design status
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.designStatus
                  ? `${diagnostics.designStatus.designValid === false ? "blocked" : diagnostics.designStatus.designValid ? "valid" : "unknown"}${diagnostics.designStatus.status ? ` (${diagnostics.designStatus.status})` : ""} @ ${diagnostics.designStatus.at}`
                  : "(no status yet)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Guardrail mode
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.guardrailMode ?? "(unknown)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Script load
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.scriptLoadFailedAt
                  ? `failed @ ${diagnostics.scriptLoadFailedAt}`
                  : diagnostics.scriptLoadCompletedAt
                    ? `ok @ ${diagnostics.scriptLoadCompletedAt}`
                    : diagnostics.scriptLoadStartedAt
                      ? `started @ ${diagnostics.scriptLoadStartedAt}`
                      : "(not requested)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">Nonce</dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.nonce ?? "(missing)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Nonce expires
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.nonceExpiresAt ?? "(unknown)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">Last event</dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.lastErrorEvent ?? "(none)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Reported origin
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.reportedOrigin ?? "(not provided)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Expected origin
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.expectedOrigin ?? "(not provided)"}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <dt className="font-medium text-gray-800 sm:w-40">
                Logged at
              </dt>
              <dd className="font-mono text-[11px] text-gray-700">
                {diagnostics.errorCapturedAt ?? diagnostics.requestedAt}
              </dd>
            </div>
          </dl>
          {diagnostics.messageEvents.length > 0 ? (
            <details className="mt-3">
              <summary className="cursor-pointer font-medium text-gray-800">
                Recent postMessage events
              </summary>
              <ul className="mt-2 space-y-1 rounded-lg bg-gray-50 p-2 text-[11px] font-mono leading-tight text-gray-700">
                {diagnostics.messageEvents.map((item) => (
                  <li key={`${item.at}-${item.event}`}>
                    [{item.at}] {item.event} (origin: {item.origin ?? "n/a"})
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          {diagnostics.designStatus?.blockingIssues?.length ? (
            <details className="mt-3">
              <summary className="cursor-pointer font-medium text-gray-800">
                Printful blocking issues
              </summary>
              <ul className="mt-2 space-y-1 rounded-lg bg-gray-50 p-2 text-[11px] font-mono leading-tight text-gray-700">
                {diagnostics.designStatus.blockingIssues.map((issue, index) => (
                  <li key={`${issue}-${index}`}>{issue}</li>
                ))}
              </ul>
            </details>
          ) : null}
          {diagnostics.designStatus?.warningMessages?.length ? (
            <details className="mt-3">
              <summary className="cursor-pointer font-medium text-gray-800">
                Printful warnings
              </summary>
              <ul className="mt-2 space-y-1 rounded-lg bg-gray-50 p-2 text-[11px] font-mono leading-tight text-gray-700">
                {diagnostics.designStatus.warningMessages.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            </details>
          ) : null}
          {diagnostics.designStatus?.rawPayload ? (
            <details className="mt-3">
              <summary className="cursor-pointer font-medium text-gray-800">
                Raw design status payload
              </summary>
              <pre className="mt-2 max-h-64 overflow-x-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-2 text-[11px] leading-tight text-gray-700">
                {diagnostics.designStatus.rawPayload}
              </pre>
            </details>
          ) : null}
          {diagnostics.rawErrorPayload ? (
            <details className="mt-3">
              <summary className="cursor-pointer font-medium text-gray-800">
                Raw Printful payload
              </summary>
              <pre className="mt-2 max-h-64 overflow-x-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-2 text-[11px] leading-tight text-gray-700">
                {diagnostics.rawErrorPayload}
              </pre>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default EdmEditor;
