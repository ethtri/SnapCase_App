export type TemplateCacheEntry = {
  externalProductId: string;
  templateId: string;
  source?: string | null;
  cachedAt: number;
};

const STORAGE_KEY = "snapcase:edm-template-cache";

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

function readCache(): TemplateCacheEntry[] {
  if (!isSessionStorageAvailable()) {
    return [];
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as TemplateCacheEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((entry) => ({
        externalProductId: entry.externalProductId,
        templateId: entry.templateId,
        source: entry.source ?? null,
        cachedAt: entry.cachedAt ?? Date.now(),
      }))
      .filter(
        (entry) =>
          typeof entry.externalProductId === "string" &&
          entry.externalProductId.length > 0 &&
          typeof entry.templateId === "string" &&
          entry.templateId.length > 0,
      );
  } catch {
    return [];
  }
}

function writeCache(entries: TemplateCacheEntry[]): void {
  if (!isSessionStorageAvailable()) {
    return;
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage write failures (private browsing, etc).
  }
}

export function getCachedTemplate(
  externalProductId: string,
): TemplateCacheEntry | null {
  if (typeof externalProductId !== "string" || !externalProductId.length) {
    return null;
  }
  const entries = readCache();
  return entries.find(
    (entry) => entry.externalProductId === externalProductId,
  ) ?? null;
}

export function upsertTemplateCache(input: {
  externalProductId: string;
  templateId: string;
  source?: string | null;
}): TemplateCacheEntry | null {
  if (
    typeof input.externalProductId !== "string" ||
    !input.externalProductId.length ||
    typeof input.templateId !== "string" ||
    !input.templateId.length
  ) {
    return null;
  }

  const current = readCache();
  const existingIndex = current.findIndex(
    (entry) => entry.externalProductId === input.externalProductId,
  );
  const nextEntry: TemplateCacheEntry = {
    externalProductId: input.externalProductId,
    templateId: input.templateId,
    source: input.source ?? null,
    cachedAt: Date.now(),
  };

  if (existingIndex >= 0) {
    current[existingIndex] = nextEntry;
  } else {
    current.push(nextEntry);
  }

  writeCache(current);
  return nextEntry;
}

export function clearTemplateCache(): void {
  if (!isSessionStorageAvailable()) {
    return;
  }
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore removal failures.
  }
}
