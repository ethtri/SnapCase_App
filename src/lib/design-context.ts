export type DesignContext = {
  variantId: number | null;
  externalProductId: string | null;
  templateId: string | null;
  exportedImage: string | null;
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
    exportedImage: null,
    variantLabel: null,
    lastCheckoutAttemptAt: null,
    timestamp: Date.now(),
  };
}

function isSessionStorageAvailable(): boolean {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

export function loadDesignContext(): DesignContext | null {
  if (!isSessionStorageAvailable()) {
    return null;
  }

  const raw = window.sessionStorage.getItem(DESIGN_CONTEXT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DesignContext>;
    return {
      variantId: parsed.variantId ?? null,
      externalProductId: parsed.externalProductId ?? null,
      templateId: parsed.templateId ?? null,
      exportedImage: parsed.exportedImage ?? null,
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

  window.sessionStorage.setItem(
    DESIGN_CONTEXT_STORAGE_KEY,
    JSON.stringify(next),
  );
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
  if (!isSessionStorageAvailable()) {
    return;
  }
  window.sessionStorage.removeItem(DESIGN_CONTEXT_STORAGE_KEY);
}

// TODO(design-context): Replace sessionStorage with authenticated persistence when user accounts arrive.
