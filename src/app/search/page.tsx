"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDownUp, Bus, SlidersHorizontal, X, CalendarX, MapPin } from "lucide-react";
import Link from "next/link";
import SearchForm from "@/components/search/SearchForm";
import TripCard from "@/components/trips/TripCard";
import { searchApi } from "@/lib/api";
import { TripSearchResult } from "@/lib/types";
import { format } from "date-fns";

type SortKey = "departure" | "price_asc" | "price_desc" | "seats";

const BUS_TYPES = ["MINIBUS", "STANDARD", "LUXURY", "SLEEPER"] as const;
type BusType = (typeof BUS_TYPES)[number];

const BUS_TYPE_LABELS: Record<BusType, string> = {
  MINIBUS: "Minibus",
  STANDARD: "Standard",
  LUXURY: "Luxury",
  SLEEPER: "Sleeper",
};

function SearchPage() {
  const params = useSearchParams();
  const origin = params.get("origin") ?? "";
  const destination = params.get("destination") ?? "";
  const date = params.get("date") ?? "";

  const [trips, setTrips] = useState<TripSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<SortKey>("departure");
  const [selectedTypes, setSelectedTypes] = useState<Set<BusType>>(new Set());
  const [minSeats, setMinSeats] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchTrips = useCallback(async () => {
    if (!origin || !destination || !date) return;
    setLoading(true);
    setError("");
    try {
      const res = await searchApi.trips(origin, destination, date);
      setTrips(res.data.data ?? []);
    } catch {
      setError("Could not load trips. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [origin, destination, date]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const toggleType = (t: BusType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedTypes(new Set());
    setMinSeats(1);
  };

  const activeFilterCount = selectedTypes.size + (minSeats > 1 ? 1 : 0);

  // Available bus types in current results (only show chips that have at least one trip)
  const availableTypes = BUS_TYPES.filter((t) =>
    trips.some((trip) => trip.busType === t)
  );

  const filtered = trips.filter((trip) => {
    if (selectedTypes.size > 0 && !selectedTypes.has(trip.busType as BusType)) return false;
    if (trip.availableSeats < minSeats) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    if (sort === "seats") return b.availableSeats - a.availableSeats;
    return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
  });

  const formattedDate = date
    ? format(new Date(date + "T00:00:00"), "EEE, dd MMM yyyy")
    : "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Compact search bar at top */}
      <div className="mb-6">
        <SearchForm />
      </div>

      {/* Route header + controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">
            {origin} → {destination}
          </h1>
          <p className="text-sm text-slate-500">
            {formattedDate} · {trips.length} bus{trips.length !== 1 ? "es" : ""} found
            {activeFilterCount > 0 && (
              <span className="ml-1 text-emerald-600">· {sorted.length} shown</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 transition-colors ${
              activeFilterCount > 0
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-emerald-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <ArrowDownUp className="h-4 w-4 text-slate-400" />
            <select
              aria-label="Sort trips"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="departure">Earliest first</option>
              <option value="price_asc">Cheapest first</option>
              <option value="price_desc">Most expensive first</option>
              <option value="seats">Most seats available</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Filters</span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>

          {/* Bus type chips */}
          {availableTypes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Bus type</p>
              <div className="flex flex-wrap gap-2">
                {availableTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                      selectedTypes.has(t)
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-emerald-400"
                    }`}
                  >
                    {BUS_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Min seats slider */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">
              Minimum available seats: <span className="text-emerald-600 font-semibold">{minSeats}</span>
            </p>
            <input
              type="range"
              aria-label="Minimum available seats"
              min={1}
              max={10}
              value={minSeats}
              onChange={(e) => setMinSeats(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>1</span>
              <span>10+</span>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-32" />
                  <div className="h-3 bg-slate-100 rounded w-48" />
                </div>
                <div className="w-24 h-9 bg-slate-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button type="button" onClick={fetchTrips} className="text-sm text-emerald-600 underline">Try again</button>
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 px-6">
          {activeFilterCount > 0 ? (
            <>
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <SlidersHorizontal className="h-9 w-9 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No buses match your filters</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
                Your current filters are hiding all available buses. Try loosening them up.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <X className="h-4 w-4" /> Clear all filters
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 relative">
                <Bus className="h-9 w-9 text-slate-300" />
                <div className="absolute -top-1 -right-1 w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                  <CalendarX className="h-4 w-4 text-red-400" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No trips found</h3>
              <p className="text-sm text-slate-500 mb-1 max-w-sm mx-auto">
                We couldn't find any buses from{" "}
                <span className="font-semibold text-slate-700">{origin}</span> to{" "}
                <span className="font-semibold text-slate-700">{destination}</span> on{" "}
                <span className="font-semibold text-slate-700">{formattedDate}</span>.
              </p>
              <p className="text-xs text-slate-400 mb-8">
                This route may not be available yet, or all seats are sold out.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
                    window.location.href = `/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${tomorrow}`;
                  }}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  <CalendarX className="h-4 w-4" /> Try tomorrow
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-600 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  <MapPin className="h-4 w-4" /> Change route
                </Link>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((trip) => (
            <TripCard key={trip.tripId} trip={trip} date={date} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">Loading...</div>}>
      <SearchPage />
    </Suspense>
  );
}
