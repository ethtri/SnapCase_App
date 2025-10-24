"use client";

import { useMemo, useState } from "react";

import {
  type DeviceCatalogEntry,
  getDeviceCatalog,
} from "@/data/catalog";
import { logAnalyticsEvent } from "@/lib/analytics";

type CatalogByBrand = {
  brand: DeviceCatalogEntry["brand"];
  items: DeviceCatalogEntry[];
};

function formatCaseType(caseType: DeviceCatalogEntry["caseType"]): string {
  return `${caseType.charAt(0).toUpperCase()}${caseType.slice(1)} case`;
}

export default function DesignPage(): JSX.Element {
  const catalog = useMemo(() => getDeviceCatalog(), []);
  const catalogByBrand = useMemo<CatalogByBrand[]>(() => {
    return catalog.reduce<CatalogByBrand[]>((groups, item) => {
      const existing = groups.find((group) => group.brand === item.brand);
      if (existing) {
        existing.items.push(item);
        return groups;
      }
      return [...groups, { brand: item.brand, items: [item] }];
    }, []);
  }, [catalog]);

  const [selectedDevice, setSelectedDevice] =
    useState<DeviceCatalogEntry | null>(null);

  const handleSelect = (entry: DeviceCatalogEntry) => {
    setSelectedDevice(entry);
    logAnalyticsEvent("select_device", {
      variantId: entry.variantId,
      externalProductId: entry.externalProductId,
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-12">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
          Scene 1 - Start your design
        </p>
        <h1 className="text-3xl font-semibold text-gray-900">
          Choose your device and case style
        </h1>
        <p className="text-base text-gray-600">
          Select the phone you are designing for. Your editor experience and
          checkout summary will use this information to map the right Printful
          variant.
        </p>
      </header>

      <section className="space-y-8">
        {catalogByBrand.map((group) => (
          <div key={group.brand} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold capitalize text-gray-900">
                {group.brand}
              </h2>
              <span className="text-xs uppercase tracking-wide text-gray-400">
                Snap cases
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {group.items.map((entry) => {
                const isSelected =
                  selectedDevice?.variantId === entry.variantId;
                return (
                  <label
                    key={entry.variantId}
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gray-900 ${
                      isSelected
                        ? "border-gray-900 ring-2 ring-gray-900"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="device"
                      value={entry.variantId}
                      checked={isSelected}
                      onChange={() => handleSelect(entry)}
                      className="h-4 w-4 accent-gray-900"
                    />
                    <div className="flex flex-col gap-1">
                      <span className="text-xs uppercase tracking-wide text-gray-500">
                        {entry.brand}
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        {entry.model}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatCaseType(entry.caseType)}
                      </span>
                      {/* TODO(scene 2 storyboard): Replace static price with live catalog pricing when available. */}
                      <span className="text-sm font-medium text-gray-900">
                        $34.99
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <footer className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
        <div>
          {selectedDevice ? (
            <div className="space-y-1">
              <span className="font-medium text-gray-900">
                {selectedDevice.brand.toUpperCase()} &mdash;{" "}
                {selectedDevice.model}
              </span>
              <div className="text-xs text-gray-500">
                Variant ID {selectedDevice.variantId} /{" "}
                {selectedDevice.externalProductId}
              </div>
            </div>
          ) : (
            <span className="font-medium text-gray-900">
              No device selected yet
            </span>
          )}
          <p>
            We will unlock the editor and checkout once you choose a device and
            confirm the case.
          </p>
        </div>
        <button
          type="button"
          disabled={!selectedDevice}
          className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2 font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300 md:w-auto"
        >
          Continue to design
        </button>
      </footer>
    </div>
  );
}
