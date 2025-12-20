export type DesignGuardrailSnapshot = {
  designValid: boolean | null;
  blockingIssues: string[];
  warningMessages: string[];
  reportedVariantIds: number[];
  selectedVariantIds: number[];
  variantMismatch: boolean;
  guardrailMode: "snapcase" | "printful";
  updatedAt: string;
  rawPayload: string | null;
};

export type DesignContext = {
  variantId: number | null;
  externalProductId: string | null;
  templateId: string | null;
  templateStoreId: string | null;
  templateStoredAt: number | null;
  exportedImage: string | null;
  designFileId: number | null;
  designFileUrl: string | null;
  variantLabel?: string | null;
  lastCheckoutAttemptAt: number | null;
  unitPriceCents: number | null;
  unitPriceCurrency: string | null;
  pricingSource: string | null;
  printfulProductId?: number | null;
  guardrailSnapshot: DesignGuardrailSnapshot | null;
  timestamp: number;
};

export const DESIGN_CONTEXT_STORAGE_KEY = "snapcase:design-context";

function createEmptyContext(): DesignContext {
  return {
    variantId: null,
    externalProductId: null,
    templateId: null,
    templateStoreId: null,
    templateStoredAt: null,
    exportedImage: null,
    designFileId: null,
    designFileUrl: null,
    variantLabel: null,
    lastCheckoutAttemptAt: null,
    unitPriceCents: null,
    unitPriceCurrency: null,
    pricingSource: null,
    printfulProductId: null,
    guardrailSnapshot: null,
    timestamp: Date.now(),
  };
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === "string");
}

function parseNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => {
      if (typeof entry === "number" && Number.isFinite(entry)) {
        return entry;
      }
      if (typeof entry === "string") {
        const parsed = Number(entry);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    })
    .filter((entry): entry is number => entry != null);
}

function parseGuardrailSnapshot(
  value: unknown,
): DesignGuardrailSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const guardrailMode =
    record.guardrailMode === "printful" || record.guardrailMode === "snapcase"
      ? record.guardrailMode
      : "snapcase";

  return {
    designValid:
      typeof record.designValid === "boolean" ? record.designValid : null,
    blockingIssues: parseStringArray(record.blockingIssues),
    warningMessages: parseStringArray(record.warningMessages),
    reportedVariantIds: parseNumberArray(record.reportedVariantIds),
    selectedVariantIds: parseNumberArray(record.selectedVariantIds),
    variantMismatch: Boolean(record.variantMismatch),
    guardrailMode,
    updatedAt:
      typeof record.updatedAt === "string" && record.updatedAt.trim().length
        ? record.updatedAt
        : new Date().toISOString(),
    rawPayload:
      typeof record.rawPayload === "string" ? record.rawPayload : null,
  };
}

function isSessionStorageAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return Boolean(window.sessionStorage);
  } catch {
    return false;
  }
}

function readFromSessionStorage(): string | null {
  if (!isSessionStorageAvailable()) {
    return null;
  }

  try {
    return window.sessionStorage.getItem(DESIGN_CONTEXT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeToSessionStorage(value: string): void {
  if (!isSessionStorageAvailable()) {
    return;
  }

  try {
    window.sessionStorage.setItem(DESIGN_CONTEXT_STORAGE_KEY, value);
  } catch {
    // Ignore write errors (e.g., privacy mode).
  }
}

function removeFromSessionStorage(): void {
  if (!isSessionStorageAvailable()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(DESIGN_CONTEXT_STORAGE_KEY);
  } catch {
    // Ignore removal errors.
  }
}

export function loadDesignContext(): DesignContext | null {
  if (!isSessionStorageAvailable()) {
    return null;
  }

  const raw = readFromSessionStorage();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DesignContext>;
    return {
      variantId: parsed.variantId ?? null,
      externalProductId: parsed.externalProductId ?? null,
      templateId: parsed.templateId ?? null,
      templateStoreId: parsed.templateStoreId ?? null,
      templateStoredAt: parsed.templateStoredAt ?? null,
      exportedImage: parsed.exportedImage ?? null,
      designFileId: parsed.designFileId ?? null,
      designFileUrl: parsed.designFileUrl ?? null,
      variantLabel: parsed.variantLabel ?? null,
      lastCheckoutAttemptAt: parsed.lastCheckoutAttemptAt ?? null,
      unitPriceCents: parsed.unitPriceCents ?? null,
      unitPriceCurrency: parsed.unitPriceCurrency ?? null,
      pricingSource: parsed.pricingSource ?? null,
      printfulProductId: parsed.printfulProductId ?? null,
      guardrailSnapshot: parseGuardrailSnapshot(parsed.guardrailSnapshot),
      timestamp: parsed.timestamp ?? Date.now(),
    };
  } catch (error) {
    console.error("Failed to parse design context", error);
    return null;
  }
}

export function saveDesignContext(
  update: Partial<DesignContext>,
): DesignContext | null {
  if (!isSessionStorageAvailable()) {
    return null;
  }

  const current = loadDesignContext() ?? createEmptyContext();
  const next: DesignContext = {
    ...current,
    ...update,
    timestamp: Date.now(),
  };

  writeToSessionStorage(JSON.stringify(next));
  return next;
}

export function markCheckoutAttempt(
  update: Partial<DesignContext> = {},
): DesignContext | null {
  return saveDesignContext({
    ...update,
    lastCheckoutAttemptAt: Date.now(),
  });
}

export function clearDesignContext(): void {
  removeFromSessionStorage();
}

// TODO(design-context): Replace sessionStorage with authenticated persistence when user accounts arrive.
