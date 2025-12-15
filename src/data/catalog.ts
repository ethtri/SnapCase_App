export type DeviceCatalogEntry = {
  brand: "apple" | "samsung";
  model: string;
  caseType: "snap";
  variantId: number;
  externalProductId: string;
  productId?: number;
};

const DEVICE_CATALOG: DeviceCatalogEntry[] = [
  {
    brand: "apple",
    model: "iPhone 17 Pro",
    caseType: "snap",
    variantId: 613,
    externalProductId: "SNAP_IP17PRO_SNAP",
  },
  {
    brand: "apple",
    model: "iPhone 17",
    caseType: "snap",
    variantId: 611,
    externalProductId: "SNAP_IP17_SNAP",
  },
  {
    brand: "apple",
    model: "iPhone 17 Pro Max",
    caseType: "snap",
    variantId: 614,
    externalProductId: "SNAP_IP17PM_SNAP",
  },
  {
    brand: "apple",
    model: "iPhone 17 Air",
    caseType: "snap",
    variantId: 612,
    externalProductId: "SNAP_IP17AIR_SNAP",
  },
  {
    brand: "apple",
    model: "iPhone 16 Pro",
    caseType: "snap",
    variantId: 623,
    externalProductId: "SNAP_IP16PRO_SNAP",
  },
  {
    brand: "apple",
    model: "iPhone 16",
    caseType: "snap",
    variantId: 621,
    externalProductId: "SNAP_IP16_SNAP",
  },
  {
    brand: "apple",
    model: "iPhone 16 Pro Max",
    caseType: "snap",
    variantId: 624,
    externalProductId: "SNAP_IP16PM_SNAP",
  },
  {
    brand: "apple",
    model: "iPhone 16 Plus",
    caseType: "snap",
    variantId: 622,
    externalProductId: "SNAP_IP16PLUS_SNAP",
  },
  {
    brand: "apple",
    model: "iPhone 15 Pro",
    caseType: "snap",
    variantId: 632,
    externalProductId: "SNAP_IP15PRO_SNAP",
  },
  {
    brand: "apple",
    model: "iPhone 15",
    caseType: "snap",
    variantId: 631,
    externalProductId: "SNAP_IP15_SNAP",
  },
  {
    brand: "apple",
    model: "iPhone 15 Pro Max",
    caseType: "snap",
    variantId: 633,
    externalProductId: "SNAP_IP15PM_SNAP",
  },
  {
    brand: "apple",
    model: "iPhone 14 Pro",
    caseType: "snap",
    variantId: 642,
    externalProductId: "SNAP_IP14PRO_SNAP",
  },
  {
    brand: "apple",
    model: "iPhone 14",
    caseType: "snap",
    variantId: 641,
    externalProductId: "SNAP_IP14_SNAP",
  },
  {
    brand: "apple",
    model: "iPhone 14 Pro Max",
    caseType: "snap",
    variantId: 643,
    externalProductId: "SNAP_IP14PM_SNAP",
  },
  {
    brand: "samsung",
    model: "Galaxy S24 Ultra",
    caseType: "snap",
    variantId: 712,
    externalProductId: "SNAP_S24U_SNAP",
  },
  {
    brand: "samsung",
    model: "Galaxy S24+",
    caseType: "snap",
    variantId: 711,
    externalProductId: "SNAP_S24P_SNAP",
  },
  {
    brand: "samsung",
    model: "Galaxy S24",
    caseType: "snap",
    variantId: 710,
    externalProductId: "SNAP_S24_SNAP",
  },
];

export function getDeviceCatalog(): DeviceCatalogEntry[] {
  return DEVICE_CATALOG;
}

export function findDeviceCatalogEntryByVariantId(
  variantId: number,
): DeviceCatalogEntry | undefined {
  return DEVICE_CATALOG.find((entry) => entry.variantId === variantId);
}
