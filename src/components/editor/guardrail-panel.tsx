import { useMemo, type JSX } from "react";

import {
  type DesignGuardrailState,
  type GuardrailTone,
} from "@/lib/guardrails";

type GuardrailPanelProps = {
  state: DesignGuardrailState;
};

const toneClasses: Record<GuardrailTone, string> = {
  positive: "bg-emerald-50 text-emerald-800 border-emerald-200",
  caution: "bg-amber-50 text-amber-800 border-amber-200",
  critical: "bg-red-50 text-red-800 border-red-200",
};

export function GuardrailPanel({ state }: GuardrailPanelProps): JSX.Element {
  const dpiBadge = useMemo(() => {
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

  const dpiToneClass = toneClasses[state.dpiMessage.tone];
  const safeAreaToneClass = toneClasses[state.safeAreaMessage.tone];

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
            Print readiness check
          </span>
        </div>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[dpiBadge.tone]}`}>
          {dpiBadge.label}
        </span>
      </header>

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
    </section>
  );
}

export default GuardrailPanel;
