"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowRight, Clock, Bus, ChevronRight } from "lucide-react";
import SeatMap from "@/components/trips/SeatMap";
import { tripApi } from "@/lib/api";
import { TripDetail } from "@/lib/types";

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") ?? "";
  const router = useRouter();

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([tripApi.detail(tripId), tripApi.seats(tripId)])
      .then(([detail, seats]) => {
        setTrip({ ...detail.data.data, seats: seats.data.data?.seats ?? [] });
      })
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [tripId, router]);

  const toggleSeat = (sn: string) => {
    setSelected((prev) =>
      prev.includes(sn) ? prev.filter((s) => s !== sn) : [...prev, sn]
    );
  };

  const proceed = () => {
    if (!selected.length || !trip) return;
    const params = new URLSearchParams({
      tripId,
      seats: selected.join(","),
      amount: String(trip.price * selected.length),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const total = trip.price * selected.length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-slate-400 mb-6">
        <span>Search</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-700 font-medium">Select Seats</span>
        <ChevronRight className="h-3 w-3" />
        <span>Checkout</span>
      </nav>

      {/* Trip summary card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-700">{trip.operatorName}</p>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
            {trip.busType}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">
              {format(new Date(trip.departureTime), "HH:mm")}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{trip.origin}</p>
          </div>

          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              Direct
            </div>
            <div className="w-full flex items-center">
              <div className="h-px flex-1 bg-slate-200" />
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 mx-1 flex-shrink-0" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">
              {format(new Date(trip.arrivalTime), "HH:mm")}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{trip.destination}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="text-slate-500">{trip.availableSeats} seats available</span>
          <span className="font-bold text-slate-900">
            {trip.price.toLocaleString()} RWF <span className="text-xs font-normal text-slate-400">/ seat</span>
          </span>
        </div>
      </div>

      {/* Seat map */}
      <h2 className="text-sm font-semibold text-slate-700 mb-3">Choose your seat(s)</h2>
      <SeatMap
        seats={trip.seats}
        selected={selected}
        onToggle={toggleSeat}
        maxSelectable={5}
      />

      {/* Bottom CTA */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4">
        <div>
          {selected.length > 0 ? (
            <>
              <p className="text-sm text-slate-500">{selected.length} seat(s) × {trip.price.toLocaleString()} RWF</p>
              <p className="text-xl font-bold text-slate-900">{total.toLocaleString()} RWF</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">Select at least one seat to continue</p>
          )}
        </div>
        <button
          onClick={proceed}
          disabled={selected.length === 0}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl flex-shrink-0"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
