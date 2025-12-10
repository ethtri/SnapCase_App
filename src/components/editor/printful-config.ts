export type PrintfulConfigDiagnosticsSnapshot = {
  variantLockEnabled: boolean;
  variantLockFlags: Record<string, unknown>;
  disabledTools: string[];
  featureConfig: Record<string, unknown>;
  styleVariables: Record<string, string>;
  navigationOverrides: Record<string, unknown>;
  useUserConfirmationErrors: boolean;
  themeName: string;
};

type BuildPrintfulConfigOptions = {
  variantId: number;
  printfulProductId: number | null;
  shouldInitProduct: boolean;
  technique?: string;
  lockVariant?: boolean;
  theme?: typeof SNAPCASE_EMBED_THEME;
  hooks?: {
    onDesignStatusUpdate?: (payload: unknown) => void;
    onPricingStatusUpdate?: (payload: unknown) => void;
  };
};

export const SNAPCASE_EMBED_THEME = {
  name: "SnapCase Violet",
  variables: {
    "--pf-color-primary": "#111827",
    "--pf-color-primary-hover": "#0f172a",
    "--pf-color-primary-text": "#ffffff",
    "--pf-color-border": "#e5e7eb",
    "--pf-color-surface": "#ffffff",
    "--pf-color-surface-muted": "#f9fafb",
    "--pf-color-text": "#111827",
    "--pf-color-text-muted": "#4b5563",
    "--pf-radius-base": "16px",
    "--pf-radius-button": "9999px",
  },
};

function buildVariantLockFlags(
  variantId: number,
  lockVariant: boolean | undefined,
) {
  const enableLock = Boolean(lockVariant);
  return {
    allowOnlyOneColorToBeSelected: enableLock,
    allowOnlyOneSizeToBeSelected: enableLock,
    isVariantSelectionDisabled: enableLock,
    preselectedSizes: enableLock ? [String(variantId)] : undefined,
  };
}

export function buildPrintfulConfig({
  variantId,
  printfulProductId,
  shouldInitProduct,
  technique,
  lockVariant = false,
  theme = SNAPCASE_EMBED_THEME,
  hooks,
}: BuildPrintfulConfigOptions) {
  const disabledTools = ["clipart", "text", "pattern", "background"];
  const featureConfig = {
    disable_clipart: true,
    disable_text_tools: true,
    disable_pattern_tools: true,
    disable_background: true,
    disable_external_file_library: true,
    initial_open_view: "layers_view",
  };
  const styleVariables = {
    ...theme.variables,
    "--pf-navigation-bg": theme.variables["--pf-color-surface"],
    "--pf-navigation-border": theme.variables["--pf-color-border"],
    "--pf-navigation-color": theme.variables["--pf-color-text"],
    "--pf-button-radius": theme.variables["--pf-radius-button"],
  };
  const navigationOverrides = {
    toolbar: {
      background: theme.variables["--pf-color-surface"],
      color: theme.variables["--pf-color-text"],
    },
  };

  const variantLockFlags = buildVariantLockFlags(variantId, lockVariant);

  const diagnostics: PrintfulConfigDiagnosticsSnapshot = {
    variantLockEnabled: Boolean(lockVariant),
    variantLockFlags,
    disabledTools,
    featureConfig,
    styleVariables,
    navigationOverrides,
    useUserConfirmationErrors: false,
    themeName: theme.name,
  };

  const initProduct =
    shouldInitProduct && printfulProductId
      ? {
          productId: printfulProductId,
          technique: technique ?? "SUBLIMATION",
        }
      : undefined;

  return {
    diagnostics,
    hooks: {
      onDesignStatusUpdate: hooks?.onDesignStatusUpdate ?? (() => {}),
      onPricingStatusUpdate: hooks?.onPricingStatusUpdate ?? (() => {}),
    },
    featureConfig,
    style: {
      variables: styleVariables,
      navigation: navigationOverrides,
    },
    disabledPlacements: [],
    isVariantSelectionDisabled: variantLockFlags.isVariantSelectionDisabled,
    allowOnlyOneColorToBeSelected: variantLockFlags.allowOnlyOneColorToBeSelected,
    allowOnlyOneSizeToBeSelected: variantLockFlags.allowOnlyOneSizeToBeSelected,
    preselectedColors: undefined,
    preselectedSizes: variantLockFlags.preselectedSizes,
    useUserConfirmationErrors: false,
    iframeClassName: "snapcase-edm-frame",
    ...(initProduct ? { initProduct } : {}),
  };
}
