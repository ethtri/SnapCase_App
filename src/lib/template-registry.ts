export type TemplateRecord = {
  templateStoreId: string;
  templateId: string | null;
  variantId: number | null;
  externalProductId: string | null;
  designUrl: string | null;
  printfulFileId: number | null;
  printfulFileUrl: string | null;
  createdAt: number;
};

const TEMPLATE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const registry = new Map<string, TemplateRecord>();
const byExternalProduct = new Map<string, string>();

function now(): number {
  return Date.now();
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `tpl_${crypto.randomUUID()}`;
  }
  return `tpl_${Math.random().toString(36).slice(2)}`;
}

function purgeExpiredTemplates(): void {
  const cutoff = now() - TEMPLATE_TTL_MS;
  for (const [id, record] of registry.entries()) {
    if (record.createdAt < cutoff) {
      registry.delete(id);
      if (
        record.externalProductId &&
        byExternalProduct.get(record.externalProductId) === id
      ) {
        byExternalProduct.delete(record.externalProductId);
      }
    }
  }
}

export function upsertTemplateRecord(input: {
  templateId: string | null;
  variantId: number | null;
  externalProductId: string | null;
  designUrl?: string | null;
  printfulFileId?: number | null;
  printfulFileUrl?: string | null;
  templateStoreId?: string;
}): TemplateRecord {
  purgeExpiredTemplates();
  const templateStoreId = input.templateStoreId || generateId();
  const record: TemplateRecord = {
    templateStoreId,
    templateId: input.templateId ?? null,
    variantId: input.variantId ?? null,
    externalProductId: input.externalProductId ?? null,
    designUrl: input.designUrl ?? null,
    printfulFileId:
      typeof input.printfulFileId === "number" ? input.printfulFileId : null,
    printfulFileUrl: input.printfulFileUrl ?? null,
    createdAt: now(),
  };
  registry.set(templateStoreId, record);
  if (record.externalProductId) {
    byExternalProduct.set(record.externalProductId, templateStoreId);
  }
  return record;
}

export function getTemplateRecord(
  templateStoreId: string,
): TemplateRecord | null {
  purgeExpiredTemplates();
  return registry.get(templateStoreId) ?? null;
}

export function getTemplateRecordByExternalProductId(
  externalProductId: string,
): TemplateRecord | null {
  purgeExpiredTemplates();
  const key = byExternalProduct.get(externalProductId);
  if (!key) {
    return null;
  }
  return registry.get(key) ?? null;
}
