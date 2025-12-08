import { useState, type JSX } from "react";

import { type GuardrailInput } from "@/lib/guardrails";

import { GuardrailPanel } from "./guardrail-panel";
import { SafeAreaOverlayIndicator } from "./safe-area-overlay";
import { useDesignGuardrails } from "./use-design-guardrails";

type FabricEditorProps = {
  variantId: number;
  guardrailInput: GuardrailInput | null;
  onExport?: (payload: { exportedImage: string; variantId: number }) => void;
};

export function FabricEditor({
  variantId,
  guardrailInput,
  onExport,
}: FabricEditorProps): JSX.Element {
  const [exportedImage, setExportedImage] = useState<string | null>(null);
  const guardrails = useDesignGuardrails(guardrailInput);

  const handleMockExport = () => {
    const mockImage = `data:image/png;base64,FAKE_IMAGE_${variantId}_${Date.now()}`;
    setExportedImage(mockImage);
    onExport?.({ exportedImage: mockImage, variantId });
  };

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-gray-200 bg-gray-50 p-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Fabric.js fallback
        </p>
        <h2 className="text-xl font-semibold text-gray-900">
          Canvas editor guardrails
        </h2>
        <p className="text-sm text-gray-600">
          The Fabric fallback mirrors the EDM guardrail overlay and messages so
          both flows stay in sync.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
        <SafeAreaOverlayIndicator hasCollision={guardrails.safeAreaCollisions} />
        <GuardrailPanel state={guardrails} />
      </div>

      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-900">Export mock</p>
        <p>
          Exporting here will mimic Fabric.js returning a PNG that we can persist
          for checkout.
        </p>
        <button
          type="button"
          onClick={handleMockExport}
          className="mt-3 inline-flex items-center gap-2 rounded-md border border-gray-900 px-3 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-900 hover:text-white"
        >
          Mock export design
        </button>
        {exportedImage ? (
          <p className="mt-3 break-all text-xs text-gray-500">
            Last export preview:{" "}
            <span className="font-mono text-gray-700">{exportedImage}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default FabricEditor;
