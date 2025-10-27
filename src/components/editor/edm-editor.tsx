import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react";

import { type GuardrailInput } from "@/lib/guardrails";

import { GuardrailPanel } from "./guardrail-panel";
import { SafeAreaOverlayIndicator } from "./safe-area-overlay";
import { useDesignGuardrails } from "./use-design-guardrails";

type EdmEditorProps = {
  variantId: number;
  externalProductId: string;
  guardrailInput: GuardrailInput | null;
  onTemplateSaved?: (payload: { templateId: string; variantId: number }) => void;
};

type PFDesignMakerInstance = {
  destroy?: () => void;
};

type PFDesignMakerOptions = {
  elemId: string;
  nonce: string;
  externalProductId: string;
  onTemplateSaved?: (payload: unknown) => void;
  onError?: (error: unknown) => void;
};

type PFDesignMakerConstructor = new (
  options: PFDesignMakerOptions,
) => PFDesignMakerInstance;

declare global {
  interface Window {
    PFDesignMaker?: PFDesignMakerConstructor;
  }
}

const EDM_SCRIPT_SRC = "https://files.cdn.printful.com/embed/embed.js";

let edmScriptPromise: Promise<void> | null = null;

function ensureEdmScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("EDM script can only be loaded in a browser environment."),
    );
  }

  if (window.PFDesignMaker) {
    return Promise.resolve();
  }

  if (!edmScriptPromise) {
    edmScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${EDM_SCRIPT_SRC}"]`,
      );

      const readyState = (existing as HTMLScriptElement & {
        readyState?: string;
      }).readyState;

      if (
        existing &&
        (existing.dataset.snapcaseEdmLoaded === "true" ||
          readyState === "complete" ||
          readyState === "loaded")
      ) {
        existing.dataset.snapcaseEdmLoaded = "true";
        resolve();
        return;
      }

      const script = existing ?? document.createElement("script");

      const handleLoad = () => {
        script.dataset.snapcaseEdmLoaded = "true";
        script.removeEventListener("load", handleLoad);
        script.removeEventListener("error", handleError);
        resolve();
      };

      const handleError = () => {
        script.removeEventListener("load", handleLoad);
        script.removeEventListener("error", handleError);
        edmScriptPromise = null;
        reject(new Error("Failed to load Printful EDM script."));
      };

      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });

      if (!existing) {
        script.src = EDM_SCRIPT_SRC;
        script.async = true;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
      }
    });
  }

  return edmScriptPromise;
}

function resolveTemplateId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const direct = data.templateId ?? data.template_id;

  if (typeof direct === "string" && direct.trim()) {
    return direct;
  }

  if (typeof direct === "number") {
    return String(direct);
  }

  const nested = data.template ?? data.result;
  if (nested && typeof nested === "object") {
    const nestedRecord = nested as Record<string, unknown>;
    const nestedId =
      nestedRecord.id ?? nestedRecord.templateId ?? nestedRecord.template_id;
    if (typeof nestedId === "string" && nestedId.trim()) {
      return nestedId;
    }
    if (typeof nestedId === "number") {
      return String(nestedId);
    }
  }

  return null;
}

