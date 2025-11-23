import { useMemo } from "react";

import {
  type DesignGuardrailState,
  type GuardrailInput,
  buildDesignGuardrailState,
  createDefaultGuardrailState,
} from "@/lib/guardrails";

export function useDesignGuardrails(
  input: GuardrailInput | null,
): DesignGuardrailState {
  return useMemo(() => {
    if (!input) {
      return createDefaultGuardrailState();
    }

    return buildDesignGuardrailState(input);
  }, [input]);
}

// TODO(guardrails): Wire this hook to live Printful safe-area metrics once the EDM SDK is integrated.
