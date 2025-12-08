import { useMemo, type JSX } from "react";

import {
  type DesignGuardrailState,
  type GuardrailTone,
} from "@/lib/guardrails";

type GuardrailPanelProps = {
  state: DesignGuardrailState;
  mode?: "snapcase" | "printful";
  printfulDetails?: {
    designValid: boolean | null;
    blockingIssues: string[];
    warningMessages: string[];
    selectedVariantIds: number[];
    variantMismatch?: boolean;
    updatedAt?: string | null;
  } | null;
};

const toneClasses: Record<GuardrailTone, string> = {
  positive: "bg-emerald-50 text-emerald-800 border-emerald-200",
  caution: "bg-amber-50 text-amber-800 border-amber-200",
  critical: "bg-red-50 text-red-800 border-red-200",
};

export function GuardrailPanel({
  state,
  mode = "snapcase",
  printfulDetails = null,
}: GuardrailPanelProps): JSX.Element {
  const isPrintfulMode = mode === "printful" && Boolean(printfulDetails);
  const snapcaseBadge = useMemo(() => {
    switch (state.dpiStatus) {
      case "good":
        return { label: "Good", tone: "positive" as GuardrailTone };
      case "warn":
        return { label: "Warning", tone: "caution" as GuardrailTone };
      case "block":
        return { label: "Blocked", tone: "critical" as GuardrailTone };
      default:
        return { label: "Unknown", tone: "caution" as GuardrailTone };
    }
  }, [state.dpiStatus]);

  const printful = isPrintfulMode ? printfulDetails : null;
  const printfulHasBlocking = Boolean(
    printful &&
      (printful.blockingIssues.length > 0 || printful.designValid === false),
  );
  const printfulHasWarnings = Boolean(
    printful && !printfulHasBlocking && printful.warningMessages.length > 0,
  );

  const badge = isPrintfulMode && printful
    ? {
        label: printfulHasBlocking
          ? "Fix in Printful"
          : printfulHasWarnings
            ? "Printful warning"
            : "Printful ready",
        tone: printfulHasBlocking
          ? ("critical" as GuardrailTone)
          : printfulHasWarnings
            ? ("caution" as GuardrailTone)
            : ("positive" as GuardrailTone),
      }
    : snapcaseBadge;

  const dpiToneClass = toneClasses[state.dpiMessage.tone];
  const safeAreaToneClass = toneClasses[state.safeAreaMessage.tone];
  const printfulToneClass = badge ? toneClasses[badge.tone] : toneClasses.positive;

  const effectiveDpiSummary =
    typeof state.effectiveDpi === "number"
      ? `${Math.round(state.effectiveDpi)} DPI`
      : "Awaiting upload";

  return (
    <section
      className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      aria-live="polite"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wide text-gray-500">
            Guardrails
          </span>
          <span className="text-lg font-semibold text-gray-900">
            {isPrintfulMode ? "Printful guardrails" : "Print readiness check"}
          </span>
        </div>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[badge.tone]}`}>
          {badge.label}
        </span>
      </header>
      {isPrintfulMode && printful ? (
        <>
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${printfulToneClass}`}
            role="status"
          >
            <p className="font-semibold" data-testid="guardrail-title">
              {printfulHasBlocking
                ? "Fix issues in Printful"
                : printfulHasWarnings
                  ? "Printful raised warnings"
                  : "Printful guardrails clear"}
            </p>
            <p className="mt-1" data-testid="guardrail-description">
              {printfulHasBlocking
                ? "Printful is blocking save/continue until the issues below are resolved."
                : printfulHasWarnings
                  ? "You can continue once you review the warnings below."
                  : "Printful validated this design; SnapCase guardrails will stay muted."}
            </p>
            {printful.updatedAt ? (
              <p className="mt-2 text-xs font-medium uppercase tracking-wide">
                Updated {printful.updatedAt}
              </p>
            ) : null}
          </div>
          {printful.blockingIssues.length ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              <p className="font-semibold">Blocking issues</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-red-800">
                {printful.blockingIssues.map((issue, index) => (
                  <li key={`${issue}-${index}`}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {printful.warningMessages.length ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Warnings from Printful</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-800">
                {printful.warningMessages.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {printful.variantMismatch ? (
            <div className="rounded-xl border border-amber-200 bg-white px-4 py-3 text-xs text-amber-900">
              Printful reported a different variant selection inside the iframe. Refresh the editor if the snapshot does not match the SnapCase pick list.
            </div>
          ) : null}
          <footer
            className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500"
            data-testid="guardrail-footnote"
          >
            Printful&apos;s guardrail banner now gates the Continue CTA. Resolve their warnings/errors to re-enable SnapCase copy.
          </footer>
        </>
      ) : (
        <>
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${dpiToneClass}`}
            role="status"
          >
            <p className="font-semibold" data-testid="guardrail-title">
              {state.dpiMessage.title}
            </p>
            <p className="mt-1" data-testid="guardrail-description">
              {state.dpiMessage.description}
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide">
              Estimated quality: {effectiveDpiSummary}
            </p>
          </div>

          <div
            className={`rounded-xl border px-4 py-3 text-sm ${safeAreaToneClass}`}
            role="status"
          >
            <p className="font-semibold">{state.safeAreaMessage.title}</p>
            <p className="mt-1">{state.safeAreaMessage.description}</p>
          </div>

          <footer
            className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500"
            data-testid="guardrail-footnote"
          >
            {state.allowProceed
              ? "You can continue, but keep the DPI meter and safe-area chip within the storyboard thresholds."
              : "Continue is disabled until you resolve the safe-area or DPI blockers. Follow the storyboard guidance to stay production ready."}
          </footer>
        </>
      )}
    </section>
  );
}

export default GuardrailPanel;
