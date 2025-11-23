import type { JSX } from "react";

type SafeAreaOverlayIndicatorProps = {
  hasCollision: boolean;
};

export function SafeAreaOverlayIndicator({
  hasCollision,
}: SafeAreaOverlayIndicatorProps): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative aspect-[9/19] w-full max-w-[220px] overflow-hidden rounded-3xl border border-gray-300 bg-gray-100 shadow-inner">
        <div className="absolute inset-2 rounded-2xl border border-gray-300 bg-gradient-to-b from-gray-50 to-gray-200" />
        <div className="absolute inset-6 rounded-2xl border-2 border-dashed border-gray-400" />
        <div
          className={`absolute inset-x-6 top-6 rounded-xl px-3 py-1 text-center text-xs font-semibold ${
            hasCollision ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
          }`}
        >
          {hasCollision ? "Adjust artwork" : "Safe zone"}
        </div>
        <span className="sr-only">
          {hasCollision
            ? "Artwork collides with the camera cutout. Adjust placement."
            : "Artwork sits inside the safe production zone."}
        </span>
      </div>
      <p className="text-xs text-gray-500">
        {!hasCollision
          ? "Safe-area overlay is clear. Camera cutout and bleed look good."
          : "Safe-area overlay shows a collision with the camera cutout. Reposition artwork."}
      </p>
    </div>
  );
}

export default SafeAreaOverlayIndicator;
