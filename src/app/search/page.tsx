"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, SlidersHorizontal, ArrowDownUp, Bus } from "lucide-react";
import SearchForm from "@/components/search/SearchForm";
import TripCard from "@/components/trips/TripCard";
import { searchApi } from "@/lib/api";
import { TripSearchResult } from "@/lib/types";
import { format } from "date-fns";

type SortKey = "departure" | "price_asc" | "price_desc" | "seats";

function SearchPage() {
  const params = useSearchParams();
  const origin = params.get("origin") ?? "";
  const destination = params.get("destination") ?? "";
  const date = params.get("date") ?? "";

  const [trips, setTrips] = useState<TripSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<SortKey>("departure");

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

  const sorted = [...trips].sort((a, b) => {
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

      {/* Route header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">
            {origin} → {destination}
          </h1>
          <p className="text-sm text-slate-500">{formattedDate} · {trips.length} bus{trips.length !== 1 ? "es" : ""} found</p>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowDownUp className="h-4 w-4 text-slate-400" />
          <select
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
          <button onClick={fetchTrips} className="text-sm text-emerald-600 underline">Try again</button>
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <Bus className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700 mb-1">No buses found</h3>
          <p className="text-sm text-slate-400 mb-4">
            No buses available for this route on {formattedDate}.
          </p>
          <p className="text-xs text-slate-400">Try a different date or check back later.</p>
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
