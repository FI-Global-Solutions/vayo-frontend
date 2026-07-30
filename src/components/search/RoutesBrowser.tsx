"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Loader2 } from "lucide-react";
import { searchApi, RouteConnection } from "@/lib/api";

export default function RoutesBrowser() {
  const [connections, setConnections] = useState<RouteConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    searchApi.connections()
      .then((r) => setConnections(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (connections.length === 0) return null;

  // Deduplicate to unique board→drop pairs (in case multiple operators serve same segment)
  const seen = new Set<string>();
  const unique = connections.filter((c) => {
    const key = `${c.boardStop}|${c.dropStop}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const prefill = (c: RouteConnection) => {
    // Go to search page with origin+destination pre-filled — user picks their date there
    router.push(`/search?origin=${encodeURIComponent(c.boardStop)}&destination=${encodeURIComponent(c.dropStop)}`);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-5">
        <MapPin className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        <div>
          <h2 className="text-lg font-bold text-slate-800">Available routes</h2>
          <p className="text-sm text-slate-500">Select a route — then pick your travel date</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {unique.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => prefill(c)}
            className="group bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md rounded-xl p-4 text-left transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <span className="truncate">{c.boardStop}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{c.dropStop}</span>
                </div>
                {c.distanceKm && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    ~{Math.round(Number(c.distanceKm))} km
                    {c.basePrice ? ` · from ${Number(c.basePrice).toLocaleString()} RWF` : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                Select date
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
