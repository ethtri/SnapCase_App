import {
  DPI_GOOD_THRESHOLD,
  DPI_WARN_THRESHOLD,
  buildDesignGuardrailState,
  createDefaultGuardrailState,
  evaluateDpiStatus,
} from "@/lib/guardrails";

describe("guardrail helpers", () => {
  it("marks DPI as good when sample meets or exceeds the 300 DPI threshold", () => {
    const state = buildDesignGuardrailState({
      imageWidth: DPI_GOOD_THRESHOLD * 3,
      imageHeight: DPI_GOOD_THRESHOLD * 6,
      targetPrintWidthInches: 3,
      targetPrintHeightInches: 6,
      safeAreaCollisions: false,
    });

    expect(state.dpiStatus).toBe("good");
    expect(state.allowProceed).toBe(true);
  });

  it("warns when DPI falls between the warn and good thresholds", () => {
    const midPointDpi = Math.round((DPI_GOOD_THRESHOLD + DPI_WARN_THRESHOLD) / 2);
    const state = buildDesignGuardrailState({
      imageWidth: midPointDpi * 3,
      imageHeight: midPointDpi * 6,
      targetPrintWidthInches: 3,
      targetPrintHeightInches: 6,
      safeAreaCollisions: false,
    });

    expect(state.dpiStatus).toBe("warn");
    expect(state.allowProceed).toBe(true);
  });

  it("blocks progression when DPI is below 180 or safe-area collisions are detected", () => {
    const lowDpiState = buildDesignGuardrailState({
      imageWidth: (DPI_WARN_THRESHOLD - 10) * 3,
      imageHeight: (DPI_WARN_THRESHOLD - 10) * 6,
      targetPrintWidthInches: 3,
      targetPrintHeightInches: 6,
      safeAreaCollisions: false,
    });

    expect(lowDpiState.dpiStatus).toBe("block");
    expect(lowDpiState.allowProceed).toBe(false);

    const collisionState = buildDesignGuardrailState({
      imageWidth: DPI_GOOD_THRESHOLD * 3,
      imageHeight: DPI_GOOD_THRESHOLD * 6,
      targetPrintWidthInches: 3,
      targetPrintHeightInches: 6,
      safeAreaCollisions: true,
    });

    expect(collisionState.safeAreaCollisions).toBe(true);
    expect(collisionState.allowProceed).toBe(false);
  });

  it("returns a caution status in the default state before metrics are loaded", () => {
    const defaultState = createDefaultGuardrailState();

    expect(defaultState.dpiStatus).toBe("warn");
    expect(defaultState.allowProceed).toBe(true);
  });

  it("treats invalid DPI as a warning to avoid blocking uploads prematurely", () => {
    expect(evaluateDpiStatus(null)).toBe("warn");
    expect(evaluateDpiStatus(Number.NaN)).toBe("warn");
  });
});
