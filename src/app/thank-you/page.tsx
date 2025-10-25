"use client";

import Link from "next/link";
import { useEffect, useState, type JSX } from "react";

import {
  clearDesignContext,
  loadDesignContext,
  type DesignContext,
} from "@/lib/design-context";

export default function ThankYouPage(): JSX.Element {
  const [designContext, setDesignContext] = useState<DesignContext | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const context = loadDesignContext();
    if (context) {
      setDesignContext(context);
      clearDesignContext();
    }
    setIsLoaded(true);
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <header className="space-y-3 text-gray-900">
        <p className="text-sm uppercase tracking-wide text-gray-500">
          Thank you
        </p>
        <h1 className="text-3xl font-semibold">
          Your case is officially in the works
        </h1>
        <p className="text-base text-gray-600">
          We&rsquo;ll email tracking details as soon as Printful confirms
          production. A snapshot of your saved design is captured below for easy
          reference.
        </p>
      </header>

      {designContext ? (
        <section
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          data-testid="design-summary"
        >
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Design summary
            </h2>
            <p className="text-sm text-gray-600">
              This summary clears automatically after you leave the page so the
              next design starts fresh.
            </p>
          </div>
          <dl className="space-y-2 text-sm text-gray-700">
            {designContext.variantLabel ? (
              <div className="flex flex-col gap-0.5">
                <dt className="font-medium text-gray-900">Variant</dt>
                <dd>{designContext.variantLabel}</dd>
              </div>
            ) : null}
            {designContext.templateId ? (
              <div className="flex flex-col gap-0.5">
                <dt className="font-medium text-gray-900">EDM template</dt>
                <dd className="font-mono text-xs text-gray-600">
                  {designContext.templateId}
                </dd>
              </div>
            ) : null}
            {designContext.exportedImage ? (
              <div className="space-y-2">
                <dt className="font-medium text-gray-900">Fabric export</dt>
                <dd>
                  <img
                    src={designContext.exportedImage}
                    alt="Design preview"
                    className="h-48 w-full rounded-lg border border-gray-200 object-cover"
                  />
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : isLoaded ? (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
          We couldn&rsquo;t find a saved design summary. If you landed here from
          a different session, jump back to the editor to create a new case.
        </section>
      ) : null}

      <div>
        <Link
          href="/design"
          className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
        >
          Start another design
        </Link>
      </div>
    </div>
  );
}
