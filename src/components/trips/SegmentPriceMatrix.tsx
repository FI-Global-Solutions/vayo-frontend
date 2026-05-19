"use client";
import { useCallback, useEffect, useState } from "react";
import { Loader2, X, RotateCcw, Save, ArrowRight, Info } from "lucide-react";
import { toast } from "sonner";
import { operatorApi } from "@/lib/api";
import { SegmentPriceEntry } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditRow extends SegmentPriceEntry {
  editValue: string;    // what's in the input right now
  dirty: boolean;       // changed from loaded value
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRwf(n: number) {
  return Number(n).toLocaleString();
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface Props {
  tripId: string;
  tripLabel: string;  // "Kigali → Musanze · 07:00"
  basePrice: number;  // full-route price from trip card
  onClose: () => void;
}

export default function SegmentPriceMatrix({ tripId, tripLabel, basePrice, onClose }: Props) {
  const [rows, setRows]       = useState<EditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [resetting, setResetting] = useState<string | null>(null); // key being reset

  const load = useCallback(() => {
    setLoading(true);
    operatorApi.getSegmentPrices(tripId)
      .then((r) => {
        const entries: SegmentPriceEntry[] = r.data.data ?? [];
        setRows(entries.map((e) => ({
          ...e,
          editValue: String(e.price),
          dirty: false,
        })));
      })
      .catch(() => toast.error("Failed to load segment prices"))
      .finally(() => setLoading(false));
  }, [tripId]);

  useEffect(() => { load(); }, [load]);

  // Update a single row's edit value
  const setRowValue = (key: string, value: string) => {
    setRows((prev) => prev.map((r) => {
      if (rowKey(r) !== key) return r;
      return { ...r, editValue: value, dirty: value !== String(r.price) || r.overridden };
    }));
  };

  const rowKey = (r: Pick<SegmentPriceEntry, "originStopId" | "destinationStopId">) =>
    `${r.originStopId}:${r.destinationStopId}`;

  const dirtyRows = rows.filter((r) => r.dirty);
  const hasErrors = rows.some((r) => r.dirty && (isNaN(parseFloat(r.editValue)) || parseFloat(r.editValue) < 100));

  const handleSave = async () => {
    if (hasErrors || dirtyRows.length === 0) return;
    setSaving(true);
    try {
      const overrides = dirtyRows.map((r) => ({
        originStopId: r.originStopId,
        destinationStopId: r.destinationStopId,
        overridePriceRwf: parseFloat(r.editValue),
      }));
      await operatorApi.setSegmentPrices(tripId, overrides);
      toast.success(`${overrides.length} segment price${overrides.length !== 1 ? "s" : ""} saved`);
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to save segment prices");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (row: EditRow) => {
    const key = rowKey(row);
    setResetting(key);
    try {
      await operatorApi.deleteSegmentOverride(tripId, row.originStopId, row.destinationStopId);
      toast.success(`${row.originStopName} → ${row.destinationStopName} reset to formula price`);
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to reset segment price");
    } finally {
      setResetting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Segment Prices</h2>
            <p className="text-xs text-slate-400 mt-0.5">{tripLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Full-route row (read-only) */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-700">Full route</span>
            <span className="text-xs text-slate-400">(base ticket price)</span>
          </div>
          <span className="text-sm font-bold text-slate-900 tabular-nums">
            {fmtRwf(basePrice)} <span className="text-xs font-normal text-slate-400">RWF</span>
          </span>
        </div>

        {/* Info note */}
        <div className="px-6 py-2.5 border-b border-slate-100 flex items-start gap-2 text-xs text-slate-500 bg-blue-50/60">
          <Info className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
          <span>
            Edit any segment price to override the formula. Overridden rows are marked with a badge.
            Click <RotateCcw className="inline h-3 w-3 mx-0.5" /> to revert a row to the formula price.
            Minimum 100 RWF per segment.
          </span>
        </div>

        {/* Table body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No segment combinations available for this route.
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-6 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                <span>Segment</span>
                <span className="text-right w-28">Your Price (RWF)</span>
                <span className="w-8" />
              </div>

              <div className="divide-y divide-slate-50">
                {rows.map((row) => {
                  const key = rowKey(row);
                  const val = parseFloat(row.editValue);
                  const hasErr = row.dirty && (isNaN(val) || val < 100);

                  return (
                    <div key={key} className={`grid grid-cols-[1fr_auto_auto] gap-3 items-center px-6 py-3 ${row.dirty ? "bg-amber-50/40" : ""}`}>
                      {/* Segment label */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm text-slate-700 truncate">{row.originStopName}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                        <span className="text-sm text-slate-700 truncate">{row.destinationStopName}</span>
                        {row.overridden && !row.dirty && (
                          <span className="text-xs font-semibold px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-full flex-shrink-0">
                            Override
                          </span>
                        )}
                        {row.dirty && (
                          <span className="text-xs font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full flex-shrink-0">
                            Edited
                          </span>
                        )}
                      </div>

                      {/* Price input */}
                      <div className="w-28">
                        <input
                          type="number"
                          min="100"
                          step="100"
                          value={row.editValue}
                          onChange={(e) => setRowValue(key, e.target.value)}
                          className={`w-full text-right px-3 py-2 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            hasErr ? "border-red-400 bg-red-50" : "border-slate-200"
                          }`}
                        />
                        {hasErr && (
                          <p className="text-xs text-red-500 mt-0.5 text-right">Min 100</p>
                        )}
                      </div>

                      {/* Reset button */}
                      <div className="w-8 flex justify-end">
                        {row.overridden && (
                          <button
                            type="button"
                            onClick={() => handleReset(row)}
                            disabled={!!resetting}
                            title="Reset to formula price"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                          >
                            {resetting === key
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <RotateCcw className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            {dirtyRows.length > 0 ? `${dirtyRows.length} unsaved change${dirtyRows.length !== 1 ? "s" : ""}` : "No unsaved changes"}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={dirtyRows.length === 0 || hasErrors || saving}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm flex items-center gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