export function EdmEditor({
  variantId,
  externalProductId,
  guardrailInput,
  onTemplateSaved,
}: EdmEditorProps): JSX.Element {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const designerRef = useRef<PFDesignMakerInstance | null>(null);
  const guardrails = useDesignGuardrails(guardrailInput);

  const canvasId = useMemo(
    () => `snapcase-edm-canvas-${variantId}`,
    [variantId],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      setStatus("loading");
      setError(null);

      try {
        await ensureEdmScript();
      } catch (scriptError) {
        if (cancelled) {
          return;
        }
        setStatus("error");
        setError(
          scriptError instanceof Error
            ? scriptError.message
            : "Unable to load the Printful designer script.",
        );
        return;
      }

      if (cancelled) {
        return;
      }

      let nonce: string | null = null;
      let expiresAt: number | null = null;

      try {
        const response = await fetch("/api/edm/nonce", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            externalProductId,
          }),
          credentials: "same-origin",
        });

        if (!response.ok) {
          const details = await response.json().catch(() => null);
          throw new Error(
            details?.error ??
              "Printful nonce request failed. Try again in a moment.",
          );
        }

        const payload = (await response.json()) as {
          nonce?: string;
          expiresAt?: number | null;
        };

        nonce = payload?.nonce ?? null;
        expiresAt = payload?.expiresAt ?? null;

        if (!nonce) {
          throw new Error("Nonce missing from Printful response.");
        }
      } catch (nonceError) {
        if (cancelled) {
          return;
        }
        setStatus("error");
        setError(
          nonceError instanceof Error
            ? nonceError.message
            : "Failed to request a Printful nonce.",
        );
        return;
      }

      if (cancelled) {
        return;
      }

      const PFConstructor = window.PFDesignMaker;
      if (!PFConstructor) {
        setStatus("error");
        setError("Printful designer is unavailable in this environment.");
        return;
      }

      if (designerRef.current?.destroy) {
        designerRef.current.destroy();
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }

      try {
        designerRef.current = new PFConstructor({
          elemId: canvasId,
          nonce,
          externalProductId,
          onTemplateSaved: (payload: unknown) => {
            const resolved = resolveTemplateId(payload);
            if (!resolved) {
              return;
            }
            setTemplateId(resolved);
            onTemplateSaved?.({ templateId: resolved, variantId });
          },
          onError: (payload: unknown) => {
            if (typeof payload === "object" && payload && "message" in payload) {
              const maybeMessage = (payload as { message?: string }).message;
              if (maybeMessage) {
                setError(maybeMessage);
                setStatus("error");
              }
            }
          },
        });

        if (!cancelled) {
          setStatus("ready");
          if (expiresAt) {
            const normalized = new Date(expiresAt * 1000);
            // Store expiry for potential future debugging display.
            containerRef.current?.setAttribute(
              "data-nonce-expires",
              normalized.toISOString(),
            );
          }
        }
      } catch (initError) {
        if (cancelled) {
          return;
        }
        setStatus("error");
        setError(
          initError instanceof Error
            ? initError.message
            : "Failed to initialize Printful designer.",
        );
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
      if (designerRef.current?.destroy) {
        designerRef.current.destroy();
      }
      designerRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [externalProductId, canvasId, variantId, retryToken, onTemplateSaved]);

  const handleRetry = () => {
    setTemplateId(null);
    setRetryToken((token) => token + 1);
  };

  const isLoading = status === "loading";
  const hasError = status === "error";

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
          The Printful embedded designer loads inside the responsive canvas
          while we keep the storyboard guardrail messaging alongside it.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),280px] xl:grid-cols-[minmax(0,1fr),320px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px]">
            <div className="relative aspect-[6/13] w-full overflow-hidden rounded-[26px] border border-dashed border-gray-300 bg-white shadow-inner">
              <div
                id={canvasId}
                ref={containerRef}
                className="h-full w-full"
              />
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 text-sm text-gray-600">
                  <span
                    aria-hidden="true"
                    className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"
                  />
                  <span aria-live="polite">Preparing Printful designer…</span>
                </div>
              ) : null}
              {hasError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90 p-4 text-center text-sm text-gray-700">
                  <p className="font-medium text-gray-900">
                    We couldn&apos;t load the designer.
                  </p>
                  <p className="text-xs text-gray-500">
                    {error ??
                      "The Printful service did not respond. Please retry in a moment."}
                  </p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-900 px-3 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-900 hover:text-white"
                  >
                    Try again
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Nonces refresh whenever we reopen the editor. Saving pushes the
            template ID back into checkout automatically.
          </p>
        </div>
        <div className="grid gap-6">
          <SafeAreaOverlayIndicator hasCollision={guardrails.safeAreaCollisions} />
          <GuardrailPanel state={guardrails} />
        </div>
      </div>

      {templateId ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-900">Last saved template</p>
          <p className="mt-2 break-all font-mono text-xs text-gray-700">
            {templateId}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default EdmEditor;
