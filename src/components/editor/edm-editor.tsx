import { useState, type JSX } from "react";

import { type GuardrailInput } from "@/lib/guardrails";

import { GuardrailPanel } from "./guardrail-panel";
import { SafeAreaOverlayIndicator } from "./safe-area-overlay";
import { useDesignGuardrails } from "./use-design-guardrails";

type EdmEditorProps = {
  variantId: number;
  guardrailInput: GuardrailInput | null;
  onTemplateSaved?: (payload: { templateId: string; variantId: number }) => void;
};

export function EdmEditor({
  variantId,
  guardrailInput,
  onTemplateSaved,
}: EdmEditorProps): JSX.Element {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const guardrails = useDesignGuardrails(guardrailInput);

  const handleMockSave = () => {
    const nextTemplateId = `tmpl_${variantId}_${Date.now()}`;
    setTemplateId(nextTemplateId);
    onTemplateSaved?.({ templateId: nextTemplateId, variantId });
  };

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-gray-200 bg-gray-50 p-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Embedded Design Maker (EDM)
        </p>
        <h2 className="text-xl font-semibold text-gray-900">
          Snapcase editor with guardrails
        </h2>
        <p className="text-sm text-gray-600">
          Placeholder EDM surface showing the safe-area overlay and DPI guardrail
          copy from the storyboard.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
        <SafeAreaOverlayIndicator hasCollision={guardrails.safeAreaCollisions} />
        <GuardrailPanel state={guardrails} />
      </div>

      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-900">Template persistence stub</p>
        <p>
          Saving within the EDM will emit a template identifier so checkout can
          resume. Click below to simulate the callback.
        </p>
        <button
          type="button"
          onClick={handleMockSave}
          className="mt-3 inline-flex items-center gap-2 rounded-md border border-gray-900 px-3 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-900 hover:text-white"
        >
          Mock save template
        </button>
        {templateId ? (
          <p className="mt-3 text-xs text-gray-500">
            Last saved template:{" "}
            <span className="font-mono text-gray-700">{templateId}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default EdmEditor;
