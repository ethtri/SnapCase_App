import {
  clearDesignContext,
  loadDesignContext,
  markCheckoutAttempt,
  saveDesignContext,
} from "@/lib/design-context";

describe("design context persistence", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    (globalThis as unknown as { window: unknown }).window = {
      sessionStorage: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
      },
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  it("merges design context updates and persists to session storage", () => {
    const firstWrite = saveDesignContext({
      variantId: 632,
      externalProductId: "SNAP_IP15PRO_SNAP",
      templateId: null,
      exportedImage: null,
    });

    expect(firstWrite).not.toBeNull();
    expect(firstWrite?.variantId).toBe(632);

    const secondWrite = saveDesignContext({
      templateId: "tmpl_mock",
    });

    expect(secondWrite?.variantId).toBe(632);
    expect(secondWrite?.templateId).toBe("tmpl_mock");

    const loaded = loadDesignContext();
    expect(loaded).not.toBeNull();
    expect(loaded?.variantId).toBe(632);
    expect(loaded?.templateId).toBe("tmpl_mock");
    expect(loaded?.externalProductId).toBe("SNAP_IP15PRO_SNAP");
    expect(typeof loaded?.timestamp).toBe("number");
    expect(loaded?.lastCheckoutAttemptAt).toBeNull();
  });

  it("clears stored context", () => {
    saveDesignContext({
      variantId: 711,
      templateId: "tmpl_to_clear",
    });

    clearDesignContext();
    expect(loadDesignContext()).toBeNull();
  });

  it("records checkout attempts without losing the stored design", () => {
    saveDesignContext({
      variantId: 710,
      externalProductId: "SNAP_PIXEL9_SNAP",
      templateId: "tmpl_checkout",
    });

    const marked = markCheckoutAttempt();
    expect(marked?.variantId).toBe(710);
    expect(marked?.templateId).toBe("tmpl_checkout");
    expect(typeof marked?.lastCheckoutAttemptAt).toBe("number");

    const reloaded = loadDesignContext();
    expect(reloaded?.variantId).toBe(710);
    expect(reloaded?.templateId).toBe("tmpl_checkout");
    expect(reloaded?.lastCheckoutAttemptAt).toBe(marked?.lastCheckoutAttemptAt);
  });
});
