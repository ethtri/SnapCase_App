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
    timestamp: Date.now(),
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
