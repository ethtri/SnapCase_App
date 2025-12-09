export type PrintfulCatalogEntry = {
  brand: "apple" | "samsung";
  model: string;
  caseType: "snap";
  externalProductId: string;
  /**
   * Legacy SnapCase variant identifier used by the UI defaults.
   * Keep for backwards compatibility with saved contexts.
   */
  defaultVariantId: number;
  /**
   * Printful catalog variant identifier when available.
   */
  catalogVariantId: number | null;
  /**
   * Printful product identifier required for create-mode init.
   */
  printfulProductId: number;
  retailPriceCents: number;
  currency: "USD";
};

const PRINTFUL_CATALOG: PrintfulCatalogEntry[] = [
  {
    brand: "apple",
    model: "iPhone 15 Pro",
    caseType: "snap",
    externalProductId: "SNAP_IP15PRO_SNAP",
    defaultVariantId: 632,
    catalogVariantId: 17726,
    printfulProductId: 683,
    retailPriceCents: 3499,
    currency: "USD",
  },
  {
    brand: "apple",
    model: "iPhone 15",
    caseType: "snap",
    externalProductId: "SNAP_IP15_SNAP",
    defaultVariantId: 631,
    catalogVariantId: 17722,
    printfulProductId: 683,
    retailPriceCents: 3499,
    currency: "USD",
  },
  {
    brand: "apple",
    model: "iPhone 15 Pro Max",
    caseType: "snap",
    externalProductId: "SNAP_IP15PM_SNAP",
    defaultVariantId: 633,
    catalogVariantId: 17728,
    printfulProductId: 683,
    retailPriceCents: 3499,
    currency: "USD",
  },
  {
    brand: "apple",
    model: "iPhone 14 Pro",
    caseType: "snap",
    externalProductId: "SNAP_IP14PRO_SNAP",
    defaultVariantId: 642,
    catalogVariantId: 16912,
    printfulProductId: 683,
    retailPriceCents: 3499,
    currency: "USD",
  },
  {
    brand: "apple",
    model: "iPhone 14",
    caseType: "snap",
    externalProductId: "SNAP_IP14_SNAP",
    defaultVariantId: 641,
    catalogVariantId: 16910,
    printfulProductId: 683,
    retailPriceCents: 3499,
    currency: "USD",
  },
  {
    brand: "apple",
    model: "iPhone 14 Pro Max",
    caseType: "snap",
    externalProductId: "SNAP_IP14PM_SNAP",
    defaultVariantId: 643,
    catalogVariantId: 16916,
    printfulProductId: 683,
    retailPriceCents: 3499,
    currency: "USD",
  },
  {
    brand: "samsung",
    model: "Galaxy S24 Ultra",
    caseType: "snap",
    externalProductId: "SNAP_S24U_SNAP",
    defaultVariantId: 712,
    catalogVariantId: null,
    printfulProductId: 683,
    retailPriceCents: 3499,
    currency: "USD",
  },
  {
    brand: "samsung",
    model: "Galaxy S24+",
    caseType: "snap",
    externalProductId: "SNAP_S24P_SNAP",
    defaultVariantId: 711,
    catalogVariantId: null,
    printfulProductId: 683,
    retailPriceCents: 3499,
    currency: "USD",
  },
  {
    brand: "samsung",
    model: "Galaxy S24",
    caseType: "snap",
    externalProductId: "SNAP_S24_SNAP",
    defaultVariantId: 710,
    catalogVariantId: null,
    printfulProductId: 683,
    retailPriceCents: 3499,
    currency: "USD",
  },
];

export function listPrintfulCatalog(): PrintfulCatalogEntry[] {
  return [...PRINTFUL_CATALOG];
}

export function findPrintfulCatalogEntry(
  externalProductId: string,
): PrintfulCatalogEntry | undefined {
  return PRINTFUL_CATALOG.find(
    (entry) => entry.externalProductId === externalProductId,
  );
}

export function findPrintfulCatalogEntryByVariantId(
  variantId: number,
): PrintfulCatalogEntry | undefined {
  return PRINTFUL_CATALOG.find(
    (entry) =>
      entry.defaultVariantId === variantId || entry.catalogVariantId === variantId,
  );
}
