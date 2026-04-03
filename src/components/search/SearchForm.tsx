"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Search } from "lucide-react";
import { searchApi } from "@/lib/api";
import CityCombobox from "@/components/ui/CityCombobox";
import DatePicker from "@/components/ui/DatePicker";
import { cn } from "@/lib/utils";

export default function SearchForm() {
  const [origins, setOrigins] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Default to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    setDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  useEffect(() => {
    searchApi.origins()
      .then((r) => setOrigins(r.data.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (origin) {
      searchApi.destinations(origin)
        .then((r) => setDestinations(r.data.data ?? []))
        .catch(() => {});
      if (destination && origin === destination) setDestination("");
    } else {
      setDestinations([]);
      setDestination("");
    }
  }, [origin]);  // eslint-disable-line react-hooks/exhaustive-deps

  const swap = () => {
    const tmp = origin;
    setOrigin(destination);
    setDestination(tmp);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !date) return;
    setLoading(true);
    router.push(
      `/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${date}`
    );
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 sm:p-6 w-full max-w-4xl mx-auto"
    >
      {/* FROM + TO row on mobile (with swap in between) */}
      <div className="grid grid-cols-[1fr_auto_1fr] sm:hidden gap-2 items-end mb-3">
        <CityCombobox
          label="From"
          placeholder="Departure city"
          options={origins}
          value={origin}
          onChange={setOrigin}
          iconColor="text-emerald-500"
        />
        <div className="pb-0.5">
          <button
            type="button"
            onClick={swap}
            title="Swap cities"
            className={cn(
              "h-10 w-10 rounded-full border-2 border-slate-200 bg-white",
              "flex items-center justify-center",
              "hover:border-emerald-400 hover:bg-emerald-50 hover:rotate-180",
              "transition-all duration-300 shadow-sm"
            )}
          >
            <ArrowLeftRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        <CityCombobox
          label="To"
          placeholder={origin ? "Destination" : "Origin first"}
          options={destinations.filter((d) => d !== origin)}
          value={destination}
          onChange={setDestination}
          disabled={!origin}
          iconColor="text-orange-500"
        />
      </div>

      {/* DATE + SEARCH row on mobile */}
      <div className="grid grid-cols-[1fr_auto] sm:hidden gap-2 items-end">
        <DatePicker value={date} onChange={setDate} minDate={new Date()} />
        <button
          type="submit"
          disabled={loading || !origin || !destination || !date}
          className={cn(
            "flex items-center justify-center gap-1.5",
            "bg-emerald-600 hover:bg-emerald-700 text-white",
            "font-semibold px-4 py-3 rounded-xl text-sm",
            "shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed",
            "whitespace-nowrap"
          )}
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>

      {/* Desktop: single row */}
      <div className="hidden sm:flex sm:flex-row sm:items-end gap-3">
        <CityCombobox
          label="From"
          placeholder="Departure city"
          options={origins}
          value={origin}
          onChange={setOrigin}
          iconColor="text-emerald-500"
        />
        <div className="flex-shrink-0 pb-0.5">
          <button
            type="button"
            onClick={swap}
            title="Swap cities"
            className={cn(
              "h-11 w-11 rounded-full border-2 border-slate-200 bg-white",
              "flex items-center justify-center",
              "hover:border-emerald-400 hover:bg-emerald-50 hover:rotate-180",
              "transition-all duration-300 shadow-sm"
            )}
          >
            <ArrowLeftRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        <CityCombobox
          label="To"
          placeholder={origin ? "Destination city" : "Select origin first"}
          options={destinations.filter((d) => d !== origin)}
          value={destination}
          onChange={setDestination}
          disabled={!origin}
          iconColor="text-orange-500"
        />
        <DatePicker value={date} onChange={setDate} minDate={new Date()} />
        <div className="flex-shrink-0">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider opacity-0">Go</label>
          <button
            type="submit"
            disabled={loading || !origin || !destination || !date}
            className={cn(
              "flex items-center justify-center gap-2",
              "bg-emerald-600 hover:bg-emerald-700 text-white",
              "font-semibold px-6 py-3 rounded-xl text-sm",
              "shadow-md hover:shadow-emerald-200 hover:shadow-lg",
              "transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Search className="h-4 w-4" />
            {loading ? "Searching..." : "Search buses"}
          </button>
        </div>
      </div>
    </form>
  );
}
