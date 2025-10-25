export const DPI_GOOD_THRESHOLD = 300;
export const DPI_WARN_THRESHOLD = 180;

export type DpiStatus = "good" | "warn" | "block";

export type GuardrailTone = "positive" | "caution" | "critical";

export type GuardrailMessage = {
  tone: GuardrailTone;
  title: string;
  description: string;
};

export type DesignGuardrailState = {
  dpiStatus: DpiStatus;
  effectiveDpi: number | null;
  safeAreaCollisions: boolean;
  allowProceed: boolean;
  dpiMessage: GuardrailMessage;
  safeAreaMessage: GuardrailMessage;
};

export type GuardrailInput = {
  imageWidth: number;
  imageHeight: number;
  targetPrintWidthInches: number;
  targetPrintHeightInches: number;
  safeAreaCollisions: boolean;
};

const DPI_MESSAGES: Record<DpiStatus, GuardrailMessage> = {
  good: {
    tone: "positive",
    title: "Print quality ready",
    description:
      "Your artwork meets the 300 DPI target from the storyboard. Expect crisp output on the finished case.",
  },
  warn: {
    tone: "caution",
    title: "Heads up on DPI",
    description:
      "This upload is between 180-299 DPI. It will print, but fine details may appear soft. Swap in a higher resolution photo if available.",
  },
  block: {
    tone: "critical",
    title: "Image too low-resolution",
    description:
      "This artwork is below 180 DPI and will look blurry. Replace it with a higher quality file before continuing.",
  },
};

const SAFE_AREA_MESSAGES: Record<string, GuardrailMessage> = {
  clear: {
    tone: "positive",
    title: "Safe area clear",
    description:
      "No camera or edge collisions detected. Keep important artwork inside this zone for production.",
  },
  collision: {
    tone: "critical",
    title: "Safe area blocked",
    description:
      "Artwork is colliding with the camera cutout or bleed mask. Reposition or resize the image so it fits the safe area.",
  },
};

export function evaluateDpiStatus(dpi: number | null): DpiStatus {
  if (dpi === null || Number.isNaN(dpi)) {
    return "warn";
  }
  if (dpi >= DPI_GOOD_THRESHOLD) {
    return "good";
  }
  if (dpi >= DPI_WARN_THRESHOLD) {
    return "warn";
  }
  return "block";
}

export function calculateEffectiveDpi(input: GuardrailInput): number | null {
  const { imageWidth, imageHeight, targetPrintWidthInches, targetPrintHeightInches } =
    input;

  if (
    targetPrintWidthInches <= 0 ||
    targetPrintHeightInches <= 0 ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return null;
  }

  const horizontalDpi = imageWidth / targetPrintWidthInches;
  const verticalDpi = imageHeight / targetPrintHeightInches;
  return Math.min(horizontalDpi, verticalDpi);
}

export function buildDesignGuardrailState(
  input: GuardrailInput,
): DesignGuardrailState {
  const effectiveDpi = calculateEffectiveDpi(input);
  const dpiStatus = evaluateDpiStatus(effectiveDpi);
  const safeAreaMessage = input.safeAreaCollisions
    ? SAFE_AREA_MESSAGES.collision
    : SAFE_AREA_MESSAGES.clear;

  return {
    dpiStatus,
    effectiveDpi,
    safeAreaCollisions: input.safeAreaCollisions,
    allowProceed: dpiStatus !== "block" && !input.safeAreaCollisions,
    dpiMessage: DPI_MESSAGES[dpiStatus],
    safeAreaMessage,
  };
}

export function createDefaultGuardrailState(): DesignGuardrailState {
  return {
    dpiStatus: "warn",
    effectiveDpi: null,
    safeAreaCollisions: false,
    allowProceed: true,
    dpiMessage: {
      tone: "caution",
      title: "Waiting for artwork",
      description:
        "Upload a design to see live DPI guidance. Defaults follow the storyboard thresholds (300 good / 180 warning).",
    },
    safeAreaMessage: SAFE_AREA_MESSAGES.clear,
  };
}

// TODO(guardrails): Replace placeholder thresholds and messages with live Printful metadata once available.
