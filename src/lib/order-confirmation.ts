export type ShippingOption = "standard" | "express";

export type FulfillmentTimelineState =
  | "submitted"
  | "print_files"
  | "in_production"
  | "shipped";

export type OrderConfirmationSnapshot = {
  orderId: string;
  placedAt: string;
  shippingOption: ShippingOption;
  shippingSpeedLabel: string;
  shippingEtaLabel: string;
  shippingEtaRange: string;
  timelineState: FulfillmentTimelineState;
  printfulStatus: string | null;
  trackingUrl?: string | null;
  trackUrl?: string | null;
  supportUrl?: string | null;
};

export const ORDER_SUPPORT_URL = "mailto:support@snapcase.ai";

const ORDER_CONFIRMATION_STORAGE_KEY = "snapcase:order-confirmation";

const SHIPPING_COPY: Record<
  ShippingOption,
  { speedLabel: string; etaLabel: string; etaRange: string }
> = {
  standard: {
    speedLabel: "Standard shipping",
    etaLabel: "Arrives in 3-5 business days",
    etaRange: "3-5 business days",
  },
  express: {
    speedLabel: "Express shipping",
    etaLabel: "Arrives in 1-2 business days",
    etaRange: "1-2 business days",
  },
};

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

export function generateOrderId(seed?: string | null): string {
  const base = seed
    ? seed.replace(/[^a-z0-9]/gi, "").slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `SC-${base.toUpperCase() || "XXXXXX"}`;
}

export function mapPrintfulStatusToTimelineState(
  status: string | null | undefined,
): FulfillmentTimelineState {
  const normalized = status?.toLowerCase();
  if (normalized === "in_production" || normalized === "processing") {
    return "in_production";
  }
  if (normalized === "print_files" || normalized === "on_hold") {
    return "print_files";
  }
  if (normalized === "shipped") {
    return "shipped";
  }
  return "submitted";
}

export function getShippingCopy(option: ShippingOption) {
  return SHIPPING_COPY[option] ?? SHIPPING_COPY.standard;
}

export function loadOrderConfirmationSnapshot():
  | OrderConfirmationSnapshot
  | null {
  if (!isSessionStorageAvailable()) {
    return null;
  }
  const raw = window.sessionStorage.getItem(ORDER_CONFIRMATION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<OrderConfirmationSnapshot>;
    if (!parsed.orderId || !parsed.placedAt || !parsed.shippingOption) {
      return null;
    }
    const shippingCopy = getShippingCopy(parsed.shippingOption);
    return {
      orderId: parsed.orderId,
      placedAt: parsed.placedAt,
      shippingOption: parsed.shippingOption,
      shippingSpeedLabel: parsed.shippingSpeedLabel ?? shippingCopy.speedLabel,
      shippingEtaLabel: parsed.shippingEtaLabel ?? shippingCopy.etaLabel,
      shippingEtaRange: parsed.shippingEtaRange ?? shippingCopy.etaRange,
      timelineState:
        parsed.timelineState ??
        mapPrintfulStatusToTimelineState(parsed.printfulStatus ?? null),
      printfulStatus: parsed.printfulStatus ?? null,
      trackingUrl: parsed.trackingUrl ?? parsed.trackUrl ?? null,
      trackUrl: parsed.trackUrl ?? parsed.trackingUrl ?? null,
      supportUrl: parsed.supportUrl ?? ORDER_SUPPORT_URL,
    };
  } catch {
    return null;
  }
}

export function persistOrderConfirmationSnapshot(
  snapshot: Partial<OrderConfirmationSnapshot>,
): OrderConfirmationSnapshot | null {
  if (!isSessionStorageAvailable()) {
    return null;
  }
  const shippingCopy = getShippingCopy(snapshot.shippingOption ?? "standard");
  const next: OrderConfirmationSnapshot = {
    orderId: snapshot.orderId ?? generateOrderId(),
    placedAt: snapshot.placedAt ?? new Date().toISOString(),
    shippingOption: snapshot.shippingOption ?? "standard",
    shippingSpeedLabel: snapshot.shippingSpeedLabel ?? shippingCopy.speedLabel,
    shippingEtaLabel: snapshot.shippingEtaLabel ?? shippingCopy.etaLabel,
    shippingEtaRange: snapshot.shippingEtaRange ?? shippingCopy.etaRange,
    timelineState:
      snapshot.timelineState ??
      mapPrintfulStatusToTimelineState(snapshot.printfulStatus ?? null),
    printfulStatus: snapshot.printfulStatus ?? null,
    trackingUrl: snapshot.trackingUrl ?? snapshot.trackUrl ?? null,
    trackUrl: snapshot.trackUrl ?? snapshot.trackingUrl ?? null,
    supportUrl: snapshot.supportUrl ?? ORDER_SUPPORT_URL,
  };
  try {
    window.sessionStorage.setItem(
      ORDER_CONFIRMATION_STORAGE_KEY,
      JSON.stringify(next),
    );
  } catch {
    // ignore write errors
  }
  return next;
}
