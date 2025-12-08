type AnalyticsPayload = Record<string, unknown>;
type AnalyticsSink = "console" | "segment";

interface AnalyticsConfig {
  sink: AnalyticsSink;
  sampleRate: number;
  segmentWriteKey?: string;
  previewOnly: boolean;
  templateSalt: string;
}

interface SegmentPreviewEvent {
  event: string;
  properties: AnalyticsPayload;
  timestamp: string;
}

declare global {
  interface Window {
    analytics?: { track: (event: string, properties?: AnalyticsPayload) => void };
    __snapcaseAnalyticsEvents?: Array<{
      name: string;
      payload: AnalyticsPayload;
    }>;
    __snapcaseSegmentPreview?: SegmentPreviewEvent[];
  }
}

let analyticsBuffersInitialized = false;

function normalizeEnvValue(value?: string | null): string | undefined {
  if (value == null) {
    return undefined;
  }
  const cleaned = value
    .replace(/\r?\n/g, "")
    .replace(/\\n/g, "")
    .replace(/"/g, "")
    .trim();
  return cleaned.length === 0 ? undefined : cleaned;
}

const resolvedSink = (() => {
  const sink = normalizeEnvValue(process.env.NEXT_PUBLIC_ANALYTICS_SINK);
  return sink === "segment" || sink === "console" ? sink : undefined;
})();

const previewFlag = normalizeEnvValue(
  process.env.NEXT_PUBLIC_SEGMENT_PREVIEW_ONLY,
);

const analyticsConfig: AnalyticsConfig = {
  sink: (resolvedSink as AnalyticsSink | undefined) ?? "console",
  sampleRate: clampSampleRate(
    Number.parseFloat(
      normalizeEnvValue(process.env.NEXT_PUBLIC_ANALYTICS_SAMPLE_RATE) ?? "1",
    ),
  ),
  segmentWriteKey: normalizeEnvValue(process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY),
  previewOnly:
    previewFlag === "1" || previewFlag?.toLowerCase() === "true" || false,
  templateSalt:
    normalizeEnvValue(process.env.NEXT_PUBLIC_ANALYTICS_TEMPLATE_SALT) ??
    "snapcase-dev",
};

function clampSampleRate(value: number): number {
  if (Number.isNaN(value) || value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
}

export function initializeAnalyticsBuffers(): void {
  if (typeof window === "undefined") {
    return;
  }
  if (
    analyticsBuffersInitialized &&
    Array.isArray(window.__snapcaseAnalyticsEvents) &&
    Array.isArray(window.__snapcaseSegmentPreview)
  ) {
    return;
  }
  if (!Array.isArray(window.__snapcaseAnalyticsEvents)) {
    window.__snapcaseAnalyticsEvents = [];
  }
  if (!Array.isArray(window.__snapcaseSegmentPreview)) {
    window.__snapcaseSegmentPreview = [];
  }
  analyticsBuffersInitialized = true;
}

function recordClientEvent(name: string, payload: AnalyticsPayload): void {
  if (typeof window === "undefined") {
    return;
  }
  initializeAnalyticsBuffers();
  window.__snapcaseAnalyticsEvents!.push({ name, payload });
}

function recordSegmentPreview(event: SegmentPreviewEvent): void {
  if (typeof window === "undefined") {
    return;
  }
  initializeAnalyticsBuffers();
  window.__snapcaseSegmentPreview!.push(event);
}

function shouldForwardExternally(): boolean {
  if (analyticsConfig.sink === "console") {
    return false;
  }
  if (analyticsConfig.sampleRate === 1) {
    return true;
  }
  return Math.random() < analyticsConfig.sampleRate;
}

function obfuscateIdentifier(raw: unknown): string | undefined {
  if (typeof raw !== "string" || raw.length === 0) {
    return undefined;
  }
  const salted = `${analyticsConfig.templateSalt}:${raw}`;
  let hash = 2166136261;
  for (let i = 0; i < salted.length; i += 1) {
    hash ^= salted.charCodeAt(i);
    // FNV-1a 32-bit
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }
  return `tpl_${(hash >>> 0).toString(16)}`;
}

function summarizePricing(pricingPayload: unknown): AnalyticsPayload | null {
  if (!Array.isArray(pricingPayload) || pricingPayload.length === 0) {
    return null;
  }
  const primary = pricingPayload[0] as Record<string, unknown>;
  const total = Number(primary["total"]);
  const currency =
    typeof primary["currency"] === "string" ? (primary["currency"] as string) : "";
  if (Number.isNaN(total) && !currency) {
    return null;
  }
  return {
    totalCents: Number.isNaN(total) ? undefined : Math.round(total * 100),
    currency,
    placements: Array.isArray(primary["placements"])
      ? (primary["placements"] as unknown[]).length
      : undefined,
  };
}

function sanitizePayloadForExport(
  name: string,
  payload: AnalyticsPayload,
): AnalyticsPayload {
  const errorSummaries = (payload["errorSummaries"] ??
    null) as Record<string, unknown> | null;
  const blockingList =
    (payload["blockingIssues"] as unknown[]) ||
    (errorSummaries?.["blockingIssues"] as unknown[]) ||
    [];
  const warningList =
    (payload["warningMessages"] as unknown[]) ||
    (errorSummaries?.["warningMessages"] as unknown[]) ||
    [];
  const blockingIssues = Array.isArray(blockingList) ? blockingList.length : 0;
  const warningMessages = Array.isArray(warningList) ? warningList.length : 0;

  const variantId = payload["variantId"];
  const selectedVariantIds = payload["selectedVariantIds"];
  const designValid = payload["designValid"];
  const externalProductId = payload["externalProductId"];
  const guardrailMode = payload["guardrailMode"];
  const timestamp = payload["timestamp"];
  const lockFlags = payload["lockFlags"];
  const templateId = payload["templateId"];
  const template_id = payload["template_id"];
  const pricingPayload = payload["pricingPayload"];

  const sanitized: AnalyticsPayload = {
    variantId: variantId ?? selectedVariantIds ?? null,
    designValid: designValid ?? null,
    externalProductId: externalProductId ?? undefined,
    guardrailBlockingCount: blockingIssues,
    guardrailWarningCount: warningMessages,
    guardrailMode: guardrailMode ?? undefined,
    timestamp: timestamp ?? new Date().toISOString(),
    schemaVersion: 1,
    event: name,
  };

  if (lockFlags && typeof lockFlags === "object") {
    sanitized.lockFlags = lockFlags;
  }

  if (typeof templateId === "string") {
    sanitized.templateFingerprint = obfuscateIdentifier(templateId);
  }
  if (typeof template_id === "string") {
    sanitized.templateFingerprint =
      sanitized.templateFingerprint ||
      obfuscateIdentifier(template_id);
  }

  if (pricingPayload) {
    const pricing = summarizePricing(pricingPayload);
    if (pricing) {
      sanitized.pricing = pricing;
    }
  }

  return sanitized;
}

function forwardToSegment(name: string, payload: AnalyticsPayload): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!analyticsConfig.segmentWriteKey) {
    if (analyticsConfig.previewOnly) {
      recordSegmentPreview({
        event: name,
        properties: payload,
        timestamp: new Date().toISOString(),
      });
    }
    return;
  }

  const sanitizedPayload = sanitizePayloadForExport(name, payload);

  if (typeof window.analytics?.track === "function") {
    window.analytics.track(name, sanitizedPayload);
    return;
  }

  if (analyticsConfig.previewOnly) {
    recordSegmentPreview({
      event: name,
      properties: sanitizedPayload,
      timestamp: new Date().toISOString(),
    });
  }
}

function forwardAnalyticsEvent(name: string, payload: AnalyticsPayload): void {
  if (!shouldForwardExternally()) {
    return;
  }
  if (analyticsConfig.sink === "segment") {
    forwardToSegment(name, payload);
  }
}

export function logAnalyticsEvent(
  name: string,
  payload: AnalyticsPayload,
): void {
  // Console logging stays as the always-on debug surface.
  console.log(`analytics.${name}`, payload);
  recordClientEvent(name, payload);
  forwardAnalyticsEvent(name, payload);
}
