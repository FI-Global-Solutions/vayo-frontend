"use client";
import { RouteStop } from "@/lib/types";

const FLAG: Record<string, string> = {
  RW: "🇷🇼", UG: "🇺🇬", KE: "🇰🇪", TZ: "🇹🇿", BI: "🇧🇮", CD: "🇨🇩",
};

type Props = {
  label: string;
  stops: RouteStop[];
  selectedStopId: string | null;
  onSelect: (stopId: string) => void;
  disabledStopIds?: string[];
};

export function StopSelector({ label, stops, selectedStopId, onSelect, disabledStopIds = [] }: Props) {
  const firstCountry = stops[0]?.countryCode ?? "RW";

  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 mb-2">{label}</p>
      <div className="space-y-1.5">
        {stops.map((stop) => {
          const isSelected = selectedStopId === stop.id;
          const isDisabled = disabledStopIds.includes(stop.id);
          const showFlag = stop.countryCode !== firstCountry;
          const flag = FLAG[stop.countryCode] ?? "";

          return (
            <button
              key={stop.id}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelect(stop.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all
                ${isSelected
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : isDisabled
                    ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer"
                }`}
            >
              <span className="flex items-center gap-2">
                {showFlag && <span className="text-base leading-none">{flag}</span>}
                <span className="font-medium">{stop.stopName}</span>
              </span>
              <span className={`text-xs tabular-nums ${isSelected ? "text-emerald-600" : isDisabled ? "text-slate-300" : "text-slate-400"}`}>
                {stop.distanceFromOriginKm === 0 ? "Origin" : `${Number(stop.distanceFromOriginKm).toLocaleString()} km`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
