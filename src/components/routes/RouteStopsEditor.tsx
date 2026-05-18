"use client";
import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";

export type StopDraft = {
  stopName: string;
  distanceFromOriginKm: number | "";
  boardingAllowed: boolean;
  droppingAllowed: boolean;
  countryCode: string;
};

const COUNTRIES = [
  { code: "RW", label: "Rwanda" },
  { code: "UG", label: "Uganda" },
  { code: "TZ", label: "Tanzania" },
  { code: "KE", label: "Kenya" },
  { code: "BI", label: "Burundi" },
  { code: "CD", label: "DRC" },
];

function emptyStop(distanceFromOriginKm: number | "" = ""): StopDraft {
  return { stopName: "", distanceFromOriginKm, boardingAllowed: true, droppingAllowed: true, countryCode: "RW" };
}

function validate(stops: StopDraft[]): string[] {
  const errors: string[] = [];
  if (stops.length < 2) { errors.push("At least 2 stops required"); return errors; }

  const first = stops[0];
  if (first.distanceFromOriginKm !== 0) errors.push("First stop must be at 0 km (origin)");

  let prevDist = -1;
  stops.forEach((s, i) => {
    if (!s.stopName.trim()) errors.push(`Stop ${i + 1}: name is required`);
    const d = Number(s.distanceFromOriginKm);
    if (isNaN(d) || s.distanceFromOriginKm === "") {
      errors.push(`Stop ${i + 1}: distance is required`);
    } else if (i > 0 && d <= prevDist) {
      errors.push(`Stop ${i + 1}: distance must be greater than stop ${i}`);
    }
    prevDist = d as number;
  });

  const hasBoarding = stops.some((s) => s.boardingAllowed);
  const hasDropping = stops.some((s) => s.droppingAllowed);
  if (!hasBoarding) errors.push("At least one stop must allow boarding");
  if (!hasDropping) errors.push("At least one stop must allow dropping off");

  return errors;
}

export function stopsValid(stops: StopDraft[]): boolean {
  return validate(stops).length === 0;
}

export default function RouteStopsEditor({
  stops,
  onChange,
  routeDistanceKm,
}: {
  stops: StopDraft[];
  onChange: (stops: StopDraft[]) => void;
  routeDistanceKm?: number;
}) {
  const [showErrors, setShowErrors] = useState(false);
  const errors = validate(stops);

  const update = (index: number, patch: Partial<StopDraft>) => {
    const next = stops.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange(next);
  };

  const addStop = () => {
    const lastDist = stops.length > 0 ? (stops[stops.length - 1].distanceFromOriginKm as number) : 0;
    const suggested = routeDistanceKm && stops.length === 1 ? routeDistanceKm : "";
    onChange([...stops, emptyStop(stops.length === 0 ? 0 : suggested !== "" ? suggested : lastDist + 1)]);
  };

  const remove = (index: number) => {
    if (stops.length <= 2) return;
    onChange(stops.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...stops];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const moveDown = (index: number) => {
    if (index === stops.length - 1) return;
    const next = [...stops];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {stops.map((stop, i) => {
        const isFirst = i === 0;
        const isLast = i === stops.length - 1;
        const isOrigin = isFirst;
        const isDestination = isLast && stops.length >= 2;

        return (
          <div key={i} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2.5">
            {/* Row 1: stop number + name */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </div>
              <input
                type="text"
                placeholder={isOrigin ? "Origin city / town" : isDestination ? "Final destination" : "Intermediate stop"}
                value={stop.stopName}
                onChange={(e) => update(i, { stopName: e.target.value })}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {/* Reorder */}
              <div className="flex flex-col gap-0.5">
                <button type="button" onClick={() => moveUp(i)} disabled={isFirst} className="p-0.5 rounded text-slate-300 hover:text-slate-600 disabled:opacity-20">
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => moveDown(i)} disabled={isLast} className="p-0.5 rounded text-slate-300 hover:text-slate-600 disabled:opacity-20">
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* Remove */}
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={stops.length <= 2}
                className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-20 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Row 2: distance + country */}
            <div className="flex items-center gap-2 pl-8">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">Distance from origin (km)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={stop.distanceFromOriginKm}
                  readOnly={isFirst}
                  onChange={(e) => update(i, { distanceFromOriginKm: e.target.value === "" ? "" : Number(e.target.value) })}
                  className={`w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isFirst ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""}`}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">Country</label>
                <select
                  value={stop.countryCode}
                  onChange={(e) => update(i, { countryCode: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: boarding / dropping toggles */}
            <div className="flex items-center gap-4 pl-8">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={stop.boardingAllowed}
                  onChange={(e) => update(i, { boardingAllowed: e.target.checked })}
                  className="w-3.5 h-3.5 accent-emerald-600"
                />
                <span className="text-xs text-slate-600">Boarding</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={stop.droppingAllowed}
                  onChange={(e) => update(i, { droppingAllowed: e.target.checked })}
                  className="w-3.5 h-3.5 accent-emerald-600"
                />
                <span className="text-xs text-slate-600">Drop-off</span>
              </label>
              {isOrigin && (
                <span className="text-xs text-slate-400 ml-auto italic">Origin stop</span>
              )}
              {isDestination && !isOrigin && (
                <span className="text-xs text-slate-400 ml-auto italic">Final stop</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Add stop button */}
      <button
        type="button"
        onClick={addStop}
        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
      >
        <Plus className="h-4 w-4" /> Add Stop
      </button>

      {/* Validation errors */}
      {showErrors && errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-red-600 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              {e}
            </p>
          ))}
        </div>
      )}

      {/* Trigger error display when user tries to save */}
      <input type="hidden" data-stop-errors={errors.length} onFocus={() => setShowErrors(true)} />
    </div>
  );
}

export { emptyStop, validate as validateStops };
